const express = require('express');
const Practice = require('../models/Practice');
const { generatePracticeQuestions } = require('../services/aiService');
const router = express.Router();

// get all practice sessions
router.get('/', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const items = await Practice.find({ createdBy: req.user.userId }).sort({ createdAt: -1 }).select('title language topic generating results createdAt');
  res.json({ items });
});

// get one practice session
router.get('/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const item = await Practice.findOne({ _id: req.params.id, createdBy: req.user.userId });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json({ item });
});

// create practice quiz and generate questions
router.post('/', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { language = 'English', topic = 'DSA', numQuestions = 20 } = req.body;
  if (!topic) return res.status(400).json({ message: 'topic is required' });
  const title = `${topic} (${language})`;
  const item = await Practice.create({ title, language, topic, questions: [], generating: true, createdBy: req.user.userId });
  res.status(201).json({ item });

  (async () => {
    try {
      const generated = await generatePracticeQuestions({ language, topic, numQuestions });
      const questions = (generated.questions || []).map((q) => ({
        prompt: q.prompt,
        options: q.options || [],
        answer: q.answer,
        explanation: q.explanation,
      }));
      item.questions = questions;
      item.generating = false;
      await item.save();
    } catch (e) {
      item.generating = false;
      await item.save();
      console.error('Practice generation failed:', e.message);
    }
  })();
});

// submit practice test results
router.post('/:id/submit', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { answers = [], durationSec = 0 } = req.body;
  const item = await Practice.findOne({ _id: req.params.id, createdBy: req.user.userId });
  if (!item) return res.status(404).json({ message: 'Not found' });
  let correct = 0;
  item.questions.forEach((q, idx) => {
    if (String(answers[idx]) === String(q.answer) || answers[idx] === q.answer || q.options?.[answers[idx]] === q.answer) {
      correct += 1;
    }
  });
  item.results.push({ correct, total: item.questions.length, durationSec });
  await item.save();
  const score = item.questions.length ? Math.round((correct / item.questions.length) * 100) : 0;
  res.json({ score, correct, total: item.questions.length, durationSec });
});

module.exports = router;


