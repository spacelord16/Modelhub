from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ModelBase(BaseModel):
    name: str
    description: str
    framework: str
    version: str
    format: str
    task_type: str
    tags: List[str]
    license: str
    paper_url: Optional[str] = None
    github_url: Optional[str] = None
    model_metadata: Optional[Dict[str, Any]] = None


class ModelCreate(ModelBase):
    pass


class ModelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    tags: Optional[List[str]] = None
    model_metadata: Optional[Dict[str, Any]] = None


class ModelInDBBase(ModelBase):
    id: int
    size_mb: float
    s3_path: str
    owner_id: int
    downloads: int
    likes: int
    average_rating: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    performance_metrics: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class Model(ModelInDBBase):
    pass


class ModelInDB(ModelInDBBase):
    pass
