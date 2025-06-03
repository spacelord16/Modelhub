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
        from app.models.user import User
        from app.models.model import Model, ModelVersion
        from app.models.deployment import ModelDeployment, DeploymentLog
        from app.core.security import get_password_hash
        from sqlalchemy.orm import Session

        print("Initializing database...")

        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")

        # Create admin user if it doesn't exist
        db = Session(bind=engine)
        try:
            admin_user = (
                db.query(User).filter(User.email == "admin@example.com").first()
            )

            if not admin_user:
                print("🔧 Creating admin user...")
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
                print("Admin user created successfully!")
                print("Admin login: admin@example.com / admin / admin")
            else:
                print("Admin user already exists")

        except Exception as e:
            print(f"Error creating admin user: {e}")
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
