// Integration tests for POST /count-characters using the exported Express app and Node's
// built-in fetch, mounted on an ephemeral port (no MongoDB required).
const assert = require('assert');
const http = require('http');
const app = require('../src/index');

let server;
let base;

async function callCountCharacters(body, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const res = await fetch(`${base}/count-characters`, {
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

  console.log('POST /count-characters cases:');

  // Valid string.
  let r = await callCountCharacters({ text: 'hello' });
  check('{"text":"hello"} -> 200 count=5', r.status === 200 && r.body.count === 5, r);

  // Empty string.
  r = await callCountCharacters({ text: '' });
  check('{"text":""} -> 200 count=0', r.status === 200 && r.body.count === 0, r);

  // Non-string number -> 400.
  r = await callCountCharacters({ text: 123 });
  check('{"text":123} -> 400 + error', r.status === 400 && r.body.error === 'text must be a string', r);

  // Missing text -> 400.
  r = await callCountCharacters({});
  check('{} -> 400 + error', r.status === 400 && r.body.error === 'text must be a string', r);

  // Null text -> 400.
  r = await callCountCharacters({ text: null });
  check('null text -> 400 + error', r.status === 400 && r.body.error === 'text must be a string', r);

  // Empty body -> 400.
  r = await callCountCharacters(undefined);
  check('empty body -> 400 + error', r.status === 400 && r.body.error === 'text must be a string', r);

  // Invalid JSON syntax -> 400/415.
  r = await callCountCharacters('not json');
  check('invalid JSON syntax -> 400/415', r.status === 400 || r.status === 415, r);

  // Missing content-type -> express.json() skips -> req.body = {} -> 400.
  const resRaw = await fetch(`${base}/count-characters`, {
    method: 'POST',
    headers: {},
    body: '{"text":"hello"}',
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
