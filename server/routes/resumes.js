const express = require('express');
const Resume = require('../models/Resume');
const router = express.Router();

// get all resumes
router.get('/', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const items = await Resume.find({ createdBy: req.user.userId }).sort({ createdAt: -1 }).select('filename sections createdAt');
  res.json({ items });
});

// get one resume
router.get('/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const item = await Resume.findOne({ _id: req.params.id, createdBy: req.user.userId });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json({ item });
});

// save a new resume
router.post('/', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { filename = '', contentText = '', sections = [], meta = {}, fileData = '' } = req.body;
  const item = await Resume.create({ filename, contentText, sections, meta, fileData, createdBy: req.user.userId });
  res.status(201).json({ item });
});

module.exports = router;

