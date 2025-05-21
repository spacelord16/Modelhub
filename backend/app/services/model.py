from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.models.model import Model, ModelVersion
from app.schemas.model import (
    ModelCreate,
    ModelUpdate,
    ModelVersionCreate,
    ModelVersionUpdate,
)
from fastapi import HTTPException
import datetime


def get_model(db: Session, model_id: int) -> Optional[Model]:
    """Retrieve a model by ID"""
    return db.query(Model).filter(Model.id == model_id).first()


def get_model_by_name(db: Session, name: str) -> Optional[Model]:
    """Retrieve a model by name"""
    return db.query(Model).filter(Model.name == name).first()


def get_model_version(
    db: Session, model_id: int, version: str
) -> Optional[ModelVersion]:
    """Retrieve a specific version of a model"""
    return (
        db.query(ModelVersion)
        .filter(ModelVersion.model_id == model_id, ModelVersion.version == version)
        .first()
    )


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

    if owner_id:
        query = query.filter(Model.owner_id == owner_id)
    if task_type:
        query = query.filter(Model.task_type == task_type)
    if framework:
        query = query.filter(Model.framework == framework)

    return query.offset(skip).limit(limit).all()


def create_model_with_version(
    db: Session,
    model_in: ModelCreate,
    version_in: ModelVersionCreate,
    owner_id: int,
    s3_path: str,
    size_mb: float,
) -> Model:
    """Create a new model with its first version"""
    # Check if model with same name exists
    existing_model = get_model_by_name(db, model_in.name)
    if existing_model:
        raise HTTPException(
            status_code=400, detail="Model with this name already exists"
        )

    # Create the model
    model_data = model_in.model_dump()
    db_model = Model(
        **model_data,
        owner_id=owner_id,
        current_version=version_in.version,
        downloads=0,
        likes=0,
        average_rating=0.0,
        created_at=datetime.datetime.now(),
    )
    db.add(db_model)
    db.commit()
    db.refresh(db_model)

    # Create the first version
    version_data = version_in.model_dump()
    db_version = ModelVersion(
        **version_data,
        model_id=db_model.id,
        s3_path=s3_path,
        size_mb=size_mb,
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)

    return db_model


def create_model_version(
    db: Session,
    model_id: int,
    version_in: ModelVersionCreate,
    s3_path: str,
    size_mb: float,
) -> ModelVersion:
    """Create a new version for an existing model"""
    # Check if model exists
    db_model = get_model(db, model_id)
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Check if version already exists
    existing_version = get_model_version(db, model_id, version_in.version)
    if existing_version:
        raise HTTPException(
            status_code=400,
            detail=f"Version {version_in.version} already exists for this model",
        )

    # Create new version
    version_data = version_in.model_dump()
    db_version = ModelVersion(
        **version_data,
        model_id=model_id,
        s3_path=s3_path,
        size_mb=size_mb,
    )
    db.add(db_version)

    # Update model's current version
    db_model.current_version = version_in.version
    db_model.updated_at = datetime.datetime.now()

    db.commit()
    db.refresh(db_version)
    return db_version


def update_model(db: Session, model_id: int, model_in: ModelUpdate) -> Model:
    """Update a model's metadata"""
    db_model = get_model(db, model_id)
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")

    update_data = model_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_model, field, value)

    db_model.updated_at = datetime.datetime.now()
    db.commit()
    db.refresh(db_model)
    return db_model


def update_version_metrics(
    db: Session, model_id: int, version: str, performance_metrics: Dict[str, Any]
) -> ModelVersion:
    """Update performance metrics for a specific model version"""
    db_version = get_model_version(db, model_id, version)
    if not db_version:
        raise HTTPException(
            status_code=404, detail=f"Version {version} not found for model {model_id}"
        )

    db_version.performance_metrics = performance_metrics
    db.commit()
    db.refresh(db_version)
    return db_version


def delete_model(db: Session, model_id: int) -> Model:
    """Delete a model and all its versions"""
    db_model = get_model(db, model_id)
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")

    db.delete(db_model)  # This will cascade delete all versions
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
