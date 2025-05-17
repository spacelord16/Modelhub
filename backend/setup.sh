#!/bin/bash

# Create uploads directory
mkdir -p uploads

# Create virtual environment (optional)
# Uncomment the lines below if you want to create a virtual environment
# python -m venv venv
# source venv/bin/activate

# Install core dependencies only (no ML frameworks)
pip install fastapi uvicorn python-multipart python-jose[cryptography] passlib[bcrypt] sqlalchemy pydantic pydantic-settings alembic psycopg2-binary boto3 python-dotenv aiofiles httpx email-validator

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating default .env file..."
    cat > .env << EOF
SECRET_KEY=temporary-secret-key-change-this-in-production
# Database options
# Set USE_SQLITE=true to use SQLite instead of PostgreSQL
USE_SQLITE=true
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=modelhub
# File storage
UPLOAD_DIR=uploads
EOF
    echo ".env file created with default values. Please update it with your actual settings."
fi

# Create database tables
python -c "
from app.models.user import Base as UserBase
from app.models.model import Base as ModelBase
from app.core.database import engine
print('Creating database tables...')
UserBase.metadata.create_all(bind=engine)
ModelBase.metadata.create_all(bind=engine)
print('Tables created successfully!')
"

# Create a default admin user
python -c "
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def create_admin_user():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == 'admin@example.com').first()
        if not admin:
            # Create admin user
            admin = User(
                email='admin@example.com',
                username='admin',  # Username is required for login
                hashed_password=pwd_context.hash('admin'),
                full_name='Admin User',
                is_superuser=True
            )
            db.add(admin)
            db.commit()
            print('Admin user created: admin@example.com / admin / admin')
        else:
            print('Admin user already exists')
    except Exception as e:
        print(f'Error creating admin user: {e}')
    finally:
        db.close()

create_admin_user()
"

echo "Setup complete! To start the server, run:"
echo "python -m uvicorn app.main:app --reload" 