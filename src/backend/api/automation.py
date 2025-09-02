"""
Automation API endpoints for workflow management and crisis monitoring.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from ..core.database import get_db
from ..core.auth import get_current_user, get_current_organization
from ..models.automation import (
    AutomationWorkflow,
    WorkflowExecution,
    CrisisAlert,
    NotificationDelivery,
    TriggerType,
    ActionType,
    WorkflowStatus,
    ExecutionStatus,
)
from ..services.automation_engine import AutomationEngine
from ..services.crisis_detector import CrisisDetector
from ..services.notification_service import NotificationService, NotificationChannel
from pydantic import BaseModel

router = APIRouter(prefix="/automation", tags=["automation"])


# Pydantic models for API
class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_type: TriggerType
    trigger_config: Dict[str, Any] = {}
    conditions: List[Dict[str, Any]] = []
    actions: List[Dict[str, Any]] = []
    priority: int = 5
    schedule_config: Dict[str, Any] = {}
    max_executions_per_hour: int = 100
    max_executions_per_day: int = 1000


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    actions: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None
    status: Optional[WorkflowStatus] = None
    priority: Optional[int] = None
    schedule_config: Optional[Dict[str, Any]] = None


class TriggerEvent(BaseModel):
    trigger_type: TriggerType
    trigger_data: Dict[str, Any]


class NotificationRequest(BaseModel):
    channel: NotificationChannel
    recipient: str
    subject: str
    content: str
    priority: str = "medium"
    template_data: Optional[Dict[str, Any]] = None


# Workflow Management Endpoints
@router.post("/workflows", response_model=Dict[str, Any])
async def create_workflow(
    workflow: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    organization=Depends(get_current_organization),
):
    """Create a new automation workflow."""
    db_workflow = AutomationWorkflow(
        organization_id=organization.id,
        created_by=current_user.id,
        name=workflow.name,
        description=workflow.description,
        trigger_type=workflow.trigger_type,
        trigger_config=workflow.trigger_config,
        conditions=workflow.conditions,
        actions=workflow.actions,
        priority=workflow.priority,
        schedule_config=workflow.schedule_config,
        max_executions_per_hour=workflow.max_executions_per_hour,
        max_executions_per_day=workflow.max_executions_per_day,
    )

    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)

    return db_workflow.to_dict()


@router.get("/workflows", response_model=List[Dict[str, Any]])
async def list_workflows(
    status: Optional[WorkflowStatus] = None,
    trigger_type: Optional[TriggerType] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """List organization workflows with optional filtering."""
    query = db.query(AutomationWorkflow).filter(
        AutomationWorkflow.organization_id == organization.id
    )

    if status:
        query = query.filter(AutomationWorkflow.status == status)

    if trigger_type:
        query = query.filter(AutomationWorkflow.trigger_type == trigger_type)

    workflows = query.offset(offset).limit(limit).all()
    return [workflow.to_dict() for workflow in workflows]


@router.get("/workflows/{workflow_id}", response_model=Dict[str, Any])
async def get_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """Get workflow details."""
    workflow = (
        db.query(AutomationWorkflow)
        .filter(
            AutomationWorkflow.id == workflow_id,
            AutomationWorkflow.organization_id == organization.id,
        )
        .first()
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return workflow.to_dict()


@router.put("/workflows/{workflow_id}", response_model=Dict[str, Any])
async def update_workflow(
    workflow_id: str,
    workflow_update: WorkflowUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    organization=Depends(get_current_organization),
):
    """Update workflow configuration."""
    workflow = (
        db.query(AutomationWorkflow)
        .filter(
            AutomationWorkflow.id == workflow_id,
            AutomationWorkflow.organization_id == organization.id,
        )
        .first()
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Update fields
    update_data = workflow_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workflow, field, value)

    workflow.last_modified_by = current_user.id
    workflow.updated_at = datetime.utcnow()
    workflow.version += 1

    db.commit()
    db.refresh(workflow)

    return workflow.to_dict()


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """Delete workflow."""
    workflow = (
        db.query(AutomationWorkflow)
        .filter(
            AutomationWorkflow.id == workflow_id,
            AutomationWorkflow.organization_id == organization.id,
        )
        .first()
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    db.delete(workflow)
    db.commit()

    return {"message": "Workflow deleted successfully"}


# Workflow Execution Endpoints
@router.post("/workflows/{workflow_id}/execute", response_model=Dict[str, Any])
async def execute_workflow(
    workflow_id: str,
    trigger_data: Dict[str, Any] = {},
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """Manually execute a workflow."""
    workflow = (
        db.query(AutomationWorkflow)
        .filter(
            AutomationWorkflow.id == workflow_id,
            AutomationWorkflow.organization_id == organization.id,
        )
        .first()
    )

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if not workflow.can_execute():
        raise HTTPException(status_code=400, detail="Workflow cannot be executed")

    # Execute workflow
    automation_engine = AutomationEngine(db)
    execution_id = await automation_engine._execute_workflow(workflow, trigger_data)

    return {"execution_id": execution_id, "status": "started"}


@router.get("/executions", response_model=List[Dict[str, Any]])
async def list_executions(
    workflow_id: Optional[str] = None,
    status: Optional[ExecutionStatus] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """List workflow executions."""
    query = db.query(WorkflowExecution).filter(
        WorkflowExecution.organization_id == organization.id
    )

    if workflow_id:
        query = query.filter(WorkflowExecution.workflow_id == workflow_id)

    if status:
        query = query.filter(WorkflowExecution.execution_status == status)

    executions = (
        query.order_by(WorkflowExecution.started_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [execution.to_dict() for execution in executions]


@router.get("/executions/{execution_id}", response_model=Dict[str, Any])
async def get_execution(
    execution_id: str,
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """Get execution details."""
    execution = (
        db.query(WorkflowExecution)
        .filter(
            WorkflowExecution.id == execution_id,
            WorkflowExecution.organization_id == organization.id,
        )
        .first()
    )

    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    return execution.to_dict()


@router.post("/executions/{execution_id}/cancel")
async def cancel_execution(
    execution_id: str,
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """Cancel a running execution."""
    execution = (
        db.query(WorkflowExecution)
        .filter(
            WorkflowExecution.id == execution_id,
            WorkflowExecution.organization_id == organization.id,
        )
        .first()
    )

    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    automation_engine = AutomationEngine(db)
    cancelled = automation_engine.cancel_execution(execution_id)

    return {"cancelled": cancelled}


# Crisis Detection Endpoints
@router.get("/crisis-alerts", response_model=List[Dict[str, Any]])
async def list_crisis_alerts(
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    resolved: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """List crisis alerts."""
    query = db.query(CrisisAlert).filter(CrisisAlert.organization_id == organization.id)

    if severity:
        query = query.filter(CrisisAlert.severity == severity)

    if acknowledged is not None:
        query = query.filter(CrisisAlert.acknowledged == acknowledged)

    if resolved is not None:
        query = query.filter(CrisisAlert.is_resolved == resolved)

    alerts = (
        query.order_by(CrisisAlert.detected_at.desc()).offset(offset).limit(limit).all()
    )

    return [alert.to_dict() for alert in alerts]


@router.post("/crisis-alerts/{alert_id}/acknowledge")
async def acknowledge_crisis_alert(
    alert_id: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    organization=Depends(get_current_organization),
):
    """Acknowledge a crisis alert."""
    alert = (
        db.query(CrisisAlert)
        .filter(
            CrisisAlert.id == alert_id, CrisisAlert.organization_id == organization.id
        )
        .first()
    )

    if not alert:
        raise HTTPException(status_code=404, detail="Crisis alert not found")

    alert.acknowledged = True
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.utcnow()
    if notes:
        alert.response_notes = notes

    db.commit()

    return {"message": "Crisis alert acknowledged"}


@router.post("/crisis-alerts/{alert_id}/resolve")
async def resolve_crisis_alert(
    alert_id: str,
    resolution_notes: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    organization=Depends(get_current_organization),
):
    """Resolve a crisis alert."""
    alert = (
        db.query(CrisisAlert)
        .filter(
            CrisisAlert.id == alert_id, CrisisAlert.organization_id == organization.id
        )
        .first()
    )

    if not alert:
        raise HTTPException(status_code=404, detail="Crisis alert not found")

    alert.is_resolved = True
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.utcnow()
    alert.resolution_notes = resolution_notes

    db.commit()

    return {"message": "Crisis alert resolved"}


# Notification Endpoints
@router.post("/notifications/send", response_model=Dict[str, Any])
async def send_notification(
    notification: NotificationRequest,
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """Send a single notification."""
    # TODO: Load notification config from organization settings
    notification_config = {"email": {}, "twilio": {}, "firebase": {}, "slack": {}}

    notification_service = NotificationService(db, notification_config)

    delivery_id = await notification_service.send_notification(
        channel=notification.channel,
        recipient=notification.recipient,
        subject=notification.subject,
        content=notification.content,
        organization_id=organization.id,
        template_data=notification.template_data,
    )

    return {"delivery_id": delivery_id}


@router.get("/notifications/stats", response_model=Dict[str, Any])
async def get_notification_stats(
    days: int = 30,
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """Get notification delivery statistics."""
    # TODO: Load notification config
    notification_config = {}
    notification_service = NotificationService(db, notification_config)

    stats = notification_service.get_organization_delivery_stats(organization.id, days)

    return stats


# Trigger Processing Endpoint
@router.post("/triggers/process")
async def process_trigger(
    trigger: TriggerEvent,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """Process an automation trigger."""
    automation_engine = AutomationEngine(db)

    # Add organization_id to trigger data
    trigger.trigger_data["organization_id"] = organization.id

    execution_ids = await automation_engine.process_trigger(
        trigger.trigger_type, trigger.trigger_data, organization.id
    )

    return {
        "processed": True,
        "execution_ids": execution_ids,
        "triggered_workflows": len(execution_ids),
    }


# Testing Endpoints
@router.post("/test/crisis-detection")
async def test_crisis_detection(
    test_mention: Dict[str, Any],
    db: Session = Depends(get_db),
    organization=Depends(get_current_organization),
):
    """Test crisis detection with sample data."""
    # TODO: Load Mentionlytics API key from settings
    api_key = "test_key"

    async with CrisisDetector(api_key, db) as detector:
        result = await detector.test_crisis_detection(organization.id, test_mention)

    return result


@router.post("/test/notifications")
async def test_notifications(
    db: Session = Depends(get_db), organization=Depends(get_current_organization)
):
    """Test all notification channels."""
    # TODO: Load notification config from organization settings
    notification_config = {}
    notification_service = NotificationService(db, notification_config)

    results = await notification_service.test_notification_channels(organization.id)

    return results
