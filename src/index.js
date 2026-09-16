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

// POST /modulo — JavaScript remainder a % b, with the same validation as /divide.
// Accepts integers and floats (negative, zero) for a; rejects missing, null,
// non-numeric, NaN, or Infinity operands with a 400 response. Divisor b === 0
// is rejected with a separate 400 response and never computed.
app.post('/modulo', (req, res) => {
  const { a, b } = req.body || {};

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return res.status(400).json({ error: 'a and b must be finite numbers' });
  }

  if (b === 0) {
    return res.status(400).json({ error: 'b must not be zero' });
  }

  return res.status(200).json({ result: a % b });
});

// POST /power — raise a to the exponent b, with the same validation as /plus,
// /minus, /multiply, and /divide. Accepts integers and floats (negative, zero);
// rejects missing, null, non-numeric, NaN, or Infinity operands with a 400 response.
app.post('/power', (req, res) => {
  const { a, b } = req.body || {};

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return res.status(400).json({ error: 'a and b must be finite numbers' });
  }

  return res.status(200).json({ result: a ** b });
});

// POST /factorial — compute n! for a non-negative integer n.
// Accepts a numeric n field; rejects missing, null, non-integer, negative,
// NaN, or Infinity values with a 400 response.
app.post('/factorial', (req, res) => {
  const { n } = req.body || {};

  if (!Number.isInteger(n) || n < 0) {
    return res.status(400).json({ error: 'n must be a non-negative integer' });
  }

  if (n === 0 || n === 1) {
    return res.status(200).json({ result: 1 });
  }

  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }

  return res.status(200).json({ result });
});

app.get('/health-check', (req, res) => {
  res.status(200).send('Server is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/todaydatetime', (req, res) => {
  res.status(200).json({ datetime: new Date().toISOString() });
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

// Static in-memory client request history for reports and CSV export.
const CLIENT_REQUESTS = [
  {
    tmKey: 'TASK-1',
    title: 'Fix login redirect',
    board: 'task',
    status: 'In Progress',
    client: 'Acme Corp',
    createdAt: '2024-06-01T12:00:00.000Z',
  },
  {
    tmKey: 'TASK-2',
    title: 'Deploy staging',
    board: 'task',
    status: 'Done',
    client: 'Acme Corp',
    createdAt: '2024-06-02T14:30:00.000Z',
  },
  {
    tmKey: 'BUG-1',
    title: 'Crash on logout',
    board: 'bug',
    status: 'In Progress',
    client: 'Beta Inc',
    createdAt: '2024-06-03T09:15:00.000Z',
  },
  {
    tmKey: 'TASK-3',
    title: 'Update docs',
    board: 'task',
    status: 'Open',
    client: 'Globex',
    createdAt: '2024-06-04T16:45:00.000Z',
  },
];

const CLIENT_REPORT_FILTER_PARAMS = ['client', 'board', 'status'];

function validateClientReportQuery(query) {
  for (const param of CLIENT_REPORT_FILTER_PARAMS) {
    if (Object.prototype.hasOwnProperty.call(query, param)) {
      const value = query[param];
      if (typeof value !== 'string' || value.trim() === '') {
        return `${param} must be a non-empty string`;
      }
    }
  }
  return null;
}

function filterClientRequests(query) {
  let rows = CLIENT_REQUESTS;

  for (const param of CLIENT_REPORT_FILTER_PARAMS) {
    if (query[param] === undefined) {
      continue;
    }
    const needle = query[param].trim().toLowerCase();
    rows = rows.filter((row) => String(row[param]).trim().toLowerCase() === needle);
  }

  return rows;
}

function escapeCsvField(value) {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function clientRequestsToCsv(rows) {
  const columns = ['tmKey', 'title', 'board', 'status', 'client', 'createdAt'];
  const header = columns.join(',');
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCsvField(row[col])).join(',')
  );
  return [header, ...dataLines].join('\n');
}

function handleClientReportFilterError(req, res) {
  const message = validateClientReportQuery(req.query);
  if (message) {
    res.status(400).json({ error: message });
    return true;
  }
  return false;
}

// GET /api/client-reports/requests — filtered JSON list of client request history.
app.get('/api/client-reports/requests', (req, res) => {
  if (handleClientReportFilterError(req, res)) {
    return;
  }
  res.status(200).json(filterClientRequests(req.query));
});

// GET /api/client-reports/export — same filters as requests, returned as CSV download.
app.get('/api/client-reports/export', (req, res) => {
  if (handleClientReportFilterError(req, res)) {
    return;
  }
  const rows = filterClientRequests(req.query);
  res
    .status(200)
    .type('text/csv')
    .set('Content-Disposition', 'attachment; filename="client-requests.csv"')
    .send(clientRequestsToCsv(rows));
});

// Only auto-start when run directly (npm start / node src/index.js).
// Exporting the app lets tests mount it without starting a listener.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
