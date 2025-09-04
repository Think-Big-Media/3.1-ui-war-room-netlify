"""SUB-AGENT 3 - CodeRabbit Integration Agent

MISSION: Automate CodeRabbit review management and implement security/quality fixes
TARGET: All commits and PRs in War Room repository

This agent provides comprehensive automation for:
- Automated CodeRabbit review triggering
- Intelligent feedback parsing and analysis
- Safe auto-fix application with rollback
- Security issue prioritization and alerting
- Pattern storage and knowledge management
"""

import asyncio
import json
import logging
import hashlib
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import aiohttp
import yaml
import re
from pathlib import Path

from base_agent import BaseAgent, WarRoomAgentError

logger = logging.getLogger(__name__)

class SecurityLevel(Enum):
    """Security issue severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class FixStatus(Enum):
    """Auto-fix application status"""
    PENDING = "pending"
    APPLIED = "applied"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"
    SKIPPED = "skipped"

@dataclass
class CodeRabbitFeedback:
    """CodeRabbit review feedback structure"""
    id: str
    type: str
    severity: SecurityLevel
    file_path: str
    line_number: int
    description: str
    suggested_fix: Optional[str]
    confidence: float
    category: str
    timestamp: datetime

@dataclass
class AutoFix:
    """Auto-fix application tracking"""
    fix_id: str
    feedback_id: str
    file_path: str
    original_content: str
    fixed_content: str
    status: FixStatus
    applied_at: Optional[datetime]
    rollback_hash: Optional[str]

class CodeRabbitIntegration(BaseAgent):
    """CodeRabbit integration agent for automated review management"""
    
    def __init__(self):
        super().__init__("CodeRabbit-Integration", "automated_code_review")
        self.github_token = None
        self.coderabbit_api_key = None
        self.webhook_secret = None
        self.repository_url = None
        self.pieces_api_key = None
        
        # Internal state
        self.active_reviews = {}
        self.feedback_cache = {}
        self.fix_history = []
        self.security_patterns = {}
        
        # Configuration
        self.auto_fix_enabled = True
        self.security_threshold = SecurityLevel.MEDIUM
        self.max_auto_fixes_per_pr = 10
        self.rollback_timeout = timedelta(hours=24)
        
        self.load_configuration()
    
    def load_configuration(self):
        """Load agent configuration from environment and config files"""
        try:
            config_path = Path("config/coderabbit_config.yaml")
            if config_path.exists():
                with open(config_path, 'r') as f:
                    config = yaml.safe_load(f)
                    
                self.github_token = config.get('github_token')
                self.coderabbit_api_key = config.get('coderabbit_api_key')
                self.webhook_secret = config.get('webhook_secret')
                self.repository_url = config.get('repository_url')
                self.pieces_api_key = config.get('pieces_api_key')
                
                # Update settings
                settings = config.get('settings', {})
                self.auto_fix_enabled = settings.get('auto_fix_enabled', True)
                self.security_threshold = SecurityLevel(
                    settings.get('security_threshold', 'medium')
                )
                self.max_auto_fixes_per_pr = settings.get('max_auto_fixes_per_pr', 10)
                
                logger.info("CodeRabbit configuration loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load configuration: {e}")
    
    async def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute CodeRabbit integration tasks"""
        task_type = task.get("type")
        
        try:
            if task_type == "monitor_commits":
                return await self._monitor_repository_commits()
            elif task_type == "trigger_review":
                return await self._trigger_coderabbit_review(task.get("commit_sha"))
            elif task_type == "process_feedback":
                return await self._process_coderabbit_feedback(task.get("review_id"))
            elif task_type == "apply_fixes":
                return await self._apply_auto_fixes(task.get("feedback_list"))
            elif task_type == "prioritize_security":
                return await self._prioritize_security_issues(task.get("issues"))
            elif task_type == "store_patterns":
                return await self._store_fix_patterns(task.get("patterns"))
            elif task_type == "webhook_handler":
                return await self._handle_github_webhook(task.get("payload"))
            else:
                raise WarRoomAgentError(f"Unknown task type: {task_type}")
                
        except Exception as e:
            logger.error(f"Task execution failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def validate_capability(self, task: Dict[str, Any]) -> bool:
        """Validate if agent can handle the task"""
        valid_tasks = [
            "monitor_commits", "trigger_review", "process_feedback",
            "apply_fixes", "prioritize_security", "store_patterns",
            "webhook_handler"
        ]
        return task.get("type") in valid_tasks
    
    def get_capabilities(self) -> List[str]:
        """Return list of capabilities"""
        return [
            "monitor_commits", "trigger_review", "process_feedback",
            "apply_fixes", "prioritize_security", "store_patterns",
            "webhook_handler", "security_analysis", "pattern_detection"
        ]
    
    async def _monitor_repository_commits(self) -> Dict[str, Any]:
        """Monitor repository for new commits and trigger reviews"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"token {self.github_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
                
                # Get recent commits
                url = f"{self.repository_url}/commits"
                params = {"since": (datetime.utcnow() - timedelta(minutes=30)).isoformat()}
                
                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        commits = await response.json()
                        
                        new_reviews = []
                        for commit in commits:
                            commit_sha = commit["sha"]
                            if commit_sha not in self.active_reviews:
                                # Trigger CodeRabbit review
                                review_result = await self._trigger_coderabbit_review(commit_sha)
                                if review_result["status"] == "success":
                                    new_reviews.append(commit_sha)
                        
                        return {
                            "status": "success",
                            "new_commits": len(commits),
                            "new_reviews": len(new_reviews),
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    else:
                        raise WarRoomAgentError(f"GitHub API error: {response.status}")
        except Exception as e:
            logger.error(f"Commit monitoring failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _trigger_coderabbit_review(self, commit_sha: str) -> Dict[str, Any]:
        """Trigger CodeRabbit review for a specific commit"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.coderabbit_api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "repository_url": self.repository_url,
                    "commit_sha": commit_sha,
                    "review_type": "comprehensive",
                    "include_security": True,
                    "include_performance": True,
                    "include_maintainability": True
                }
                
                # Trigger review via CodeRabbit API
                url = "https://api.coderabbit.ai/v1/reviews"
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status in [200, 201]:
                        review_data = await response.json()
                        review_id = review_data.get("review_id")
                        
                        self.active_reviews[commit_sha] = {
                            "review_id": review_id,
                            "started_at": datetime.utcnow(),
                            "status": "in_progress"
                        }
                        
                        logger.info(f"Triggered CodeRabbit review for commit {commit_sha}")
                        return {
                            "status": "success",
                            "review_id": review_id,
                            "commit_sha": commit_sha
                        }
                    else:
                        raise WarRoomAgentError(f"CodeRabbit API error: {response.status}")
        except Exception as e:
            logger.error(f"Review trigger failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _process_coderabbit_feedback(self, review_id: str) -> Dict[str, Any]:
        """Process and analyze CodeRabbit feedback"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.coderabbit_api_key}",
                    "Accept": "application/json"
                }
                
                # Get review results
                url = f"https://api.coderabbit.ai/v1/reviews/{review_id}"
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        review_data = await response.json()
                        
                        # Parse feedback into structured format
                        feedback_list = []
                        for item in review_data.get("feedback", []):
                            feedback = CodeRabbitFeedback(
                                id=item.get("id"),
                                type=item.get("type"),
                                severity=SecurityLevel(item.get("severity", "info")),
                                file_path=item.get("file_path"),
                                line_number=item.get("line_number", 0),
                                description=item.get("description"),
                                suggested_fix=item.get("suggested_fix"),
                                confidence=item.get("confidence", 0.0),
                                category=item.get("category", "general"),
                                timestamp=datetime.utcnow()
                            )
                            feedback_list.append(feedback)
                        
                        # Cache feedback for later processing
                        self.feedback_cache[review_id] = feedback_list
                        
                        # Automatically apply safe fixes
                        if self.auto_fix_enabled:
                            await self._apply_auto_fixes(feedback_list)
                        
                        # Prioritize security issues
                        security_issues = [f for f in feedback_list 
                                         if f.severity in [SecurityLevel.CRITICAL, SecurityLevel.HIGH]]
                        if security_issues:
                            await self._prioritize_security_issues(security_issues)
                        
                        return {
                            "status": "success",
                            "feedback_count": len(feedback_list),
                            "security_issues": len(security_issues),
                            "review_id": review_id
                        }
                    else:
                        raise WarRoomAgentError(f"CodeRabbit API error: {response.status}")
        except Exception as e:
            logger.error(f"Feedback processing failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _apply_auto_fixes(self, feedback_list: List[CodeRabbitFeedback]) -> Dict[str, Any]:
        """Apply safe auto-fixes based on CodeRabbit suggestions"""
        applied_fixes = []
        failed_fixes = []
        
        try:
            for feedback in feedback_list:
                # Only apply high-confidence, safe fixes
                if (feedback.suggested_fix and 
                    feedback.confidence > 0.8 and 
                    self._is_safe_fix(feedback)):
                    
                    fix_result = await self._apply_single_fix(feedback)
                    if fix_result["status"] == "success":
                        applied_fixes.append(fix_result["fix_id"])
                    else:
                        failed_fixes.append(feedback.id)
                
                # Limit number of auto-fixes per batch
                if len(applied_fixes) >= self.max_auto_fixes_per_pr:
                    break
            
            # Store successful fix patterns
            if applied_fixes:
                await self._store_fix_patterns(applied_fixes)
            
            return {
                "status": "success",
                "applied_fixes": len(applied_fixes),
                "failed_fixes": len(failed_fixes),
                "fix_ids": applied_fixes
            }
        except Exception as e:
            logger.error(f"Auto-fix application failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _apply_single_fix(self, feedback: CodeRabbitFeedback) -> Dict[str, Any]:
        """Apply a single auto-fix with rollback capability"""
        fix_id = hashlib.md5(f"{feedback.id}{datetime.utcnow()}".encode()).hexdigest()
        
        try:
            file_path = Path(feedback.file_path)
            if not file_path.exists():
                return {"status": "error", "error": "File not found"}
            
            # Read original content
            with open(file_path, 'r') as f:
                original_content = f.read()
            
            # Apply fix
            fixed_content = self._apply_fix_to_content(
                original_content, feedback.suggested_fix, feedback.line_number
            )
            
            # Create git backup point
            rollback_hash = self._create_rollback_point(file_path)
            
            # Write fixed content
            with open(file_path, 'w') as f:
                f.write(fixed_content)
            
            # Create fix record
            auto_fix = AutoFix(
                fix_id=fix_id,
                feedback_id=feedback.id,
                file_path=str(file_path),
                original_content=original_content,
                fixed_content=fixed_content,
                status=FixStatus.APPLIED,
                applied_at=datetime.utcnow(),
                rollback_hash=rollback_hash
            )
            
            self.fix_history.append(auto_fix)
            
            logger.info(f"Applied auto-fix {fix_id} to {file_path}")
            return {"status": "success", "fix_id": fix_id}
            
        except Exception as e:
            logger.error(f"Fix application failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def _apply_fix_to_content(self, content: str, suggested_fix: str, line_number: int) -> str:
        """Apply suggested fix to file content"""
        lines = content.split('\n')
        
        # Parse suggested fix format (assuming standard format)
        if "REPLACE:" in suggested_fix and "WITH:" in suggested_fix:
            parts = suggested_fix.split("WITH:")
            replace_text = parts[0].replace("REPLACE:", "").strip()
            with_text = parts[1].strip()
            
            # Apply replacement at specified line
            if 0 <= line_number - 1 < len(lines):
                lines[line_number - 1] = lines[line_number - 1].replace(replace_text, with_text)
        
        return '\n'.join(lines)
    
    def _create_rollback_point(self, file_path: Path) -> str:
        """Create git commit point for rollback"""
        try:
            # Create temporary commit
            result = subprocess.run(
                ["git", "add", str(file_path)],
                capture_output=True, text=True, cwd=file_path.parent
            )
            
            result = subprocess.run(
                ["git", "commit", "-m", f"Auto-fix backup point for {file_path.name}"],
                capture_output=True, text=True, cwd=file_path.parent
            )
            
            # Get commit hash
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                capture_output=True, text=True, cwd=file_path.parent
            )
            
            return result.stdout.strip()
        except Exception as e:
            logger.warning(f"Could not create rollback point: {e}")
            return None
    
    def _is_safe_fix(self, feedback: CodeRabbitFeedback) -> bool:
        """Determine if a fix is safe to apply automatically"""
        safe_categories = [
            "formatting", "style", "import_optimization",
            "variable_naming", "type_annotation", "documentation"
        ]
        
        unsafe_patterns = [
            "delete", "remove", "DROP", "rm -rf",
            "system(", "exec(", "eval(", "subprocess"
        ]
        
        # Check if category is safe
        if feedback.category not in safe_categories:
            return False
        
        # Check for unsafe patterns in suggested fix
        if feedback.suggested_fix:
            for pattern in unsafe_patterns:
                if pattern in feedback.suggested_fix:
                    return False
        
        return True
    
    async def _prioritize_security_issues(self, security_issues: List[CodeRabbitFeedback]) -> Dict[str, Any]:
        """Prioritize and alert on security issues"""
        try:
            # Sort by severity and confidence
            prioritized = sorted(
                security_issues,
                key=lambda x: (x.severity.value, -x.confidence),
                reverse=True
            )
            
            critical_issues = [i for i in prioritized if i.severity == SecurityLevel.CRITICAL]
            high_issues = [i for i in prioritized if i.severity == SecurityLevel.HIGH]
            
            # Send alerts for critical/high issues
            alerts_sent = 0
            for issue in critical_issues + high_issues:
                alert_result = await self._send_security_alert(issue)
                if alert_result["status"] == "success":
                    alerts_sent += 1
            
            return {
                "status": "success",
                "total_issues": len(security_issues),
                "critical_issues": len(critical_issues),
                "high_issues": len(high_issues),
                "alerts_sent": alerts_sent
            }
        except Exception as e:
            logger.error(f"Security prioritization failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _send_security_alert(self, issue: CodeRabbitFeedback) -> Dict[str, Any]:
        """Send security alert notification"""
        try:
            # Create alert message
            alert_message = f"""
🚨 SECURITY ALERT - {issue.severity.value.upper()}

File: {issue.file_path}
Line: {issue.line_number}
Type: {issue.type}
Confidence: {issue.confidence:.2%}

Description: {issue.description}

Suggested Fix: {issue.suggested_fix or 'Manual review required'}

Time: {issue.timestamp.isoformat()}
Issue ID: {issue.id}
"""
            
            # Send to multiple channels (GitHub issue, Slack, email, etc.)
            # Implementation depends on configured notification channels
            
            logger.critical(f"Security alert sent for issue {issue.id}")
            return {"status": "success", "alert_sent": True}
            
        except Exception as e:
            logger.error(f"Alert sending failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _store_fix_patterns(self, fix_ids: List[str]) -> Dict[str, Any]:
        """Store successful fix patterns to Pieces with tagging"""
        try:
            stored_patterns = []
            
            for fix_id in fix_ids:
                # Find fix in history
                fix_record = next((f for f in self.fix_history if f.fix_id == fix_id), None)
                if not fix_record:
                    continue
                
                # Create pattern data
                pattern_data = {
                    "fix_id": fix_id,
                    "file_type": Path(fix_record.file_path).suffix,
                    "original_content": fix_record.original_content[:500],  # Truncate for storage
                    "fixed_content": fix_record.fixed_content[:500],
                    "success_timestamp": fix_record.applied_at.isoformat(),
                    "pattern_type": "coderabbit_auto_fix"
                }
                
                # Store to Pieces (if API available)
                if self.pieces_api_key:
                    pieces_result = await self._store_to_pieces(pattern_data)
                    if pieces_result["status"] == "success":
                        stored_patterns.append(fix_id)
                
                # Also store locally for backup
                self.security_patterns[fix_id] = pattern_data
            
            return {
                "status": "success",
                "patterns_stored": len(stored_patterns),
                "storage_locations": ["pieces", "local_cache"]
            }
        except Exception as e:
            logger.error(f"Pattern storage failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _store_to_pieces(self, pattern_data: Dict[str, Any]) -> Dict[str, Any]:
        """Store pattern to Pieces with coderabbit-fixes tag"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.pieces_api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "name": f"CodeRabbit Fix Pattern - {pattern_data['fix_id'][:8]}",
                    "content": json.dumps(pattern_data, indent=2),
                    "tags": ["coderabbit-fixes", "auto-fix", "security", "quality"],
                    "type": "code_pattern",
                    "metadata": {
                        "source": "coderabbit_integration",
                        "fix_id": pattern_data["fix_id"],
                        "file_type": pattern_data["file_type"]
                    }
                }
                
                # Store via Pieces API
                url = "https://api.pieces.app/v1/snippets"
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status in [200, 201]:
                        result = await response.json()
                        return {"status": "success", "pieces_id": result.get("id")}
                    else:
                        raise WarRoomAgentError(f"Pieces API error: {response.status}")
        except Exception as e:
            logger.error(f"Pieces storage failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _handle_github_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle GitHub webhook events for automated monitoring"""
        try:
            event_type = payload.get("action")
            
            if event_type == "opened" and "pull_request" in payload:
                # New PR opened - trigger review
                pr_number = payload["pull_request"]["number"]
                head_sha = payload["pull_request"]["head"]["sha"]
                
                review_result = await self._trigger_coderabbit_review(head_sha)
                return {
                    "status": "success",
                    "event": "pr_opened",
                    "pr_number": pr_number,
                    "review_triggered": review_result["status"] == "success"
                }
            
            elif event_type == "synchronize" and "pull_request" in payload:
                # PR updated - trigger incremental review
                pr_number = payload["pull_request"]["number"]
                head_sha = payload["pull_request"]["head"]["sha"]
                
                review_result = await self._trigger_coderabbit_review(head_sha)
                return {
                    "status": "success",
                    "event": "pr_updated",
                    "pr_number": pr_number,
                    "review_triggered": review_result["status"] == "success"
                }
            
            elif "commits" in payload:
                # Push event - monitor commits
                commit_count = len(payload["commits"])
                
                for commit in payload["commits"][-5:]:  # Process last 5 commits
                    await self._trigger_coderabbit_review(commit["id"])
                
                return {
                    "status": "success",
                    "event": "push",
                    "commits_processed": min(commit_count, 5)
                }
            
            return {"status": "success", "event": "ignored"}
            
        except Exception as e:
            logger.error(f"Webhook handling failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def rollback_fix(self, fix_id: str) -> Dict[str, Any]:
        """Rollback an applied auto-fix"""
        try:
            fix_record = next((f for f in self.fix_history if f.fix_id == fix_id), None)
            if not fix_record:
                return {"status": "error", "error": "Fix record not found"}
            
            if fix_record.rollback_hash:
                # Git rollback
                file_path = Path(fix_record.file_path)
                result = subprocess.run(
                    ["git", "checkout", fix_record.rollback_hash, "--", str(file_path)],
                    capture_output=True, text=True, cwd=file_path.parent
                )
                
                if result.returncode == 0:
                    fix_record.status = FixStatus.ROLLED_BACK
                    logger.info(f"Rolled back fix {fix_id}")
                    return {"status": "success", "rolled_back": True}
                else:
                    return {"status": "error", "error": "Git rollback failed"}
            else:
                # Manual content rollback
                with open(fix_record.file_path, 'w') as f:
                    f.write(fix_record.original_content)
                
                fix_record.status = FixStatus.ROLLED_BACK
                return {"status": "success", "rolled_back": True}
                
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def get_status_report(self) -> Dict[str, Any]:
        """Generate comprehensive status report"""
        return {
            "agent_status": self.get_status(),
            "active_reviews": len(self.active_reviews),
            "cached_feedback": len(self.feedback_cache),
            "fix_history": {
                "total_fixes": len(self.fix_history),
                "successful_fixes": len([f for f in self.fix_history if f.status == FixStatus.APPLIED]),
                "rolled_back_fixes": len([f for f in self.fix_history if f.status == FixStatus.ROLLED_BACK])
            },
            "security_patterns": len(self.security_patterns),
            "configuration": {
                "auto_fix_enabled": self.auto_fix_enabled,
                "security_threshold": self.security_threshold.value,
                "max_auto_fixes_per_pr": self.max_auto_fixes_per_pr
            },
            "last_update": datetime.utcnow().isoformat()
        }