# testing_AI_Agent

A tiny Express server. Start with `npm start` (default port 3008, override with `PORT`).

Endpoints:
- `GET /hello` — returns `{ "message": "hello" }`
- `GET /health-check` — returns a `200` "Server is running"
- `GET /version` — returns `{ "version": "<npm_package_version>" }` (falls back to `1.0.0`)