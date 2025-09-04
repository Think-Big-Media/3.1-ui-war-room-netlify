#!/usr/bin/env python3
"""
CodeRabbit Integration Runner

Main execution script for SUB-AGENT 3 - CodeRabbit Integration system.
Orchestrates all components and provides unified management interface.
"""

import asyncio
import signal
import sys
import logging
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import argparse

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from coderabbit_integration import CodeRabbitIntegration
from github_webhook_server import GitHubWebhookServer
from security_alerting import SecurityAlertingSystem
from pieces_integration import PiecesIntegration
from cicd_integration import CICDIntegration
from auto_fix_engine import AutoFixEngine
from feedback_parser import FeedbackParser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CodeRabbitSystemManager:
    """Main system manager for CodeRabbit integration"""
    
    def __init__(self, config_path: str = "config/coderabbit_config.yaml"):
        self.config_path = config_path
        self.running = False
        self.components = {}
        self.tasks = []
        
        # System status
        self.start_time = None
        self.status = {
            "system": "initializing",
            "components": {},
            "statistics": {}
        }
        
        # Initialize components
        self._initialize_components()
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _initialize_components(self):
        """Initialize all system components"""
        try:
            logger.info("Initializing CodeRabbit integration components...")
            
            # Core integration agent
            self.components["coderabbit_agent"] = CodeRabbitIntegration()
            logger.info("✅ CodeRabbit agent initialized")
            
            # Webhook server
            self.components["webhook_server"] = GitHubWebhookServer()
            logger.info("✅ GitHub webhook server initialized")
            
            # Security alerting system
            self.components["security_alerting"] = SecurityAlertingSystem()
            logger.info("✅ Security alerting system initialized")
            
            # Auto-fix engine
            self.components["auto_fix_engine"] = AutoFixEngine(str(Path.cwd().parent))
            logger.info("✅ Auto-fix engine initialized")
            
            # Feedback parser
            self.components["feedback_parser"] = FeedbackParser()
            logger.info("✅ Feedback parser initialized")
            
            # CI/CD integration
            self.components["cicd_integration"] = CICDIntegration()
            logger.info("✅ CI/CD integration initialized")
            
            # Pieces integration (optional - depends on API key)
            import os
            pieces_api_key = os.getenv("PIECES_API_KEY")
            if pieces_api_key:
                self.components["pieces_integration"] = PiecesIntegration(pieces_api_key)
                logger.info("✅ Pieces integration initialized")
            else:
                logger.info("⚠️ Pieces integration skipped (no API key)")
            
            # Update component status
            for name, component in self.components.items():
                self.status["components"][name] = {
                    "status": "ready",
                    "initialized_at": datetime.utcnow().isoformat()
                }
            
            logger.info(f"All components initialized successfully ({len(self.components)} total)")
            
        except Exception as e:
            logger.error(f"Component initialization failed: {e}")
            raise
    
    async def start(self):
        """Start the CodeRabbit integration system"""
        try:
            logger.info("🚀 Starting CodeRabbit Integration System")
            self.running = True
            self.start_time = datetime.utcnow()
            self.status["system"] = "running"
            
            # Start webhook server
            webhook_task = asyncio.create_task(
                self.components["webhook_server"].start_server()
            )
            self.tasks.append(webhook_task)
            logger.info("Started GitHub webhook server")
            
            # Start periodic monitoring tasks
            monitoring_task = asyncio.create_task(self._monitoring_loop())
            self.tasks.append(monitoring_task)
            logger.info("Started monitoring loop")
            
            # Start commit monitoring
            commit_monitor_task = asyncio.create_task(self._commit_monitoring_loop())
            self.tasks.append(commit_monitor_task)
            logger.info("Started commit monitoring")
            
            # Start health check task
            health_task = asyncio.create_task(self._health_check_loop())
            self.tasks.append(health_task)
            logger.info("Started health check loop")
            
            # Start statistics collection
            stats_task = asyncio.create_task(self._statistics_loop())
            self.tasks.append(stats_task)
            logger.info("Started statistics collection")
            
            logger.info("✅ CodeRabbit Integration System fully operational")
            logger.info(f"Components active: {list(self.components.keys())}")
            logger.info("System ready to receive GitHub webhooks and process commits")
            
            # Keep running until shutdown signal
            await self._wait_for_shutdown()
            
        except Exception as e:
            logger.error(f"System startup failed: {e}")
            await self.shutdown()
            raise
    
    async def _monitoring_loop(self):
        """Periodic monitoring and maintenance loop"""
        while self.running:
            try:
                # Update component statuses
                for name, component in self.components.items():
                    try:
                        if hasattr(component, 'get_status'):
                            status = component.get_status()
                            self.status["components"][name].update({
                                "last_check": datetime.utcnow().isoformat(),
                                "details": status
                            })
                        else:
                            self.status["components"][name]["status"] = "active"
                    except Exception as e:
                        logger.warning(f"Status check failed for {name}: {e}")
                        self.status["components"][name]["status"] = "error"
                
                # Log system status every 5 minutes
                if datetime.utcnow().minute % 5 == 0:
                    active_components = len([c for c in self.status["components"].values() if c["status"] in ["ready", "active"]])
                    logger.info(f"System status: {active_components}/{len(self.components)} components active")
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(60)
    
    async def _commit_monitoring_loop(self):
        """Periodic commit monitoring for automatic reviews"""
        while self.running:
            try:
                # Monitor for new commits
                monitor_task = {
                    "type": "monitor_commits"
                }
                
                result = await self.components["coderabbit_agent"].execute_task(monitor_task)
                
                if result["status"] == "success" and result.get("new_commits", 0) > 0:
                    logger.info(f"Detected {result['new_commits']} new commits, triggered {result.get('new_reviews', 0)} reviews")
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Commit monitoring error: {e}")
                await asyncio.sleep(300)
    
    async def _health_check_loop(self):
        """Periodic health checks"""
        while self.running:
            try:
                # Check system health
                health_status = await self._perform_health_checks()
                
                if not health_status["healthy"]:
                    logger.warning(f"Health check failed: {health_status['issues']}")
                    
                    # Attempt self-healing for common issues
                    await self._attempt_self_healing(health_status["issues"])
                
                await asyncio.sleep(60)  # Check every minute
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check error: {e}")
                await asyncio.sleep(60)
    
    async def _statistics_loop(self):
        """Collect and update system statistics"""
        while self.running:
            try:
                # Collect statistics from all components
                stats = {}
                
                for name, component in self.components.items():
                    try:
                        if hasattr(component, 'get_status_report'):
                            component_stats = component.get_status_report()
                        elif hasattr(component, 'get_statistics'):
                            component_stats = component.get_statistics()
                        elif hasattr(component, 'get_stats'):
                            component_stats = component.get_stats()
                        else:
                            component_stats = {"status": "active"}
                        
                        stats[name] = component_stats
                    except Exception as e:
                        logger.warning(f"Statistics collection failed for {name}: {e}")
                        stats[name] = {"status": "error", "error": str(e)}
                
                # Update system statistics
                self.status["statistics"] = {
                    "collected_at": datetime.utcnow().isoformat(),
                    "uptime_seconds": (datetime.utcnow() - self.start_time).total_seconds() if self.start_time else 0,
                    "components": stats
                }
                
                await asyncio.sleep(120)  # Collect every 2 minutes
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Statistics collection error: {e}")
                await asyncio.sleep(120)
    
    async def _perform_health_checks(self) -> Dict[str, Any]:
        """Perform comprehensive health checks"""
        issues = []
        
        try:
            # Check component health
            for name, component in self.components.items():
                try:
                    if hasattr(component, 'health_check'):
                        health = await component.health_check()
                        if not health.get("healthy", True):
                            issues.append(f"{name}: {health.get('error', 'unhealthy')}")
                except Exception as e:
                    issues.append(f"{name}: health check failed - {e}")
            
            # Check system resources
            import psutil
            memory = psutil.virtual_memory()
            if memory.percent > 90:
                issues.append(f"High memory usage: {memory.percent}%")
            
            disk = psutil.disk_usage('/')
            if disk.percent > 90:
                issues.append(f"High disk usage: {disk.percent}%")
            
            # Check database connectivity (if applicable)
            try:
                import sqlite3
                with sqlite3.connect("data/coderabbit.db", timeout=5) as conn:
                    conn.execute("SELECT 1")
            except Exception as e:
                issues.append(f"Database connectivity: {e}")
            
            return {
                "healthy": len(issues) == 0,
                "issues": issues,
                "checked_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "healthy": False,
                "issues": [f"Health check system error: {e}"],
                "checked_at": datetime.utcnow().isoformat()
            }
    
    async def _attempt_self_healing(self, issues: List[str]):
        """Attempt to automatically resolve common issues"""
        for issue in issues:
            try:
                if "memory usage" in issue.lower():
                    # Clear caches
                    for component in self.components.values():
                        if hasattr(component, 'clear_cache'):
                            component.clear_cache()
                    logger.info("Cleared component caches to free memory")
                
                elif "disk usage" in issue.lower():
                    # Clean up old logs and temporary files
                    await self._cleanup_old_files()
                    logger.info("Cleaned up old files to free disk space")
                
                elif "database" in issue.lower():
                    # Attempt database reconnection
                    logger.info("Attempting database reconnection")
                
            except Exception as e:
                logger.error(f"Self-healing attempt failed for '{issue}': {e}")
    
    async def _cleanup_old_files(self):
        """Clean up old log files and temporary data"""
        try:
            import os
            import time
            
            # Clean logs older than 7 days
            log_dir = Path("logs")
            if log_dir.exists():
                cutoff_time = time.time() - (7 * 24 * 3600)  # 7 days
                for log_file in log_dir.glob("*.log*"):
                    if log_file.stat().st_mtime < cutoff_time:
                        log_file.unlink()
                        logger.debug(f"Deleted old log file: {log_file}")
            
            # Clean temporary data
            temp_dirs = [Path("tmp"), Path(".coderabbit_backups")]
            for temp_dir in temp_dirs:
                if temp_dir.exists():
                    for temp_file in temp_dir.glob("*"):
                        if temp_file.is_file() and temp_file.stat().st_mtime < cutoff_time:
                            temp_file.unlink()
                            logger.debug(f"Deleted old temp file: {temp_file}")
            
        except Exception as e:
            logger.error(f"File cleanup failed: {e}")
    
    async def _wait_for_shutdown(self):
        """Wait for shutdown signal"""
        try:
            while self.running:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("Received keyboard interrupt")
        except Exception as e:
            logger.error(f"Shutdown wait error: {e}")
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.running = False
    
    async def shutdown(self):
        """Gracefully shutdown the system"""
        logger.info("🛑 Initiating CodeRabbit Integration System shutdown...")
        
        self.running = False
        self.status["system"] = "shutting_down"
        
        # Cancel all running tasks
        for task in self.tasks:
            if not task.done():
                task.cancel()
        
        # Wait for tasks to complete
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)
        
        # Shutdown components
        for name, component in self.components.items():
            try:
                if hasattr(component, 'shutdown'):
                    await component.shutdown()
                elif hasattr(component, 'close'):
                    await component.close()
                logger.info(f"Shutdown component: {name}")
            except Exception as e:
                logger.warning(f"Error shutting down {name}: {e}")
        
        # Final status report
        uptime = (datetime.utcnow() - self.start_time).total_seconds() if self.start_time else 0
        logger.info(f"✅ CodeRabbit Integration System shutdown complete")
        logger.info(f"Uptime: {uptime:.1f} seconds")
        
        # Save final status
        try:
            status_file = Path("data/last_run_status.json")
            status_file.parent.mkdir(exist_ok=True)
            with open(status_file, 'w') as f:
                json.dump({
                    **self.status,
                    "shutdown_at": datetime.utcnow().isoformat(),
                    "uptime_seconds": uptime
                }, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not save final status: {e}")
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get current system status"""
        return {
            **self.status,
            "current_time": datetime.utcnow().isoformat(),
            "uptime_seconds": (datetime.utcnow() - self.start_time).total_seconds() if self.start_time else 0
        }
    
    async def execute_command(self, command: str, **kwargs) -> Dict[str, Any]:
        """Execute system command"""
        try:
            if command == "status":
                return {"status": "success", "data": self.get_system_status()}
            
            elif command == "health_check":
                health = await self._perform_health_checks()
                return {"status": "success", "data": health}
            
            elif command == "trigger_review":
                commit_sha = kwargs.get("commit_sha")
                if not commit_sha:
                    return {"status": "error", "error": "commit_sha required"}
                
                task = {
                    "type": "trigger_review",
                    "commit_sha": commit_sha
                }
                result = await self.components["coderabbit_agent"].execute_task(task)
                return {"status": "success", "data": result}
            
            elif command == "rollback_fix":
                fix_id = kwargs.get("fix_id")
                if not fix_id:
                    return {"status": "error", "error": "fix_id required"}
                
                result = await self.components["auto_fix_engine"].rollback_fix(fix_id)
                return {"status": "success", "data": result}
            
            elif command == "security_dashboard":
                dashboard = self.components["security_alerting"].get_security_dashboard()
                return {"status": "success", "data": dashboard}
            
            elif command == "pipeline_stats":
                stats = self.components["cicd_integration"].get_pipeline_statistics()
                return {"status": "success", "data": stats}
            
            else:
                return {"status": "error", "error": f"Unknown command: {command}"}
        
        except Exception as e:
            logger.error(f"Command execution failed: {e}")
            return {"status": "error", "error": str(e)}

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="CodeRabbit Integration System")
    parser.add_argument("--config", default="config/coderabbit_config.yaml",
                       help="Configuration file path")
    parser.add_argument("--command", 
                       help="Execute single command and exit")
    parser.add_argument("--commit-sha",
                       help="Commit SHA for review commands")
    parser.add_argument("--fix-id",
                       help="Fix ID for rollback commands")
    
    args = parser.parse_args()
    
    # Initialize system manager
    system = CodeRabbitSystemManager(args.config)
    
    try:
        if args.command:
            # Execute single command
            kwargs = {}
            if args.commit_sha:
                kwargs["commit_sha"] = args.commit_sha
            if args.fix_id:
                kwargs["fix_id"] = args.fix_id
                
            result = await system.execute_command(args.command, **kwargs)
            print(json.dumps(result, indent=2))
            
            if result["status"] == "error":
                sys.exit(1)
        else:
            # Start full system
            await system.start()
    
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"System error: {e}")
        sys.exit(1)
    finally:
        await system.shutdown()

if __name__ == "__main__":
    asyncio.run(main())