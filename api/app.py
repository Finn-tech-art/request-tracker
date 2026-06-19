import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Request
from pydantic import BaseModel
import jwt

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
    return {
        "SUPABASE_URL": SUPABASE_URL,
        "SUPABASE_ANON_KEY": SUPABASE_ANON_KEY,
        "AUTH_API_URL": DEPLOY_AUTH_URL or None,
    }
