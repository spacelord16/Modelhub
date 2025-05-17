import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Determine database URI
# Use SQLite as fallback if PostgreSQL is not available
if settings.USE_SQLITE:
    # Create database directory if it doesn't exist
    os.makedirs("sqlite_db", exist_ok=True)
    SQLALCHEMY_DATABASE_URI = "sqlite:///sqlite_db/model_hub.db"
    connect_args = {"check_same_thread": False}  # Needed for SQLite
else:
    SQLALCHEMY_DATABASE_URI = settings.SQLALCHEMY_DATABASE_URI
    connect_args = {}

# Create SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URI, connect_args=connect_args)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
