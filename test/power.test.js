// Integration tests for POST /power using the exported Express app and Node's
// built-in fetch, mounted on an ephemeral port (no MongoDB required).
const assert = require('assert');
const http = require('http');
const app = require('../src/index');

let server;
let base;

async function callPower(body, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const res = await fetch(`${base}/power`, {
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

  console.log('POST /power cases:');

  // Valid integer exponentiation.
  let r = await callPower({ a: 2, b: 3 });
  check('{"a":2,"b":3} -> 200 result=8', r.status === 200 && r.body.result === 8, r);

  // Zero exponent -> 1.
  r = await callPower({ a: 2, b: 0 });
  check('{"a":2,"b":0} -> 200 result=1', r.status === 200 && r.body.result === 1, r);

  // Zero base with positive exponent -> 0.
  r = await callPower({ a: 0, b: 5 });
  check('{"a":0,"b":5} -> 200 result=0', r.status === 200 && r.body.result === 0, r);

  // Valid float operands.
  r = await callPower({ a: 4, b: 0.5 });
  check('{"a":4,"b":0.5} -> 200 result=2', r.status === 200 && r.body.result === 2, r);

  // Negative base with integer exponent.
  r = await callPower({ a: -2, b: 3 });
  check('{"a":-2,"b":3} -> 200 result=-8', r.status === 200 && r.body.result === -8, r);

  // Missing a -> 400.
  r = await callPower({ b: 3 });
  check('missing a -> 400 + error', r.status === 400 && r.body.error === 'a and b must be finite numbers', r);

  // Missing b -> 400.
  r = await callPower({ a: 8 });
  check('missing b -> 400 + error', r.status === 400 && r.body.error === 'a and b must be finite numbers', r);

  // Empty body -> 400.
  r = await callPower(undefined);
  check('empty body -> 400', r.status === 400, r);

  // Null b -> 400.
  r = await callPower({ a: 8, b: null });
  check('null b -> 400', r.status === 400, r);

  // Null a -> 400.
  r = await callPower({ a: null, b: 8 });
  check('null a -> 400', r.status === 400, r);

  // Non-numeric string -> 400.
  r = await callPower({ a: 8, b: '3' });
  check('{"a":8,"b":"3"} -> 400', r.status === 400, r);

  // Boolean operand -> 400.
  r = await callPower({ a: true, b: 8 });
  check('boolean a -> 400', r.status === 400, r);

  // NaN / Infinity -> 400.
  r = await callPower({ a: Infinity, b: 1 });
  check('Infinity a -> 400', r.status === 400, r);

  // Malformed JSON syntax -> 400.
  r = await callPower('not json');
  check('invalid JSON syntax -> 400/415', r.status === 400 || r.status === 415, r);

  // Missing content-type -> json body unavailable; express.json() skips -> req.body = {} -> 400.
  const resRaw = await fetch(`${base}/power`, { method: 'POST', headers: {}, body: '{"a":8,"b":3}' });
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
