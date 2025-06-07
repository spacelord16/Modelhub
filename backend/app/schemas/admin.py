from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.model import ModelStatus, DeploymentStatus
from app.models.user import UserRole


# User Management Schemas
class UserManagement(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    role: UserRole
    last_login: Optional[datetime] = None
    login_count: int
    created_at: datetime
    model_count: int = 0

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserStatusUpdate(BaseModel):
    is_active: bool
    reason: Optional[str] = None


# Model Approval Schemas
class ModelApprovalRequest(BaseModel):
    model_id: int
    action: str = Field(..., pattern="^(approve|reject)$")
    notes: Optional[str] = None


class ModelApprovalResponse(BaseModel):
    id: int
    name: str
    status: ModelStatus
    deployment_status: DeploymentStatus
    owner_username: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PendingApproval(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    framework: str
    owner_username: str
    created_at: datetime
    task_type: Optional[str] = None

    class Config:
        from_attributes = True


# Analytics Schemas
class PlatformStats(BaseModel):
    total_users: int
    active_users_today: int
    total_models: int
    models_uploaded_today: int
    total_downloads: int
    downloads_today: int
    pending_approvals: int
    approved_models_today: int
    rejected_models_today: int
    emergency_disabled_count: int


class UserActivitySummary(BaseModel):
    activity_type: str
    count: int
    last_occurrence: datetime


class ModelActivitySummary(BaseModel):
    model_name: str
    downloads: int
    views: int
    likes: int
    owner_username: str


class AnalyticsDashboard(BaseModel):
    platform_stats: PlatformStats
    recent_activities: List[UserActivitySummary]
    top_models: List[ModelActivitySummary]
    user_growth: List[Dict[str, Any]]
    model_growth: List[Dict[str, Any]]


# Emergency Controls Schemas
class EmergencyAction(BaseModel):
    action: str = Field(..., pattern="^(disable|enable|suspend_user|unsuspend_user)$")
    target_id: int
    reason: str
    duration_hours: Optional[int] = None


class EmergencyResponse(BaseModel):
    success: bool
    message: str
    affected_count: int = 0
