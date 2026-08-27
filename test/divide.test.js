// Integration tests for POST /divide using the exported Express app and Node's
// built-in fetch, mounted on an ephemeral port (no MongoDB required).
const assert = require('assert');
const http = require('http');
const app = require('../src/index');

let server;
let base;

async function callDivide(body, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const res = await fetch(`${base}/divide`, {
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

  console.log('POST /divide cases:');

  // Valid integer quotient.
  let r = await callDivide({ a: 8, b: 2 });
  check('{"a":8,"b":2} -> 200 result=4', r.status === 200 && r.body.result === 4, r);

  // Non-integer quotient (float division).
  r = await callDivide({ a: 10, b: 4 });
  check('{"a":10,"b":4} -> 200 result=2.5', r.status === 200 && r.body.result === 2.5, r);

  // Negative operands.
  r = await callDivide({ a: -6, b: -2 });
  check('{"a":-6,"b":-2} -> 200 result=3', r.status === 200 && r.body.result === 3, r);

  // Negative dividend, positive divisor -> negative quotient.
  r = await callDivide({ a: -9, b: 3 });
  check('{"a":-9,"b":3} -> 200 result=-3', r.status === 200 && r.body.result === -3, r);

  // Zero dividend (a === 0) is valid and yields 0.
  r = await callDivide({ a: 0, b: 7 });
  check('{"a":0,"b":7} -> 200 result=0', r.status === 200 && r.body.result === 0, r);

  // Float dividend and divisor.
  r = await callDivide({ a: 1.5, b: 0.5 });
  check('{"a":1.5,"b":0.5} -> 200 result=3', r.status === 200 && r.body.result === 3, r);

  // Division by zero (b === 0) -> 400, must not compute.
  r = await callDivide({ a: 8, b: 0 });
  check('{"a":8,"b":0} -> 400 "b must not be zero"', r.status === 400 && r.body.error === 'b must not be zero', r);

  // Division by negative zero -> 400 (b === 0 covers -0).
  r = await callDivide({ a: 8, b: -0 });
  check('{"a":8,"b":-0} -> 400 "b must not be zero"', r.status === 400 && r.body.error === 'b must not be zero', r);

  // Both operands zero -> 400 (division by zero), not computed.
  r = await callDivide({ a: 0, b: 0 });
  check('{"a":0,"b":0} -> 400 "b must not be zero"', r.status === 400 && r.body.error === 'b must not be zero', r);

  // Missing a -> 400.
  r = await callDivide({ b: 3 });
  check('missing a -> 400 + error', r.status === 400 && r.body.error === 'a and b must be finite numbers', r);

  // Missing b -> 400.
  r = await callDivide({ a: 8 });
  check('missing b -> 400 + error', r.status === 400 && r.body.error === 'a and b must be finite numbers', r);

  // Empty body -> 400.
  r = await callDivide(undefined);
  check('empty body -> 400', r.status === 400, r);

  // Null b -> 400.
  r = await callDivide({ a: 8, b: null });
  check('null b -> 400', r.status === 400, r);

  // Null a -> 400.
  r = await callDivide({ a: null, b: 8 });
  check('null a -> 400', r.status === 400, r);

  // Non-numeric string operand -> 400.
  r = await callDivide({ a: 8, b: '3' });
  check('{"a":8,"b":"3"} -> 400', r.status === 400, r);

  // Boolean operand -> 400.
  r = await callDivide({ a: true, b: 8 });
  check('boolean a -> 400', r.status === 400, r);

  // NaN / Infinity -> 400 (stringified as null at the JSON layer; the invalid-value
  // path returns 400).
  r = await callDivide({ a: Infinity, b: 1 });
  check('Infinity a -> 400', r.status === 400, r);

  // Malformed JSON syntax -> 400.
  r = await callDivide('not json');
  check('invalid JSON syntax -> 400/415', r.status === 400 || r.status === 415, r);

  // Missing content-type -> json body unavailable; express.json() skips -> req.body = {} -> 400.
  const resRaw = await fetch(`${base}/divide`, { method: 'POST', headers: {}, body: '{"a":8,"b":3}' });
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
