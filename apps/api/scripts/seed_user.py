#!/usr/bin/env python3
"""Create a user + default settings row. Usage: python scripts/seed_user.py --email you@example.com --password secret"""

from __future__ import annotations

import argparse
import asyncio
import uuid

from sqlalchemy import select

from app.core.database import get_session_factory, init_db, reset_engine
from app.core.security import hash_password
from app.models.user import User
from app.models.user_settings import UserSettings


async def seed(email: str, password: str) -> None:
    await init_db()
    factory = get_session_factory()
    async with factory() as session:
        existing = await session.execute(select(User).where(User.email == email.lower()))
        if existing.scalar_one_or_none():
            print(f"User already exists: {email}")
            return
        user = User(id=uuid.uuid4(), email=email.lower(), password_hash=hash_password(password))
        user.settings = UserSettings(user_id=user.id)
        session.add(user)
        await session.commit()
        print(f"Created user {email} (id={user.id})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed an Audiblytics user")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()
    reset_engine()
    asyncio.run(seed(args.email, args.password))


if __name__ == "__main__":
    main()
