"""
Real-time automation monitoring and analytics service.

This service provides real-time monitoring of automation workflows,
execution metrics, and performance analytics.
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, AsyncGenerator
from dataclasses import dataclass
from collections import defaultdict, deque

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload

from models.automation import (
    AutomationWorkflow,
    WorkflowExecution,
    CrisisAlert,
    NotificationDelivery,
    ExecutionStatus,
    AlertSeverity,
)
from core.websocket import websocket_manager
from core.database import get_db


@dataclass
class MonitoringMetrics:
    """Container for automation monitoring metrics."""

    total_workflows: int
    active_workflows: int
    executions_today: int
    success_rate: float
    avg_execution_time: float
    alerts_pending: int
    notifications_sent: int
    performance_score: float


@dataclass
class WorkflowPerformance:
    """Performance metrics for a specific workflow."""

    workflow_id: str
    name: str
    executions_last_24h: int
    success_rate: float
    avg_execution_time: float
    last_execution: Optional[datetime]
    error_rate: float
    performance_trend: str  # 'improving', 'stable', 'degrading'


@dataclass
class SystemHealth:
    """Overall system health metrics."""

    status: str  # 'healthy', 'warning', 'critical'
    cpu_usage: float
    memory_usage: float
    db_connections: int
    queue_size: int
    errors_last_hour: int
    response_time_avg: float


class AutomationMonitor:
    """Real-time automation monitoring service."""

    def __init__(self):
        self.metrics_cache: Dict[str, Any] = {}
        self.real_time_events: deque = deque(maxlen=1000)
        self.performance_history: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=24)
        )
        self.alert_thresholds = {
            "error_rate": 0.10,  # 10%
            "execution_time": 30000,  # 30 seconds
            "queue_size": 100,
            "response_time": 5000,  # 5 seconds
        }
        self._monitoring_active = False

    async def start_monitoring(self) -> None:
        """Start real-time monitoring with background tasks."""
        self._monitoring_active = True

        # Start monitoring tasks
        asyncio.create_task(self._collect_metrics_loop())
        asyncio.create_task(self._check_system_health_loop())
        asyncio.create_task(self._broadcast_metrics_loop())

    async def stop_monitoring(self) -> None:
        """Stop real-time monitoring."""
        self._monitoring_active = False

    async def _collect_metrics_loop(self) -> None:
        """Background task to collect metrics every minute."""
        while self._monitoring_active:
            try:
                async for db in get_db():
                    metrics = await self.collect_current_metrics(db, "system")
                    self.metrics_cache["current"] = metrics

                    # Store historical data
                    now = datetime.utcnow()
                    hour_key = now.strftime("%Y-%m-%d-%H")
                    self.performance_history[hour_key].append(
                        {"timestamp": now, "metrics": metrics}
                    )

                    break

            except Exception as e:
                print(f"Error collecting metrics: {e}")

            await asyncio.sleep(60)  # Collect every minute

    async def _check_system_health_loop(self) -> None:
        """Background task to check system health every 30 seconds."""
        while self._monitoring_active:
            try:
                async for db in get_db():
                    health = await self.get_system_health(db)

                    # Check for alerts
                    if health.status == "critical":
                        await self._send_system_alert(health)

                    self.metrics_cache["health"] = health
                    break

            except Exception as e:
                print(f"Error checking system health: {e}")

            await asyncio.sleep(30)  # Check every 30 seconds

    async def _broadcast_metrics_loop(self) -> None:
        """Background task to broadcast metrics via WebSocket every 10 seconds."""
        while self._monitoring_active:
            try:
                if "current" in self.metrics_cache:
                    await websocket_manager.broadcast_to_group(
                        "automation_monitoring",
                        {
                            "type": "metrics_update",
                            "data": {
                                "metrics": self.metrics_cache["current"].__dict__,
                                "health": self.metrics_cache.get("health", {}),
                            },
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                    )

            except Exception as e:
                print(f"Error broadcasting metrics: {e}")

            await asyncio.sleep(10)  # Broadcast every 10 seconds

    async def collect_current_metrics(
        self, db: AsyncSession, organization_id: str
    ) -> MonitoringMetrics:
        """Collect current automation metrics for an organization."""
        # Get workflow counts
        workflow_query = select(func.count(AutomationWorkflow.id)).where(
            AutomationWorkflow.organization_id == organization_id
        )
        total_workflows = (await db.execute(workflow_query)).scalar() or 0

        active_workflow_query = workflow_query.where(
            AutomationWorkflow.is_active == True
        )
        active_workflows = (await db.execute(active_workflow_query)).scalar() or 0

        # Get today's executions
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        executions_query = select(func.count(WorkflowExecution.id)).where(
            and_(
                WorkflowExecution.organization_id == organization_id,
                WorkflowExecution.started_at >= today,
            )
        )
        executions_today = (await db.execute(executions_query)).scalar() or 0

        # Calculate success rate
        success_query = executions_query.where(
            WorkflowExecution.execution_status == ExecutionStatus.COMPLETED
        )
        successful_executions = (await db.execute(success_query)).scalar() or 0
        success_rate = (
            successful_executions / executions_today if executions_today > 0 else 1.0
        )

        # Average execution time
        avg_time_query = select(func.avg(WorkflowExecution.duration_ms)).where(
            and_(
                WorkflowExecution.organization_id == organization_id,
                WorkflowExecution.started_at >= today,
                WorkflowExecution.duration_ms.isnot(None),
            )
        )
        avg_execution_time = (await db.execute(avg_time_query)).scalar() or 0.0

        # Pending alerts
        alerts_query = select(func.count(CrisisAlert.id)).where(
            and_(
                CrisisAlert.organization_id == organization_id,
                CrisisAlert.is_resolved == False,
            )
        )
        alerts_pending = (await db.execute(alerts_query)).scalar() or 0

        # Notifications sent today
        notifications_query = select(func.count(NotificationDelivery.id)).where(
            and_(
                NotificationDelivery.organization_id == organization_id,
                NotificationDelivery.created_at >= today,
                NotificationDelivery.status == "delivered",
            )
        )
        notifications_sent = (await db.execute(notifications_query)).scalar() or 0

        # Calculate performance score (0-100)
        performance_score = self._calculate_performance_score(
            success_rate, avg_execution_time, alerts_pending
        )

        return MonitoringMetrics(
            total_workflows=total_workflows,
            active_workflows=active_workflows,
            executions_today=executions_today,
            success_rate=success_rate,
            avg_execution_time=avg_execution_time,
            alerts_pending=alerts_pending,
            notifications_sent=notifications_sent,
            performance_score=performance_score,
        )

    async def get_workflow_performance(
        self, db: AsyncSession, organization_id: str, limit: int = 10
    ) -> List[WorkflowPerformance]:
        """Get performance metrics for top workflows."""
        # Get workflows with recent activity
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)

        workflow_query = (
            select(AutomationWorkflow)
            .where(AutomationWorkflow.organization_id == organization_id)
            .options(selectinload(AutomationWorkflow.executions))
            .limit(limit)
        )

        workflows = (await db.execute(workflow_query)).scalars().all()

        performance_list = []

        for workflow in workflows:
            # Get executions from last 24 hours
            recent_executions = [
                exec
                for exec in workflow.executions
                if exec.started_at and exec.started_at >= twenty_four_hours_ago
            ]

            executions_count = len(recent_executions)

            if executions_count > 0:
                successful = sum(
                    1
                    for exec in recent_executions
                    if exec.execution_status == ExecutionStatus.COMPLETED
                )
                success_rate = successful / executions_count

                # Calculate average execution time
                durations = [
                    exec.duration_ms
                    for exec in recent_executions
                    if exec.duration_ms is not None
                ]
                avg_time = sum(durations) / len(durations) if durations else 0.0

                # Error rate
                errors = sum(
                    1
                    for exec in recent_executions
                    if exec.execution_status == ExecutionStatus.FAILED
                )
                error_rate = errors / executions_count

                # Determine performance trend
                trend = self._calculate_performance_trend(workflow.id, success_rate)

                last_execution = max(
                    (exec.started_at for exec in recent_executions), default=None
                )
            else:
                success_rate = 1.0
                avg_time = 0.0
                error_rate = 0.0
                trend = "stable"
                last_execution = None

            performance_list.append(
                WorkflowPerformance(
                    workflow_id=workflow.id,
                    name=workflow.name,
                    executions_last_24h=executions_count,
                    success_rate=success_rate,
                    avg_execution_time=avg_time,
                    last_execution=last_execution,
                    error_rate=error_rate,
                    performance_trend=trend,
                )
            )

        return sorted(
            performance_list, key=lambda x: x.executions_last_24h, reverse=True
        )

    async def get_system_health(self, db: AsyncSession) -> SystemHealth:
        """Get overall system health metrics."""
        # Get recent error count
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        error_query = select(func.count(WorkflowExecution.id)).where(
            and_(
                WorkflowExecution.started_at >= one_hour_ago,
                WorkflowExecution.execution_status == ExecutionStatus.FAILED,
            )
        )
        errors_last_hour = (await db.execute(error_query)).scalar() or 0

        # Calculate average response time (from recent executions)
        avg_response_query = select(func.avg(WorkflowExecution.duration_ms)).where(
            WorkflowExecution.started_at >= one_hour_ago
        )
        response_time_avg = (await db.execute(avg_response_query)).scalar() or 0.0

        # Mock system metrics (in production, these would come from actual monitoring)
        cpu_usage = 45.0  # Would come from system monitoring
        memory_usage = 62.0  # Would come from system monitoring
        db_connections = 12  # Would come from database monitoring
        queue_size = 5  # Would come from job queue monitoring

        # Determine overall status
        status = "healthy"
        if (
            errors_last_hour > 10
            or response_time_avg > self.alert_thresholds["response_time"]
            or cpu_usage > 90
            or memory_usage > 90
        ):
            status = "critical"
        elif (
            errors_last_hour > 5
            or response_time_avg > self.alert_thresholds["response_time"] * 0.8
            or cpu_usage > 70
            or memory_usage > 70
        ):
            status = "warning"

        return SystemHealth(
            status=status,
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            db_connections=db_connections,
            queue_size=queue_size,
            errors_last_hour=errors_last_hour,
            response_time_avg=response_time_avg,
        )

    async def get_real_time_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent real-time events."""
        return list(self.real_time_events)[-limit:]

    async def log_execution_event(
        self, execution: WorkflowExecution, event_type: str
    ) -> None:
        """Log a workflow execution event for real-time monitoring."""
        event = {
            "id": execution.id,
            "workflow_id": execution.workflow_id,
            "organization_id": execution.organization_id,
            "event_type": event_type,  # 'started', 'completed', 'failed'
            "status": execution.execution_status.value,
            "timestamp": datetime.utcnow().isoformat(),
            "duration": execution.duration_ms,
        }

        self.real_time_events.append(event)

        # Broadcast to WebSocket subscribers
        await websocket_manager.broadcast_to_group(
            f"automation_monitoring_{execution.organization_id}",
            {"type": "execution_event", "data": event},
        )

    def _calculate_performance_score(
        self, success_rate: float, avg_execution_time: float, alerts_pending: int
    ) -> float:
        """Calculate overall performance score (0-100)."""
        # Base score from success rate (0-40 points)
        success_score = success_rate * 40

        # Execution time score (0-30 points)
        # Penalty for executions over 10 seconds
        time_penalty = min(avg_execution_time / 10000 * 10, 30)  # Max 30 point penalty
        time_score = max(0, 30 - time_penalty)

        # Alert score (0-30 points)
        # Penalty for pending alerts
        alert_penalty = min(alerts_pending * 5, 30)  # 5 points per alert, max 30
        alert_score = max(0, 30 - alert_penalty)

        return min(100, success_score + time_score + alert_score)

    def _calculate_performance_trend(
        self, workflow_id: str, current_success_rate: float
    ) -> str:
        """Calculate performance trend based on historical data."""
        # This is a simplified version - in production, you'd analyze historical data
        if current_success_rate >= 0.95:
            return "improving"
        elif current_success_rate >= 0.80:
            return "stable"
        else:
            return "degrading"

    async def _send_system_alert(self, health: SystemHealth) -> None:
        """Send system alert when critical issues detected."""
        alert_message = f"System health critical: {health.status}. "

        if health.cpu_usage > 90:
            alert_message += f"High CPU usage: {health.cpu_usage}%. "
        if health.memory_usage > 90:
            alert_message += f"High memory usage: {health.memory_usage}%. "
        if health.errors_last_hour > 10:
            alert_message += (
                f"High error rate: {health.errors_last_hour} errors in last hour. "
            )

        # In production, this would send actual alerts (email, Slack, etc.)
        print(f"SYSTEM ALERT: {alert_message}")

        # Broadcast alert to WebSocket subscribers
        await websocket_manager.broadcast_to_group(
            "system_alerts",
            {
                "type": "system_alert",
                "severity": "critical",
                "message": alert_message,
                "data": health.__dict__,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )


# Global monitoring instance
automation_monitor = AutomationMonitor()
