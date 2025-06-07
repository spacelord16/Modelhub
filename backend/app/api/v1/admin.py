from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import List, Optional
from datetime import datetime, timedelta

from app.api.deps import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.model import Model, ModelStatus, DeploymentStatus
from app.models.analytics import PlatformAnalytics, UserActivity, ModelActivity
from app.schemas.admin import (
    UserManagement,
    UserRoleUpdate,
    UserStatusUpdate,
    ModelApprovalRequest,
    ModelApprovalResponse,
    PendingApproval,
    AnalyticsDashboard,
    PlatformStats,
    UserActivitySummary,
    ModelActivitySummary,
    EmergencyAction,
    EmergencyResponse,
)

router = APIRouter()


def require_admin_access(current_user: User = Depends(get_current_active_user)):
    """Dependency to ensure user has admin access"""
    if not current_user.has_admin_access():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user


def require_moderator_access(current_user: User = Depends(get_current_active_user)):
    """Dependency to ensure user has moderator access"""
    if not current_user.can_moderate():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Moderator access required"
        )
    return current_user


# User Management Endpoints
@router.get("/users", response_model=List[UserManagement])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    role_filter: Optional[UserRole] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_access),
):
    """Get all users with filtering options"""
    query = db.query(User)

    if role_filter:
        query = query.filter(User.role == role_filter)

    if active_only:
        query = query.filter(User.is_active == True)

    users = query.offset(skip).limit(limit).all()

    # Add model count for each user
    user_data = []
    for user in users:
        model_count = db.query(Model).filter(Model.owner_id == user.id).count()
        user_dict = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "role": user.role,
            "last_login": user.last_login,
            "login_count": user.login_count,
            "created_at": user.created_at,
            "model_count": model_count,
        }
        user_data.append(UserManagement(**user_dict))

    return user_data


@router.put("/users/{user_id}/role", response_model=UserManagement)
async def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_access),
):
    """Update user role (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent non-super-admins from creating other admins
    if (
        role_update.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        and admin_user.role != UserRole.SUPER_ADMIN
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can assign admin roles",
        )

    user.role = role_update.role
    db.commit()
    db.refresh(user)

    # Log the action
    activity = UserActivity(
        user_id=admin_user.id,
        activity_type="role_change",
        activity_details={
            "target_user_id": user_id,
            "new_role": role_update.role.value,
            "changed_by": admin_user.username,
        },
    )
    db.add(activity)
    db.commit()

    model_count = db.query(Model).filter(Model.owner_id == user.id).count()
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "role": user.role,
        "last_login": user.last_login,
        "login_count": user.login_count,
        "created_at": user.created_at,
        "model_count": model_count,
    }
    return UserManagement(**user_dict)


@router.put("/users/{user_id}/status", response_model=UserManagement)
async def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_access),
):
    """Activate or deactivate user account"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = status_update.is_active
    db.commit()
    db.refresh(user)

    # Log the action
    activity = UserActivity(
        user_id=admin_user.id,
        activity_type="status_change",
        activity_details={
            "target_user_id": user_id,
            "new_status": "active" if status_update.is_active else "inactive",
            "reason": status_update.reason,
            "changed_by": admin_user.username,
        },
    )
    db.add(activity)
    db.commit()

    model_count = db.query(Model).filter(Model.owner_id == user.id).count()
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "role": user.role,
        "last_login": user.last_login,
        "login_count": user.login_count,
        "created_at": user.created_at,
        "model_count": model_count,
    }
    return UserManagement(**user_dict)


