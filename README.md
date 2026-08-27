# testing_AI_Agent

A tiny Express server. Start with `npm start` (default port 3008, override with `PORT`).

Endpoints:
- `GET /hello` — returns `{ "message": "hello" }`
- `GET /health-check` — returns a `200` "Server is running"
- `GET /version` — returns `{ "version": "<npm_package_version>" }` (falls back to `1.0.0`)
- `POST /plus` — adds two numbers `{ "a": 2, "b": 3 }` → `{ "result": 5 }`. Rejects missing, non-numeric, NaN, or Infinity operands with a `400`.
- `POST /minus` — subtracts `b` from `a` `{ "a": 8, "b": 3 }` → `{ "result": 5 }`. Same `400` validation as `/plus`.
- `POST /multiply` — multiplies two numbers `{ "a": 2, "b": 3 }` → `{ "result": 6 }`. Same `400` validation as `/plus`.

Tests: `npm test` runs integration tests for `POST /plus`, `POST /minus`, and `POST /multiply` against the exported app on an ephemeral port (no MongoDB required).