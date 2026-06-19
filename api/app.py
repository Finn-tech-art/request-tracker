import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Request
from pydantic import BaseModel
import jwt
import httpx
from fastapi import status

# Load environment variables from .env when present (local development)
load_dotenv()

ADMIN_USER = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASSWORD", "admin123")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGO = "HS256"

app = FastAPI(title="Request Tracker Auth")

from fastapi.middleware.cors import CORSMiddleware

# Allow CORS for local development. Lock this down in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase config (loaded from environment)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
DEPLOY_AUTH_URL = os.getenv("AUTH_API_URL")


class Creds(BaseModel):
    username: str
    password: str


@app.post("/login")
async def login(c: Creds):
    if c.username == ADMIN_USER and c.password == ADMIN_PASS:
        payload = {
            "sub": c.username,
            "isAdmin": True,
            "exp": datetime.utcnow() + timedelta(hours=6),
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)
        return {"token": token, "username": c.username, "name": "Administrator", "isAdmin": True}
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.get("/verify")
async def verify(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = parts[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return {"username": payload.get("sub"), "isAdmin": payload.get("isAdmin", False)}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/config")
async def get_config():
    """Return public configuration values used by the frontend.

    This includes SUPABASE_URL and SUPABASE_ANON_KEY. These values are intended
    to be public (anon key) and are safe to expose to client-side code.
    """
    # For deployments using the Python backend as the sole API, we only
    # expose the auth service URL. Do not return service role keys here.
    return {
        "AUTH_API_URL": DEPLOY_AUTH_URL or None,
    }


async def _call_supabase(method: str, path: str, json_payload=None, params=None):
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Supabase URL not configured on server")
    key = SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY
    if not key:
        raise HTTPException(status_code=500, detail="Supabase key not configured on server")

    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1{path}"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

    async with httpx.AsyncClient() as client:
        resp = await client.request(method, url, headers=headers, json=json_payload, params=params, timeout=30.0)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=f"Supabase error: {resp.text}")
    try:
        return resp.json()
    except Exception:
        return resp.text


@app.get('/requests')
async def list_requests():
    """Return all requests (proxied from Supabase)."""
    rows = await _call_supabase('GET', '/requests', params={'select': '*', 'order': 'created_at.desc'})
    return rows


class RequestIn(BaseModel):
    name: str
    email: str
    product: Optional[str] = None
    request_type: Optional[str] = None
    priority: Optional[str] = None
    message: Optional[str] = None
    status: Optional[str] = 'Open'


@app.post('/requests', status_code=status.HTTP_201_CREATED)
async def create_request(req: RequestIn):
    payload = {
        'name': req.name,
        'email': req.email,
        'product': req.product,
        'request_type': req.request_type,
        'priority': req.priority,
        'message': req.message,
        'status': req.status,
        'created_at': datetime.utcnow().isoformat()
    }
    created = await _call_supabase('POST', '/requests', json_payload=[payload])
    # Supabase returns an array of created records
    return created[0] if isinstance(created, list) and len(created) > 0 else created


@app.patch('/requests/{request_id}')
async def patch_request(request_id: str, patch: dict, authorization: Optional[str] = Header(None)):
    # Only allow updates from authenticated admin users
    if not authorization:
        raise HTTPException(status_code=401, detail='Missing Authorization header')
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise HTTPException(status_code=401, detail='Invalid Authorization header')
    token = parts[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail='Invalid token')
    if not payload.get('isAdmin'):
        raise HTTPException(status_code=403, detail='Admin privileges required')

    # Apply patch via Supabase REST
    updated = await _call_supabase('PATCH', f"/requests", json_payload=patch, params={'id': f'eq.{request_id}'})
    return updated[0] if isinstance(updated, list) and len(updated) > 0 else updated
