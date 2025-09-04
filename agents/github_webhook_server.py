"""GitHub Webhook Server for CodeRabbit Integration

Provides real-time monitoring of GitHub events:
- Commit pushes
- Pull request creation/updates
- Branch creation/deletion
- Repository events

Automatically triggers CodeRabbit reviews and processes feedback.
"""

import asyncio
import hashlib
import hmac
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import aiohttp
from aiohttp import web, web_request
import ssl
import signal
import sys
from pathlib import Path

from coderabbit_integration import CodeRabbitIntegration

logger = logging.getLogger(__name__)

class GitHubWebhookServer:
    """GitHub webhook server for automated CodeRabbit integration"""
    
    def __init__(self, port: int = 8080, host: str = "0.0.0.0"):
        self.port = port
        self.host = host
        self.app = web.Application()
        self.coderabbit_agent = CodeRabbitIntegration()
        self.webhook_secret = None
        self.processing_queue = asyncio.Queue()
        
        # Event tracking
        self.processed_events = set()
        self.event_stats = {
            "total_events": 0,
            "processed_events": 0,
            "failed_events": 0,
            "ignored_events": 0
        }
        
        self._setup_routes()
        self._load_configuration()
    
    def _load_configuration(self):
        """Load webhook configuration"""
        try:
            config_path = Path("config/coderabbit_config.yaml")
            if config_path.exists():
                import yaml
                with open(config_path, 'r') as f:
                    config = yaml.safe_load(f)
                    self.webhook_secret = config.get('webhook_secret')
                    
                    # Server configuration
                    server_config = config.get('webhook_server', {})
                    self.port = server_config.get('port', 8080)
                    self.host = server_config.get('host', '0.0.0.0')
                    
                logger.info("Webhook server configuration loaded")
        except Exception as e:
            logger.warning(f"Could not load webhook configuration: {e}")
    
    def _setup_routes(self):
        """Setup webhook routes and handlers"""
        self.app.router.add_post('/webhook/github', self._handle_github_webhook)
        self.app.router.add_get('/webhook/health', self._health_check)
        self.app.router.add_get('/webhook/status', self._status_endpoint)
        self.app.router.add_post('/webhook/manual-trigger', self._manual_trigger)
    
    async def _handle_github_webhook(self, request: web_request.Request) -> web.Response:
        """Handle incoming GitHub webhook events"""
        try:
            # Verify webhook signature
            if not await self._verify_signature(request):
                logger.warning("Invalid webhook signature received")
                return web.Response(status=401, text="Invalid signature")
            
            # Parse event data
            event_type = request.headers.get('X-GitHub-Event')
            delivery_id = request.headers.get('X-GitHub-Delivery')
            
            if not event_type or not delivery_id:
                return web.Response(status=400, text="Missing required headers")
            
            # Check for duplicate events
            if delivery_id in self.processed_events:
                logger.info(f"Duplicate event {delivery_id} ignored")
                return web.Response(status=200, text="Duplicate event ignored")
            
            payload = await request.json()
            
            # Add to processing queue
            event_data = {
                "type": event_type,
                "delivery_id": delivery_id,
                "payload": payload,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self.processing_queue.put(event_data)
            self.event_stats["total_events"] += 1
            
            logger.info(f"Queued GitHub event: {event_type} (delivery: {delivery_id})")
            return web.Response(status=200, text="Event received")
            
        except Exception as e:
            logger.error(f"Webhook handling error: {e}")
            self.event_stats["failed_events"] += 1
            return web.Response(status=500, text="Internal server error")
    
    async def _verify_signature(self, request: web_request.Request) -> bool:
        """Verify GitHub webhook signature"""
        if not self.webhook_secret:
            logger.warning("No webhook secret configured - skipping verification")
            return True
        
        try:
            signature = request.headers.get('X-Hub-Signature-256')
            if not signature:
                return False
            
            body = await request.read()
            expected_signature = hmac.new(
                self.webhook_secret.encode(),
                body,
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(
                signature,
                f"sha256={expected_signature}"
            )
        except Exception as e:
            logger.error(f"Signature verification error: {e}")
            return False
    
    async def _health_check(self, request: web_request.Request) -> web.Response:
        """Health check endpoint"""
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "queue_size": self.processing_queue.qsize(),
            "coderabbit_agent": "active" if self.coderabbit_agent else "inactive"
        }
        
        return web.json_response(health_status)
    
    async def _status_endpoint(self, request: web_request.Request) -> web.Response:
        """Status and statistics endpoint"""
        status_data = {
            "server": {
                "host": self.host,
                "port": self.port,
                "uptime": datetime.utcnow().isoformat()
            },
            "queue": {
                "size": self.processing_queue.qsize(),
                "processing": True
            },
            "statistics": self.event_stats,
            "coderabbit_agent": self.coderabbit_agent.get_status_report()
        }
        
        return web.json_response(status_data)
    
    async def _manual_trigger(self, request: web_request.Request) -> web.Response:
        """Manual trigger endpoint for testing"""
        try:
            data = await request.json()
            trigger_type = data.get("type")
            
            if trigger_type == "commit_review":
                commit_sha = data.get("commit_sha")
                if not commit_sha:
                    return web.Response(status=400, text="commit_sha required")
                
                result = await self.coderabbit_agent.execute_task({
                    "type": "trigger_review",
                    "commit_sha": commit_sha
                })
                
                return web.json_response(result)
            
            elif trigger_type == "monitor_commits":
                result = await self.coderabbit_agent.execute_task({
                    "type": "monitor_commits"
                })
                
                return web.json_response(result)
            
            else:
                return web.Response(status=400, text="Invalid trigger type")
                
        except Exception as e:
            logger.error(f"Manual trigger error: {e}")
            return web.Response(status=500, text="Internal server error")
    
    async def _process_event_queue(self):
        """Process queued GitHub events"""
        logger.info("Starting event queue processor")
        
        while True:
            try:
                # Get event from queue with timeout
                event_data = await asyncio.wait_for(
                    self.processing_queue.get(), timeout=1.0
                )
                
                # Mark event as being processed
                self.processed_events.add(event_data["delivery_id"])
                
                # Process the event
                result = await self._process_github_event(event_data)
                
                if result["status"] == "success":
                    self.event_stats["processed_events"] += 1
                    logger.info(f"Successfully processed event {event_data['delivery_id']}")
                else:
                    self.event_stats["failed_events"] += 1
                    logger.error(f"Failed to process event {event_data['delivery_id']}: {result.get('error')}")
                
                # Cleanup old processed events (keep last 1000)
                if len(self.processed_events) > 1000:
                    # Remove oldest 200 events
                    old_events = list(self.processed_events)[:200]
                    for event_id in old_events:
                        self.processed_events.discard(event_id)
                
            except asyncio.TimeoutError:
                # No events in queue, continue
                continue
            except Exception as e:
                logger.error(f"Event queue processing error: {e}")
                await asyncio.sleep(5)  # Wait before retry
    
    async def _process_github_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single GitHub event"""
        try:
            event_type = event_data["type"]
            payload = event_data["payload"]
            
            # Handle different event types
            if event_type == "push":
                return await self._handle_push_event(payload)
            elif event_type == "pull_request":
                return await self._handle_pull_request_event(payload)
            elif event_type == "pull_request_review":
                return await self._handle_pr_review_event(payload)
            elif event_type == "release":
                return await self._handle_release_event(payload)
            elif event_type == "issues":
                return await self._handle_issues_event(payload)
            else:
                self.event_stats["ignored_events"] += 1
                return {
                    "status": "ignored",
                    "reason": f"Event type '{event_type}' not handled"
                }
        
        except Exception as e:
            logger.error(f"Event processing error: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _handle_push_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle git push events"""
        try:
            repository = payload.get("repository", {})
            commits = payload.get("commits", [])
            
            if not commits:
                return {"status": "ignored", "reason": "No commits in push"}
            
            # Trigger CodeRabbit reviews for new commits
            results = []
            for commit in commits[-5:]:  # Process last 5 commits max
                commit_sha = commit.get("id")
                if commit_sha:
                    result = await self.coderabbit_agent.execute_task({
                        "type": "trigger_review",
                        "commit_sha": commit_sha
                    })
                    results.append(result)
            
            successful_reviews = len([r for r in results if r.get("status") == "success"])
            
            return {
                "status": "success",
                "event": "push",
                "repository": repository.get("full_name"),
                "commits_processed": len(results),
                "reviews_triggered": successful_reviews
            }
        
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def _handle_pull_request_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pull request events"""
        try:
            action = payload.get("action")
            pull_request = payload.get("pull_request", {})
            
            if action in ["opened", "synchronize", "reopened"]:
                head_sha = pull_request.get("head", {}).get("sha")
                pr_number = pull_request.get("number")
                
                if head_sha:
                    # Trigger comprehensive review for PR
                    result = await self.coderabbit_agent.execute_task({
                        "type": "trigger_review",
                        "commit_sha": head_sha
                    })
                    
                    return {
                        "status": "success",
                        "event": "pull_request",
                        "action": action,
                        "pr_number": pr_number,
                        "review_triggered": result.get("status") == "success"
                    }
            
            return {
                "status": "ignored",
                "reason": f"PR action '{action}' not handled"
            }
        
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def _handle_pr_review_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pull request review events"""
        try:
            action = payload.get("action")
            review = payload.get("review", {})
            
            if action == "submitted":
                # Log review submission for monitoring
                logger.info(f"PR review submitted: {review.get('state')}")
                
                return {
                    "status": "success",
                    "event": "pr_review",
                    "action": action,
                    "review_state": review.get("state")
                }
            
            return {"status": "ignored", "reason": f"Review action '{action}' not handled"}
        
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def _handle_release_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle release events"""
        try:
            action = payload.get("action")
            release = payload.get("release", {})
            
            if action == "published":
                # Trigger final security scan for release
                tag_name = release.get("tag_name")
                
                # Could trigger additional security validation here
                logger.info(f"Release published: {tag_name}")
                
                return {
                    "status": "success",
                    "event": "release",
                    "action": action,
                    "tag": tag_name
                }
            
            return {"status": "ignored", "reason": f"Release action '{action}' not handled"}
        
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def _handle_issues_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle issues events"""
        try:
            action = payload.get("action")
            issue = payload.get("issue", {})
            
            # Check if issue is security-related
            labels = [label.get("name", "").lower() for label in issue.get("labels", [])]
            security_labels = ["security", "vulnerability", "cve", "exploit"]
            
            if any(label in security_labels for label in labels):
                # Priority handling for security issues
                logger.warning(f"Security issue {action}: {issue.get('title')}")
                
                return {
                    "status": "success",
                    "event": "security_issue",
                    "action": action,
                    "issue_number": issue.get("number"),
                    "priority": "high"
                }
            
            return {"status": "ignored", "reason": "Non-security issue"}
        
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def start_server(self):
        """Start the webhook server"""
        try:
            # Start event queue processor
            queue_task = asyncio.create_task(self._process_event_queue())
            
            # Setup graceful shutdown
            def signal_handler():
                logger.info("Received shutdown signal")
                queue_task.cancel()
            
            for sig in [signal.SIGTERM, signal.SIGINT]:
                signal.signal(sig, lambda s, f: signal_handler())
            
            # Start web server
            runner = web.AppRunner(self.app)
            await runner.setup()
            
            site = web.TCPSite(runner, self.host, self.port)
            await site.start()
            
            logger.info(f"GitHub webhook server started on {self.host}:{self.port}")
            
            # Keep server running
            try:
                await queue_task
            except asyncio.CancelledError:
                logger.info("Event queue processor stopped")
            finally:
                await runner.cleanup()
                
        except Exception as e:
            logger.error(f"Server startup error: {e}")
            raise

async def main():
    """Main entry point"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    server = GitHubWebhookServer()
    await server.start_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)