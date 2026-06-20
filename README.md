# Request Tracker

Request Tracker is a small web application built for the Software Engineering Attachment Assessment Task. It lets a user submit a request, feedback item, issue, or idea, then view and manage submitted requests through a request list and admin dashboard.

The current deployed app is hosted on Render:

https://request-tracker-9jac.onrender.com/

## Current State

The project is currently at a working full-stack stage:

- The frontend is built with plain HTML, CSS, and JavaScript.
- The backend is a FastAPI app served by Render.
- Submitted requests are persisted through Supabase using the backend as a proxy.
- The app supports clean page URLs such as `/submit`, `/requests`, `/login`, and `/dashboard`.
- The data API now lives under `/api/requests` so `/requests` can be used as the request-list page.
- `evolution.md` is my running journal for the project. It records the average flow of my thinking, implementation steps, bugs, fixes, and decisions during the build.

## Features Completed

- Home page with navigation and call-to-action buttons.
- Request submission form with name, email, product, request type, priority, and message fields.
- Request list page that displays submitted requests.
- Search, status filtering, product filtering, and date sorting.
- Request detail modal.
- Admin login using a FastAPI authentication endpoint.
- Admin dashboard with summary counts.
- Admin-only status update flow for submitted requests.
- Supabase persistence through server-side API routes.
- Render deployment using a single Python web service.
- Clean route aliases for user-facing pages:
  - `/`
  - `/submit`
  - `/requests`
  - `/login`
  - `/dashboard`

## Tech Stack

- HTML
- CSS
- JavaScript ES modules
- Python
- FastAPI
- Supabase
- Render
- JWT authentication

## Project Structure

```text
api/
  app.py                 FastAPI backend, auth routes, Supabase proxy, static serving
  requirements.txt       Python dependencies

src/
  index.html             Home page
  pages/                 Submit, requests, login, and dashboard pages
  css/                   Page styles
  js/
    app.js               App bootstrap and page controller selection
    controllers/         Page-specific behavior
    services/            Auth and request API services
    models/              Request model
    ui/                  Rendering, modal, and notification helpers
    utils/               Validation and helper functions

render.yaml              Render deployment manifest
evolution.md             Running process journal
```

## How The App Works

The FastAPI backend serves both the frontend and the API from the same Render service.

Page routes:

```text
/                  Home
/submit            Submit request page
/requests          Submitted requests page
/login             Admin login page
/dashboard         Admin dashboard
```

API routes:

```text
GET    /api/requests
POST   /api/requests
PATCH  /api/requests/{request_id}
POST   /login
GET    /verify
GET    /config
```

The frontend `requestService` talks to `/api/requests`. The backend then calls Supabase REST endpoints using a server-side key, so the service key is not exposed in browser JavaScript.

## Supabase Table

The app expects a `requests` table similar to this:

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

## Environment Variables

For local development, create a `.env` file in the project root:

```env
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key_optional
ADMIN_USERNAME=admin
ADMIN_PASSWORD=supersecret
JWT_SECRET=replace-with-a-strong-secret
AUTH_API_URL=http://127.0.0.1:8000
```

On Render, configure these in the service environment. `SUPABASE_SERVICE_KEY` should stay server-side only.

## Running Locally

Install backend dependencies:

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r api/requirements.txt
```

Start the app:

```bash
uvicorn api.app:app --reload --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000/
http://127.0.0.1:8000/submit
http://127.0.0.1:8000/requests
```

## What Was Challenging

The biggest challenge was deployment shape. The project began as a static HTML/CSS/JavaScript app, but admin login and Supabase persistence required a backend. I moved the app to a single FastAPI service on Render so the backend could serve the static frontend and proxy database requests.

Another issue was route overlap. The app originally needed `/requests` for API data, but users naturally expect `/requests` to be the request-list page. I fixed this by moving the data API to `/api/requests` and using `/requests` as a clean page route.

I also fixed the submit path so clean URLs like `/submit` initialize the correct JavaScript controller, and so submitted requests include an `id` before being inserted into Supabase.

## What Is Not Perfect Yet

- The UI is functional, but it can still be polished further.
- The status names are currently app-oriented (`Open`, `In Progress`, `Resolved`, `Closed`) rather than exactly matching every label in the assessment prompt.
- There are no automated tests yet.
- Admin authentication is intentionally simple for the assessment.
- Error messages could be more user-friendly.

## Improvements I Would Add With More Time

- Add automated tests for the backend API and frontend service layer.
- Add better loading, empty, and error states.
- Add CSV export.
- Add delete/archive actions.
- Improve dashboard analytics.
- Add stronger role management for admins.
- Tighten CORS and production security settings.
- Add database migrations or schema setup instructions.

## Process Journal

`evolution.md` is part of this submission. It is my running journal for the project and shows how the app evolved from a static UI skeleton into a deployed FastAPI and Supabase-backed application. It includes implementation notes, problems encountered, route fixes, persistence decisions, and the latest deployment/debugging work.

## Use Of AI Tools

I used AI support during the project mainly for debugging, checking route behavior, reviewing the backend/frontend flow, and improving documentation clarity. I reviewed the suggested changes, tested the important paths, and kept `evolution.md` updated so the reasoning and fixes remain visible.
