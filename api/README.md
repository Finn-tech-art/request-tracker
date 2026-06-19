# Request Tracker Auth (FastAPI)

This small FastAPI app provides `/login` and `/verify` endpoints used by the frontend for authentication. It reads `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `JWT_SECRET` from environment variables or a local `.env` file.

Quick start (Windows / PowerShell):

1. Create a virtual environment and activate it (optional but recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r api/requirements.txt
```

3. (Optional) Create a `.env` in the repo root with credentials:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=change-me-for-prod
```

4. Run the server:

```powershell
uvicorn api.app:app --reload --host 127.0.0.1 --port 8000
```

The frontend will try `http://localhost:8000` by default if `window.APP_CONFIG.AUTH_API_URL` is not set. When deploying, set `APP_CONFIG.AUTH_API_URL` to the hosted auth service URL (e.g. Render) before loading the frontend.

Security note: The app currently uses permissive CORS for local development and a simple environment-stored admin account. Do not use these defaults in production without strengthening credentials, CORS, and secrets management.

Render deployment
--------------

This repository includes a sample `render.yaml` manifest at the project root which defines two services:

- `request-tracker-auth` — a Python web service running the FastAPI auth app (`api/app.py`).
- `request-tracker-frontend` — a Static Site serving the `src/` folder. During the static site's build step the `scripts/generate-config-from-env.js` script will be executed to write `src/js/config/config.js` from environment variables.

Quick steps to deploy on Render (using the `render.yaml` manifest):

1. Push this repository to a connected GitHub/GitLab account.
2. In Render, create a new Web Service and/or use the `render.yaml` import to create both services.
3. For the auth service, set the environment variables in Render: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`.
4. For the static site, set `AUTH_API_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` as env vars in Render. The build command will generate `src/js/config/config.js` with these values and the static site will include it at build time.
5. Deploy and verify:
	- Auth service: `https://<auth-service>.onrender.com/config` should return the JSON config.
	- Frontend: open the static site URL and log in.

Notes:
- The `SUPABASE_ANON_KEY` (anon/public key) is safe to expose to client code, but you should apply Row-Level Security (RLS) policies in Supabase to restrict writes if needed.
- Consider using Render's Secrets/Environment UI to avoid committing any secrets to the repo.
