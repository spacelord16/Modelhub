"""
Production-safe script to create admin user
Works with both PostgreSQL (Railway) and SQLite (local)
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.security import get_password_hash
from app.models.user import User, UserRole

# Get database URL from environment or use SQLite default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sqlite_db/app.db")

# Convert postgres:// to postgresql:// if needed (Railway compatibility)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Using database: {DATABASE_URL}")

try:
    # Create engine and session
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Test connection
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")

    # Create session and check/create admin user
    db = SessionLocal()

    try:
        # Check if admin user exists
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()

        if admin_user:
            # Update existing admin user
            admin_user.username = "admin"
            admin_user.hashed_password = get_password_hash("admin")
            admin_user.is_superuser = True
            admin_user.is_active = True
            admin_user.role = UserRole.SUPER_ADMIN
            admin_user.full_name = "Admin User"
            db.commit()
            print("✅ Admin user updated successfully!")
        else:
            # Create new admin user
            admin_user = User(
                email="admin@example.com",
                username="admin",
                full_name="Admin User",
                hashed_password=get_password_hash("admin"),
                is_superuser=True,
                is_active=True,
                role=UserRole.SUPER_ADMIN,
                login_count=0,
            )
            db.add(admin_user)
            db.commit()
            print("✅ Admin user created successfully!")

        print("\n🎉 Admin credentials:")
        print("Email: admin@example.com")
        print("Username: admin")
        print("Password: admin")
        print("Role: SUPER_ADMIN")

    except Exception as e:
        print(f"❌ Error with admin user: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

except Exception as e:
    print(f"❌ Database connection error: {e}")
    sys.exit(1)

print("\n✅ Script completed successfully!")
