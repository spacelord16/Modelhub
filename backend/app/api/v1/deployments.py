from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.deployment import (
    Deployment,
    DeploymentCreate,
    DeploymentUpdate,
    DeploymentListResponse,
    DeploymentStatusResponse,
    DeploymentActionRequest,
    DeploymentActionResponse,
    DeploymentMetrics,
    DeploymentLog,
)
from app.services.deployment import DeploymentService
from app.models.deployment import DeploymentStatus

router = APIRouter()


@router.get("/", response_model=DeploymentListResponse)
def get_deployments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[DeploymentStatus] = Query(None),
):
    """Get user's deployments with optional filtering"""
    deployment_service = DeploymentService(db)
    deployments = deployment_service.get_deployments(
        owner_id=current_user.id, skip=skip, limit=limit, status=status
    )

    # Convert to response format with model information
    deployment_list = []
    for deployment in deployments:
        deployment_data = {
            **deployment.__dict__,
            "model_name": deployment.model.name,
            "model_framework": deployment.model.framework,
            "model_version": (
                deployment.model_version.version if deployment.model_version else None
            ),
        }
        deployment_list.append(deployment_data)

    return DeploymentListResponse(
        deployments=deployment_list,
        total=len(deployment_list),
        page=skip // limit + 1,
        per_page=limit,
    )


@router.post("/", response_model=Deployment)
def create_deployment(
    deployment_in: DeploymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new model deployment"""
    deployment_service = DeploymentService(db)
    return deployment_service.create_deployment(deployment_in, current_user.id)


@router.get("/{deployment_id}", response_model=DeploymentStatusResponse)
def get_deployment(
    deployment_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get deployment details with status and metrics"""
    deployment_service = DeploymentService(db)

    deployment = deployment_service.get_deployment(deployment_id)
    if not deployment or deployment.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")

    metrics = deployment_service.get_deployment_metrics(deployment_id)
    logs = deployment_service.get_deployment_logs(deployment_id, limit=10)

    return DeploymentStatusResponse(
        deployment=deployment, metrics=metrics, recent_logs=logs
    )


@router.put("/{deployment_id}", response_model=Deployment)
def update_deployment(
    deployment_id: int = Path(..., gt=0),
    deployment_update: DeploymentUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update deployment configuration"""
    deployment_service = DeploymentService(db)
    return deployment_service.update_deployment(
        deployment_id, deployment_update, current_user.id
    )


@router.delete("/{deployment_id}")
def delete_deployment(
    deployment_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a deployment"""
    deployment_service = DeploymentService(db)
    success = deployment_service.delete_deployment(deployment_id, current_user.id)

    if success:
        return {"message": "Deployment deleted successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to delete deployment")


@router.post("/{deployment_id}/actions", response_model=DeploymentActionResponse)
def deployment_action(
    deployment_id: int = Path(..., gt=0),
    action_request: DeploymentActionRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Perform actions on deployment (start, stop, restart, scale)"""
    deployment_service = DeploymentService(db)

    deployment = deployment_service.get_deployment(deployment_id)
    if not deployment or deployment.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")

    action = action_request.action.lower()

    try:
        if action == "start":
            updated_deployment = deployment_service.start_deployment(
                deployment_id, current_user.id
            )
            return DeploymentActionResponse(
                success=True,
                message="Deployment start initiated",
                deployment_id=deployment_id,
                new_status=updated_deployment.status,
            )

        elif action == "stop":
            updated_deployment = deployment_service.stop_deployment(
                deployment_id, current_user.id
            )
            return DeploymentActionResponse(
                success=True,
                message="Deployment stopped",
                deployment_id=deployment_id,
                new_status=updated_deployment.status,
            )

        elif action == "restart":
            # Stop then start
            deployment_service.stop_deployment(deployment_id, current_user.id)
            updated_deployment = deployment_service.start_deployment(
                deployment_id, current_user.id
            )
            return DeploymentActionResponse(
                success=True,
                message="Deployment restart initiated",
                deployment_id=deployment_id,
                new_status=updated_deployment.status,
            )

        elif action == "scale":
            # TODO: Implement scaling logic
            return DeploymentActionResponse(
                success=False,
                message="Scaling not yet implemented",
                deployment_id=deployment_id,
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid action: {action}. Supported actions: start, stop, restart, scale",
            )

    except Exception as e:
        return DeploymentActionResponse(
            success=False, message=str(e), deployment_id=deployment_id
        )


@router.get("/{deployment_id}/metrics", response_model=DeploymentMetrics)
def get_deployment_metrics(
    deployment_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get deployment performance metrics"""
    deployment_service = DeploymentService(db)

    deployment = deployment_service.get_deployment(deployment_id)
    if not deployment or deployment.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")

    return deployment_service.get_deployment_metrics(deployment_id)


@router.get("/{deployment_id}/logs", response_model=List[DeploymentLog])
def get_deployment_logs(
    deployment_id: int = Path(..., gt=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get deployment logs"""
    deployment_service = DeploymentService(db)

    deployment = deployment_service.get_deployment(deployment_id)
    if not deployment or deployment.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")

    return deployment_service.get_deployment_logs(deployment_id, limit)


@router.post("/{deployment_id}/predict")
async def predict(
    deployment_id: int = Path(..., gt=0),
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Make prediction using deployed model (proxy endpoint)"""
    deployment_service = DeploymentService(db)

    deployment = deployment_service.get_deployment(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    if deployment.status != DeploymentStatus.RUNNING:
        raise HTTPException(
            status_code=400,
            detail=f"Deployment is not running (status: {deployment.status})",
        )

    # TODO: Implement actual prediction proxy
    # This would forward the request to the deployed model endpoint
    # For now, return a mock response

    return {
        "deployment_id": deployment_id,
        "model_name": deployment.model.name,
        "prediction": "This is a mock prediction response",
        "input": payload,
        "status": "success",
    }
