#!/usr/bin/env python3
"""
Tiny login helper that reads ADMIN_USERNAME and ADMIN_PASSWORD from a .env file
and validates a provided username/password pair. Exit code 0 on success, 1 on failure.

Usage:
  python scripts/login.py <username> <password>

Note: This is only for local testing. Do NOT use in production.
"""
import sys
from pathlib import Path

try:
    from dotenv import dotenv_values
except Exception:
    print("Missing dependency 'python-dotenv'. Install with: pip install python-dotenv")
    sys.exit(2)


def load_env(env_path: Path):
    if not env_path.exists():
        print(f".env not found at {env_path}")
        return {}
    return dotenv_values(env_path)


def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/login.py <username> <password>")
        return 2

    username = sys.argv[1]
    password = sys.argv[2]

    env = load_env(Path('.env'))
    admin_user = env.get('ADMIN_USERNAME') or env.get('ADMIN_USER') or env.get('ADMIN')
    admin_pass = env.get('ADMIN_PASSWORD') or env.get('ADMIN_PASS') or env.get('ADMIN_PW')

    if not admin_user or not admin_pass:
        print('Admin credentials not found in .env')
        return 2

    if username == admin_user and password == admin_pass:
        print('OK')
        return 0

    print('INVALID')
    return 1


if __name__ == '__main__':
    rc = main()
    sys.exit(rc)
