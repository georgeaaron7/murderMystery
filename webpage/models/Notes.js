const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, default: '' },
  color: { type: String, required: true },
  ts: { type: Number, required: true }
});

const ConnectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  a: { type: String, required: true },
  b: { type: String, required: true }
});

const NotesSchema = new mongoose.Schema({
  participantId: { type: String, required: true, index: true },
  suspectId: { type: String, required: true, index: true },
  notes: [NoteSchema],
  connections: [ConnectionSchema],
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for fast lookups
NotesSchema.index({ participantId: 1, suspectId: 1 }, { unique: true });

module.exports = mongoose.model('Notes', NotesSchema);
