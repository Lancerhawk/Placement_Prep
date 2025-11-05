const jwt = require('jsonwebtoken');
const User = require('../models/User');

function createJwt(userId) {
  const { JWT_SECRET } = process.env;
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res, token, remember, req) {
  // Detect production: check if request is HTTPS or NODE_ENV is production
  const isProduction = process.env.NODE_ENV === 'production' || 
                       req.secure || 
                       req.headers['x-forwarded-proto'] === 'https';
  
  const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction, // Required when sameSite is 'none'
    path: '/',
  };
  
  if (remember) {
    // Persistent cookie that lasts 7 days
    res.cookie('token', token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  } else {
    // Session cookie (no maxAge) - cleared when browser closes
    res.cookie('token', token, cookieOptions);
  }
}

exports.register = async (req, res) => {
  try {
    const { email, username, password, confirmPassword, remember } = req.body;
    if (!email || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const user = await User.create({ email, username, password });
    const token = createJwt(user.id);
    setAuthCookie(res, token, Boolean(remember), req);
    res.status(201).json({
      user: { id: user.id, email: user.email, username: user.username },
      remembered: Boolean(remember),
    });
  } catch (err) {
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email or username already registered' });
    }
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const token = createJwt(user.id);
    setAuthCookie(res, token, Boolean(remember), req);
    res.json({ user: { id: user.id, email: user.email, username: user.username }, remembered: Boolean(remember) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const auth = req.user;
    if (!auth) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(auth.userId).select('email username');
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    res.json({ user: { id: user.id, email: user.email, username: user.username } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    // wipe the auth cookie
    const isProduction = process.env.NODE_ENV === 'production' || 
                         req.secure || 
                         req.headers['x-forwarded-proto'] === 'https';
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      path: '/',
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


