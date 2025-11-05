const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    options: [{ type: String }],
    answer: { type: String },
    explanation: { type: String },
  },
  { _id: false }
);

const ResultSchema = new mongoose.Schema(
  {
    correct: { type: Number, required: true },
    total: { type: Number, required: true },
    durationSec: { type: Number, default: 0 },
    takenAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PracticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    language: { type: String, required: true },
    topic: { type: String, required: true },
    questions: [QuestionSchema],
    generating: { type: Boolean, default: false },
    results: [ResultSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Practice', PracticeSchema);


