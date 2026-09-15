// Integration tests for client report list + CSV export (exported app, ephemeral port).
const http = require('http');
const app = require('../src/index');

let server;
let base;

async function getJson(path) {
  const res = await fetch(`${base}${path}`);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body, headers: res.headers };
}

async function getText(path) {
  const res = await fetch(`${base}${path}`);
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

async function main() {
  let pass = 0;
  let fail = 0;
  function check(name, cond, actual) {
    if (cond) {
      pass++;
      console.log(`  ok  ${name}`);
    } else {
      fail++;
      console.log(`FAIL  ${name} -> got ${JSON.stringify(actual)}`);
    }
  }

  console.log('GET /api/client-reports/requests and export:');

  let r = await getJson('/api/client-reports/requests');
  check(
    'no filters -> 200 and all seeded rows',
    r.status === 200 && Array.isArray(r.body) && r.body.length === 4,
    r
  );
  check(
    'each row has required fields',
    r.body.every(
      (row) =>
        row.tmKey &&
        row.title &&
        row.board &&
        row.status &&
        row.client &&
        row.createdAt
    ),
    r.body
  );

  r = await getJson(
    '/api/client-reports/requests?client=Acme%20Corp&board=task&status=In%20Progress'
  );
  const task1 = r.body.find((row) => row.tmKey === 'TASK-1');
  check(
    'Acme + task + In Progress -> TASK-1 present',
    r.status === 200 && task1 && task1.client === 'Acme Corp',
    r
  );
  check(
    'Acme + task + In Progress -> excludes non-matching',
    r.status === 200 && r.body.length === 1,
    r
  );

  r = await getJson('/api/client-reports/requests?client=%20');
  check(
    'whitespace client -> 400',
    r.status === 400 && r.body.error && r.body.error.includes('client'),
    r
  );

  const listFiltered = await getJson('/api/client-reports/requests?client=Acme%20Corp');
  const csvFiltered = await getText('/api/client-reports/export?client=Acme%20Corp');
  const csvLines = csvFiltered.text.trim().split('\n');
  check('export Acme -> 200 text/csv', csvFiltered.status === 200, csvFiltered.status);
  check(
    'export Content-Type text/csv',
    (csvFiltered.headers.get('content-type') || '').includes('text/csv'),
    csvFiltered.headers.get('content-type')
  );
  check(
    'export Content-Disposition attachment client-requests.csv',
    (csvFiltered.headers.get('content-disposition') || '').includes('client-requests.csv'),
    csvFiltered.headers.get('content-disposition')
  );
  check(
    'CSV header row',
    csvLines[0] === 'tmKey,title,board,status,client,createdAt',
    csvLines[0]
  );
  check(
    'CSV data row count matches JSON list',
    csvLines.length - 1 === listFiltered.body.length,
    { csvRows: csvLines.length - 1, jsonLen: listFiltered.body.length }
  );
  check(
    'CSV contains TASK-1 tmKey',
    csvFiltered.text.includes('TASK-1'),
    csvFiltered.text.slice(0, 120)
  );

  const listAll = await getJson('/api/client-reports/requests');
  const csvAll = await getText('/api/client-reports/export');
  const allLines = csvAll.text.trim().split('\n');
  check(
    'unfiltered export row count matches list',
    allLines.length - 1 === listAll.body.length,
    { csvRows: allLines.length - 1, jsonLen: listAll.body.length }
  );

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
}

(async () => {
  try {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        base = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
    await main();
  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
  }
})();
