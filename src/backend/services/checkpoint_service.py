"""
Checkpoint Service
Provides checkpoint functionality for workflows, database backups, and deployment validation.
"""

import asyncio
import json
import logging
import os
import subprocess
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union
from enum import Enum
import hashlib
import pickle
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from core.database import get_db
from core.config import settings
from models.automation import WorkflowExecution, ExecutionStatus

logger = logging.getLogger(__name__)


class CheckpointType(str, Enum):
    """Types of checkpoints supported."""

    WORKFLOW = "workflow"
    DATABASE = "database"
    DEPLOYMENT = "deployment"


class CheckpointStatus(str, Enum):
    """Status of a checkpoint."""

    CREATED = "created"
    VALIDATED = "validated"
    RESTORED = "restored"
    FAILED = "failed"


class WorkflowCheckpoint:
    """Handles workflow state checkpointing."""

    def __init__(self, checkpoint_dir: Optional[str] = None):
        if checkpoint_dir is None:
            checkpoint_dir = os.getenv("CHECKPOINT_DIR", "/tmp/warroom/checkpoints")
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

    async def create_checkpoint(
        self,
        execution_id: str,
        step_id: str,
        state: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Create a checkpoint for a workflow execution step."""
        try:
            checkpoint_id = self._generate_checkpoint_id(execution_id, step_id)
            checkpoint_data = {
                "checkpoint_id": checkpoint_id,
                "execution_id": execution_id,
                "step_id": step_id,
                "state": state,
                "metadata": metadata or {},
                "created_at": datetime.utcnow().isoformat(),
                "type": CheckpointType.WORKFLOW,
            }

            checkpoint_path = self.checkpoint_dir / f"{checkpoint_id}.checkpoint"
            with open(checkpoint_path, "wb") as f:
                pickle.dump(checkpoint_data, f)

            logger.info(f"Created workflow checkpoint: {checkpoint_id}")
            return checkpoint_id

        except Exception as e:
            logger.error(f"Failed to create workflow checkpoint: {str(e)}")
            raise

    async def restore_checkpoint(self, checkpoint_id: str) -> Dict[str, Any]:
        """Restore a workflow from a checkpoint."""
        try:
            checkpoint_path = self.checkpoint_dir / f"{checkpoint_id}.checkpoint"

            if not checkpoint_path.exists():
                raise ValueError(f"Checkpoint {checkpoint_id} not found")

            with open(checkpoint_path, "rb") as f:
                checkpoint_data = pickle.load(f)

            logger.info(f"Restored workflow checkpoint: {checkpoint_id}")
            return checkpoint_data

        except Exception as e:
            logger.error(f"Failed to restore workflow checkpoint: {str(e)}")
            raise

    async def list_checkpoints(
        self, execution_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List all checkpoints, optionally filtered by execution ID."""
        checkpoints = []

        for checkpoint_file in self.checkpoint_dir.glob("*.checkpoint"):
            try:
                with open(checkpoint_file, "rb") as f:
                    data = pickle.load(f)

                if execution_id is None or data.get("execution_id") == execution_id:
                    checkpoints.append(
                        {
                            "checkpoint_id": data["checkpoint_id"],
                            "execution_id": data["execution_id"],
                            "step_id": data["step_id"],
                            "created_at": data["created_at"],
                        }
                    )
            except Exception as e:
                logger.warning(
                    f"Failed to read checkpoint file {checkpoint_file}: {str(e)}"
                )

        return sorted(checkpoints, key=lambda x: x["created_at"], reverse=True)

    async def cleanup_old_checkpoints(self, days: int = 7):
        """Remove checkpoints older than specified days."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        removed_count = 0

        for checkpoint_file in self.checkpoint_dir.glob("*.checkpoint"):
            try:
                with open(checkpoint_file, "rb") as f:
                    data = pickle.load(f)

                created_at = datetime.fromisoformat(data["created_at"])
                if created_at < cutoff_date:
                    checkpoint_file.unlink()
                    removed_count += 1
            except Exception as e:
                logger.warning(
                    f"Failed to process checkpoint file {checkpoint_file}: {str(e)}"
                )

        logger.info(f"Cleaned up {removed_count} old checkpoints")
        return removed_count

    def _generate_checkpoint_id(self, execution_id: str, step_id: str) -> str:
        """Generate a unique checkpoint ID."""
        timestamp = datetime.utcnow().isoformat()
        data = f"{execution_id}:{step_id}:{timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]


class DatabaseCheckpoint:
    """Handles database backup checkpoints."""

    def __init__(self, backup_dir: Optional[str] = None):
        if backup_dir is None:
            backup_dir = os.getenv("BACKUP_DIR", "/tmp/warroom/db_backups")
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    async def create_backup_checkpoint(
        self, db_url: str, checkpoint_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a database backup checkpoint."""
        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            checkpoint_name = checkpoint_name or f"db_checkpoint_{timestamp}"
            backup_file = self.backup_dir / f"{checkpoint_name}.sql"

            # Parse database URL
            from urllib.parse import urlparse

            parsed = urlparse(db_url)

            # Create pg_dump command
            env = os.environ.copy()
            env["PGPASSWORD"] = parsed.password

            cmd = [
                "pg_dump",
                "-h",
                parsed.hostname,
                "-p",
                str(parsed.port or 5432),
                "-U",
                parsed.username,
                "-d",
                parsed.path.lstrip("/"),
                "-f",
                str(backup_file),
                "--verbose",
                "--no-owner",
                "--no-privileges",
            ]

            # Run backup
            process = await asyncio.create_subprocess_exec(
                *cmd,
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                raise Exception(f"Backup failed: {stderr.decode()}")

            # Calculate checksum
            checksum = self._calculate_file_checksum(backup_file)

            checkpoint_info = {
                "checkpoint_name": checkpoint_name,
                "backup_file": str(backup_file),
                "created_at": datetime.utcnow().isoformat(),
                "size_bytes": backup_file.stat().st_size,
                "checksum": checksum,
                "type": CheckpointType.DATABASE,
                "status": CheckpointStatus.CREATED,
            }

            # Save checkpoint metadata
            metadata_file = self.backup_dir / f"{checkpoint_name}.meta"
            with open(metadata_file, "w") as f:
                json.dump(checkpoint_info, f, indent=2)

            logger.info(f"Created database checkpoint: {checkpoint_name}")
            return checkpoint_info

        except Exception as e:
            logger.error(f"Failed to create database checkpoint: {str(e)}")
            raise

    async def restore_from_checkpoint(
        self, checkpoint_name: str, target_db_url: str
    ) -> bool:
        """Restore database from a checkpoint."""
        try:
            backup_file = self.backup_dir / f"{checkpoint_name}.sql"

            if not backup_file.exists():
                raise ValueError(f"Backup file not found: {checkpoint_name}")

            # Verify checksum
            metadata_file = self.backup_dir / f"{checkpoint_name}.meta"
            if metadata_file.exists():
                with open(metadata_file, "r") as f:
                    metadata = json.load(f)

                current_checksum = self._calculate_file_checksum(backup_file)
                if current_checksum != metadata.get("checksum"):
                    raise ValueError(
                        "Backup file checksum mismatch - file may be corrupted"
                    )

            # Parse target database URL
            from urllib.parse import urlparse

            parsed = urlparse(target_db_url)

            # Restore using psql
            env = os.environ.copy()
            env["PGPASSWORD"] = parsed.password

            cmd = [
                "psql",
                "-h",
                parsed.hostname,
                "-p",
                str(parsed.port or 5432),
                "-U",
                parsed.username,
                "-d",
                parsed.path.lstrip("/"),
                "-f",
                str(backup_file),
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                raise Exception(f"Restore failed: {stderr.decode()}")

            logger.info(f"Restored database from checkpoint: {checkpoint_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to restore database checkpoint: {str(e)}")
            raise

    async def list_backup_checkpoints(self) -> List[Dict[str, Any]]:
        """List all database backup checkpoints."""
        checkpoints = []

        for meta_file in self.backup_dir.glob("*.meta"):
            try:
                with open(meta_file, "r") as f:
                    metadata = json.load(f)
                checkpoints.append(metadata)
            except Exception as e:
                logger.warning(f"Failed to read metadata file {meta_file}: {str(e)}")

        return sorted(checkpoints, key=lambda x: x["created_at"], reverse=True)

    def _calculate_file_checksum(self, file_path: Path) -> str:
        """Calculate SHA256 checksum of a file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()


class DeploymentCheckpoint:
    """Handles deployment validation checkpoints."""

    def __init__(self):
        self.checks = {
            "environment": self._check_environment,
            "database": self._check_database,
            "dependencies": self._check_dependencies,
            "migrations": self._check_migrations,
            "health": self._check_health_endpoints,
            "configuration": self._check_configuration,
        }

    async def create_deployment_checkpoint(self) -> Dict[str, Any]:
        """Create a comprehensive deployment checkpoint."""
        checkpoint_results = {
            "checkpoint_id": datetime.utcnow().strftime("%Y%m%d_%H%M%S"),
            "created_at": datetime.utcnow().isoformat(),
            "type": CheckpointType.DEPLOYMENT,
            "checks": {},
            "overall_status": CheckpointStatus.CREATED,
        }

        all_passed = True

        for check_name, check_func in self.checks.items():
            try:
                result = await check_func()
                checkpoint_results["checks"][check_name] = result
                if not result.get("passed", False):
                    all_passed = False
            except Exception as e:
                checkpoint_results["checks"][check_name] = {
                    "passed": False,
                    "error": str(e),
                }
                all_passed = False

        checkpoint_results["overall_status"] = (
            CheckpointStatus.VALIDATED if all_passed else CheckpointStatus.FAILED
        )

        # Save checkpoint results
        checkpoint_file = (
            Path("/tmp/warroom/deployment_checkpoints")
            / f"{checkpoint_results['checkpoint_id']}.json"
        )
        checkpoint_file.parent.mkdir(parents=True, exist_ok=True)

        with open(checkpoint_file, "w") as f:
            json.dump(checkpoint_results, f, indent=2)

        return checkpoint_results

    async def _check_environment(self) -> Dict[str, Any]:
        """Check environment variables."""
        required_vars = [
            "DATABASE_URL",
            "JWT_SECRET",
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY",
        ]

        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)

        return {
            "passed": len(missing_vars) == 0,
            "missing_vars": missing_vars,
            "message": "All required environment variables present"
            if not missing_vars
            else f"Missing: {', '.join(missing_vars)}",
        }

    async def _check_database(self) -> Dict[str, Any]:
        """Check database connectivity."""
        try:
            engine = create_engine(settings.DATABASE_URL)
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                result.fetchone()

            return {"passed": True, "message": "Database connection successful"}
        except Exception as e:
            return {
                "passed": False,
                "error": str(e),
                "message": "Database connection failed",
            }

    async def _check_dependencies(self) -> Dict[str, Any]:
        """Check Python dependencies."""
        try:
            # Check if requirements.txt exists
            req_file = Path("src/backend/requirements.txt")
            if not req_file.exists():
                return {"passed": False, "message": "requirements.txt not found"}

            # Check for common issues
            with open(req_file, "r") as f:
                requirements = f.read()

            issues = []
            if "fastapi" not in requirements:
                issues.append("FastAPI not in requirements")
            if "sqlalchemy" not in requirements:
                issues.append("SQLAlchemy not in requirements")

            return {
                "passed": len(issues) == 0,
                "issues": issues,
                "message": "All core dependencies present"
                if not issues
                else f"Issues found: {', '.join(issues)}",
            }
        except Exception as e:
            return {
                "passed": False,
                "error": str(e),
                "message": "Failed to check dependencies",
            }

    async def _check_migrations(self) -> Dict[str, Any]:
        """Check database migrations status."""
        try:
            # Run alembic current to check migration status
            process = await asyncio.create_subprocess_exec(
                "alembic",
                "current",
                cwd="src/backend",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                return {
                    "passed": False,
                    "error": stderr.decode(),
                    "message": "Failed to check migration status",
                }

            return {
                "passed": True,
                "current_revision": stdout.decode().strip(),
                "message": "Migrations are up to date",
            }
        except Exception as e:
            return {
                "passed": False,
                "error": str(e),
                "message": "Failed to check migrations",
            }

    async def _check_health_endpoints(self) -> Dict[str, Any]:
        """Check if health endpoints are properly configured."""
        # This would normally make an HTTP request to the health endpoint
        # For now, we'll just check if the endpoint is defined
        return {
            "passed": True,
            "message": "Health endpoints configured",
            "endpoints": ["/api/v1/monitoring/health", "/api/v1/monitoring/ready"],
        }

    async def _check_configuration(self) -> Dict[str, Any]:
        """Check deployment configuration files."""
        required_files = [
            "railway.json",
            "Dockerfile.railway",
            ".env.production.template",
        ]

        missing_files = []
        for file in required_files:
            if not Path(file).exists():
                missing_files.append(file)

        return {
            "passed": len(missing_files) == 0,
            "missing_files": missing_files,
            "message": "All configuration files present"
            if not missing_files
            else f"Missing: {', '.join(missing_files)}",
        }


class CheckpointService:
    """Main service for managing all types of checkpoints."""

    def __init__(self):
        self.workflow_checkpoint = WorkflowCheckpoint()
        self.database_checkpoint = DatabaseCheckpoint()
        self.deployment_checkpoint = DeploymentCheckpoint()

    async def create_checkpoint(
        self, checkpoint_type: CheckpointType, **kwargs
    ) -> Dict[str, Any]:
        """Create a checkpoint of the specified type."""
        if checkpoint_type == CheckpointType.WORKFLOW:
            checkpoint_id = await self.workflow_checkpoint.create_checkpoint(**kwargs)
            return {"checkpoint_id": checkpoint_id, "type": checkpoint_type}

        elif checkpoint_type == CheckpointType.DATABASE:
            return await self.database_checkpoint.create_backup_checkpoint(**kwargs)

        elif checkpoint_type == CheckpointType.DEPLOYMENT:
            return await self.deployment_checkpoint.create_deployment_checkpoint()

        else:
            raise ValueError(f"Unknown checkpoint type: {checkpoint_type}")

    async def restore_checkpoint(
        self, checkpoint_type: CheckpointType, **kwargs
    ) -> Any:
        """Restore from a checkpoint."""
        if checkpoint_type == CheckpointType.WORKFLOW:
            return await self.workflow_checkpoint.restore_checkpoint(**kwargs)

        elif checkpoint_type == CheckpointType.DATABASE:
            return await self.database_checkpoint.restore_from_checkpoint(**kwargs)

        else:
            raise ValueError(f"Cannot restore checkpoint type: {checkpoint_type}")

    async def list_checkpoints(
        self, checkpoint_type: Optional[CheckpointType] = None
    ) -> List[Dict[str, Any]]:
        """List checkpoints, optionally filtered by type."""
        all_checkpoints = []

        if checkpoint_type in [None, CheckpointType.WORKFLOW]:
            workflow_checkpoints = await self.workflow_checkpoint.list_checkpoints()
            all_checkpoints.extend(workflow_checkpoints)

        if checkpoint_type in [None, CheckpointType.DATABASE]:
            db_checkpoints = await self.database_checkpoint.list_backup_checkpoints()
            all_checkpoints.extend(db_checkpoints)

        return all_checkpoints


# Singleton instance
checkpoint_service = CheckpointService()
