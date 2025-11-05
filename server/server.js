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

// Trust proxy for x-forwarded-proto header (needed for Render and other hosting services)
app.set('trust proxy', 1);

// setup middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,
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

// catch-all for undefined routes (should be after all routes)
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found', path: req.originalUrl });
});
  

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


