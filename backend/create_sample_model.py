#!/usr/bin/env python3
"""
Create a sample model for testing deployment functionality
"""

import sys
import os
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import SQLALCHEMY_DATABASE_URI, Base
from app.models.model import Model, ModelVersion
from app.models.user import User

# Create engine
engine = create_engine(SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_sample_model():
    db = SessionLocal()

    try:
        # Get the admin user
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            print("Admin user not found. Please run create_admin.py first.")
            return False

        # Check if model already exists
        existing_model = (
            db.query(Model).filter(Model.name == "Sample PyTorch Model").first()
        )
        if existing_model:
            print("Sample model already exists")
            return True

        # Create sample model
        model = Model(
            name="Sample PyTorch Model",
            description="A sample PyTorch model for testing deployment functionality",
            framework="pytorch",
            current_version="1.0.0",
            task_type="classification",
            tags=["test", "pytorch", "classification"],
            license="MIT",
            owner_id=admin_user.id,
            downloads=0,
            likes=0,
            average_rating=0.0,
        )

        db.add(model)
        db.commit()
        db.refresh(model)

        # Create a model version
        model_version = ModelVersion(
            model_id=model.id,
            version="1.0.0",
            s3_path="/tmp/dummy_model.pt",
            size_mb=0.1,
            format="pytorch",
            changelog="Initial version",
            performance_metrics={"accuracy": 0.95},
            model_metadata={"test": True},
        )

        db.add(model_version)
        db.commit()

        print(f"Sample model created successfully:")
        print(f"  ID: {model.id}")
        print(f"  Name: {model.name}")
        print(f"  Framework: {model.framework}")
        print(f"  Owner: {admin_user.email}")

        return True

    except Exception as e:
        print(f"Error creating sample model: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    if create_sample_model():
        print("\n✅ Sample model created successfully!")
        print("You can now test the deployment functionality.")
    else:
        print("\n❌ Failed to create sample model.")
        sys.exit(1)
