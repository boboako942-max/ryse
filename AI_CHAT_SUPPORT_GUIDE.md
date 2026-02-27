# AI Chat Support System - StyleHub

## Overview

StyleHub now includes an intelligent AI-powered chat support system that helps customers with:
- Product information and recommendations
- Order tracking and status
- Shipping and delivery inquiries
- Payment and billing questions
- Returns and exchanges
- General customer support

## Architecture

### Backend Components

#### 1. **ChatMessage Model** (`backend/models/ChatMessage.js`)
Stores chat history with the following fields:
- `userId`: Reference to the user
- `userMessage`: Customer's message
- `aiResponse`: AI's response
- `session`: Chat session identifier
- `feedbackRating`: User rating (1-5 stars)
- `category`: Support category (product, order, shipping, payment, general, returns)
- `timestamps`: Created and updated dates

#### 2. **Chat Controller** (`backend/controllers/chatController.js`)
Handles all chat operations:
- `sendMessage`: Process user message and generate AI response
- `getChatHistory`: Retrieve chat messages for a user
- `rateResponse`: Save user feedback on AI responses
- `clearHistory`: Delete chat history for a session

#### 3. **Chat Routes** (`backend/routes/chatRoutes.js`)
API endpoints (all require authentication):
- `POST /api/chat/send` - Send a message
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/rate` - Rate a response
- `POST /api/chat/clear` - Clear chat history

### Frontend Components

#### 1. **ChatContext** (`frontend/src/context/ChatContext.jsx`)
React context for managing chat state:
- `chatMessages`: Array of chat messages
- `loading`: Loading state
- `error`: Error messages
- `currentSession`: Current chat session
- Methods: `sendMessage()`, `getChatHistory()`, `rateResponse()`, `clearHistory()`

#### 2. **ChatWidget** (`frontend/src/components/ChatWidget.jsx`)
Floating chat widget with:
- Floating button in bottom-right corner
- Message display area
- Category selection for better context
- Message input with textarea
- Typing indicators
- Feedback rating buttons

#### 3. **ChatWidget Styles** (`frontend/src/components/ChatWidget.css`)
Professional styling with:
- Gradient backgrounds
- Smooth animations
- Responsive design
- Category buttons
- Message bubbles

## Setup Instructions

### 1. Install Dependencies

#### Backend
```bash
cd backend
npm install openai
```

#### Frontend
No additional packages needed (uses existing Axios and React).

### 2. Configure Environment Variables

#### Backend (.env file)
Create a `.env` file in the `backend` directory based on `.env.example`:

```bash
# AI Chat Support
OPENAI_API_KEY=your-openai-api-key-here
```

**Getting an OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in with your OpenAI account
3. Create a new API key
4. Copy and paste it into your `.env` file

#### Frontend (.env.local file)
Ensure your frontend has proper API URL configuration:

```bash
# Create .env.local in frontend directory
VITE_API_URL=http://localhost:5000
```

### 3. Database Setup

The ChatMessage model is already set up in MongoDB. The database will automatically create the collection and indexes when the first message is saved.

### 4. Start the Application

```bash
# From root directory
npm run dev

# Or start backend and frontend separately
npm run dev:backend
npm run dev:frontend
```

## Usage

### For Users

1. **Click the Chat Button**: A floating button appears in the bottom-right corner of the page
2. **Select Category**: Choose a support category (Product, Order, Shipping, etc.)
3. **Type Your Message**: Enter your question in the text area
4. **Send Message**: Press Enter or click the Send button
5. **Rate Response**: After receiving a response, click 👍 or 👎 to provide feedback
6. **View History**: All messages are saved and can be viewed in future sessions

### For Developers

#### Sending a Message
```javascript
const { sendMessage } = useContext(ChatContext);

await sendMessage('What products do you have?', 'product');
```

#### Getting Chat History
```javascript
const { getChatHistory } = useContext(ChatContext);

// Fetch history for specific session
await getChatHistory('default', 50);
```

#### Rating a Response
```javascript
const { rateResponse } = useContext(ChatContext);

// Rate helpful (5 stars)
await rateResponse(messageId, 5);

