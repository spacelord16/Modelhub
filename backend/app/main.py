from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel

app = FastAPI(
    title="Deep Learning Model Hub API",
    description="API for managing and deploying deep learning models",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
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

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Deep Learning Model Hub API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

# Import and include routers
# from app.api.v1 import models, users, inference
# app.include_router(models.router, prefix="/api/v1/models", tags=["models"])
# app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
# app.include_router(inference.router, prefix="/api/v1/inference", tags=["inference"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 