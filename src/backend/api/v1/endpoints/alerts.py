"""
Alert management endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime

from core.deps import get_current_user
from models.user import User
from services.alert_service import (
    alert_service,
    AlertSeverity,
    AlertType,
    Alert,
    AlertRule,
)

router = APIRouter()


@router.get("/alerts/active", response_model=List[Alert])
async def get_active_alerts(
    current_user: User = Depends(get_current_user),
) -> List[Alert]:
    """
    Get all active alerts.

    Returns:
        List of active alerts
    """
    if current_user.role not in ["admin", "platform_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can view alerts")

    return await alert_service.get_active_alerts()


@router.get("/alerts/history", response_model=List[Alert])
async def get_alert_history(
    hours: int = Query(24, ge=1, le=168, description="Hours of history"),
    severity: Optional[AlertSeverity] = None,
    type: Optional[AlertType] = None,
    current_user: User = Depends(get_current_user),
) -> List[Alert]:
    """
    Get alert history.

    Args:
        hours: Number of hours of history to retrieve (1-168)
        severity: Filter by severity
        type: Filter by alert type

    Returns:
        List of historical alerts
    """
    if current_user.role not in ["admin", "platform_admin"]:
        raise HTTPException(
            status_code=403, detail="Only admins can view alert history"
        )

    return await alert_service.get_alert_history(
        hours=hours, severity=severity, type=type
    )


@router.post("/alerts/{alert_key}/resolve")
async def resolve_alert(alert_key: str, current_user: User = Depends(get_current_user)):
    """
    Resolve an active alert.

    Args:
        alert_key: Key of the alert to resolve

    Returns:
        Success status
    """
    if current_user.role not in ["admin", "platform_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can resolve alerts")

    resolved = await alert_service.resolve_alert(alert_key)

    if not resolved:
        raise HTTPException(
            status_code=404, detail="Alert not found or already resolved"
        )

    return {"success": True, "message": f"Alert {alert_key} resolved"}


@router.post("/alerts/test")
async def test_alert(
    severity: AlertSeverity = AlertSeverity.WARNING,
    current_user: User = Depends(get_current_user),
):
    """
    Create a test alert for testing the alert system.

    Args:
        severity: Severity level for the test alert

    Returns:
        Created test alert
    """
    if current_user.role != "platform_admin":
        raise HTTPException(
            status_code=403, detail="Only platform admins can create test alerts"
        )

    alert = await alert_service.create_alert(
        type=AlertType.CUSTOM,
        severity=severity,
        title="Test Alert",
        message=f"This is a test alert with severity: {severity}",
        context={
            "triggered_by": current_user.email,
            "test": True,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    return {
        "success": True,
        "alert": alert,
        "message": "Test alert created successfully",
    }


@router.get("/alerts/rules", response_model=List[AlertRule])
async def get_alert_rules(
    current_user: User = Depends(get_current_user),
) -> List[AlertRule]:
    """
    Get configured alert rules.

    Returns:
        List of alert rules
    """
    if current_user.role != "platform_admin":
        raise HTTPException(
            status_code=403, detail="Only platform admins can view alert rules"
        )

    return alert_service.rules


@router.put("/alerts/rules/{rule_name}/toggle")
async def toggle_alert_rule(
    rule_name: str, enabled: bool, current_user: User = Depends(get_current_user)
):
    """
    Enable or disable an alert rule.

    Args:
        rule_name: Name of the rule to toggle
        enabled: Whether to enable or disable the rule

    Returns:
        Updated rule status
    """
    if current_user.role != "platform_admin":
        raise HTTPException(
            status_code=403, detail="Only platform admins can modify alert rules"
        )

    # Find and update rule
    rule_found = False
    for rule in alert_service.rules:
        if rule.name == rule_name:
            rule.enabled = enabled
            rule_found = True
            break

    if not rule_found:
        raise HTTPException(status_code=404, detail=f"Rule '{rule_name}' not found")

    return {
        "success": True,
        "rule_name": rule_name,
        "enabled": enabled,
        "message": f"Rule '{rule_name}' {'enabled' if enabled else 'disabled'}",
    }


@router.get("/alerts/summary")
async def get_alerts_summary(current_user: User = Depends(get_current_user)):
    """
    Get summary of alerts.

    Returns:
        Alert summary statistics
    """
    if current_user.role not in ["admin", "platform_admin"]:
        raise HTTPException(
            status_code=403, detail="Only admins can view alert summary"
        )

    active_alerts = await alert_service.get_active_alerts()
    history_24h = await alert_service.get_alert_history(hours=24)

    # Count by severity
    severity_counts = {"info": 0, "warning": 0, "error": 0, "critical": 0}

    for alert in active_alerts:
        severity_counts[alert.severity.value] += 1

    # Count by type
    type_counts = {}
    for alert in active_alerts:
        type_counts[alert.type.value] = type_counts.get(alert.type.value, 0) + 1

    return {
        "active_count": len(active_alerts),
        "last_24h_count": len(history_24h),
        "severity_breakdown": severity_counts,
        "type_breakdown": type_counts,
        "most_recent": active_alerts[0].dict() if active_alerts else None,
        "timestamp": datetime.utcnow().isoformat(),
    }
