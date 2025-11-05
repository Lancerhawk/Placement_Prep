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

const TopicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    questions: [QuestionSchema],
    completed: { type: Boolean, default: false },
    lastScore: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    progress: {
      answers: [{ type: Number, default: -1 }],
      remainingSec: { type: Number, default: 0 },
      locked: [{ type: Number }],
      flags: [{ type: Number }],
      updatedAt: { type: Date },
    },
  },
  { _id: true }
);

const ResultSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, required: true },
    correct: { type: Number, required: true },
    total: { type: Number, required: true },
    takenAt: { type: Date, default: Date.now },
    durationSec: { type: Number, default: 0 },
  },
  { _id: false }
);

const InterviewSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    type: { type: String, enum: ['technical', 'behavioral', 'other'], default: 'technical' },
    techStack: [{ type: String }],
    salary: { type: String },
    numQuestions: { type: Number, default: 20 },
    rounds: { type: Number, default: 5 },
    perRound: { type: Number, default: 5 },
    topics: [TopicSchema],
    results: [ResultSchema],
    generating: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', InterviewSchema);


