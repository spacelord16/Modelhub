from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class ModelVersionBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    version: str
    changelog: str
    format: str
    model_metadata: Optional[Dict[str, Any]] = None
    performance_metrics: Optional[Dict[str, Any]] = None


class ModelVersionCreate(ModelVersionBase):
    pass


class ModelVersionUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    changelog: Optional[str] = None
    model_metadata: Optional[Dict[str, Any]] = None
    performance_metrics: Optional[Dict[str, Any]] = None


class ModelVersionInDBBase(ModelVersionBase):
    id: int
    model_id: int
    s3_path: str
    size_mb: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class ModelVersion(ModelVersionInDBBase):
    pass


class ModelBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: str
    description: str
    framework: str
    task_type: str
    tags: List[str]
    license: str
    paper_url: Optional[str] = None
    github_url: Optional[str] = None


class ModelCreate(ModelBase):
    pass


class ModelUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None


class ModelInDBBase(ModelBase):
    id: int
    owner_id: int
    current_version: str
    downloads: int
    likes: int
    average_rating: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    versions: List[ModelVersion]

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class Model(ModelInDBBase):
    pass


class ModelInDB(ModelInDBBase):
    pass
