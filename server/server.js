const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authMiddleware = require('./middlewares/auth');
const authRoutes = require('./routes/auth');
const interviewRoutes = require('./routes/interviews');
const practiceRoutes = require('./routes/practice');
const resumeRoutes = require('./routes/resumes');

const app = express();

// setup middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(authMiddleware);

// routes
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/resumes', resumeRoutes);

// health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// start the server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on :${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });


