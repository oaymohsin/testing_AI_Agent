// Integration tests for GET /todaydatetime using the exported Express app and Node's
// built-in fetch, mounted on an ephemeral port (no MongoDB required).
const http = require('http');
const app = require('../src/index');

let server;
let base;

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

  console.log('GET /todaydatetime cases:');

  const res = await fetch(`${base}/todaydatetime`);
  const body = await res.json();

  check('status 200', res.status === 200, res.status);
  check('datetime is string', typeof body.datetime === 'string', body);
  check(
    'datetime is valid ISO-8601 UTC',
    Number.isFinite(Date.parse(body.datetime)) && body.datetime.endsWith('Z'),
    body.datetime,
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
