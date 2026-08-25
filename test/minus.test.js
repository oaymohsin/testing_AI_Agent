// Integration tests for POST /minus using the exported Express app and Node's
// built-in fetch, mounted on an ephemeral port (no MongoDB required).
const assert = require('assert');
const http = require('http');
const app = require('../src/index');

let server;
let base;

async function callMinus(body, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const res = await fetch(`${base}/minus`, {
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

  console.log('POST /minus cases:');

  // Valid integer difference.
  let r = await callMinus({ a: 8, b: 3 });
  check('{"a":8,"b":3} -> 200 result=5', r.status === 200 && r.body.result === 5, r);

  // Negative difference (b > a).
  r = await callMinus({ a: 3, b: 8 });
  check('{"a":3,"b":8} -> 200 result=-5', r.status === 200 && r.body.result === -5, r);

  // Float operands.
  r = await callMinus({ a: 1.5, b: 1 });
  check('{"a":1.5,"b":1} -> 200 result=0.5', r.status === 200 && r.body.result === 0.5, r);

  // Negative and zero.
  r = await callMinus({ a: -2, b: 0 });
  check('{"a":-2,"b":0} -> 200 result=-2', r.status === 200 && r.body.result === -2, r);

  // Missing a -> 400.
  r = await callMinus({ b: 3 });
  check('missing a -> 400 + error', r.status === 400 && r.body.error === 'a and b must be finite numbers', r);

  // Missing b -> 400.
  r = await callMinus({ a: 8 });
  check('missing b -> 400 + error', r.status === 400 && r.body.error === 'a and b must be finite numbers', r);

  // Empty body -> 400.
  r = await callMinus(undefined);
  check('empty body -> 400', r.status === 400, r);

  // Null b -> 400.
  r = await callMinus({ a: 8, b: null });
  check('null b -> 400', r.status === 400, r);

  // Non-numeric string -> 400.
  r = await callMinus({ a: 8, b: '3' });
  check('{"a":8,"b":"3"} -> 400', r.status === 400, r);

  // NaN / Infinity -> 400 (stringified as null at JSON layer; NaN/Infinity are
  // invalid JSON that serializes to null, and the invalid-value path returns 400).
  r = await callMinus({ a: Infinity, b: 1 });
  check('Infinity a -> 400', r.status === 400, r);

  // Malformed JSON syntax -> 400.
  r = await callMinus('not json');
  check('invalid JSON syntax -> 400/415', r.status === 400 || r.status === 415, r);

  // Missing content-type -> json body unavailable; express.json() skips -> req.body = {} -> 400.
  const resRaw = await fetch(`${base}/minus`, { method: 'POST', headers: {}, body: '{"a":8,"b":3}' });
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
