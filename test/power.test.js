// Integration tests for POST /power using the exported Express app and Node's
// built-in fetch, mounted on an ephemeral port (no MongoDB required).
const http = require('http');
const app = require('../src/index');

let server;
let base;

async function callPower(body) {
  const res = await fetch(`${base}/power`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  let r = await callPower({ a: 2, b: 3 });
  check('{"a":2,"b":3} -> 200 result=8', r.status === 200 && r.body.result === 8, r);

  r = await callPower({ a: 2, b: 0 });
  check('{"a":2,"b":0} -> 200 result=1', r.status === 200 && r.body.result === 1, r);

  r = await callPower({ a: 2 });
  check('missing b -> 400 + error', r.status === 400 && typeof r.body.error === 'string', r);

  r = await callPower({ b: 3 });
  check('missing a -> 400 + error', r.status === 400 && typeof r.body.error === 'string', r);

  r = await callPower({ a: 'x', b: 4 });
  check('non-numeric a -> 400', r.status === 400, r);

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
