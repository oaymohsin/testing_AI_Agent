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

start();
