const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userMessage: {
      type: String,
      required: true,
    },
    aiResponse: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      default: 'user',
    },
    session: {
      type: String,
      default: 'default',
    },
    feedbackRating: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      default: null,
    },
    category: {
      type: String,
      enum: ['product', 'order', 'shipping', 'payment', 'general', 'returns'],
      default: 'general',
    },
  },
  { timestamps: true }
);

// Index for faster queries
ChatMessageSchema.index({ userId: 1, createdAt: -1 });
ChatMessageSchema.index({ userId: 1, session: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