// Rate unhelpful (1 star)
await rateResponse(messageId, 1);
```

## AI Behavior

### With OpenAI API Key (Recommended)
When `OPENAI_API_KEY` is configured:
- Uses OpenAI's GPT-3.5-turbo model
- Highly accurate and contextual responses
- Understands natural language
- Requires active OpenAI API account and credits

### Without OpenAI API Key (Mock Mode)
The system falls back to keyword-based responses:
- Provides pre-written responses for common questions
- No external API calls
- Works offline
- Limited contextual understanding

To enable OpenAI integration:
1. Add `OPENAI_API_KEY` to your `.env` file
2. Restart the backend server

## API Response Examples

### Send Message
**Request:**
```
POST /api/chat/send
Content-Type: application/json
Authorization: Bearer {token}

{
  "message": "Do you have any summer sales?",
  "session": "default",
  "category": "product"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message processed successfully",
  "data": {
    "id": "64b3f5c0d1e2a3b4c5d6e7f8",
    "userMessage": "Do you have any summer sales?",
    "aiResponse": "We offer competitive pricing and regular sales. Check out our Products page for the best deals!",
    "timestamp": "2024-02-26T10:30:00Z"
  }
}
```

### Get Chat History
**Request:**
```
GET /api/chat/history?session=default&limit=50
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat history retrieved successfully",
  "data": [
    {
      "_id": "64b3f5c0d1e2a3b4c5d6e7f8",
      "userMessage": "Do you have any summer sales?",
      "aiResponse": "We offer competitive pricing...",
      "session": "default",
      "category": "product",
      "feedbackRating": 5,
      "createdAt": "2024-02-26T10:30:00Z"
    }
  ]
}
```

## Customization

### Modify System Prompt
Edit `backend/controllers/chatController.js`:
```javascript
const SYSTEM_PROMPT = `Your custom prompt here...`;
```

### Change Chat Widget Appearance
Edit `frontend/src/components/ChatWidget.css`:
- Colors: Modify the gradient in `.chat-widget-button`
- Size: Adjust `width` and `height` in `.chat-widget-container`
- Position: Change `bottom` and `right` values

### Add New Support Categories
1. Update `Category.enum` in `backend/models/ChatMessage.js`
2. Add button in `frontend/src/components/ChatWidget.jsx`
3. Enhance system prompt to handle the category

## Database Indexes

The ChatMessage model includes optimized indexes:
- `userId + createdAt`: Fast retrieval of user's chat history
- `userId + session`: Quick access to specific sessions

For large-scale deployments, consider adding text indexes for search functionality.

## Security Considerations

1. **Authentication**: All chat endpoints require valid JWT token
2. **API Keys**: Keep `OPENAI_API_KEY` secure, never commit to version control
3. **Rate Limiting**: Consider implementing rate limiting in production
4. **Data Privacy**: Chat messages are stored in database and can be deleted at user's request

## Monitoring & Analytics

Monitor chat interactions:
```javascript
// Query database for analytics
db.ChatMessages.aggregate([
  {
    $group: {
      _id: "$category",
      count: { $sum: 1 },
      avgRating: { $avg: "$feedbackRating" }
    }
  }
])
```

## Troubleshooting

### Chat Widget Not Appearing
- Ensure `ChatProvider` is wrapping your app
- Check browser console for errors
- Verify `VITE_API_URL` is correct

### AI Responses Are Generic
- Configure `OPENAI_API_KEY` for better responses
- Adjust `SYSTEM_PROMPT` for more specific guidance

### Messages Not Being Saved
- Verify MongoDB is running and connected
- Check user authentication status
- Review backend logs for errors

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is correct and active
- Check OpenAI account credits
- Review API rate limits

## Future Enhancements

Potential improvements:
- [ ] Upload chat transcripts as PDF
- [ ] Integrate with live agent support
- [ ] Multi-language support
- [ ] Sentiment analysis for escalation
- [ ] Document-based RAG for product knowledge
- [ ] Chat analytics dashboard
- [ ] Integration with order/user data for personalized responses

## Support

For issues or feature requests:
1. Check the troubleshooting section
2. Review backend logs for errors
3. Verify API configuration
4. Contact development team

---

**Last Updated:** February 2026
**Version:** 1.0.0
