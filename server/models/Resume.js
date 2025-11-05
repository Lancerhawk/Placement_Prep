const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    items: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { _id: false }
);

const ResumeSchema = new mongoose.Schema(
  {
    filename: { type: String },
    contentText: { type: String },
    sections: [SectionSchema],
    meta: { type: mongoose.Schema.Types.Mixed },
    fileData: { type: String }, // Base64 encoded file for preview
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', ResumeSchema);

