"""
Checkpoint schemas
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from enum import Enum

# Define enums locally to avoid circular imports
class CheckpointType(str, Enum):
    """Types of checkpoints."""
    MANUAL = "manual"
    AUTOMATIC = "automatic"
    SCHEDULED = "scheduled"
    BEFORE_EXECUTION = "before_execution"
    AFTER_EXECUTION = "after_execution"
    ERROR_RECOVERY = "error_recovery"


class CheckpointStatus(str, Enum):
    """Status of checkpoint operations."""
    CREATED = "created"
    RESTORED = "restored"
    FAILED = "failed"
    DELETED = "deleted"


class CheckpointCreate(BaseModel):
    """Schema for creating a checkpoint."""

    checkpoint_type: CheckpointType
    execution_id: Optional[str] = None
    step_id: Optional[str] = None
    state: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    checkpoint_name: Optional[str] = None


class CheckpointResponse(BaseModel):
    """Response schema for checkpoint operations."""

    checkpoint_id: str
    type: CheckpointType
    status: CheckpointStatus
    message: str


class CheckpointInfo(BaseModel):
    """Basic checkpoint information."""

    checkpoint_id: str
    type: Optional[CheckpointType] = None
    execution_id: Optional[str] = None
    step_id: Optional[str] = None
    created_at: str
    checkpoint_name: Optional[str] = None
    size_bytes: Optional[int] = None
    checksum: Optional[str] = None


class CheckpointList(BaseModel):
    """List of checkpoints."""

    checkpoints: List[Dict[str, Any]]
    total: int


class CheckpointUpdate(BaseModel):
    """Schema for updating a checkpoint."""
    checkpoint_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CheckpointRestore(BaseModel):
    """Schema for restoring from a checkpoint."""
    checkpoint_id: str
    restore_options: Optional[Dict[str, Any]] = None


class CheckpointHistory(BaseModel):
    """Schema for checkpoint history."""
    checkpoints: List[CheckpointInfo]
    total_count: int
    page: int = 1
    page_size: int = 20


class DeploymentCheck(BaseModel):
    """Single deployment check result."""

    passed: bool
    message: str
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class DeploymentCheckpointResponse(BaseModel):
    """Response for deployment checkpoint."""

    checkpoint_id: str
    type: CheckpointType
    status: CheckpointStatus
    checks: Dict[str, DeploymentCheck]
    created_at: str


class RestoreRequest(BaseModel):
    """Request to restore from checkpoint."""

    checkpoint_id: str
    checkpoint_type: CheckpointType
    target_db_url: Optional[str] = None  # For database restores
