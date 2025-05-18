"""
Script to manually generate a JWT token for a user.
Useful for testing API endpoints that require authentication.
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User
from datetime import timedelta
from app.core.config import settings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def generate_token_for_user(username_or_email: str):
    """Generate a token for the specified user"""
    db = SessionLocal()
    try:
        # Find user by email or username
        user = db.query(User).filter(User.email == username_or_email).first()
        if not user:
            user = db.query(User).filter(User.username == username_or_email).first()

        if not user:
            print(f"No user found with email or username: {username_or_email}")
            return None

        # Generate token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(user.id, expires_delta=access_token_expires)

        print(f"User found: {user.email} (ID: {user.id})")
        print(f"Token expiration: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
        print("\nToken: " + token)
        print("\nUse this token in the Authorization header as: Bearer <token>")

        return token

    except Exception as e:
        print(f"Error generating token: {e}")
        return None
    finally:
        db.close()


if __name__ == "__main__":
    print("\n=== JWT Token Generator ===\n")
    username_or_email = (
        input("Enter username or email (default: admin@example.com): ")
        or "admin@example.com"
    )
    generate_token_for_user(username_or_email)
