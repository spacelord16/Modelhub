from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    Text,
    Boolean,
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class DeploymentStatus(str, enum.Enum):
    PENDING = "pending"
    BUILDING = "building"
    DEPLOYING = "deploying"
    RUNNING = "running"
    FAILED = "failed"
    STOPPED = "stopped"
    UPDATING = "updating"


class DeploymentType(str, enum.Enum):
    SERVERLESS = "serverless"  # Lambda/Cloud Functions
    CONTAINER = "container"  # Docker containers
    ENDPOINT = "endpoint"  # Dedicated endpoints


class ModelDeployment(Base):
    __tablename__ = "model_deployments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)  # User-friendly deployment name
    description = Column(Text, nullable=True)

    # Model reference
    model_id = Column(Integer, ForeignKey("models.id"))
    model_version_id = Column(Integer, ForeignKey("model_versions.id"))
    model = relationship("Model")
    model_version = relationship("ModelVersion")

    # Deployment configuration
    deployment_type = Column(Enum(DeploymentType), default=DeploymentType.CONTAINER)
    status = Column(
        Enum(DeploymentStatus), default=DeploymentStatus.PENDING, index=True
    )
    endpoint_url = Column(String, nullable=True)  # Public endpoint URL
    internal_url = Column(String, nullable=True)  # Internal service URL

    # Resource configuration
    cpu_limit = Column(Float, default=1.0)  # CPU cores
    memory_limit = Column(Integer, default=512)  # MB
    max_replicas = Column(Integer, default=3)
    min_replicas = Column(Integer, default=1)

    # Deployment metadata
    environment_vars = Column(JSON, default={})  # Environment variables
    deployment_config = Column(JSON, default={})  # Platform-specific config
    health_check_path = Column(String, default="/health")

    # Status tracking
    build_logs = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    last_health_check = Column(DateTime(timezone=True), nullable=True)

    # Usage metrics
    request_count = Column(Integer, default=0)
    last_request_at = Column(DateTime(timezone=True), nullable=True)
    avg_response_time = Column(Float, nullable=True)  # milliseconds

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deployed_at = Column(DateTime(timezone=True), nullable=True)

    # Owner
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User")

    # Auto-scaling settings
    auto_scale_enabled = Column(Boolean, default=True)
    scale_up_threshold = Column(Float, default=70.0)  # CPU percentage
    scale_down_threshold = Column(Float, default=30.0)  # CPU percentage

    def __repr__(self):
        return f"<ModelDeployment {self.name} status={self.status}>"


class DeploymentLog(Base):
    __tablename__ = "deployment_logs"

    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("model_deployments.id"))
    deployment = relationship("ModelDeployment")

    log_level = Column(String, default="INFO")  # DEBUG, INFO, WARNING, ERROR
    message = Column(Text)
    component = Column(String, nullable=True)  # builder, deployer, scaler, etc.
    log_metadata = Column(JSON, default={})

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<DeploymentLog {self.log_level}: {self.message[:50]}>"
