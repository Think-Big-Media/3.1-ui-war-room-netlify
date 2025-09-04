"""
Automation Engine Service
Handles workflow execution, triggers, and event processing.
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union, Callable
from enum import Enum

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from core.database import get_db
from models.automation import (
    AutomationWorkflow,
    WorkflowExecution,
    CrisisAlert,
    NotificationDelivery,
    TriggerType,
    ActionType,
    ExecutionStatus,
    WorkflowStatus,
)
from .checkpoint_service import checkpoint_service, CheckpointType

logger = logging.getLogger(__name__)


class TriggerCondition:
    """Represents a single trigger condition."""

    def __init__(self, field: str, operator: str, value: Any):
        self.field = field
        self.operator = operator
        self.value = value

    def evaluate(self, data: Dict[str, Any]) -> bool:
        """Evaluate condition against provided data."""
        try:
            field_value = self._get_nested_value(data, self.field)

            if self.operator == "equals":
                return field_value == self.value
            elif self.operator == "not_equals":
                return field_value != self.value
            elif self.operator == "greater_than":
                return float(field_value) > float(self.value)
            elif self.operator == "less_than":
                return float(field_value) < float(self.value)
            elif self.operator == "contains":
                return str(self.value).lower() in str(field_value).lower()
            elif self.operator == "not_contains":
                return str(self.value).lower() not in str(field_value).lower()
            elif self.operator == "in":
                return field_value in self.value
            elif self.operator == "not_in":
                return field_value not in self.value
            elif self.operator == "exists":
                return field_value is not None
            elif self.operator == "not_exists":
                return field_value is None
            else:
                logger.warning(f"Unknown operator: {self.operator}")
                return False

        except Exception as e:
            logger.error(f"Error evaluating condition: {e}")
            return False

    def _get_nested_value(self, data: Dict[str, Any], field: str) -> Any:
        """Get nested field value using dot notation."""
        keys = field.split(".")
        value = data

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None

        return value


class AutomationEngine:
    """Core automation engine for handling workflows and triggers."""

    def __init__(self, db: Session):
        self.db = db
        self.running_executions: Dict[str, asyncio.Task] = {}
        self.trigger_handlers: Dict[TriggerType, Callable] = {
            TriggerType.SCHEDULE: self._handle_schedule_trigger,
            TriggerType.EVENT: self._handle_event_trigger,
            TriggerType.EXTERNAL: self._handle_external_trigger,
            TriggerType.THRESHOLD: self._handle_threshold_trigger,
            TriggerType.USER_ACTION: self._handle_user_action_trigger,
            TriggerType.CRISIS: self._handle_crisis_trigger,
        }
        self.action_handlers: Dict[ActionType, Callable] = {
            ActionType.SEND_EMAIL: self._send_email,
            ActionType.SEND_SMS: self._send_sms,
            ActionType.SEND_WHATSAPP: self._send_whatsapp,
            ActionType.BROWSER_NOTIFICATION: self._send_browser_notification,
            ActionType.SLACK_MESSAGE: self._send_slack_message,
            ActionType.CREATE_TASK: self._create_task,
            ActionType.UPDATE_CONTACT: self._update_contact,
            ActionType.ADD_TAG: self._add_tag,
            ActionType.WEBHOOK: self._send_webhook,
            ActionType.CRISIS_ALERT: self._create_crisis_alert,
        }

    async def process_trigger(
        self,
        trigger_type: TriggerType,
        trigger_data: Dict[str, Any],
        organization_id: str,
    ) -> List[str]:
        """
        Process a trigger and execute matching workflows.
        Returns list of execution IDs.
        """
        logger.info(f"Processing {trigger_type} trigger for org {organization_id}")

        # Find workflows that match this trigger
        workflows = self._get_matching_workflows(trigger_type, organization_id)
        execution_ids = []

        for workflow in workflows:
            if not workflow.can_execute():
                continue

            # Check if conditions are met
            if self._evaluate_conditions(workflow.conditions, trigger_data):
                execution_id = await self._execute_workflow(workflow, trigger_data)
                if execution_id:
                    execution_ids.append(execution_id)

        return execution_ids

    def _get_matching_workflows(
        self, trigger_type: TriggerType, organization_id: str
    ) -> List[AutomationWorkflow]:
        """Get workflows that match the trigger type and organization."""
        return (
            self.db.query(AutomationWorkflow)
            .filter(
                and_(
                    AutomationWorkflow.organization_id == organization_id,
                    AutomationWorkflow.trigger_type == trigger_type,
                    AutomationWorkflow.is_active == True,
                    AutomationWorkflow.status == WorkflowStatus.ACTIVE,
                )
            )
            .all()
        )

    def _evaluate_conditions(
        self, conditions: List[Dict[str, Any]], trigger_data: Dict[str, Any]
    ) -> bool:
        """Evaluate workflow conditions against trigger data."""
        if not conditions:
            return True  # No conditions = always execute

        for condition_group in conditions:
            # Handle AND/OR logic
            if "operator" in condition_group:
                if condition_group["operator"] == "AND":
                    if not all(
                        TriggerCondition(**cond).evaluate(trigger_data)
                        for cond in condition_group["conditions"]
                    ):
                        return False
                elif condition_group["operator"] == "OR":
                    if not any(
                        TriggerCondition(**cond).evaluate(trigger_data)
                        for cond in condition_group["conditions"]
                    ):
                        return False
            else:
                # Single condition
                if not TriggerCondition(**condition_group).evaluate(trigger_data):
                    return False

        return True

    async def _execute_workflow(
        self, workflow: AutomationWorkflow, trigger_data: Dict[str, Any]
    ) -> Optional[str]:
        """Execute a workflow and return execution ID."""
        # Create execution record
        execution = WorkflowExecution(
            workflow_id=workflow.id,
            organization_id=workflow.organization_id,
            trigger_data=trigger_data,
            trigger_source=trigger_data.get("source", "unknown"),
            steps_total=len(workflow.actions),
        )

        self.db.add(execution)
        self.db.commit()
        self.db.refresh(execution)

        # Start execution as background task
        task = asyncio.create_task(self._run_workflow_execution(execution.id))
        self.running_executions[execution.id] = task

        return execution.id

    async def _run_workflow_execution(self, execution_id: str) -> None:
        """Run workflow execution steps."""
        execution = (
            self.db.query(WorkflowExecution)
            .filter(WorkflowExecution.id == execution_id)
            .first()
        )

        if not execution:
            logger.error(f"Execution {execution_id} not found")
            return

        workflow = execution.workflow
        start_time = datetime.utcnow()

        try:
            # Update status to running
            execution.execution_status = ExecutionStatus.RUNNING
            execution.add_log_entry("info", "Workflow execution started")
            self.db.commit()

            # Check for existing checkpoint to resume from
            last_checkpoint = None
            checkpoints = await checkpoint_service.workflow_checkpoint.list_checkpoints(
                execution_id
            )
            if checkpoints:
                last_checkpoint = checkpoints[0]
                checkpoint_data = (
                    await checkpoint_service.workflow_checkpoint.restore_checkpoint(
                        last_checkpoint["checkpoint_id"]
                    )
                )
                start_index = (
                    checkpoint_data["state"].get("last_completed_step", -1) + 1
                )
                execution.add_log_entry(
                    "info", f"Resuming from checkpoint at step {start_index}"
                )
            else:
                start_index = 0

            # Execute each action
            for i, action in enumerate(
                workflow.actions[start_index:], start=start_index
            ):
                execution.current_step = (
                    f"Action {i + 1}: {action.get('type', 'unknown')}"
                )
                execution.add_log_entry("info", f"Executing action: {action}")

                try:
                    await self._execute_action(action, execution)
                    execution.steps_completed = i + 1
                    execution.actions_executed += 1

                    # Create checkpoint after successful action
                    checkpoint_state = {
                        "last_completed_step": i,
                        "execution_state": execution.execution_metadata,
                        "workflow_id": workflow.id,
                        "actions_executed": execution.actions_executed,
                    }

                    await checkpoint_service.create_checkpoint(
                        checkpoint_type=CheckpointType.WORKFLOW,
                        execution_id=execution_id,
                        step_id=f"step_{i}",
                        state=checkpoint_state,
                        metadata={"action_type": action.get("type", "unknown")},
                    )

                except Exception as action_error:
                    execution.add_log_entry(
                        "error", f"Action failed: {str(action_error)}"
                    )
                    logger.error(
                        f"Action failed in execution {execution_id}: {action_error}"
                    )
                    # Continue with next action unless it's critical
                    if action.get("critical", False):
                        raise action_error

                self.db.commit()

            # Mark as completed
            execution.execution_status = ExecutionStatus.COMPLETED
            execution.success = True
            execution.completed_at = datetime.utcnow()
            execution.duration_ms = int(
                (execution.completed_at - start_time).total_seconds() * 1000
            )
            execution.add_log_entry("info", "Workflow execution completed successfully")

            # Update workflow stats
            workflow.execution_count += 1
            workflow.success_count += 1
            workflow.last_executed_at = execution.completed_at

            # Update average execution time
            if workflow.avg_execution_time_ms:
                workflow.avg_execution_time_ms = (
                    workflow.avg_execution_time_ms + execution.duration_ms
                ) / 2
            else:
                workflow.avg_execution_time_ms = execution.duration_ms

        except Exception as e:
            # Mark as failed
            execution.execution_status = ExecutionStatus.FAILED
            execution.success = False
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            execution.duration_ms = int(
                (execution.completed_at - start_time).total_seconds() * 1000
            )
            execution.add_log_entry("error", f"Workflow execution failed: {str(e)}")

            # Update workflow stats
            workflow.execution_count += 1
            workflow.failure_count += 1
            workflow.last_executed_at = execution.completed_at

            logger.error(f"Workflow execution {execution_id} failed: {e}")

        finally:
            self.db.commit()
            # Remove from running executions
            if execution_id in self.running_executions:
                del self.running_executions[execution_id]

    async def _execute_action(
        self, action: Dict[str, Any], execution: WorkflowExecution
    ) -> None:
        """Execute a single workflow action."""
        action_type = ActionType(action["type"])

        if action_type in self.action_handlers:
            await self.action_handlers[action_type](action, execution)
        else:
            raise ValueError(f"Unknown action type: {action_type}")

    # Trigger Handlers
    async def _handle_schedule_trigger(self, trigger_data: Dict[str, Any]) -> None:
        """Handle scheduled triggers (cron, intervals)."""
        # This would be called by a scheduler service
        pass

    async def _handle_event_trigger(self, trigger_data: Dict[str, Any]) -> None:
        """Handle platform events (donations, volunteer signups)."""
        await self.process_trigger(
            TriggerType.EVENT, trigger_data, trigger_data["organization_id"]
        )

    async def _handle_external_trigger(self, trigger_data: Dict[str, Any]) -> None:
        """Handle external API events (webhooks, API calls)."""
        await self.process_trigger(
            TriggerType.EXTERNAL, trigger_data, trigger_data["organization_id"]
        )

    async def _handle_threshold_trigger(self, trigger_data: Dict[str, Any]) -> None:
        """Handle metric threshold triggers."""
        await self.process_trigger(
            TriggerType.THRESHOLD, trigger_data, trigger_data["organization_id"]
        )

    async def _handle_user_action_trigger(self, trigger_data: Dict[str, Any]) -> None:
        """Handle user interaction triggers."""
        await self.process_trigger(
            TriggerType.USER_ACTION, trigger_data, trigger_data["organization_id"]
        )

    async def _handle_crisis_trigger(self, trigger_data: Dict[str, Any]) -> None:
        """Handle crisis detection triggers from Mentionlytics."""
        await self.process_trigger(
            TriggerType.CRISIS, trigger_data, trigger_data["organization_id"]
        )

    # Action Handlers (placeholders for now)
    async def _send_email(
        self, action: Dict[str, Any], execution: WorkflowExecution
    ) -> None:
        """Send email notification."""
        # TODO: Implement email sending
        execution.notifications_sent += 1
        execution.add_log_entry("info", f"Email sent to {action.get('recipient')}")

    async def _send_sms(
        self, action: Dict[str, Any], execution: WorkflowExecution
    ) -> None:
        """Send SMS notification."""
        # TODO: Implement SMS sending
        execution.notifications_sent += 1
        execution.add_log_entry("info", f"SMS sent to {action.get('recipient')}")

    async def _send_whatsapp(
        self, action: Dict[str, Any], execution: WorkflowExecution
    ) -> None:
        """Send WhatsApp notification."""
        # TODO: Implement WhatsApp sending
        execution.notifications_sent += 1
        execution.add_log_entry("info", f"WhatsApp sent to {action.get('recipient')}")

    async def _send_browser_notification(
        self, action: Dict[str, Any], execution: WorkflowExecution
    ) -> None:
        """Send browser push notification."""
        # TODO: Implement browser notifications
        execution.notifications_sent += 1
        execution.add_log_entry(
            "info", f"Browser notification sent to {action.get('recipient')}"
        )

    async def _send_slack_message(
        self, action: Dict[str, Any], execution: WorkflowExecution
    ) -> None:
        """Send Slack message."""
        # TODO: Implement Slack integration
        execution.notifications_sent += 1
        execution.add_log_entry(
            "info", f"Slack message sent to {action.get('channel')}"
        )

    async def _create_task(
        self, action: Dict[str, Any], execution: WorkflowExecution
    ) -> None:
        """Create a task in the system."""
        # TODO: Implement task creation
        execution.add_log_entry("info", f"Task created: {action.get('title')}")

    async def _update_contact(
        self, action: Dict[str, Any], execution: WorkflowExecution
    ) -> None:
        """Update contact information."""
        # TODO: Implement contact updates
        execution.add_log_entry("info", f"Contact updated: {action.get('contact_id')}")

    async def _add_tag(
        self, action: Dict[str, Any], execution: WorkflowExecution
    ) -> None:
        """Add tag to contact or entity."""
        # TODO: Implement tag addition
        execution.add_log_entry("info", f"Tag added: {action.get('tag')}")

    async def _send_webhook(
        self, action: Dict[str, Any], execution: WorkflowExecution
    ) -> None:
        """Send webhook request."""
        # TODO: Implement webhook sending
        execution.api_calls_made += 1
        execution.add_log_entry("info", f"Webhook sent to {action.get('url')}")

    async def _create_crisis_alert(
        self, action: Dict[str, Any], execution: WorkflowExecution
    ) -> None:
        """Create crisis alert."""
        alert = CrisisAlert(
            organization_id=execution.organization_id,
            alert_type=action.get("alert_type", "automated"),
            severity=action.get("severity", "medium"),
            title=action.get("title", "Automated Crisis Alert"),
            description=action.get("description", ""),
            source="automation_workflow",
            content=action.get("content", ""),
            workflow_triggered=True,
            workflow_ids=[execution.workflow_id],
        )

        self.db.add(alert)
        execution.add_log_entry("info", f"Crisis alert created: {alert.title}")

    def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of workflow execution."""
        execution = (
            self.db.query(WorkflowExecution)
            .filter(WorkflowExecution.id == execution_id)
            .first()
        )

        if not execution:
            return None

        return execution.to_dict()

    def cancel_execution(self, execution_id: str) -> bool:
        """Cancel a running workflow execution."""
        if execution_id in self.running_executions:
            task = self.running_executions[execution_id]
            task.cancel()

            # Update execution record
            execution = (
                self.db.query(WorkflowExecution)
                .filter(WorkflowExecution.id == execution_id)
                .first()
            )

            if execution:
                execution.execution_status = ExecutionStatus.FAILED
                execution.error_message = "Execution cancelled by user"
                execution.completed_at = datetime.utcnow()
                execution.add_log_entry("warning", "Execution cancelled")
                self.db.commit()

            del self.running_executions[execution_id]
            return True

        return False
