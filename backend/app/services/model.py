from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.models.model import Model
from app.schemas.model import ModelCreate, ModelUpdate
from fastapi import HTTPException
import datetime


def get_model(db: Session, model_id: int) -> Optional[Model]:
    """Retrieve a model by ID"""
    return db.query(Model).filter(Model.id == model_id).first()


def get_model_by_name_version(db: Session, name: str, version: str) -> Optional[Model]:
    """Retrieve a model by name and version"""
    return db.query(Model).filter(Model.name == name, Model.version == version).first()


def get_models(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    owner_id: Optional[int] = None,
    task_type: Optional[str] = None,
    framework: Optional[str] = None,
) -> List[Model]:
    """Get all models with optional filtering"""
    query = db.query(Model)

    # Apply filters if provided
    if owner_id:
        query = query.filter(Model.owner_id == owner_id)
    if task_type:
        query = query.filter(Model.task_type == task_type)
    if framework:
        query = query.filter(Model.framework == framework)

    return query.offset(skip).limit(limit).all()


def create_model(
    db: Session, model_in: ModelCreate, owner_id: int, s3_path: str, size_mb: float
) -> Model:
    """Create a new model"""
    model_data = model_in.model_dump()

    # Check if model with same name and version already exists
    existing_model = get_model_by_name_version(
        db, model_data["name"], model_data["version"]
    )
    if existing_model:
        raise HTTPException(
            status_code=400, detail="Model with this name and version already exists"
        )

    db_model = Model(
        **model_data,
        owner_id=owner_id,
        s3_path=s3_path,
        size_mb=size_mb,
        downloads=0,
        likes=0,
        average_rating=0.0,
        created_at=datetime.datetime.now(),
    )
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return db_model


def update_model(db: Session, model_id: int, model_in: ModelUpdate) -> Model:
    """Update a model"""
    db_model = get_model(db, model_id)
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Update model fields
    update_data = model_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_model, field, value)

    db_model.updated_at = datetime.datetime.now()
    db.commit()
    db.refresh(db_model)
    return db_model


def delete_model(db: Session, model_id: int) -> Model:
    """Delete a model"""
    db_model = get_model(db, model_id)
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")

    db.delete(db_model)
    db.commit()
    return db_model


def increment_downloads(db: Session, model_id: int) -> Model:
    """Increment download count for a model"""
    db_model = get_model(db, model_id)
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")

    db_model.downloads += 1
    db.commit()
    db.refresh(db_model)
    return db_model


def update_model_metrics(
    db: Session, model_id: int, performance_metrics: Dict[str, Any]
) -> Model:
    """Update model performance metrics"""
    db_model = get_model(db, model_id)
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")

    db_model.performance_metrics = performance_metrics
    db_model.updated_at = datetime.datetime.now()
    db.commit()
    db.refresh(db_model)
    return db_model
