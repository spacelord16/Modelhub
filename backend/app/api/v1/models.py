from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    Query,
    Body,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import os

from app.api.deps import get_db, get_current_active_user
from app.services.model import (
    get_model,
    get_models,
    create_model_with_version,
    create_model_version,
    update_model,
    delete_model,
    get_model_version,
    update_version_metrics,
    increment_downloads,
)
from app.models.user import User
from app.schemas.model import (
    Model,
    ModelCreate,
    ModelUpdate,
    ModelVersion,
    ModelVersionCreate,
)
from app.utils.storage import save_uploaded_file, get_download_url
from app.core.config import settings

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
    # For now, return all models - in production you might want to filter by visibility
    models = get_models(
        db=db, skip=skip, limit=limit, task_type=task_type, framework=framework
    )
    return models


@router.post("/", response_model=Model)
async def create_model_endpoint(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    name: str = Form(...),
    description: str = Form(...),
    framework: str = Form(...),
    version: str = Form(...),
    format: str = Form(...),
    task_type: str = Form(...),
    tags: str = Form(...),  # JSON string of tags
    license: str = Form(...),
    paper_url: Optional[str] = Form(None),
    github_url: Optional[str] = Form(None),
    changelog: str = Form(...),
    metadata: Optional[str] = Form(None),  # JSON string of metadata
    model_file: UploadFile = File(...),
):
    """Create a new model with its first version"""
    # Convert JSON strings to Python objects
    tags_list = json.loads(tags)
    metadata_dict = json.loads(metadata) if metadata else None

    # Create model schema
    model_in = ModelCreate(
        name=name,
        description=description,
        framework=framework,
        task_type=task_type,
        tags=tags_list,
        license=license,
        paper_url=paper_url,
        github_url=github_url,
    )

    # Create version schema
    version_in = ModelVersionCreate(
        version=version,
        format=format,
        changelog=changelog,
        model_metadata=metadata_dict,
    )

    # Save the uploaded file
    s3_path, size_mb = await save_uploaded_file(model_file, current_user.id)

    # Create the model with its first version
    return create_model_with_version(
        db=db,
        model_in=model_in,
        version_in=version_in,
        owner_id=current_user.id,
        s3_path=s3_path,
        size_mb=size_mb,
    )


@router.post("/{model_id}/versions", response_model=ModelVersion)
async def create_version_endpoint(
    *,
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    version: str = Form(...),
    format: str = Form(...),
    changelog: str = Form(...),
    metadata: Optional[str] = Form(None),
    model_file: UploadFile = File(...),
):
    """Create a new version for an existing model"""
    # Check model ownership
    db_model = get_model(db, model_id)
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    if db_model.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Parse metadata
    metadata_dict = json.loads(metadata) if metadata else None

    # Create version schema
    version_in = ModelVersionCreate(
        version=version,
        format=format,
        changelog=changelog,
        model_metadata=metadata_dict,
    )

    # Save the uploaded file
    s3_path, size_mb = await save_uploaded_file(model_file, current_user.id)

    # Create the new version
    return create_model_version(
        db=db,
        model_id=model_id,
        version_in=version_in,
        s3_path=s3_path,
        size_mb=size_mb,
    )


@router.get("/{model_id}/versions/{version}", response_model=ModelVersion)
def read_model_version(
    model_id: int,
    version: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific version of a model"""
    db_version = get_model_version(db, model_id, version)
    if not db_version:
        raise HTTPException(
            status_code=404, detail=f"Version {version} not found for model {model_id}"
        )
    return db_version


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
    current_user: User = Depends(get_current_active_user),
):
    """Update a model's metadata"""
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    # Only allow owner or admin to update
    if db_model.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return update_model(db=db, model_id=model_id, model_in=model_in)


@router.post("/{model_id}/versions/{version}/metrics", response_model=ModelVersion)
def update_version_performance(
    *,
    model_id: int,
    version: str,
    metrics: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update performance metrics for a specific model version"""
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    # Only allow owner or admin to update metrics
    if db_model.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return update_version_metrics(
        db=db, model_id=model_id, version=version, performance_metrics=metrics
    )


@router.delete("/{model_id}", response_model=Model)
def delete_model_endpoint(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a model and all its versions"""
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    # Only allow owner or admin to delete
    if db_model.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return delete_model(db=db, model_id=model_id)


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


@router.get("/{model_id}/download")
def download_model(
    model_id: int,
    version: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Download a model file"""
    # Get the model
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    # Get the specific version or current version
    target_version = version or db_model.current_version
    db_version = get_model_version(db, model_id, target_version)
    if not db_version:
        raise HTTPException(
            status_code=404,
            detail=f"Version {target_version} not found for model {model_id}",
        )

    # Construct file path from s3_path
    # s3_path format: "models/{user_id}/{filename}"
    file_path = os.path.join(
        settings.UPLOAD_DIR, db_version.s3_path.replace("models/", "")
    )

    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Model file not found on server")

    # Increment download count
    increment_downloads(db, model_id)

    # Return file for download
    filename = (
        f"{db_model.name.replace(' ', '_')}_v{target_version}.{db_version.format}"
    )
    return FileResponse(
        path=file_path, filename=filename, media_type="application/octet-stream"
    )


@router.get("/{model_id}/versions/{version}/download")
def download_model_version(
    model_id: int,
    version: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Download a specific version of a model"""
    return download_model(
        model_id=model_id, version=version, db=db, current_user=current_user
    )
