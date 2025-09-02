"""
Audit logging functionality for platform administration.
"""
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from models.platform_admin import PlatformAuditLog
from models.user import User
from core.logging import logger


async def audit_action(
    db: AsyncSession,
    admin_user: User,
    action: str,
    entity_type: str,
    entity_id: Optional[UUID] = None,
    changes: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    target_org_id: Optional[UUID] = None,
    target_user_id: Optional[UUID] = None,
    request: Optional[Request] = None,
) -> PlatformAuditLog:
    """
    Create an audit log entry for administrative actions.

    Args:
        db: Database session
        admin_user: User performing the action
        action: Action identifier (e.g., 'org.create', 'user.suspend')
        entity_type: Type of entity being acted upon
        entity_id: ID of the entity
        changes: Before/after values or changes made
        metadata: Additional context
        target_org_id: Organization affected by the action
        target_user_id: User affected by the action
        request: FastAPI request object for IP/user agent

    Returns:
        Created audit log entry
    """
    try:
        # Extract request metadata
        ip_address = None
        user_agent = None

        if request:
            # Get IP address (handle proxies)
            forwarded_for = request.headers.get("X-Forwarded-For")
            if forwarded_for:
                ip_address = forwarded_for.split(",")[0].strip()
            else:
                ip_address = request.client.host if request.client else None

            # Get user agent
            user_agent = request.headers.get("User-Agent")

        # Create audit log entry
        audit_log = PlatformAuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            admin_user_id=admin_user.id,
            admin_user_email=admin_user.email,
            target_org_id=target_org_id,
            target_user_id=target_user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            changes=changes,
            metadata=metadata,
            timestamp=datetime.utcnow(),
        )

        db.add(audit_log)
        await db.commit()
        await db.refresh(audit_log)

        logger.info(
            f"Audit log created: {action} by {admin_user.email} on {entity_type}",
            extra={
                "audit_id": str(audit_log.id),
                "action": action,
                "admin_user": admin_user.email,
                "entity_type": entity_type,
                "entity_id": str(entity_id) if entity_id else None,
            },
        )

        return audit_log

    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
        # Don't fail the main operation if audit logging fails
        await db.rollback()
        raise


# Audit action types
class AuditActions:
    """Standard audit action identifiers."""

    # Organization actions
    ORG_CREATE = "organization.create"
    ORG_UPDATE = "organization.update"
    ORG_DELETE = "organization.delete"
    ORG_SUSPEND = "organization.suspend"
    ORG_ACTIVATE = "organization.activate"

    # User actions
    USER_CREATE = "user.create"
    USER_UPDATE = "user.update"
    USER_DELETE = "user.delete"
    USER_SUSPEND = "user.suspend"
    USER_ACTIVATE = "user.activate"
    USER_ROLE_CHANGE = "user.role_change"

    # Feature flag actions
    FEATURE_CREATE = "feature_flag.create"
    FEATURE_UPDATE = "feature_flag.update"
    FEATURE_DELETE = "feature_flag.delete"
    FEATURE_TOGGLE = "feature_flag.toggle"

    # System actions
    SYSTEM_CONFIG_UPDATE = "system.config_update"
    SYSTEM_MAINTENANCE = "system.maintenance"

    # Data actions
    DATA_EXPORT = "data.export"
    DATA_IMPORT = "data.import"
    DATA_PURGE = "data.purge"


# Audit helper functions
async def audit_org_action(
    db: AsyncSession,
    admin_user: User,
    action: str,
    org_id: UUID,
    changes: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
):
    """Convenience function for organization audit logs."""
    return await audit_action(
        db=db,
        admin_user=admin_user,
        action=action,
        entity_type="organization",
        entity_id=org_id,
        changes=changes,
        target_org_id=org_id,
        request=request,
    )


async def audit_user_action(
    db: AsyncSession,
    admin_user: User,
    action: str,
    user_id: UUID,
    org_id: UUID,
    changes: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
):
    """Convenience function for user audit logs."""
    return await audit_action(
        db=db,
        admin_user=admin_user,
        action=action,
        entity_type="user",
        entity_id=user_id,
        changes=changes,
        target_org_id=org_id,
        target_user_id=user_id,
        request=request,
    )
