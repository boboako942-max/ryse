const ChatMessage = require('../models/ChatMessage');
const { sendResponse, sendError } = require('../utils/response');
const axios = require('axios');

// System prompt for the AI to provide customer support for StyleHub
const SYSTEM_PROMPT = `You are an AI support assistant for StyleHub, our online clothing and apparel shop.

You help customers with:
- Product information and recommendations
- Orders and tracking
- Payments (GCash, card, Stripe, etc.)
- Refund and cancellation requests
- Account login issues and password resets

Guidelines:
- Give short, clear, and professional answers
- Be friendly and helpful
- Keep responses concise (under 150 words)
- If the question is not related to the shop, politely refuse and redirect to shop topics
- For complex issues, suggest contacting our support team
- Always prioritize customer satisfaction

StyleHub sells clothing and apparel items online with fast shipping and secure payment options.`;

// Send message and get AI response
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, session = 'default', category = 'general' } = req.body;
    const userId = req.user.id;

    // Validate message
    if (!message || !message.trim()) {
      return sendError(res, 400, 'Message cannot be empty');
    }

    // Call OpenAI API
    let aiResponse;
    try {
      aiResponse = await getAIResponse(message);
    } catch (error) {
      console.error('AI API Error:', error.message);
      return sendError(res, 500, 'Failed to get AI response. Please try again later.');
    }

    // Save message to database
    const chatMessage = new ChatMessage({
      userId,
      userMessage: message,
      aiResponse,
      session,
      category,
    });

    await chatMessage.save();

    sendResponse(res, 200, true, 'Message processed successfully', {
      id: chatMessage._id,
      userMessage: chatMessage.userMessage,
      aiResponse: chatMessage.aiResponse,
      timestamp: chatMessage.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// Get chat history
exports.getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { session = 'default', limit = 50 } = req.query;

    const messages = await ChatMessage.find({
      userId,
      session,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-__v');

    sendResponse(res, 200, true, 'Chat history retrieved successfully', messages.reverse());
  } catch (error) {
    next(error);
  }
};

// Rate AI response
exports.rateResponse = async (req, res, next) => {
  try {
    const { messageId, rating } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (!rating || ![1, 2, 3, 4, 5].includes(rating)) {
      return sendError(res, 400, 'Rating must be between 1 and 5');
    }

    const message = await ChatMessage.findOneAndUpdate(
      { _id: messageId, userId },
      { feedbackRating: rating },
      { new: true }
    );

    if (!message) {
      return sendError(res, 404, 'Message not found');
    }

    sendResponse(res, 200, true, 'Rating saved successfully', message);
  } catch (error) {
    next(error);
  }
};

// Clear chat history
exports.clearHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { session = 'default' } = req.body;

    await ChatMessage.deleteMany({
      userId,
      session,
    });

    sendResponse(res, 200, true, 'Chat history cleared successfully', null);
  } catch (error) {
    next(error);
  }
};

// Get AI response from Google Gemini
async function getAIResponse(userMessage) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    // Return a mock response if API key is not set
    return getMockResponse(userMessage);
  }

  try {
    // Using gemini-2.5-flash as it's a fast and efficient model
    // Available alternatives: gemini-pro-latest, gemini-2.0-flash, gemini-2.5-pro
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: userMessage,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: {
            text: SYSTEM_PROMPT,
          },
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract the text from Gemini's response format
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
  } catch (error) {
    console.error('Google Gemini API Error:');
    console.error('  Status:', error.response?.status);
    console.error('  Message:', error.response?.data?.error?.message || error.message);
    
    // Check if it's a quota error
    if (error.response?.status === 429) {
      console.error('  ⚠️  API quota exceeded. Please check your Gemini API quota at https://ai.google.dev/');
    }
    
    throw error;
  }
}

// Mock response for testing without API key
function getMockResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();

  const responses = {
    product: 'We have a wide range of clothing and apparel! What specific type of item are you looking for?',
    order:
      'You can track your order in the "Orders" section of your account. If you need more details, please contact our support team.',
    shipping:
      'We offer fast and reliable shipping to most locations. Shipping times typically range from 3-7 business days.',
    payment:
      'We accept multiple payment methods including credit cards and digital wallets. All payments are secure and encrypted.',
    return:
      'We offer a 30-day return policy on most items. Items must be unworn and in original condition. Please visit our Returns section for more details.',
    size:
      'Size charts are available on each product page. If you need help choosing a size, feel free to ask!',
    price: 'We offer competitive pricing and regular sales. Check out our Products page for the best deals!',
  };

  if (lowerMessage.includes('product') || lowerMessage.includes('item') || lowerMessage.includes('clothes')) {
    return responses.product;
  } else if (lowerMessage.includes('order')) {
    return responses.order;
  } else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
    return responses.shipping;
  } else if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
    return responses.payment;
  } else if (lowerMessage.includes('return') || lowerMessage.includes('exchange')) {
    return responses.return;
  } else if (lowerMessage.includes('size')) {
    return responses.size;
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return responses.price;
  } else {
    return "Thank you for your question! I'm here to help with any questions about StyleHub. How can I assist you today?";
  }
}
