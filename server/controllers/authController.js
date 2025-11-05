const jwt = require('jsonwebtoken');
const User = require('../models/User');

function createJwt(userId) {
  const { JWT_SECRET } = process.env;
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res, token, remember) {
  if (remember) {
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  } else {
    // don't save cookie if they didn't check remember me
    res.clearCookie('token', { path: '/' });
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
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const user = await User.create({ email, username, password });
    const token = createJwt(user.id);
    setAuthCookie(res, token, Boolean(remember));
    res.status(201).json({
      user: { id: user.id, email: user.email, username: user.username },
      remembered: Boolean(remember),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const token = createJwt(user.id);
    setAuthCookie(res, token, Boolean(remember));
    res.json({ user: { id: user.id, email: user.email, username: user.username }, remembered: Boolean(remember) });
  } catch (err) {
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
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


