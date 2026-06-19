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