# Model Approval Endpoints
@router.get("/models/pending", response_model=List[PendingApproval])
async def get_pending_models(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    moderator_user: User = Depends(require_moderator_access),
):
    """Get models pending approval"""
    models = (
        db.query(Model)
        .join(User, Model.owner_id == User.id)
        .filter(Model.status == ModelStatus.PENDING)
        .order_by(desc(Model.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    pending_models = []
    for model in models:
        model_dict = {
            "id": model.id,
            "name": model.name,
            "description": model.description,
            "framework": model.framework,
            "owner_username": model.owner.username,
            "created_at": model.created_at,
            "task_type": model.task_type,
        }
        pending_models.append(PendingApproval(**model_dict))

    return pending_models


@router.post("/models/approve", response_model=ModelApprovalResponse)
async def approve_or_reject_model(
    approval_request: ModelApprovalRequest,
    db: Session = Depends(get_db),
    moderator_user: User = Depends(require_moderator_access),
):
    """Approve or reject a model"""
    model = db.query(Model).filter(Model.id == approval_request.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    if model.status != ModelStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Model is not pending approval (current status: {model.status.value})",
        )

    # Update model status
    if approval_request.action == "approve":
        model.status = ModelStatus.APPROVED
        model.deployment_status = DeploymentStatus.ACTIVE
    else:
        model.status = ModelStatus.REJECTED
        model.deployment_status = DeploymentStatus.INACTIVE

    model.reviewed_by = moderator_user.id
    model.reviewed_at = datetime.utcnow()
    model.review_notes = approval_request.notes

    db.commit()
    db.refresh(model)

    # Log the action
    activity = UserActivity(
        user_id=moderator_user.id,
        activity_type="model_review",
        activity_details={
            "model_id": model.id,
            "action": approval_request.action,
            "notes": approval_request.notes,
            "reviewed_by": moderator_user.username,
        },
    )
    db.add(activity)
    db.commit()

    # Return response
    response_dict = {
        "id": model.id,
        "name": model.name,
        "status": model.status,
        "deployment_status": model.deployment_status,
        "owner_username": model.owner.username,
        "reviewed_by": moderator_user.username,
        "reviewed_at": model.reviewed_at,
        "review_notes": model.review_notes,
        "created_at": model.created_at,
    }
    return ModelApprovalResponse(**response_dict)


# Analytics Endpoints
@router.get("/analytics/dashboard", response_model=AnalyticsDashboard)
async def get_analytics_dashboard(
    db: Session = Depends(get_db), admin_user: User = Depends(require_admin_access)
):
    """Get comprehensive analytics dashboard data"""
    today = datetime.utcnow().date()

    # Platform stats
    total_users = db.query(User).count()
    active_users_today = (
        db.query(UserActivity)
        .filter(
            func.date(UserActivity.timestamp) == today,
            UserActivity.activity_type == "login",
        )
        .distinct(UserActivity.user_id)
        .count()
    )

    total_models = db.query(Model).count()
    models_uploaded_today = (
        db.query(Model).filter(func.date(Model.created_at) == today).count()
    )

    total_downloads = db.query(func.sum(Model.downloads)).scalar() or 0
    downloads_today = (
        db.query(ModelActivity)
        .filter(
            func.date(ModelActivity.timestamp) == today,
            ModelActivity.activity_type == "download",
        )
        .count()
    )

    pending_approvals = (
        db.query(Model).filter(Model.status == ModelStatus.PENDING).count()
    )

    approved_models_today = (
        db.query(Model)
        .filter(
            func.date(Model.reviewed_at) == today, Model.status == ModelStatus.APPROVED
        )
        .count()
    )

    rejected_models_today = (
        db.query(Model)
        .filter(
            func.date(Model.reviewed_at) == today, Model.status == ModelStatus.REJECTED
        )
        .count()
    )

    emergency_disabled_count = (
        db.query(Model)
        .filter(Model.deployment_status == DeploymentStatus.EMERGENCY_DISABLED)
        .count()
    )

    platform_stats = PlatformStats(
        total_users=total_users,
        active_users_today=active_users_today,
        total_models=total_models,
        models_uploaded_today=models_uploaded_today,
        total_downloads=total_downloads,
        downloads_today=downloads_today,
        pending_approvals=pending_approvals,
        approved_models_today=approved_models_today,
        rejected_models_today=rejected_models_today,
        emergency_disabled_count=emergency_disabled_count,
    )

    # Recent activities (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    activity_summary = (
        db.query(
            UserActivity.activity_type,
            func.count(UserActivity.id).label("count"),
            func.max(UserActivity.timestamp).label("last_occurrence"),
        )
        .filter(UserActivity.timestamp >= week_ago)
        .group_by(UserActivity.activity_type)
        .order_by(desc(func.count(UserActivity.id)))
        .limit(10)
        .all()
    )

    recent_activities = [
        UserActivitySummary(
            activity_type=activity.activity_type,
            count=activity.count,
            last_occurrence=activity.last_occurrence,
        )
        for activity in activity_summary
    ]

    # Top models
    top_models_query = (
        db.query(Model)
        .join(User, Model.owner_id == User.id)
        .order_by(desc(Model.downloads))
        .limit(10)
        .all()
    )

    top_models = [
        ModelActivitySummary(
            model_name=model.name,
            downloads=model.downloads,
            views=0,  # You can implement view tracking
            likes=model.likes,
            owner_username=model.owner.username,
        )
        for model in top_models_query
    ]

    # User growth (last 30 days)
    user_growth = []
    for i in range(30):
        date = datetime.utcnow().date() - timedelta(days=i)
        count = db.query(User).filter(func.date(User.created_at) <= date).count()
        user_growth.append({"date": date.isoformat(), "count": count})

    # Model growth (last 30 days)
    model_growth = []
    for i in range(30):
        date = datetime.utcnow().date() - timedelta(days=i)
        count = db.query(Model).filter(func.date(Model.created_at) <= date).count()
        model_growth.append({"date": date.isoformat(), "count": count})

    return AnalyticsDashboard(
        platform_stats=platform_stats,
        recent_activities=recent_activities,
        top_models=top_models,
        user_growth=user_growth,
        model_growth=model_growth,
    )


# Emergency Controls
@router.post("/emergency", response_model=EmergencyResponse)
async def execute_emergency_action(
    emergency_action: EmergencyAction,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_access),
):
    """Execute emergency actions (admin only)"""
    affected_count = 0

    if emergency_action.action == "disable":
        # Emergency disable model
        model = db.query(Model).filter(Model.id == emergency_action.target_id).first()
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")

        model.deployment_status = DeploymentStatus.EMERGENCY_DISABLED
        affected_count = 1
        message = f"Model '{model.name}' has been emergency disabled"

    elif emergency_action.action == "enable":
        # Re-enable model
        model = db.query(Model).filter(Model.id == emergency_action.target_id).first()
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")

        model.deployment_status = DeploymentStatus.ACTIVE
        affected_count = 1
        message = f"Model '{model.name}' has been re-enabled"

    elif emergency_action.action == "suspend_user":
        # Suspend user and disable all their models
        user = db.query(User).filter(User.id == emergency_action.target_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.is_active = False
        user_models = db.query(Model).filter(Model.owner_id == user.id).all()
        for model in user_models:
            model.deployment_status = DeploymentStatus.EMERGENCY_DISABLED

        affected_count = len(user_models) + 1
        message = (
            f"User '{user.username}' suspended, {len(user_models)} models disabled"
        )

    elif emergency_action.action == "unsuspend_user":
        # Unsuspend user
        user = db.query(User).filter(User.id == emergency_action.target_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.is_active = True
        affected_count = 1
        message = f"User '{user.username}' has been unsuspended"

    db.commit()

    # Log emergency action
    activity = UserActivity(
        user_id=admin_user.id,
        activity_type="emergency_action",
        activity_details={
            "action": emergency_action.action,
            "target_id": emergency_action.target_id,
            "reason": emergency_action.reason,
            "duration_hours": emergency_action.duration_hours,
            "executed_by": admin_user.username,
        },
    )
    db.add(activity)
    db.commit()

    return EmergencyResponse(
        success=True, message=message, affected_count=affected_count
    )
