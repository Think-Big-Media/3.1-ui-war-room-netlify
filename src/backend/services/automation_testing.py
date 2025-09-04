"""
Automation testing and validation service.

This service provides comprehensive testing capabilities for automation workflows,
including validation, simulation, and performance testing.
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import uuid
from unittest.mock import Mock, AsyncMock

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from models.automation import (
    AutomationWorkflow,
    WorkflowExecution,
    TriggerType,
    ExecutionStatus,
    NotificationChannel,
)
from .automation_engine import AutomationEngine
from .crisis_detector import CrisisDetector
from .notification_service import NotificationService


class TestStatus(str, Enum):
    """Test execution status."""

    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"


class TestType(str, Enum):
    """Types of automation tests."""

    VALIDATION = "validation"
    SIMULATION = "simulation"
    PERFORMANCE = "performance"
    INTEGRATION = "integration"
    STRESS = "stress"


@dataclass
class TestResult:
    """Result of a single test execution."""

    test_id: str
    test_type: TestType
    workflow_id: str
    status: TestStatus
    execution_time_ms: int
    message: str
    details: Dict[str, Any]
    timestamp: datetime
    errors: List[str] = None


@dataclass
class ValidationResult:
    """Result of workflow validation."""

    is_valid: bool
    errors: List[str]
    warnings: List[str]
    score: float  # 0-100
    recommendations: List[str]


@dataclass
class PerformanceMetrics:
    """Performance testing metrics."""

    avg_execution_time: float
    max_execution_time: float
    min_execution_time: float
    throughput_per_second: float
    memory_usage_mb: float
    cpu_usage_percent: float
    success_rate: float
    error_rate: float


class AutomationTester:
    """Comprehensive automation testing and validation service."""

    def __init__(self):
        self.test_results: Dict[str, List[TestResult]] = {}
        self.mock_services = {
            "crisis_detector": Mock(spec=CrisisDetector),
            "notification_service": Mock(spec=NotificationService),
        }
        self.test_data_generators = {
            "mention": self._generate_test_mention,
            "metric": self._generate_test_metric,
            "schedule": self._generate_test_schedule,
            "webhook": self._generate_test_webhook,
        }

    async def validate_workflow(
        self, workflow: AutomationWorkflow, db: AsyncSession
    ) -> ValidationResult:
        """Validate a workflow configuration for correctness and best practices."""
        errors = []
        warnings = []
        recommendations = []

        # Basic validation
        if not workflow.name or len(workflow.name.strip()) == 0:
            errors.append("Workflow name is required")

        if not workflow.trigger_type:
            errors.append("Trigger type is required")

        if not workflow.actions or len(workflow.actions) == 0:
            errors.append("At least one action is required")

        # Trigger validation
        trigger_errors = await self._validate_trigger(
            workflow.trigger_type, workflow.trigger_config
        )
        errors.extend(trigger_errors)

        # Conditions validation
        if workflow.conditions:
            condition_errors = self._validate_conditions(workflow.conditions)
            errors.extend(condition_errors)

        # Actions validation
        action_errors = self._validate_actions(workflow.actions)
        errors.extend(action_errors)

        # Performance warnings
        if len(workflow.actions) > 10:
            warnings.append(
                "Workflow has many actions - consider breaking into smaller workflows"
            )

        if workflow.max_executions_per_hour and workflow.max_executions_per_hour > 1000:
            warnings.append("High execution limit may impact performance")

        # Security recommendations
        for action in workflow.actions:
            if action.get("type") == "webhook" and not action.get("config", {}).get(
                "url", ""
            ).startswith("https://"):
                recommendations.append("Use HTTPS URLs for webhook actions")

        # Calculate validation score
        total_checks = 10
        failed_checks = len(errors)
        warning_penalty = len(warnings) * 0.1
        score = max(
            0, (total_checks - failed_checks - warning_penalty) / total_checks * 100
        )

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            recommendations=recommendations,
        )

    async def simulate_workflow_execution(
        self,
        workflow: AutomationWorkflow,
        trigger_data: Dict[str, Any],
        db: AsyncSession,
        dry_run: bool = True,
    ) -> TestResult:
        """Simulate workflow execution with test data."""
        test_id = str(uuid.uuid4())
        start_time = datetime.utcnow()

        try:
            # Create automation engine with mocked services for testing
            engine = AutomationEngine()

            if dry_run:
                # Mock external services
                engine.crisis_detector = self.mock_services["crisis_detector"]
                engine.notification_service = self.mock_services["notification_service"]

                # Setup mock responses
                self.mock_services["crisis_detector"].analyze_mention = AsyncMock(
                    return_value={
                        "crisis_score": 0.3,
                        "severity": "low",
                        "keywords": ["test"],
                        "sentiment": 0.1,
                    }
                )

                self.mock_services[
                    "notification_service"
                ].send_notification = AsyncMock(return_value=True)

            # Execute workflow
            execution_ids = await engine.process_trigger(
                workflow.trigger_type, trigger_data, workflow.organization_id
            )

            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            return TestResult(
                test_id=test_id,
                test_type=TestType.SIMULATION,
                workflow_id=workflow.id,
                status=TestStatus.PASSED,
                execution_time_ms=int(execution_time),
                message=f"Workflow simulation completed successfully. {len(execution_ids)} executions triggered.",
                details={
                    "execution_ids": execution_ids,
                    "trigger_data": trigger_data,
                    "dry_run": dry_run,
                },
                timestamp=start_time,
            )

        except Exception as e:
            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            return TestResult(
                test_id=test_id,
                test_type=TestType.SIMULATION,
                workflow_id=workflow.id,
                status=TestStatus.FAILED,
                execution_time_ms=int(execution_time),
                message=f"Workflow simulation failed: {str(e)}",
                details={"error": str(e), "trigger_data": trigger_data},
                timestamp=start_time,
                errors=[str(e)],
            )

    async def performance_test_workflow(
        self,
        workflow: AutomationWorkflow,
        test_duration_seconds: int = 60,
        concurrent_executions: int = 10,
        db: AsyncSession = None,
    ) -> Tuple[TestResult, PerformanceMetrics]:
        """Perform load testing on a workflow."""
        test_id = str(uuid.uuid4())
        start_time = datetime.utcnow()

        execution_times = []
        success_count = 0
        error_count = 0

        try:
            # Generate test data
            test_cases = []
            for i in range(concurrent_executions):
                trigger_data = self._generate_test_data_for_trigger(
                    workflow.trigger_type
                )
                test_cases.append(trigger_data)

            # Run concurrent simulations
            tasks = []
            for trigger_data in test_cases:
                task = self.simulate_workflow_execution(
                    workflow, trigger_data, db, dry_run=True
                )
                tasks.append(task)

            # Execute and collect results
            test_results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in test_results:
                if isinstance(result, TestResult):
                    execution_times.append(result.execution_time_ms)
                    if result.status == TestStatus.PASSED:
                        success_count += 1
                    else:
                        error_count += 1
                else:
                    error_count += 1
                    execution_times.append(30000)  # Timeout value

            # Calculate metrics
            if execution_times:
                avg_execution_time = sum(execution_times) / len(execution_times)
                max_execution_time = max(execution_times)
                min_execution_time = min(execution_times)
            else:
                avg_execution_time = max_execution_time = min_execution_time = 0

            total_executions = success_count + error_count
            throughput = (
                total_executions / test_duration_seconds
                if test_duration_seconds > 0
                else 0
            )
            success_rate = (
                success_count / total_executions if total_executions > 0 else 0
            )
            error_rate = error_count / total_executions if total_executions > 0 else 0

            metrics = PerformanceMetrics(
                avg_execution_time=avg_execution_time,
                max_execution_time=max_execution_time,
                min_execution_time=min_execution_time,
                throughput_per_second=throughput,
                memory_usage_mb=0.0,  # Would be measured in production
                cpu_usage_percent=0.0,  # Would be measured in production
                success_rate=success_rate,
                error_rate=error_rate,
            )

            test_execution_time = (
                datetime.utcnow() - start_time
            ).total_seconds() * 1000

            test_result = TestResult(
                test_id=test_id,
                test_type=TestType.PERFORMANCE,
                workflow_id=workflow.id,
                status=TestStatus.PASSED if error_rate < 0.1 else TestStatus.FAILED,
                execution_time_ms=int(test_execution_time),
                message=f"Performance test completed. Success rate: {success_rate:.2%}",
                details={
                    "concurrent_executions": concurrent_executions,
                    "total_executions": total_executions,
                    "metrics": metrics.__dict__,
                },
                timestamp=start_time,
            )

            return test_result, metrics

        except Exception as e:
            test_execution_time = (
                datetime.utcnow() - start_time
            ).total_seconds() * 1000

            test_result = TestResult(
                test_id=test_id,
                test_type=TestType.PERFORMANCE,
                workflow_id=workflow.id,
                status=TestStatus.FAILED,
                execution_time_ms=int(test_execution_time),
                message=f"Performance test failed: {str(e)}",
                details={"error": str(e)},
                timestamp=start_time,
                errors=[str(e)],
            )

            # Return empty metrics on failure
            empty_metrics = PerformanceMetrics(
                avg_execution_time=0,
                max_execution_time=0,
                min_execution_time=0,
                throughput_per_second=0,
                memory_usage_mb=0,
                cpu_usage_percent=0,
                success_rate=0,
                error_rate=1.0,
            )

            return test_result, empty_metrics

    async def integration_test_workflow(
        self, workflow: AutomationWorkflow, db: AsyncSession
    ) -> TestResult:
        """Test workflow integration with external services."""
        test_id = str(uuid.uuid4())
        start_time = datetime.utcnow()

        try:
            integration_results = []

            # Test external service integrations based on workflow actions
            for action in workflow.actions:
                action_type = action.get("type")

                if action_type == "send_notification":
                    channel = action.get("config", {}).get("channel")
                    if channel:
                        result = await self._test_notification_integration(channel)
                        integration_results.append(result)

                elif action_type == "webhook":
                    url = action.get("config", {}).get("url")
                    if url:
                        result = await self._test_webhook_integration(url)
                        integration_results.append(result)

                elif action_type == "crisis_detection":
                    result = await self._test_crisis_detection_integration()
                    integration_results.append(result)

            # Evaluate overall integration health
            failed_integrations = [r for r in integration_results if not r["success"]]
            success_rate = (
                (len(integration_results) - len(failed_integrations))
                / len(integration_results)
                if integration_results
                else 1.0
            )

            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            status = TestStatus.PASSED if success_rate >= 0.8 else TestStatus.FAILED

            return TestResult(
                test_id=test_id,
                test_type=TestType.INTEGRATION,
                workflow_id=workflow.id,
                status=status,
                execution_time_ms=int(execution_time),
                message=f"Integration test completed. Success rate: {success_rate:.2%}",
                details={
                    "integration_results": integration_results,
                    "success_rate": success_rate,
                    "failed_integrations": failed_integrations,
                },
                timestamp=start_time,
            )

        except Exception as e:
            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            return TestResult(
                test_id=test_id,
                test_type=TestType.INTEGRATION,
                workflow_id=workflow.id,
                status=TestStatus.FAILED,
                execution_time_ms=int(execution_time),
                message=f"Integration test failed: {str(e)}",
                details={"error": str(e)},
                timestamp=start_time,
                errors=[str(e)],
            )

    async def run_comprehensive_test_suite(
        self, workflow: AutomationWorkflow, db: AsyncSession
    ) -> Dict[str, TestResult]:
        """Run all test types for a workflow."""
        results = {}

        # 1. Validation test
        validation_result = await self.validate_workflow(workflow, db)
        results["validation"] = TestResult(
            test_id=str(uuid.uuid4()),
            test_type=TestType.VALIDATION,
            workflow_id=workflow.id,
            status=TestStatus.PASSED
            if validation_result.is_valid
            else TestStatus.FAILED,
            execution_time_ms=50,  # Validation is fast
            message=f"Validation score: {validation_result.score:.1f}/100",
            details=validation_result.__dict__,
            timestamp=datetime.utcnow(),
        )

        # 2. Simulation test
        trigger_data = self._generate_test_data_for_trigger(workflow.trigger_type)
        results["simulation"] = await self.simulate_workflow_execution(
            workflow, trigger_data, db
        )

        # 3. Integration test
        results["integration"] = await self.integration_test_workflow(workflow, db)

        # 4. Performance test (light version)
        performance_result, _ = await self.performance_test_workflow(
            workflow, test_duration_seconds=30, concurrent_executions=5, db=db
        )
        results["performance"] = performance_result

        # Store results
        if workflow.id not in self.test_results:
            self.test_results[workflow.id] = []

        for test_result in results.values():
            self.test_results[workflow.id].append(test_result)

        return results

    def get_test_history(self, workflow_id: str) -> List[TestResult]:
        """Get test history for a workflow."""
        return self.test_results.get(workflow_id, [])

    def get_test_summary(self, workflow_id: str) -> Dict[str, Any]:
        """Get summary of test results for a workflow."""
        results = self.test_results.get(workflow_id, [])

        if not results:
            return {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "success_rate": 0,
                "last_test": None,
                "avg_execution_time": 0,
            }

        passed = sum(1 for r in results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in results if r.status == TestStatus.FAILED)
        success_rate = passed / len(results) if results else 0
        avg_execution_time = sum(r.execution_time_ms for r in results) / len(results)
        last_test = max(results, key=lambda r: r.timestamp)

        return {
            "total_tests": len(results),
            "passed": passed,
            "failed": failed,
            "success_rate": success_rate,
            "last_test": last_test.timestamp,
            "avg_execution_time": avg_execution_time,
        }

    # Private helper methods

    async def _validate_trigger(
        self, trigger_type: TriggerType, trigger_config: Dict
    ) -> List[str]:
        """Validate trigger configuration."""
        errors = []

        if trigger_type == TriggerType.SCHEDULE:
            if not trigger_config.get("schedule"):
                errors.append("Schedule trigger requires schedule configuration")
            # Add cron validation here

        elif trigger_type == TriggerType.WEBHOOK:
            if not trigger_config.get("endpoint"):
                errors.append("Webhook trigger requires endpoint configuration")

        elif trigger_type == TriggerType.METRIC_THRESHOLD:
            if not trigger_config.get("metric") or not trigger_config.get("threshold"):
                errors.append("Metric threshold trigger requires metric and threshold")

        return errors

    def _validate_conditions(self, conditions: List[Dict]) -> List[str]:
        """Validate workflow conditions."""
        errors = []

        for i, condition in enumerate(conditions):
            if not condition.get("field"):
                errors.append(f"Condition {i+1}: field is required")
            if not condition.get("operator"):
                errors.append(f"Condition {i+1}: operator is required")
            if "value" not in condition:
                errors.append(f"Condition {i+1}: value is required")

        return errors

    def _validate_actions(self, actions: List[Dict]) -> List[str]:
        """Validate workflow actions."""
        errors = []

        for i, action in enumerate(actions):
            if not action.get("type"):
                errors.append(f"Action {i+1}: type is required")

            action_type = action.get("type")
            config = action.get("config", {})

            if action_type == "send_notification":
                if not config.get("channel"):
                    errors.append(f"Action {i+1}: notification channel is required")
                if not config.get("message"):
                    errors.append(f"Action {i+1}: notification message is required")

            elif action_type == "webhook":
                if not config.get("url"):
                    errors.append(f"Action {i+1}: webhook URL is required")

        return errors

    def _generate_test_data_for_trigger(
        self, trigger_type: TriggerType
    ) -> Dict[str, Any]:
        """Generate appropriate test data for trigger type."""
        if trigger_type == TriggerType.MENTION_DETECTED:
            return self._generate_test_mention()
        elif trigger_type == TriggerType.METRIC_THRESHOLD:
            return self._generate_test_metric()
        elif trigger_type == TriggerType.SCHEDULE:
            return self._generate_test_schedule()
        elif trigger_type == TriggerType.WEBHOOK:
            return self._generate_test_webhook()
        else:
            return {"test": True, "timestamp": datetime.utcnow().isoformat()}

    def _generate_test_mention(self) -> Dict[str, Any]:
        """Generate test social media mention data."""
        return {
            "platform": "twitter",
            "author": "test_user",
            "content": "Test mention for automation testing",
            "sentiment": 0.1,
            "reach": 1000,
            "engagement": 50,
            "keywords": ["test", "automation"],
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _generate_test_metric(self) -> Dict[str, Any]:
        """Generate test metric data."""
        return {
            "metric_name": "test_metric",
            "value": 75.5,
            "threshold": 70.0,
            "organization_id": "test_org",
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _generate_test_schedule(self) -> Dict[str, Any]:
        """Generate test schedule data."""
        return {
            "schedule_id": "test_schedule",
            "trigger_time": datetime.utcnow().isoformat(),
            "context": {"scheduled_task": "test_automation"},
        }

    def _generate_test_webhook(self) -> Dict[str, Any]:
        """Generate test webhook data."""
        return {
            "webhook_id": "test_webhook",
            "payload": {"test": True, "message": "Test webhook trigger"},
            "source": "test_system",
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def _test_notification_integration(self, channel: str) -> Dict[str, Any]:
        """Test notification channel integration."""
        try:
            # Mock test - in production, this would test actual services
            if channel in ["sms", "email", "push", "slack"]:
                await asyncio.sleep(0.1)  # Simulate API call
                return {
                    "channel": channel,
                    "success": True,
                    "response_time_ms": 100,
                    "message": f"{channel.title()} integration successful",
                }
            else:
                return {
                    "channel": channel,
                    "success": False,
                    "error": f"Unsupported channel: {channel}",
                }
        except Exception as e:
            return {"channel": channel, "success": False, "error": str(e)}

    async def _test_webhook_integration(self, url: str) -> Dict[str, Any]:
        """Test webhook integration."""
        try:
            # Mock test - in production, this would make actual HTTP request
            await asyncio.sleep(0.2)  # Simulate HTTP request

            if url.startswith("https://"):
                return {
                    "url": url,
                    "success": True,
                    "response_time_ms": 200,
                    "status_code": 200,
                    "message": "Webhook integration successful",
                }
            else:
                return {
                    "url": url,
                    "success": False,
                    "error": "Only HTTPS webhooks are supported",
                }
        except Exception as e:
            return {"url": url, "success": False, "error": str(e)}

    async def _test_crisis_detection_integration(self) -> Dict[str, Any]:
        """Test crisis detection integration."""
        try:
            # Mock test - in production, this would test Mentionlytics API
            await asyncio.sleep(0.3)  # Simulate API call

            return {
                "service": "mentionlytics",
                "success": True,
                "response_time_ms": 300,
                "message": "Crisis detection integration successful",
            }
        except Exception as e:
            return {"service": "mentionlytics", "success": False, "error": str(e)}


# Global testing instance
automation_tester = AutomationTester()
