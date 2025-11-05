const express = require('express');
const Interview = require('../models/Interview');
const { generateTopicsQuestions } = require('../services/aiService');
const router = express.Router();

// get all interviews
router.get('/', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const items = await Interview.find({ createdBy: req.user.userId }).sort({ createdAt: -1 }).select('company role type salary topics results createdAt generating rounds perRound');
  res.json({ items });
});

// get one interview
router.get('/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const item = await Interview.findOne({ _id: req.params.id, createdBy: req.user.userId });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json({ item });
});

// create interview and start generating questions
router.post('/', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    let { company, role, type = 'technical', techStack = [], salary = '', numQuestions = 20, rounds = 5, perRound = 5 } = req.body;
    if (!company || !role) return res.status(400).json({ message: 'company and role are required' });
    rounds = Math.max(1, Math.min(10, Number(rounds)));
    perRound = Math.max(5, Math.min(10, Number(perRound)));

    const interview = await Interview.create({ company, role, type, techStack, salary, numQuestions, rounds, perRound, topics: [], generating: true, createdBy: req.user.userId });
    res.status(201).json({ item: interview });

    // generate questions in the background
    (async () => {
      try {
        const generated = await generateTopicsQuestions({ company, role, type, techStack, rounds, perRound, numQuestions });
        const topics = (generated.topics || []).map((t) => ({
          name: t.name,
          questions: (t.questions || []).map((q) => ({
            prompt: q.prompt,
            options: q.options || [],
            answer: q.answer,
            explanation: q.explanation,
          })),
          totalQuestions: (t.questions || []).length,
        }));
        interview.topics = topics;
        interview.generating = false;
        await interview.save();
      } catch (e) {
        interview.generating = false;
        await interview.save();
        console.error('Generation failed:', e.message);
      }
    })();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// manually trigger regeneration
router.post('/:id/generate', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const interview = await Interview.findOne({ _id: req.params.id, createdBy: req.user.userId });
  if (!interview) return res.status(404).json({ message: 'Not found' });
  interview.generating = true;
  await interview.save();
  (async () => {
    try {
      const generated = await generateTopicsQuestions({
        company: interview.company,
        role: interview.role,
        type: interview.type,
        techStack: interview.techStack,
        rounds: interview.rounds,
        perRound: interview.perRound,
        numQuestions: interview.numQuestions,
      });
      const topics = (generated.topics || []).map((t) => ({
        name: t.name,
        questions: (t.questions || []).map((q) => ({ prompt: q.prompt, options: q.options || [], answer: q.answer, explanation: q.explanation })),
        totalQuestions: (t.questions || []).length,
      }));
      interview.topics = topics;
      interview.generating = false;
      await interview.save();
    } catch (e) {
      interview.generating = false;
      await interview.save();
    }
  })();
  res.json({ ok: true });
});

// submit test results
router.post('/:id/submit', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { topicId, answers = [], durationSec = 0 } = req.body;
  const interview = await Interview.findOne({ _id: req.params.id, createdBy: req.user.userId });
  if (!interview) return res.status(404).json({ message: 'Not found' });
  const topic = interview.topics.id(topicId);
  if (!topic) return res.status(404).json({ message: 'Topic not found' });

  let correct = 0;
  topic.questions.forEach((q, idx) => {
    if (String(answers[idx]) === String(q.answer) || answers[idx] === q.answer || q.options?.[answers[idx]] === q.answer) {
      correct += 1;
    }
  });
  topic.completed = true;
  topic.lastScore = Math.round((correct / topic.questions.length) * 100);
  topic.totalQuestions = topic.questions.length;
  topic.progress = { answers: [], remainingSec: 0, locked: [], flags: [], updatedAt: new Date() };

  interview.results.push({ topicId, correct, total: topic.questions.length, durationSec });
  await interview.save();
  res.json({ score: topic.lastScore, correct, total: topic.questions.length, durationSec });
});

// save test progress
router.patch('/:id/progress', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { topicId, answers = [], remainingSec = 0, locked = [], flags = [] } = req.body;
  const interview = await Interview.findOne({ _id: req.params.id, createdBy: req.user.userId });
  if (!interview) return res.status(404).json({ message: 'Not found' });
  const topic = interview.topics.id(topicId);
  if (!topic) return res.status(404).json({ message: 'Topic not found' });
  if (topic.completed) return res.status(400).json({ message: 'Topic already completed' });
  topic.progress = {
    answers,
    remainingSec,
    locked,
    flags,
    updatedAt: new Date(),
  };
  await interview.save();
  res.json({ ok: true });
});

// reset topic so user can retake
router.post('/:id/retake', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { topicId } = req.body;
  const interview = await Interview.findOne({ _id: req.params.id, createdBy: req.user.userId });
  if (!interview) return res.status(404).json({ message: 'Not found' });
  const topic = interview.topics.id(topicId);
  if (!topic) return res.status(404).json({ message: 'Topic not found' });
  topic.completed = false;
  topic.lastScore = 0;
  topic.progress = { answers: [], remainingSec: 0, locked: [], flags: [], updatedAt: new Date() };
  // delete old results for this topic
  interview.results = interview.results.filter((r) => String(r.topicId) !== String(topicId));
  await interview.save();
  res.json({ ok: true });
});

module.exports = router;


