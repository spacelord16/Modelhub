from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    Text,
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ModelStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class DeploymentStatus(enum.Enum):
    INACTIVE = "inactive"
    ACTIVE = "active"
    EMERGENCY_DISABLED = "emergency_disabled"


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, index=True)
    changelog = Column(Text)
    s3_path = Column(String)  # Path to model files in S3
    size_mb = Column(Float)
    format = Column(String)  # saved_model, pt, pth, onnx, etc.
    model_metadata = Column(JSON)  # Additional version-specific metadata
    performance_metrics = Column(JSON)  # Store benchmark results
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Foreign key to parent model
    model_id = Column(Integer, ForeignKey("models.id"))
    model = relationship("Model", back_populates="versions")

    def __repr__(self):
        return f"<ModelVersion {self.version}>"


class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    framework = Column(String)  # pytorch, tensorflow, onnx, etc.
    current_version = Column(String)  # Reference to latest version
    task_type = Column(String)  # classification, detection, etc.
    tags = Column(JSON)  # List of tags
    license = Column(String)
    paper_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Admin/Approval workflow fields
    status = Column(Enum(ModelStatus), default=ModelStatus.PENDING)
    deployment_status = Column(
        Enum(DeploymentStatus), default=DeploymentStatus.INACTIVE
    )
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_notes = Column(Text, nullable=True)

    # Relationships
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="models")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    versions = relationship(
        "ModelVersion", back_populates="model", cascade="all, delete-orphan"
    )

    # Model metrics
    downloads = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)

    def __repr__(self):
        return f"<Model {self.name} current_version={self.current_version}>"
