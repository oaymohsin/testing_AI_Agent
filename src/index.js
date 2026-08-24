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
  res.json({ status: 'ok' });
});

// Application version derived from npm_package_version (set by npm during npm start);
// falls back to '1.0.0' when unset (e.g. running node directly).
const APP_VERSION = process.env.npm_package_version || '1.0.0';

app.get('/version', (req, res) => {
  res.json({ version: APP_VERSION });
});

app.use('/api/auth', authRoutes);

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
