/**
 * Auth Routes
 * POST /api/auth/register  — create new account
 * POST /api/auth/login     — authenticate, return JWT
 * GET  /api/auth/me        — get current user (protected)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { isUsingMongo, getJsonAdapter } = require('../middleware/database');
const { authMiddleware, generateToken } = require('../middleware/auth');

const router = express.Router();

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const errors = [];
    if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
    if (!email || !validateEmail(email)) errors.push('Valid email address is required');
    if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
    if (errors.length) return res.status(400).json({ error: errors[0], errors });

    if (isUsingMongo()) {
      const User = require('../models/User');
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(409).json({ error: 'Email already registered' });
      const user = new User({ name: name.trim(), email: email.toLowerCase(), password });
      await user.save();
      const token = generateToken({ id: user._id, email: user.email, name: user.name });
      return res.status(201).json({ message: 'Account created successfully', token, user: { id: user._id, name: user.name, email: user.email } });
    } else {
      const db = getJsonAdapter();
      const existing = db.findOne('users', { email: email.toLowerCase() });
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const hashedPwd = await bcrypt.hash(password, 12);
      const newUser = { id: uuidv4(), name: name.trim(), email: email.toLowerCase(), password: hashedPwd, role: 'customer', createdAt: new Date().toISOString() };
      db.insertOne('users', newUser);
      const token = generateToken({ id: newUser.id, email: newUser.email, name: newUser.name });
      return res.status(201).json({ message: 'Account created successfully', token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    }
  } catch (err) {
    console.error('[Register]', err);
    if (err.code === 11000) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    if (isUsingMongo()) {
      const User = require('../models/User');
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user || !(await user.comparePassword(password)))
        return res.status(401).json({ error: 'Invalid email or password' });
      const token = generateToken({ id: user._id, email: user.email, name: user.name });
      return res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email } });
    } else {
      const db = getJsonAdapter();
      const user = db.findOne('users', { email: email.toLowerCase() });
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
      const token = generateToken({ id: user.id, email: user.email, name: user.name });
      return res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email } });
    }
  } catch (err) {
    console.error('[Login]', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (isUsingMongo()) {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user });
    } else {
      const db = getJsonAdapter();
      const user = db.findOne('users', { id: req.user.id });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { password, ...safeUser } = user;
      return res.json({ user: safeUser });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
