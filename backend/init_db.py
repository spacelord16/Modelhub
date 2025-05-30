#!/usr/bin/env python
"""
Database initialization script for Railway deployment.
This script creates the database tables and initial admin user.
"""
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.user import User
from app.models.model import Model, ModelVersion
from app.core.security import get_password_hash
from sqlalchemy.orm import Session


def init_database():
    print("🔧 Creating database tables...")

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

    # Create admin user
    print("🔧 Creating admin user...")
    db = Session(bind=engine)

    try:
        # Check if admin user exists
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()

        if not admin_user:
            # Create admin user
            admin_user = User(
                email="admin@example.com",
                username="admin",
                full_name="Admin User",
                hashed_password=get_password_hash("admin"),
                is_superuser=True,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print("✅ Admin user created successfully!")
        else:
            print("ℹ️  Admin user already exists")

        print(f"✅ Database initialization complete!")
        print(f"Admin login credentials:")
        print(f"  Email: admin@example.com")
        print(f"  Username: admin")
        print(f"  Password: admin")

    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

    return True


if __name__ == "__main__":
    try:
        success = init_database()
        if success:
            print("🎉 Database initialization completed successfully!")
            sys.exit(0)
        else:
            print("💥 Database initialization failed!")
            sys.exit(1)
    except Exception as e:
        print(f"💥 Fatal error during database initialization: {e}")
        sys.exit(1)
