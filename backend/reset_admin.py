"""
Script to reset admin user credentials.
This is useful when you forget the admin password or need to recreate the admin user.
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User, Base
from passlib.context import CryptContext
import os

# Initialize password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def reset_admin_user():
    """Create or reset the admin user"""
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@example.com").first()

        # If admin exists, reset the password
        if admin:
            admin.hashed_password = pwd_context.hash("admin")
            admin.is_superuser = True
            # Ensure username is set
            if not admin.username:
                admin.username = "admin"
            db.commit()
            print("Admin user reset: admin@example.com / admin / admin")
        else:
            # Create admin user with all required fields
            admin = User(
                email="admin@example.com",
                username="admin",  # This was missing in setup.sh
                hashed_password=pwd_context.hash("admin"),
                full_name="Admin User",
                is_superuser=True,
            )
            db.add(admin)
            db.commit()
            print("Admin user created: admin@example.com / admin / admin")

    except Exception as e:
        print(f"Error resetting admin user: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    reset_admin_user()
