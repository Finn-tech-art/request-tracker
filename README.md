# Request Tracker

A lightweight request tracking web app (vanilla JS frontend + Python FastAPI backend) built to demonstrate a minimal support/feature request workflow.

This repository contains:

- `src/` - Static frontend (HTML, CSS, JS) built with ES modules and plain JavaScript.
  - `src/js/` - JavaScript modules (controllers, services, UI helpers, models).
  - `src/pages/` - HTML pages: `login.html`, `submit.html`, `requests.html`, `dashboard.html`.
  - `src/css/` - Styling.
- `api/` - Python FastAPI app that provides authentication, proxies requests to Supabase (Postgres), serves the static frontend, and exposes a runtime `js/config/config.js` module.
- `scripts/` - Helper scripts (e.g., `generate-config-from-env.js`) to emit client-side config during builds.
- `render.yaml` - Render.com manifest for deploying a single Python service that serves both the frontend and API.

## Features

- Submit requests via `submit.html` and view them on `requests.html` and `dashboard.html`.
- Admin login via `/login` and JWT-based verification (`/verify`) on the server.
- Admins can update the request `status` from the request modal; updates are proxied through the FastAPI backend to Supabase.
- Cross-tab synchronization using `BroadcastChannel`.
- No reliance on `localStorage` for persistence — Supabase is the single source of truth.

## Architecture

- Frontend is static and uses `requestService` to talk to a same-origin API (`/requests`) provided by the Python server.
- The Python FastAPI backend proxies CRUD operations to Supabase's REST API using a server-side service key (keeps the service role key off the client).
- The backend serves static files from `src/` and exposes a runtime `GET /js/config/config.js` to provide `AUTH_API_URL` (same-origin) to the frontend.

## Environment and Secrets

Create a `.env` file for local development (do NOT commit it). Required variables:

```
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key (optional for client access)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=supersecret
JWT_SECRET=replace-with-strong-secret
AUTH_API_URL=http://127.0.0.1:8000 # optional for local testing
```

- Use `SUPABASE_SERVICE_KEY` on the server for writes. Never expose the service key to client-side code in production.

## Supabase Table Schema

Run the following SQL in your Supabase SQL editor to create the `requests` table expected by the app:

```sql
create table public.requests (
  id text primary key,
  name text not null,
  email text not null,
  product text,
  request_type text,
  priority text,
  message text,
  status text default 'Open',
  created_at timestamptz default now()
);
```

Adjust RLS policies based on your security needs. The backend uses the service key to bypass RLS for writes; configure policies carefully if you allow direct client writes.

## Running Locally

1. Install Python dependencies for the API:

```bash
python -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows
pip install -r api/requirements.txt
```

2. Set environment variables (via `.env` or export in your shell), then run:

```bash
uvicorn api.app:app --reload --port 8000
```

3. Open the frontend pages in the browser (served by the FastAPI static files):

- `http://127.0.0.1:8000/pages/submit.html`
- `http://127.0.0.1:8000/pages/requests.html`
- `http://127.0.0.1:8000/pages/dashboard.html`

## Deploying to Render

This project contains a `render.yaml` manifest configured to deploy a single Python web service:

- It installs `api/requirements.txt` and runs `uvicorn api.app:app`.
- Make sure to set the required environment variables in the Render dashboard: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`.
- After deployment, the site will be served from `https://<your-service>/` and the frontend will call the same origin for API calls.

## Notes & Troubleshooting

- If you see the frontend warning "Data backend not configured...", ensure either the runtime `/js/config/config.js` contains valid `SUPABASE` values (for client-side direct access) or that `AUTH_API_URL` is set and reachable so the frontend can call the server's `/config` endpoint.
- Recent changes removed the empty build-time `src/js/config/config.js` file so the runtime config route is used; if you previously generated a static config during build, remove it to let the server provide runtime values.
- If `/requests` returns `404` on your deployed domain, check the Render service logs to confirm the Python app started successfully and that `SUPABASE_SERVICE_KEY` is present in the service environment.

## Development Tips

- Use `scripts/generate-config-from-env.js` during build if you need a static `config.js` for environments where the backend won't serve runtime config (e.g., deploying the static site separately).
- To mimic production behavior locally, run `uvicorn api.app:app` and browse using the server's static paths so the app uses same-origin API.

## Contributing

- Fork, create feature branches, and open PRs. Keep changes focused and include tests where applicable.

## License

MIT
