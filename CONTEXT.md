## Purpose

This repo is a minimal Express HTTP server sandbox for AI agent POC testing. It exposes greeting, health check, health probe, version, user list, arithmetic addition, subtraction, and multiplication endpoints on port 3008 (configurable via `PORT`). The server can be run as a standalone process or imported as an Express app for integration testing in Node.

## Folder Structure

```
testing_AI_Agent/
├── .git/                  # Git repo (single branch: main)
├── src/
│   └── index.js           # Sole application file — Express app + server bootstrap (exports app for tests)
├── test/
│   ├── plus.test.js       # Integration tests for POST /plus (uses built-in fetch, no DB required)
│   ├── minus.test.js      # Integration tests for POST /minus (uses built-in fetch, no DB required)
│   └── multiply.test.js   # Integration tests for POST /multiply (uses built-in fetch, no DB required)
├── node_modules/          # Installed dependencies (Express 4.x, bcrypt)
├── package.json           # Project manifest + scripts (includes npm test)
├── package-lock.json      # Lockfile
├── README.md              # Usage/endpoints doc (includes POST /plus, /minus and /multiply docs)
└── CONTEXT.md             # Repo context for the AI coding agent
```

## Key Modules

- `src/index.js` — the only application file. Requires `express`, creates the app, defines routes (including `/health`, `/version`, `/api/users`, `POST /plus`, `POST /minus`, and `POST /multiply`), and starts the server with `app.listen()`. Uses the port from `process.env.PORT` (default `3008`). The health endpoint explicitly sets HTTP status 200 before returning JSON. Contains a static in-memory `USERS` array. Exports the Express app via `module.exports` and only auto-starts when run directly (via `require.main === module` check) — this allows tests to mount the app on an ephemeral port without requiring MongoDB.
- `test/plus.test.js` — integration tests for `POST /plus` using the exported app and Node's built-in `fetch`, mounted on an ephemeral port (no MongoDB required). Tests valid integer/float/negative sums, missing operands, empty body, malformed JSON, and non-numeric values.
- `test/minus.test.js` — integration tests for `POST /minus` using the exported app and Node's built-in `fetch`, mounted on an ephemeral port (no MongoDB required). Tests valid integer/float/negative/zero differences, missing operands, and validation errors.
- `test/multiply.test.js` — integration tests for `POST /multiply` using the exported app and Node's built-in `fetch`, mounted on an ephemeral port (no MongoDB required). Tests valid integer/float/negative/zero products, missing operands, and validation errors.
- `package.json` — declares `"main": "src/index.js"` and the run scripts:
  - `npm start` → `npm run start:dev`
  - `npm run start:dev` → `node --watch src/index.js` (auto-restart on change)
  - `npm run start:prod` → `node src/index.js`
  - `npm test` → `node test/plus.test.js && node test/minus.test.js && node test/multiply.test.js` (integration tests for all three arithmetic endpoints)
  - Dependencies: `express ^4.19.2`, `bcrypt ^6.0.0`.

## Conventions

- **Language/module system**: CommonJS (`require`/`module.exports`, no import/export). Plain JavaScript, no TypeScript.
- **Style**: Standard minimal Node/Express idioms. No linter, formatter, or CI config present.
- **Testing**: Integration tests exist in `test/plus.test.js`, `test/minus.test.js`, and `test/multiply.test.js`, run via `npm test`. Tests use Node's built-in `fetch`, ephemeral port, and no external test framework or DB.
- **Config**: Port is read from the `PORT` environment variable, defaulting to `3008`. Version is derived from `npm_package_version` (set by npm during `npm start`), falling back to `1.0.0` when running `node` directly. No other config file.
- **Naming**: Routes are flat (`/hello`, `/health-check`, `/health`, `/version`, `/api/users`, `/plus`, `/minus`, `/multiply`); single top-level `src/` directory with one file; tests in `test/` directory. Public endpoints have no auth; data comes from static in-memory store until a database is introduced.
- **Server startup**: Auto-start only when run directly (`require.main === module`); otherwise exports the Express app for programmatic use in tests.

## API Surface

HTTP API routes and endpoints defined in `src/index.js`. Server listens on `PORT` (default `3008`).

- `GET /hello` — returns JSON `{ "message": "hello" }`.
- `GET /health-check` — returns HTTP `200` with plain text `Server is running`.
- `GET /health` — returns HTTP `200` with JSON `{ "status": "ok" }` (explicitly sets status code).
- `GET /version` — returns HTTP `200` with JSON `{ "version": "<npm_package_version>" }` (falls back to `"1.0.0"`).
- `GET /api/users` — returns HTTP `200` with JSON array of users: `[{ "id": 1, "name": "Alice" }, { "id": 2, "name": "Bob" }, { "id": 3, "name": "Charlie" }]`. Public endpoint, no auth, no query parameters.
- `POST /plus` — accepts JSON body with numeric operands `{ "a": <number>, "b": <number> }` and returns HTTP `200` with JSON `{ "result": <a + b> }`. Accepts integers, floats, negatives, and zero. Rejects missing, null, non-numeric, `NaN`, or `Infinity` operands with HTTP `400` and JSON `{ "error": "a and b must be finite numbers" }`.
- `POST /minus` — accepts JSON body with numeric operands `{ "a": <number>, "b": <number> }` and returns HTTP `200` with JSON `{ "result": <a - b> }`. Accepts integers, floats, negatives, and zero. Rejects missing, null, non-numeric, `NaN`, or `Infinity` operands with HTTP `400` and JSON `{ "error": "a and b must be finite numbers" }`.
- `POST /multiply` — accepts JSON body with numeric operands `{ "a": <number>, "b": <number> }` and returns HTTP `200` with JSON `{ "result": <a * b> }`. Accepts integers, floats, negatives, and zero. Returns 0 when either operand is 0. Rejects missing, null, non-numeric, `NaN`, or `Infinity` operands with HTTP `400` and JSON `{ "error": "a and b must be finite numbers" }`.

Start the server with `npm start`, then call e.g. `curl http://localhost:3008/hello` or `curl http://localhost:3008/api/users`. Run tests with `npm test`.