from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.api.v1.api import api_router
from app.api.deps import get_current_active_user

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for managing and deploying deep learning models",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Set up CORS with explicit configuration
cors_origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "https://modelhub-pink.vercel.app",
    "https://modelhub.whoretard.uk",  # Custom domain pointing to Railway
    "https://modelhub-production.up.railway.app",  # Actual Railway domain
    "https://*.vercel.app",  # Allow all Vercel preview deployments
]

# Print CORS origins for debugging
print(f"🔧 CORS Origins configured: {cors_origins}")
print(f"🔧 Settings CORS Origins: {settings.BACKEND_CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins + settings.BACKEND_CORS_ORIGINS,  # Combine both lists
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight requests for 24 hours
)


# Error handling
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)},
    )


# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Setup upload directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


# Download endpoint
@app.get(f"{settings.API_V1_STR}/downloads/models/{{user_id}}/{{filename}}")
async def download_file(
    user_id: str, filename: str, current_user=Depends(get_current_active_user)
):
    file_path = os.path.join(settings.UPLOAD_DIR, user_id, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        file_path, media_type="application/octet-stream", filename=filename
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "cors_origins": cors_origins + settings.BACKEND_CORS_ORIGINS,
        "port": os.getenv("PORT", "8000"),
    }


# Debug endpoint to check database status
@app.get("/debug/db")
async def debug_db():
    try:
        from app.core.database import engine, SessionLocal
        from app.models.user import User
        from sqlalchemy import text

        # Test basic connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            db_connected = True

        # Test tables exist
        db = SessionLocal()
        try:
            user_count = db.query(User).count()
            tables_exist = True
        except Exception as table_error:
            user_count = 0
            tables_exist = False
        finally:
            db.close()

        return {
            "database_connected": db_connected,
            "tables_exist": tables_exist,
            "user_count": user_count,
            "database_url": (
                settings.SQLALCHEMY_DATABASE_URI[:50] + "..."
                if settings.SQLALCHEMY_DATABASE_URI
                else None
            ),
            "use_sqlite": settings.USE_SQLITE,
        }
    except Exception as e:
        return {
            "error": str(e),
            "database_connected": False,
            "tables_exist": False,
        }


# Manual database initialization endpoint
@app.post("/debug/init-db")
async def init_database():
    try:
        from app.core.database import engine, Base, SessionLocal
        from app.models.user import User, UserRole
        from app.models.model import Model, ModelVersion
        from app.models.deployment import ModelDeployment, DeploymentLog
        from app.models.analytics import PlatformAnalytics, UserActivity, ModelActivity
        from app.core.security import get_password_hash
        from sqlalchemy import text

        # Import all models to ensure they're registered
        print("Force importing all models...")

        # Create all tables
        print("Creating all tables...")
        Base.metadata.create_all(bind=engine)

        # Verify tables were created
        with engine.connect() as conn:
            result = conn.execute(
                text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                )
            )
            tables = [row[0] for row in result]

        # Create admin user
        db = SessionLocal()
        try:
            admin_user = (
                db.query(User).filter(User.email == "admin@example.com").first()
            )
            if not admin_user:
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
                admin_created = True
            else:
                admin_created = False
        except Exception as e:
            db.rollback()
            admin_created = f"Error: {e}"
        finally:
            db.close()

        return {
            "success": True,
            "tables_created": tables,
            "admin_user_created": admin_created,
            "message": "Database initialized successfully",
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Database initialization failed",
        }


# Manual column addition endpoint
@app.post("/debug/add-columns")
async def add_missing_columns():
    try:
        from app.core.database import engine
        from sqlalchemy import text

        results = []

        with engine.connect() as conn:
            # Add missing columns to users table
            try:
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'USER'")
                )
                conn.execute(text("ALTER TABLE users ADD COLUMN last_login TIMESTAMP"))
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0")
                )
                conn.commit()
                results.append("Added columns to users table")
            except Exception as e:
                results.append(f"Users table columns: {str(e)}")

            # Add missing columns to models table
            try:
                conn.execute(
                    text(
                        "ALTER TABLE models ADD COLUMN status VARCHAR DEFAULT 'PENDING'"
                    )
                )
                conn.execute(
                    text(
                        "ALTER TABLE models ADD COLUMN deployment_status VARCHAR DEFAULT 'INACTIVE'"
                    )
                )
                conn.execute(text("ALTER TABLE models ADD COLUMN reviewed_by INTEGER"))
                conn.execute(
                    text("ALTER TABLE models ADD COLUMN reviewed_at TIMESTAMP")
                )
                conn.execute(text("ALTER TABLE models ADD COLUMN review_notes TEXT"))
                conn.commit()
                results.append("Added columns to models table")
            except Exception as e:
                results.append(f"Models table columns: {str(e)}")

        return {
            "success": True,
            "results": results,
            "message": "Column addition completed",
        }

    except Exception as e:
        return {"success": False, "error": str(e), "message": "Column addition failed"}


# CORS test endpoint
@app.options("/api/v1/auth/token")
async def cors_test():
    return {"message": "CORS test successful"}


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": "1.0.0",
        "docs_url": f"{settings.API_V1_STR}/docs",
    }


# Database initialization
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        from app.core.database import engine, Base
        from app.models.user import User, UserRole
        from app.models.model import Model, ModelVersion
        from app.models.deployment import ModelDeployment, DeploymentLog
        from app.models.analytics import PlatformAnalytics, UserActivity, ModelActivity
        from app.core.security import get_password_hash
        from sqlalchemy.orm import Session
        from sqlalchemy import text

        print("Initializing database...")

        # Import all models to ensure they're registered with Base
        print("Importing all models...")

        # Force import all models to register them with Base
        print(f"User model: {User}")
        print(f"Model model: {Model}")
        print(f"ModelVersion model: {ModelVersion}")
        print(f"Analytics models: {PlatformAnalytics}, {UserActivity}, {ModelActivity}")

        # Create all tables
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")

        # Verify tables were created
        with engine.connect() as conn:
            result = conn.execute(
                text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                )
            )
            tables = [row[0] for row in result]
            print(f"Created tables: {tables}")

        # Create admin user if it doesn't exist
        db = Session(bind=engine)
        try:
            admin_user = (
                db.query(User).filter(User.email == "admin@example.com").first()
            )

            if not admin_user:
                print("🔧 Creating admin user...")
                from app.models.user import UserRole

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
                print("Admin login: admin@example.com / admin / admin")
            else:
                print("Admin user already exists")

        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            db.rollback()
        finally:
            db.close()

        print("Database initialization completed!")

    except Exception as e:
        print(f"Database initialization error: {e}")
        # Don't fail startup, just log the error


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
