from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json

from app.api.deps import get_db, get_current_active_user
from app.services.model import (
    get_model,
    get_models,
    create_model,
    update_model,
    delete_model,
    increment_downloads,
    update_model_metrics,
)
from app.models.user import User
from app.schemas.model import Model, ModelCreate, ModelUpdate

router = APIRouter()


@router.get("/", response_model=List[Model])
def read_models(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    task_type: Optional[str] = None,
    framework: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
):
    """Get all models with optional filtering"""
    models = get_models(
        db=db, skip=skip, limit=limit, task_type=task_type, framework=framework
    )
    return models


@router.post("/", response_model=Model)
def create_model_endpoint(
    *,
    db: Session = Depends(get_db),
    model_in: ModelCreate,
    current_user: User = Depends(get_current_active_user),
    s3_path: str = Form(...),
    size_mb: float = Form(...)
):
    """Create a new model"""
    # In a real implementation, you'd handle file upload to S3 here
    # and get back the s3_path and size_mb from that operation
    return create_model(
        db=db,
        model_in=model_in,
        owner_id=current_user.id,
        s3_path=s3_path,
        size_mb=size_mb,
    )


@router.get("/{model_id}", response_model=Model)
def read_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific model by ID"""
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return db_model


@router.put("/{model_id}", response_model=Model)
def update_model_endpoint(
    *,
    model_id: int,
    db: Session = Depends(get_db),
    model_in: ModelUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a model"""
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    # Only allow owner or admin to update
    if db_model.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return update_model(db=db, model_id=model_id, model_in=model_in)


@router.delete("/{model_id}", response_model=Model)
def delete_model_endpoint(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a model"""
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    # Only allow owner or admin to delete
    if db_model.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return delete_model(db=db, model_id=model_id)


@router.post("/{model_id}/download", response_model=Model)
def download_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Record a model download and return download URL"""
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    # Increment download counter
    updated_model = increment_downloads(db=db, model_id=model_id)

    # In a real implementation, you'd generate a pre-signed URL for S3 download
    # For now, we just return the model with incremented download count
    return updated_model


@router.post("/{model_id}/metrics", response_model=Model)
def update_model_performance(
    *,
    model_id: int,
    metrics: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update model performance metrics"""
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    # Only allow owner or admin to update metrics
    if db_model.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return update_model_metrics(db=db, model_id=model_id, performance_metrics=metrics)


@router.get("/user/{user_id}", response_model=List[Model])
def read_user_models(
    user_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
):
    """Get all models belonging to a user"""
    models = get_models(db=db, skip=skip, limit=limit, owner_id=user_id)
    return models
