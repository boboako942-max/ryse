import React, { createContext, useState, useCallback, useContext } from 'react';
import axios from 'axios';

const ChatContext = createContext(undefined);

export function ChatProvider({ children }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState('default');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000/api';

  const sendMessage = useCallback(async (message, category = 'general') => {
    if (!message?.trim()) {
      setError('Message cannot be empty');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to use the chat feature');
        setLoading(false);
        return null;
      }

      console.log('Sending message to:', `${apiUrl}/chat/send`);
      const response = await axios.post(
        `${apiUrl}/chat/send`,
        { 
          message: message.trim(), 
          session: currentSession, 
          category 
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      console.log('Response received:', response.data);

      if (response.data?.data) {
        const data = response.data.data;
        setChatMessages((prev) => [
          ...prev,
          {
            id: data.id,
            userMessage: data.userMessage,
            aiResponse: data.aiResponse,
            timestamp: data.timestamp,
          },
        ]);
      }
      
      setLoading(false);
      return response.data?.data || null;
    } catch (err) {
      console.error('Chat error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const msg = err.response?.data?.message || err.message || 'Failed to send message';
      setError(msg);
      setLoading(false);
      return null;
    }
  }, [currentSession, apiUrl]);

  // Get chat history
  const getChatHistory = useCallback(async (session = 'default', limit = 50) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view chat history');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${apiUrl}/chat/history`, {
        params: { session, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      setChatMessages(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load chat history');
      setLoading(false);
    }
  }, [apiUrl]);

  // Rate AI response
  const rateResponse = useCallback(async (messageId, rating) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${apiUrl}/chat/rate`,
        { messageId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, feedbackRating: rating } : msg
        )
      );
    } catch (err) {
      console.error('Failed to rate response:', err);
    }
  }, [apiUrl]);

  // Clear chat history
  const clearHistory = useCallback(async (session = 'default') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${apiUrl}/chat/clear`,
        { session },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatMessages([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
      setError('Failed to clear chat history');
    }
  }, [apiUrl]);

  const value = {
    chatMessages,
    loading,
    error,
    currentSession,
    setCurrentSession,
    sendMessage,
    getChatHistory,
    rateResponse,
    clearHistory,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
