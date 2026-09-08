// Integration tests for POST /factorial using the exported Express app and Node's
// built-in fetch, mounted on an ephemeral port (no MongoDB required).
const assert = require('assert');
const http = require('http');
const app = require('../src/index');

let server;
let base;

async function callFactorial(body, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const res = await fetch(`${base}/factorial`, {
    method: 'POST',
    headers,
    body: body === undefined || body === null ? undefined : JSON.stringify(body),
  });
  let json = null;
  const text = await res.text();
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
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

  console.log('POST /factorial cases:');

  // n=5 -> 120.
  let r = await callFactorial({ n: 5 });
  check('{"n":5} -> 200 result=120', r.status === 200 && r.body.result === 120, r);

  // n=0 -> 1.
  r = await callFactorial({ n: 0 });
  check('{"n":0} -> 200 result=1', r.status === 200 && r.body.result === 1, r);

  // n=1 -> 1.
  r = await callFactorial({ n: 1 });
  check('{"n":1} -> 200 result=1', r.status === 200 && r.body.result === 1, r);

  // Float n -> 400.
  r = await callFactorial({ n: 3.5 });
  check('{"n":3.5} -> 400 + error', r.status === 400 && r.body.error === 'n must be a non-negative integer', r);

  // Negative n -> 400.
  r = await callFactorial({ n: -1 });
  check('{"n":-1} -> 400 + error', r.status === 400 && r.body.error === 'n must be a non-negative integer', r);

  // Missing n -> 400.
  r = await callFactorial({});
  check('{} -> 400 + error', r.status === 400 && r.body.error === 'n must be a non-negative integer', r);

  // Null n -> 400.
  r = await callFactorial({ n: null });
  check('null n -> 400 + error', r.status === 400 && r.body.error === 'n must be a non-negative integer', r);

  // Empty body -> 400.
  r = await callFactorial(undefined);
  check('empty body -> 400 + error', r.status === 400 && r.body.error === 'n must be a non-negative integer', r);

  // Non-numeric string -> 400.
  r = await callFactorial({ n: '5' });
  check('{"n":"5"} -> 400 + error', r.status === 400 && r.body.error === 'n must be a non-negative integer', r);

  // NaN / Infinity -> 400.
  r = await callFactorial({ n: Infinity });
  check('Infinity n -> 400 + error', r.status === 400 && r.body.error === 'n must be a non-negative integer', r);

  // Invalid JSON syntax -> 400/415.
  r = await callFactorial('not json');
  check('invalid JSON syntax -> 400/415', r.status === 400 || r.status === 415, r);

  // Missing content-type -> express.json() skips -> req.body = {} -> 400.
  const resRaw = await fetch(`${base}/factorial`, {
    method: 'POST',
    headers: {},
    body: '{"n":5}',
  });
  check('no content-type -> 400', resRaw.status === 400, resRaw.status);

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
