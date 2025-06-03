#!/usr/bin/env python3
"""
Check database contents
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import SQLALCHEMY_DATABASE_URI
from app.models.model import Model, ModelVersion
from app.models.user import User

# Create engine
engine = create_engine(SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def check_database():
    db = SessionLocal()

    try:
        # Check users
        users = db.query(User).all()
        print("Users:")
        for user in users:
            print(f"  ID: {user.id}, Email: {user.email}, Username: {user.username}")

        # Check models
        models = db.query(Model).all()
        print(f"\nModels:")
        for model in models:
            print(
                f"  ID: {model.id}, Name: {model.name}, Owner ID: {model.owner_id}, Framework: {model.framework}"
            )

        # Check model versions
        versions = db.query(ModelVersion).all()
        print(f"\nModel Versions:")
        for version in versions:
            print(
                f"  ID: {version.id}, Model ID: {version.model_id}, Version: {version.version}"
            )

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    check_database()
