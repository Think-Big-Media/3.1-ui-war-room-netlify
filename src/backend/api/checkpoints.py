"""
Checkpoint API endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from core.deps import get_db
from api.v1.endpoints.auth import get_current_active_user
from core.deps import require_platform_admin as require_admin
from models.user import User
from services.checkpoint_service import (
    checkpoint_service,
    CheckpointType,
    CheckpointStatus,
)
from schemas.checkpoint import (
    CheckpointCreate,
    CheckpointResponse,
    CheckpointList,
    DeploymentCheckpointResponse,
)

router = APIRouter()


@router.post("/workflow", response_model=CheckpointResponse)
async def create_workflow_checkpoint(
    execution_id: str,
    step_id: str,
    state: dict,
    metadata: Optional[dict] = None,
    current_user: User = Depends(get_current_active_user),
):
    """Create a checkpoint for a workflow execution."""
    try:
        checkpoint_id = await checkpoint_service.create_checkpoint(
            checkpoint_type=CheckpointType.WORKFLOW,
            execution_id=execution_id,
            step_id=step_id,
            state=state,
            metadata=metadata,
        )
        return CheckpointResponse(
            checkpoint_id=checkpoint_id["checkpoint_id"],
            type=CheckpointType.WORKFLOW,
            status=CheckpointStatus.CREATED,
            message="Workflow checkpoint created successfully",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkpoint: {str(e)}",
        )


@router.post("/database", response_model=CheckpointResponse)
async def create_database_checkpoint(
    background_tasks: BackgroundTasks,
    checkpoint_name: Optional[str] = None,
    current_user: User = Depends(require_admin),
):
    """Create a database backup checkpoint (admin only)."""
    try:
        # Get database URL from settings
        from ..core.config import settings

        # Run backup in background
        background_tasks.add_task(
            checkpoint_service.create_checkpoint,
            checkpoint_type=CheckpointType.DATABASE,
            db_url=settings.DATABASE_URL,
            checkpoint_name=checkpoint_name,
        )

        return CheckpointResponse(
            checkpoint_id=checkpoint_name or "auto_generated",
            type=CheckpointType.DATABASE,
            status=CheckpointStatus.CREATED,
            message="Database backup initiated in background",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate database backup: {str(e)}",
        )


@router.post("/deployment", response_model=DeploymentCheckpointResponse)
async def create_deployment_checkpoint(current_user: User = Depends(require_admin)):
    """Run deployment readiness checks and create checkpoint (admin only)."""
    try:
        result = await checkpoint_service.create_checkpoint(
            checkpoint_type=CheckpointType.DEPLOYMENT
        )

        return DeploymentCheckpointResponse(
            checkpoint_id=result["checkpoint_id"],
            type=CheckpointType.DEPLOYMENT,
            status=result["overall_status"],
            checks=result["checks"],
            created_at=result["created_at"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run deployment checks: {str(e)}",
        )


@router.get("/workflow/{checkpoint_id}")
async def get_workflow_checkpoint(
    checkpoint_id: str, current_user: User = Depends(get_current_active_user)
):
    """Retrieve a specific workflow checkpoint."""
    try:
        checkpoint_data = await checkpoint_service.restore_checkpoint(
            checkpoint_type=CheckpointType.WORKFLOW, checkpoint_id=checkpoint_id
        )
        return checkpoint_data
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve checkpoint: {str(e)}",
        )


@router.get("/list", response_model=CheckpointList)
async def list_checkpoints(
    checkpoint_type: Optional[CheckpointType] = None,
    execution_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
):
    """List all checkpoints, optionally filtered by type or execution ID."""
    try:
        checkpoints = await checkpoint_service.list_checkpoints(checkpoint_type)

        # Filter by execution_id if provided
        if execution_id and checkpoint_type == CheckpointType.WORKFLOW:
            checkpoints = [
                cp for cp in checkpoints if cp.get("execution_id") == execution_id
            ]

        return CheckpointList(checkpoints=checkpoints, total=len(checkpoints))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list checkpoints: {str(e)}",
        )


@router.post("/restore/database/{checkpoint_name}")
async def restore_database_checkpoint(
    checkpoint_name: str,
    background_tasks: BackgroundTasks,
    target_db_url: Optional[str] = None,
    current_user: User = Depends(require_admin),
):
    """Restore database from a checkpoint (admin only)."""
    try:
        from ..core.config import settings

        # Use provided target or default to current database
        target_url = target_db_url or settings.DATABASE_URL

        # Run restore in background
        background_tasks.add_task(
            checkpoint_service.restore_checkpoint,
            checkpoint_type=CheckpointType.DATABASE,
            checkpoint_name=checkpoint_name,
            target_db_url=target_url,
        )

        return {
            "message": "Database restore initiated in background",
            "checkpoint_name": checkpoint_name,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate database restore: {str(e)}",
        )


@router.delete("/cleanup")
async def cleanup_old_checkpoints(
    days: int = 7, current_user: User = Depends(require_admin)
):
    """Clean up checkpoints older than specified days (admin only)."""
    try:
        removed_count = (
            await checkpoint_service.workflow_checkpoint.cleanup_old_checkpoints(days)
        )

        return {"message": f"Cleaned up {removed_count} old checkpoints", "days": days}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup checkpoints: {str(e)}",
        )
