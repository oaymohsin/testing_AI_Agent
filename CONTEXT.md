## Purpose

What this repo does: a minimal Express HTTP server sandbox for AI agent POC testing. It exposes greeting, health check, health probe, and version endpoints on port 3008 (configurable via `PORT`).

## Folder Structure

```
testing_AI_Agent/
├── .git/                  # Git repo (single branch: main)
├── src/
│   └── index.js           # Sole application file — Express app + server bootstrap
├── node_modules/          # Installed dependencies (Express 4.x deps)
├── package.json           # Project manifest + scripts
├── package-lock.json      # Lockfile
├── README.md              # Brief usage/endpoints doc
└── CONTEXT.md             # Repo context for the AI coding agent
```

## Key Modules

- `src/index.js` — the only module. Requires `express`, creates the app, defines the routes (including `/health` and `/version`), and starts the server with `app.listen()`. Uses the port from `process.env.PORT` (default `3008`). The health endpoint explicitly sets HTTP status 200 before returning JSON.
- `package.json` — declares `"main": "src/index.js"` and the run scripts:
  - `npm start` → `npm run start:dev`
  - `npm run start:dev` → `node --watch src/index.js` (auto-restart on change)
  - `npm run start:prod` → `node src/index.js`
  - Single dependency: `express ^4.19.2`.

## Conventions

- **Language/module system**: CommonJS (`require`/`module.exports`, no import/export). Plain JavaScript, no TypeScript.
- **Style**: Standard minimal Node/Express idioms. No linter, formatter, or CI config present.
- **Testing**: No test files and no test script in `package.json`.
- **Config**: Port is read from the `PORT` environment variable, defaulting to `3008`. Version is derived from `npm_package_version` (set by npm during `npm start`), falling back to `1.0.0` when running `node` directly. No other config file.
- **Naming**: Routes are flat (`/hello`, `/health-check`, `/health`, `/version`); single top-level `src/` directory with one file.

## API Surface

HTTP API routes and endpoints defined in `src/index.js`. Server listens on `PORT` (default `3008`).

- `GET /hello` — returns JSON `{ "message": "hello" }`.
- `GET /health-check` — returns HTTP `200` with plain text `Server is running`.
- `GET /health` — returns HTTP `200` with JSON `{ "status": "ok" }` (explicitly sets status code).
- `GET /version` — returns HTTP `200` with JSON `{ "version": "<npm_package_version>" }` (falls back to `"1.0.0"`).

Start the server with `npm start`, then call e.g. `curl http://localhost:3008/hello`.