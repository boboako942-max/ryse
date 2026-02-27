import React, { useState, useEffect, useRef } from 'react';
import { useChatContext } from '../context/ChatContext';
import './ChatWidget.css';

export default function ChatWidget() {
  const { chatMessages, loading, sendMessage, error, rateResponse } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, loading]);

  const handleOpenChat = () => {
    setIsOpen(!isOpen);
    // Give a small delay for DOM to update before scrolling
    setTimeout(scrollToBottom, 0);
  };

  const handleSendMessage = async () => {
    if (!messageInput?.trim()) {
      alert('Please type a message');
      return;
    }

    try {
      const message = messageInput;
      setMessageInput('');
      console.log('User sent:', message);
      
      const result = await sendMessage(message, selectedCategory);
      
      if (result) {
        console.log('Message sent successfully');
      } else {
        console.warn('Message send returned no result');
      }
    } catch (err) {
      console.error('HandleSendMessage error:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      <button
        className="chat-widget-button"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(scrollToBottom, 100);
        }}
        title="Chat Support"
        aria-label="Open chat support"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      {/* Chat Widget Container */}
      {isOpen && (
        <div className="chat-widget-container">
          {/* Header */}
          <div className="chat-header">
            <h3>StyleHub Support</h3>
            <button
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Category Selector */}
          <div className="chat-categories">
            {['general', 'product', 'order', 'shipping', 'payment', 'returns'].map((cat) => (
              <button
                key={cat}
                className={`category-button ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {error && (
              <div className="error-message">
                <p>⚠️ {error}</p>
              </div>
            )}
            {chatMessages.length === 0 ? (
              <div className="empty-state">
                <p>👋 Hello! How can we help you today?</p>
                <p className="help-text">Ask us anything about StyleHub!</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="message-pair">
                  {/* User Message */}
                  <div className="message user-message">
                    <p>{msg.userMessage}</p>
                  </div>

                  {/* AI Response */}
                  <div className="message ai-message">
                    <p>{msg.aiResponse}</p>
                    <div className="message-actions">
                      <button
                        className="action-button"
                        onClick={() => rateResponse(msg.id, 1)}
                        title="Not helpful"
                      >
                        👎
                      </button>
                      <button
                        className="action-button"
                        onClick={() => rateResponse(msg.id, 5)}
                        title="Helpful"
                      >
                        👍
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="message ai-message typing">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <textarea
              className="chat-input"
              placeholder="Type your message... (Shift+Enter for new line)"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              rows="3"
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={loading || !messageInput.trim()}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
