const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3008;

const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());

app.get('/hello', (req, res) => {
  res.json({ message: 'hello' });
});

// POST /plus — add two numeric operands provided in the JSON body.
// Accepts integers and floats; rejects missing, null, non-numeric,
// NaN, or Infinity values with a 400 response.
app.post('/plus', (req, res) => {
  const { a, b } = req.body || {};

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return res.status(400).json({ error: 'a and b must be finite numbers' });
  }

  return res.status(200).json({ result: a + b });
});

app.get('/health-check', (req, res) => {
  res.status(200).send('Server is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Application version derived from npm_package_version (set by npm during npm start);
// falls back to '1.0.0' when unset (e.g. running node directly).
const APP_VERSION = process.env.npm_package_version || '1.0.0';

app.get('/version', (req, res) => {
  res.json({ version: APP_VERSION });
});

app.use('/api/auth', authRoutes);

// Static in-memory list of users known to the system.
// Used as the initial data source until a database-backed store is introduced.
const USERS = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
];

// GET /api/users — return the full list of users. Public endpoint, no auth,
// no query parameters, no side effects beyond serving the static list.
app.get('/api/users', (req, res) => {
  res.status(200).json(USERS);
});

// Connect to MongoDB, then start the server. Server error handler lets us reconnect/retry.
async function start() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is required.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

// Only auto-start when run directly (npm start / node src/index.js).
// Exporting the app lets tests mount it without a MongoDB connection.
if (require.main === module) {
  start();
}

module.exports = app;
