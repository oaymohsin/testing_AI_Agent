# testing_AI_Agent

A tiny Express server. Start with `npm start` (default port 3008, override with `PORT`).

Endpoints:
- `GET /hello` — returns `{ "message": "hello" }`
- `GET /health-check` — returns a `200` "Server is running"
- `GET /version` — returns `{ "version": "<npm_package_version>" }` (falls back to `1.0.0`)
- `POST /plus` — adds two numbers `{ "a": 2, "b": 3 }` → `{ "result": 5 }`. Rejects missing, non-numeric, NaN, or Infinity operands with a `400`.
- `POST /minus` — subtracts `b` from `a` `{ "a": 8, "b": 3 }` → `{ "result": 5 }`. Same `400` validation as `/plus`.
- `POST /multiply` — multiplies two numbers `{ "a": 2, "b": 3 }` → `{ "result": 6 }`. Same `400` validation as `/plus`.
- `POST /divide` — divides `a` by `b` `{ "a": 8, "b": 2 }` → `{ "result": 4 }`. Same `400` validation as `/plus`; rejects `b === 0` with `{ "error": "b must not be zero" }`.
- `POST /modulo` — JavaScript remainder `a % b` `{ "a": 10, "b": 3 }` → `{ "result": 1 }`. Same `400` validation as `/divide`; rejects `b === 0` with `{ "error": "b must not be zero" }`.
- `POST /power` — raises `a` to the exponent `b` `{ "a": 2, "b": 3 }` → `{ "result": 8 }`. Same `400` validation as `/plus`.
- `POST /count-characters` — returns UTF-16 character length of `{ "text": "hello" }` → `{ "count": 5 }`. Rejects missing, null, or non-string `text` with `{ "error": "text must be a string" }`.
- `POST /factorial` — computes factorial of a non-negative integer `{ "n": 5 }` → `{ "result": 120 }`. `0!` returns `{ "result": 1 }`. Rejects missing, null, non-integer, negative, NaN, or Infinity `n` with `{ "error": "n must be a non-negative integer" }`.

Tests: `npm test` runs integration tests for `POST /plus`, `POST /minus`, `POST /multiply`, `POST /divide`, `POST /modulo`, `POST /power`, `POST /count-characters`, and `POST /factorial` against the exported app on an ephemeral port (no MongoDB required).