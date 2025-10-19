const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatHistorySchema = new mongoose.Schema({
  participantId: { type: String, required: true, index: true },
  suspectId: { type: String, required: true, index: true },
  messages: { type: [MessageSchema], default: [] },
});

ChatHistorySchema.index({ participantId: 1, suspectId: 1 }, { unique: true });

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
