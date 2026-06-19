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
