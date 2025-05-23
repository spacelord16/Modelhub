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

# Set up CORS
origins = settings.BACKEND_CORS_ORIGINS
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
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
    return {"status": "healthy"}


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": "1.0.0",
        "docs_url": f"{settings.API_V1_STR}/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
