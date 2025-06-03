from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.models.deployment import DeploymentStatus, DeploymentType


# Base deployment schemas
class DeploymentBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: str = Field(..., min_length=1, max_length=100, description="Deployment name")
    description: Optional[str] = Field(None, max_length=500)
    deployment_type: DeploymentType = DeploymentType.CONTAINER

    # Resource configuration
    cpu_limit: float = Field(1.0, ge=0.1, le=8.0, description="CPU cores")
    memory_limit: int = Field(512, ge=128, le=8192, description="Memory in MB")
    max_replicas: int = Field(3, ge=1, le=10)
    min_replicas: int = Field(1, ge=1, le=5)

    # Configuration
    environment_vars: Dict[str, str] = Field(default_factory=dict)
    health_check_path: str = "/health"

    # Auto-scaling
    auto_scale_enabled: bool = True
    scale_up_threshold: float = Field(70.0, ge=0.0, le=100.0)
    scale_down_threshold: float = Field(30.0, ge=0.0, le=100.0)


class DeploymentCreate(DeploymentBase):
    model_config = ConfigDict(protected_namespaces=())
    model_id: int
    model_version_id: Optional[int] = None


class DeploymentUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    name: Optional[str] = None
    description: Optional[str] = None
    cpu_limit: Optional[float] = None
    memory_limit: Optional[int] = None
    max_replicas: Optional[int] = None
    min_replicas: Optional[int] = None
    environment_vars: Optional[Dict[str, str]] = None
    auto_scale_enabled: Optional[bool] = None
    scale_up_threshold: Optional[float] = None
    scale_down_threshold: Optional[float] = None


class DeploymentMetrics(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    request_count: int
    avg_response_time: Optional[float] = None
    last_request_at: Optional[datetime] = None
    last_health_check: Optional[datetime] = None
    current_replicas: int
    cpu_usage: Optional[float] = None
    memory_usage: Optional[float] = None


class Deployment(DeploymentBase):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)
    id: int
    model_id: int
    model_version_id: Optional[int] = None
    owner_id: int
    status: DeploymentStatus
    endpoint_url: Optional[str] = None
    error_message: Optional[str] = None

    # Auto-scaling
    auto_scale_enabled: bool = True
    scale_up_threshold: float = 70.0
    scale_down_threshold: float = 30.0

    # Health check
    health_check_path: str = "/health"

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None
    deployed_at: Optional[datetime] = None

    # Metrics
    request_count: int = 0
    last_request_at: Optional[datetime] = None
    avg_response_time: Optional[float] = None


class DeploymentWithModel(Deployment):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)
    model_name: str
    model_framework: str
    model_version: Optional[str] = None


class DeploymentLogBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    log_level: str = "INFO"
    message: str
    component: Optional[str] = None
    log_metadata: Dict[str, Any] = Field(default_factory=dict)


class DeploymentLogCreate(DeploymentLogBase):
    model_config = ConfigDict(protected_namespaces=())
    deployment_id: int


class DeploymentLog(DeploymentLogBase):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)
    id: int
    deployment_id: int
    created_at: datetime


# Request/Response schemas for specific actions
class DeploymentActionRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    action: str  # start, stop, restart, scale
    parameters: Dict[str, Any] = Field(default_factory=dict)


class DeploymentActionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    success: bool
    message: str
    deployment_id: int


class DeploymentListResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    deployments: List[DeploymentWithModel]
    total: int
    page: int
    limit: int


class DeploymentStatusResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    status: DeploymentStatus
    message: str


# Configuration templates for different deployment types
class ContainerDeploymentConfig(BaseModel):
    image_tag: Optional[str] = None
    port: int = 8080
    registry: str = "docker.io"
    build_args: Dict[str, str] = Field(default_factory=dict)


class ServerlessDeploymentConfig(BaseModel):
    runtime: str = "python3.9"
    timeout: int = 30
    memory_size: int = 256
    trigger_type: str = "http"


class EndpointDeploymentConfig(BaseModel):
    instance_type: str = "small"
    accelerator: Optional[str] = None  # gpu, tpu
    framework_version: Optional[str] = None
