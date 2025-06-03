from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncio
import logging
from fastapi import HTTPException

try:
    import docker

    DOCKER_AVAILABLE = True
except ImportError:
    DOCKER_AVAILABLE = False
    docker = None

from app.models.deployment import (
    ModelDeployment,
    DeploymentLog,
    DeploymentStatus,
    DeploymentType,
)
from app.models.model import Model, ModelVersion
from app.schemas.deployment import (
    DeploymentCreate,
    DeploymentUpdate,
    DeploymentLogCreate,
    DeploymentMetrics,
)

logger = logging.getLogger(__name__)


class DeploymentService:
    def __init__(self, db: Session):
        self.db = db
        self.docker_client = None
        if DOCKER_AVAILABLE:
            try:
                self.docker_client = docker.from_env()
            except Exception as e:
                logger.warning(f"Docker client not available: {e}")
        else:
            logger.warning(
                "Docker module not available. Deployment functionality will be limited."
            )

    def get_deployment(self, deployment_id: int) -> Optional[ModelDeployment]:
        """Get deployment by ID"""
        return (
            self.db.query(ModelDeployment)
            .filter(ModelDeployment.id == deployment_id)
            .first()
        )

    def get_deployments(
        self,
        owner_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[DeploymentStatus] = None,
    ) -> List[ModelDeployment]:
        """Get deployments for a user with optional filtering"""
        query = self.db.query(ModelDeployment).filter(
            ModelDeployment.owner_id == owner_id
        )

        if status:
            query = query.filter(ModelDeployment.status == status)

        return query.offset(skip).limit(limit).all()

    def create_deployment(
        self, deployment_in: DeploymentCreate, owner_id: int
    ) -> ModelDeployment:
        """Create a new model deployment"""
        # Validate model exists and user owns it
        model = (
            self.db.query(Model)
            .filter(Model.id == deployment_in.model_id, Model.owner_id == owner_id)
            .first()
        )

        if not model:
            raise HTTPException(
                status_code=404, detail="Model not found or you don't have permission"
            )

        # Get model version (use latest if not specified)
        if deployment_in.model_version_id:
            model_version = (
                self.db.query(ModelVersion)
                .filter(
                    ModelVersion.id == deployment_in.model_version_id,
                    ModelVersion.model_id == deployment_in.model_id,
                )
                .first()
            )

            if not model_version:
                raise HTTPException(status_code=404, detail="Model version not found")
        else:
            # Use the latest version
            model_version = (
                self.db.query(ModelVersion)
                .filter(ModelVersion.model_id == deployment_in.model_id)
                .order_by(ModelVersion.created_at.desc())
                .first()
            )

            if not model_version:
                raise HTTPException(status_code=404, detail="No model versions found")

        # Check for existing deployment with same name
        existing = (
            self.db.query(ModelDeployment)
            .filter(
                ModelDeployment.name == deployment_in.name,
                ModelDeployment.owner_id == owner_id,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=400, detail="Deployment with this name already exists"
            )

        # Create deployment record
        deployment_data = deployment_in.model_dump()
        deployment_data.update(
            {
                "owner_id": owner_id,
                "model_version_id": model_version.id,
                "status": DeploymentStatus.PENDING,
            }
        )

        db_deployment = ModelDeployment(**deployment_data)
        self.db.add(db_deployment)
        self.db.commit()
        self.db.refresh(db_deployment)

        # Log deployment creation
        self._log_deployment_event(
            db_deployment.id,
            "INFO",
            f"Deployment '{deployment_in.name}' created",
            "system",
        )

        # Start deployment process asynchronously
        asyncio.create_task(self._deploy_model(db_deployment.id))

        return db_deployment

    def update_deployment(
        self, deployment_id: int, deployment_update: DeploymentUpdate, owner_id: int
    ) -> ModelDeployment:
        """Update deployment configuration"""
        deployment = self.get_deployment(deployment_id)

        if not deployment or deployment.owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Deployment not found")

        # Update fields
        update_data = deployment_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(deployment, field, value)

        deployment.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(deployment)

        self._log_deployment_event(
            deployment_id, "INFO", f"Deployment configuration updated", "system"
        )

        return deployment

    def delete_deployment(self, deployment_id: int, owner_id: int) -> bool:
        """Delete a deployment"""
        deployment = self.get_deployment(deployment_id)

        if not deployment or deployment.owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Deployment not found")

        # Stop deployment if running
        if deployment.status == DeploymentStatus.RUNNING:
            self.stop_deployment(deployment_id, owner_id)

        # Delete deployment record
        self.db.delete(deployment)
        self.db.commit()

        return True

    def start_deployment(self, deployment_id: int, owner_id: int) -> ModelDeployment:
        """Start a stopped deployment"""
        deployment = self.get_deployment(deployment_id)

        if not deployment or deployment.owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Deployment not found")

        if deployment.status == DeploymentStatus.RUNNING:
            raise HTTPException(status_code=400, detail="Deployment is already running")

        deployment.status = DeploymentStatus.DEPLOYING
        self.db.commit()

        # Start deployment process
        asyncio.create_task(self._deploy_model(deployment_id))

        return deployment

    def stop_deployment(self, deployment_id: int, owner_id: int) -> ModelDeployment:
        """Stop a running deployment"""
        deployment = self.get_deployment(deployment_id)

        if not deployment or deployment.owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Deployment not found")

        # Update status
        deployment.status = DeploymentStatus.STOPPED
        deployment.endpoint_url = None
        self.db.commit()

        self._log_deployment_event(
            deployment_id, "INFO", "Deployment stopped by user", "system"
        )

        return deployment

    def get_deployment_metrics(self, deployment_id: int) -> DeploymentMetrics:
        """Get deployment metrics"""
        deployment = self.get_deployment(deployment_id)

        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")

        # TODO: Integrate with actual monitoring system
        return DeploymentMetrics(
            request_count=deployment.request_count,
            avg_response_time=deployment.avg_response_time,
            last_request_at=deployment.last_request_at,
            last_health_check=deployment.last_health_check,
            current_replicas=deployment.min_replicas,  # Placeholder
            cpu_usage=None,  # Would come from monitoring
            memory_usage=None,  # Would come from monitoring
        )

    def get_deployment_logs(
        self, deployment_id: int, limit: int = 100
    ) -> List[DeploymentLog]:
        """Get deployment logs"""
        return (
            self.db.query(DeploymentLog)
            .filter(DeploymentLog.deployment_id == deployment_id)
            .order_by(DeploymentLog.created_at.desc())
            .limit(limit)
            .all()
        )

    async def _deploy_model(self, deployment_id: int):
        """Internal method to handle model deployment process"""
        deployment = self.get_deployment(deployment_id)
        if not deployment:
            return

        try:
            deployment.status = DeploymentStatus.BUILDING
            self.db.commit()

            self._log_deployment_event(
                deployment_id, "INFO", "Starting model deployment process", "deployer"
            )

            # Get model and version info
            model_version = (
                self.db.query(ModelVersion)
                .filter(ModelVersion.id == deployment.model_version_id)
                .first()
            )

            if not model_version:
                raise Exception("Model version not found")

            # Generate deployment configuration
            config = self._generate_deployment_config(deployment, model_version)

            # Deploy based on type
            if deployment.deployment_type == DeploymentType.CONTAINER:
                endpoint_url = await self._deploy_container(
                    deployment, model_version, config
                )
            elif deployment.deployment_type == DeploymentType.SERVERLESS:
                endpoint_url = await self._deploy_serverless(
                    deployment, model_version, config
                )
            else:
                endpoint_url = await self._deploy_endpoint(
                    deployment, model_version, config
                )

            # Update deployment with success
            deployment.status = DeploymentStatus.RUNNING
            deployment.endpoint_url = endpoint_url
            deployment.deployed_at = datetime.utcnow()
            self.db.commit()

            self._log_deployment_event(
                deployment_id,
                "INFO",
                f"Deployment successful. Endpoint: {endpoint_url}",
                "deployer",
            )

        except Exception as e:
            # Update deployment with error
            deployment.status = DeploymentStatus.FAILED
            deployment.error_message = str(e)
            self.db.commit()

            self._log_deployment_event(
                deployment_id, "ERROR", f"Deployment failed: {str(e)}", "deployer"
            )

    def _generate_deployment_config(
        self, deployment: ModelDeployment, model_version: ModelVersion
    ) -> Dict[str, Any]:
        """Generate deployment configuration based on model and deployment settings"""
        return {
            "name": deployment.name,
            "model_path": model_version.s3_path,
            "framework": model_version.model.framework,
            "cpu_limit": deployment.cpu_limit,
            "memory_limit": deployment.memory_limit,
            "min_replicas": deployment.min_replicas,
            "max_replicas": deployment.max_replicas,
            "environment_vars": deployment.environment_vars,
            "health_check_path": deployment.health_check_path,
        }

    async def _deploy_container(
        self,
        deployment: ModelDeployment,
        model_version: ModelVersion,
        config: Dict[str, Any],
    ) -> str:
        """Deploy model as container (Docker/Kubernetes)"""
        # This is a simplified implementation
        # In production, this would interact with Kubernetes or Docker Swarm

        deployment_name = f"model-{deployment.id}"

        # For now, simulate deployment with a mock endpoint
        # In production, this would:
        # 1. Build Docker image with model
        # 2. Deploy to Kubernetes cluster
        # 3. Set up ingress/load balancer
        # 4. Return actual endpoint URL

        await asyncio.sleep(2)  # Simulate deployment time

        return f"https://api.modelhub.com/v1/deployments/{deployment.id}/predict"

    async def _deploy_serverless(
        self,
        deployment: ModelDeployment,
        model_version: ModelVersion,
        config: Dict[str, Any],
    ) -> str:
        """Deploy model as serverless function"""
        # This would integrate with AWS Lambda, Google Cloud Functions, etc.
        await asyncio.sleep(1)  # Simulate deployment time
        return f"https://serverless.modelhub.com/v1/deployments/{deployment.id}/predict"

    async def _deploy_endpoint(
        self,
        deployment: ModelDeployment,
        model_version: ModelVersion,
        config: Dict[str, Any],
    ) -> str:
        """Deploy model as dedicated endpoint"""
        # This would integrate with cloud ML platforms like SageMaker, Vertex AI, etc.
        await asyncio.sleep(3)  # Simulate deployment time
        return f"https://endpoint.modelhub.com/v1/deployments/{deployment.id}/predict"

    def _log_deployment_event(
        self,
        deployment_id: int,
        level: str,
        message: str,
        component: str,
        log_metadata: Dict[str, Any] = None,
    ):
        """Log deployment event"""
        log_entry = DeploymentLog(
            deployment_id=deployment_id,
            log_level=level,
            message=message,
            component=component,
            log_metadata=log_metadata or {},
        )
        self.db.add(log_entry)
        self.db.commit()
