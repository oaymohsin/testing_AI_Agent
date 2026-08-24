const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate a signed JWT for a user document.
function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Normalize a user doc into a password-free object for responses.
function publicUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return obj;
}

// POST /api/auth/signup — register a new user.
// 400 missing/invalid fields, 409 duplicate email, 201 created.
router.post('/signup', async (req, res) => {
  const { username, email, password, role } = req.body || {};

  // Required fields present?
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }

  // Email format.
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'email is invalid' });
  }

  // Username length cap.
  if (typeof username === 'string' && username.length > 50) {
    return res.status(400).json({ error: 'username cannot exceed 50 characters' });
  }

  // Role must be one of the allowed values (defaults handled by the schema).
  if (role !== undefined && !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be either user or admin' });
  }

  try {
    let user = await User.create({ username, email, password, role });

    // Reload without the password select:false referenced in create response.
    user = await User.findById(user._id);

    return res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    // Duplicate key on the unique email index.
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'email already exists' });
    }

    // Mongoose validation error (schema-level checks not otherwise applied).
    if (err && err.name === 'ValidationError') {
      const messages = Object.values(err.errors || {}).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/signin — authenticate a user, return a JWT token.
// 401 invalid credentials, 200 token + user.
router.post('/signin', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    // Explicitly select password (schema default excludes it).
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'invalid email or password' });
    }

    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(401).json({ error: 'invalid email or password' });
    }

    const token = signToken(user._id);
    return res.status(200).json({ token, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
