#!/usr/bin/env python3
"""
Critical Failure Alerting System
Handles notifications for critical health check failures
"""

import asyncio
import json
import smtplib
import subprocess
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Dict, List, Any, Optional
import logging
import os

class AlertingSystem:
    """Handles critical failure alerts and notifications"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config = self.load_config(config_file)
        self.logger = logging.getLogger(__name__)
        self.alert_history: List[Dict[str, Any]] = []
        self.max_history = 1000
        
    def load_config(self, config_file: Optional[str] = None) -> Dict[str, Any]:
        """Load alerting configuration"""
        default_config = {
            "email": {
                "enabled": False,
                "smtp_server": "smtp.gmail.com",
                "smtp_port": 587,
                "username": "",
                "password": "",
                "from_email": "",
                "to_emails": [],
                "use_tls": True
            },
            "webhook": {
                "enabled": False,
                "url": "",
                "method": "POST",
                "headers": {"Content-Type": "application/json"},
                "timeout": 10
            },
            "slack": {
                "enabled": False,
                "webhook_url": "",
                "channel": "#alerts",
                "username": "WarRoom-HealthBot"
            },
            "pushcut": {
                "enabled": False,
                "api_key": "",
                "notification_name": "WarRoomAlert"
            },
            "console": {
                "enabled": True,
                "color": True
            },
            "file": {
                "enabled": True,
                "log_file": "alerts.log"
            }
        }
        
        if config_file and Path(config_file).exists():
            try:
                with open(config_file, 'r') as f:
                    user_config = json.load(f)
                    # Merge configs
                    for key, value in user_config.items():
                        if key in default_config and isinstance(value, dict):
                            default_config[key].update(value)
                        else:
                            default_config[key] = value
            except Exception as e:
                self.logger.error(f"Failed to load config file {config_file}: {e}")
        
        return default_config
    
    async def send_alert(self, alert_type: str, title: str, message: str, severity: str = "HIGH", 
                        context: Optional[Dict[str, Any]] = None):
        """Send alert through configured channels"""
        
        alert_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": alert_type,
            "title": title,
            "message": message,
            "severity": severity,
            "context": context or {}
        }
        
        # Add to history
        self.alert_history.append(alert_data)
        if len(self.alert_history) > self.max_history:
            self.alert_history = self.alert_history[-self.max_history:]
        
        # Send through configured channels
        tasks = []
        
        if self.config["console"]["enabled"]:
            self.send_console_alert(alert_data)
        
        if self.config["file"]["enabled"]:
            self.send_file_alert(alert_data)
        
        if self.config["email"]["enabled"]:
            tasks.append(self.send_email_alert(alert_data))
        
        if self.config["webhook"]["enabled"]:
            tasks.append(self.send_webhook_alert(alert_data))
        
        if self.config["slack"]["enabled"]:
            tasks.append(self.send_slack_alert(alert_data))
        
        if self.config["pushcut"]["enabled"]:
            tasks.append(self.send_pushcut_alert(alert_data))
        
        # Execute async tasks
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    self.logger.error(f"Alert delivery failed for task {i}: {result}")
    
    def send_console_alert(self, alert_data: Dict[str, Any]):
        """Send alert to console"""
        severity_colors = {
            "CRITICAL": "\033[91m",  # Red
            "HIGH": "\033[91m",      # Red
            "MEDIUM": "\033[93m",    # Yellow
            "LOW": "\033[94m",       # Blue
            "INFO": "\033[92m"       # Green
        }
        
        reset_color = "\033[0m"
        
        if self.config["console"]["color"]:
            color = severity_colors.get(alert_data["severity"], "")
            print(f"\n{color}🚨 ALERT: {alert_data['title']}{reset_color}")
            print(f"{color}Severity: {alert_data['severity']}{reset_color}")
            print(f"{color}Type: {alert_data['type']}{reset_color}")
            print(f"{color}Message: {alert_data['message']}{reset_color}")
            print(f"{color}Time: {alert_data['timestamp']}{reset_color}")
        else:
            print(f"\n🚨 ALERT: {alert_data['title']}")
            print(f"Severity: {alert_data['severity']}")
            print(f"Type: {alert_data['type']}")
            print(f"Message: {alert_data['message']}")
            print(f"Time: {alert_data['timestamp']}")
    
    def send_file_alert(self, alert_data: Dict[str, Any]):
        """Send alert to log file"""
        try:
            log_file = Path(self.config["file"]["log_file"])
            log_file.parent.mkdir(exist_ok=True)
            
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"{json.dumps(alert_data)}\n")
                
        except Exception as e:
            self.logger.error(f"Failed to write alert to file: {e}")
    
    async def send_email_alert(self, alert_data: Dict[str, Any]):
        """Send email alert"""
        try:
            config = self.config["email"]
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = config["from_email"]
            msg['To'] = ", ".join(config["to_emails"])
            msg['Subject'] = f"🚨 War Room Alert: {alert_data['title']}"
            
            # HTML body
            html_body = f"""
            <html>
            <body>
                <h2 style="color: {'red' if alert_data['severity'] in ['CRITICAL', 'HIGH'] else 'orange'};">
                    🚨 War Room Health Alert
                </h2>
                
                <table style="border-collapse: collapse; width: 100%;">
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Title</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">{alert_data['title']}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Severity</td>
                        <td style="border: 1px solid #ddd; padding: 8px; color: {'red' if alert_data['severity'] in ['CRITICAL', 'HIGH'] else 'orange'};">
                            {alert_data['severity']}
                        </td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Type</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">{alert_data['type']}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Message</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">{alert_data['message']}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Timestamp</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">{alert_data['timestamp']}</td>
                    </tr>
                </table>
                
                <p style="margin-top: 20px; color: #666;">
                    This alert was generated by the War Room Health Check Agent.<br>
                    Please investigate immediately if this is a critical alert.
                </p>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            with smtplib.SMTP(config["smtp_server"], config["smtp_port"]) as server:
                if config["use_tls"]:
                    server.starttls()
                
                if config["username"] and config["password"]:
                    server.login(config["username"], config["password"])
                
                server.send_message(msg)
            
            self.logger.info(f"Email alert sent to {config['to_emails']}")
            
        except Exception as e:
            self.logger.error(f"Failed to send email alert: {e}")
    
    async def send_webhook_alert(self, alert_data: Dict[str, Any]):
        """Send webhook alert"""
        try:
            import aiohttp
            
            config = self.config["webhook"]
            
            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method=config["method"],
                    url=config["url"],
                    json=alert_data,
                    headers=config["headers"],
                    timeout=aiohttp.ClientTimeout(total=config["timeout"])
                ) as response:
                    if response.status >= 400:
                        raise Exception(f"Webhook returned status {response.status}")
                    
                    self.logger.info(f"Webhook alert sent to {config['url']}")
                    
        except Exception as e:
            self.logger.error(f"Failed to send webhook alert: {e}")
    
    async def send_slack_alert(self, alert_data: Dict[str, Any]):
        """Send Slack alert"""
        try:
            import aiohttp
            
            config = self.config["slack"]
            
            # Create Slack message
            color = "danger" if alert_data["severity"] in ["CRITICAL", "HIGH"] else "warning"
            
            slack_payload = {
                "channel": config["channel"],
                "username": config["username"],
                "attachments": [
                    {
                        "color": color,
                        "title": f"🚨 War Room Alert: {alert_data['title']}",
                        "fields": [
                            {
                                "title": "Severity",
                                "value": alert_data["severity"],
                                "short": True
                            },
                            {
                                "title": "Type", 
                                "value": alert_data["type"],
                                "short": True
                            },
                            {
                                "title": "Message",
                                "value": alert_data["message"],
                                "short": False
                            }
                        ],
                        "footer": "War Room Health Check Agent",
                        "ts": int(datetime.now().timestamp())
                    }
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    config["webhook_url"],
                    json=slack_payload,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status >= 400:
                        raise Exception(f"Slack webhook returned status {response.status}")
                    
                    self.logger.info(f"Slack alert sent to {config['channel']}")
                    
        except Exception as e:
            self.logger.error(f"Failed to send Slack alert: {e}")
    
    async def send_pushcut_alert(self, alert_data: Dict[str, Any]):
        """Send Pushcut notification (iOS)"""
        try:
            import aiohttp
            
            config = self.config["pushcut"]
            
            # Create Pushcut payload
            pushcut_payload = {
                "title": f"🚨 War Room Alert",
                "text": f"{alert_data['title']}\n\n{alert_data['message']}",
                "isTimeSensitive": alert_data["severity"] in ["CRITICAL", "HIGH"]
            }
            
            url = f"https://api.pushcut.io/v1/notifications/{config['notification_name']}"
            headers = {
                "API-Key": config["api_key"],
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    json=pushcut_payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status >= 400:
                        raise Exception(f"Pushcut API returned status {response.status}")
                    
                    self.logger.info("Pushcut alert sent")
                    
        except Exception as e:
            self.logger.error(f"Failed to send Pushcut alert: {e}")
    
    def get_alert_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent alert history"""
        return self.alert_history[-limit:]
    
    def get_alert_stats(self) -> Dict[str, Any]:
        """Get alert statistics"""
        if not self.alert_history:
            return {"total": 0, "by_severity": {}, "by_type": {}}
        
        stats = {
            "total": len(self.alert_history),
            "by_severity": {},
            "by_type": {},
            "recent_24h": 0
        }
        
        # Count by severity and type
        from collections import Counter
        severities = Counter(alert["severity"] for alert in self.alert_history)
        types = Counter(alert["type"] for alert in self.alert_history)
        
        stats["by_severity"] = dict(severities)
        stats["by_type"] = dict(types)
        
        # Count recent alerts (last 24 hours)
        from datetime import datetime, timezone, timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        
        recent_count = sum(
            1 for alert in self.alert_history
            if datetime.fromisoformat(alert["timestamp"]) > cutoff
        )
        stats["recent_24h"] = recent_count
        
        return stats

# Health check specific alerting functions
class HealthCheckAlerter:
    """Specialized alerting for health check results"""
    
    def __init__(self, alerting_system: AlertingSystem):
        self.alerting = alerting_system
    
    async def alert_critical_failure(self, component: str, error: str, context: Dict[str, Any] = None):
        """Alert for critical component failure"""
        await self.alerting.send_alert(
            alert_type="CRITICAL_FAILURE",
            title=f"Critical Failure: {component}",
            message=f"Component '{component}' has failed critically: {error}",
            severity="CRITICAL",
            context=context or {}
        )
    
    async def alert_migration_not_ready(self, health_score: int, issues: List[str]):
        """Alert when system is not ready for migration"""
        await self.alerting.send_alert(
            alert_type="MIGRATION_READINESS",
            title="Migration Readiness Failed",
            message=f"System is not ready for migration. Health score: {health_score}. Issues: {'; '.join(issues)}",
            severity="HIGH",
            context={"health_score": health_score, "issues": issues}
        )
    
    async def alert_performance_degradation(self, component: str, response_time: float, threshold: float):
        """Alert for performance issues"""
        await self.alerting.send_alert(
            alert_type="PERFORMANCE_DEGRADATION",
            title=f"Performance Issue: {component}",
            message=f"Component '{component}' response time ({response_time:.2f}ms) exceeds threshold ({threshold:.2f}ms)",
            severity="MEDIUM",
            context={"component": component, "response_time": response_time, "threshold": threshold}
        )
    
    async def alert_consecutive_failures(self, failure_count: int, components: List[str]):
        """Alert for consecutive failures"""
        await self.alerting.send_alert(
            alert_type="CONSECUTIVE_FAILURES",
            title=f"Consecutive Failures Detected",
            message=f"{failure_count} consecutive failures detected in: {', '.join(components)}",
            severity="HIGH",
            context={"failure_count": failure_count, "components": components}
        )
    
    async def alert_health_score_drop(self, current_score: int, previous_score: int, threshold: int = 70):
        """Alert for significant health score drops"""
        if current_score < threshold and previous_score >= threshold:
            await self.alerting.send_alert(
                alert_type="HEALTH_SCORE_DROP",
                title="Health Score Dropped Below Threshold",
                message=f"Health score dropped from {previous_score} to {current_score} (threshold: {threshold})",
                severity="MEDIUM",
                context={"current_score": current_score, "previous_score": previous_score, "threshold": threshold}
            )

def create_sample_config():
    """Create a sample alerting configuration file"""
    sample_config = {
        "email": {
            "enabled": False,
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 587,
            "username": "your-email@gmail.com",
            "password": "your-app-password",
            "from_email": "your-email@gmail.com",
            "to_emails": ["admin@yourcompany.com", "devops@yourcompany.com"],
            "use_tls": True
        },
        "webhook": {
            "enabled": False,
            "url": "https://your-webhook-endpoint.com/alerts",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer your-token"
            },
            "timeout": 10
        },
        "slack": {
            "enabled": False,
            "webhook_url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
            "channel": "#war-room-alerts",
            "username": "WarRoom-HealthBot"
        },
        "pushcut": {
            "enabled": False,
            "api_key": "your-pushcut-api-key",
            "notification_name": "WarRoomAlert"
        },
        "console": {
            "enabled": True,
            "color": True
        },
        "file": {
            "enabled": True,
            "log_file": "logs/alerts.log"
        }
    }
    
    config_file = Path(__file__).parent / "alerting_config.json"
    with open(config_file, 'w') as f:
        json.dump(sample_config, f, indent=2)
    
    print(f"Sample config created at: {config_file}")
    return config_file

def main():
    """Test the alerting system"""
    import argparse
    
    parser = argparse.ArgumentParser(description="War Room Alerting System")
    parser.add_argument("--create-config", action="store_true", help="Create sample config file")
    parser.add_argument("--test", action="store_true", help="Send test alert")
    parser.add_argument("--config", help="Config file path")
    
    args = parser.parse_args()
    
    if args.create_config:
        create_sample_config()
        return
    
    # Test alert
    if args.test:
        async def test_alert():
            alerting = AlertingSystem(args.config)
            await alerting.send_alert(
                alert_type="TEST",
                title="Test Alert",
                message="This is a test alert to verify the alerting system is working.",
                severity="INFO"
            )
            print("Test alert sent!")
        
        asyncio.run(test_alert())

if __name__ == "__main__":
    main()