from fastapi import APIRouter

from app.api.v1 import users, auth, models, deployments, admin

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(
    deployments.router, prefix="/deployments", tags=["deployments"]
)
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
