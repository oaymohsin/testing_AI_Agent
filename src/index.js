const express = require('express');

const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3008;

// Allow the local Vite dev server to call this API from the browser.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

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

// POST /count-characters — return the UTF-16 character length of the input text.
// Accepts a string text field; rejects missing, null, or non-string values with 400.
app.post('/count-characters', (req, res) => {
  try {
    const { text } = req.body || {};

    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'text must be a string' });
    }

    return res.status(200).json({ count: text.length });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /minus — subtract b from a, with the same validation as /plus.
// Accepts integers and floats (negative, zero); rejects missing, null,
// non-numeric, NaN, or Infinity operands with a 400 response.
app.post('/minus', (req, res) => {
  const { a, b } = req.body || {};

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return res.status(400).json({ error: 'a and b must be finite numbers' });
  }

  return res.status(200).json({ result: a - b });
});

// POST /multiply — multiply a by b, with the same validation as /plus and /minus.
// Accepts integers and floats (negative, zero); rejects missing, null,
// non-numeric, NaN, or Infinity operands with a 400 response. Returns 0 when
// either operand is 0.
app.post('/multiply', (req, res) => {
  const { a, b } = req.body || {};

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return res.status(400).json({ error: 'a and b must be finite numbers' });
  }

  return res.status(200).json({ result: a * b });
});

// POST /divide — divide a by b, with the same validation as /plus, /minus, and
// /multiply. Accepts integers and floats (negative, zero) for a; rejects missing,
// null, non-numeric, NaN, or Infinity operands with a 400 response. Division by
// zero (b === 0) is rejected with a separate 400 response and never computed.
app.post('/divide', (req, res) => {
  const { a, b } = req.body || {};

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return res.status(400).json({ error: 'a and b must be finite numbers' });
  }

  if (b === 0) {
    return res.status(400).json({ error: 'b must not be zero' });
  }

  return res.status(200).json({ result: a / b });
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

// Only auto-start when run directly (npm start / node src/index.js).
// Exporting the app lets tests mount it without starting a listener.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
