"""Security Issue Prioritization and Alerting System

Advanced security monitoring and alerting:
- Real-time security issue detection
- Risk-based prioritization
- Multi-channel alerting
- Escalation procedures
- Integration with security databases
- Automated threat assessment
"""

import asyncio
import json
import logging
import hashlib
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import aiohttp
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import yaml
import re

from feedback_parser import ParsedFeedback, FeedbackCategory

logger = logging.getLogger(__name__)

class SecuritySeverity(Enum):
    """Security severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "info"

class AlertChannel(Enum):
    """Alert delivery channels"""
    EMAIL = "email"
    SLACK = "slack"
    GITHUB_ISSUE = "github_issue"
    WEBHOOK = "webhook"
    SMS = "sms"
    TEAMS = "teams"

class ThreatCategory(Enum):
    """Categories of security threats"""
    INJECTION = "injection"
    BROKEN_AUTH = "broken_authentication"
    SENSITIVE_DATA = "sensitive_data"
    XXE = "xxe"
    BROKEN_ACCESS = "broken_access_control"
    SECURITY_MISCONFIG = "security_misconfiguration"
    XSS = "xss"
    DESERIALIZATION = "insecure_deserialization"
    COMPONENTS = "vulnerable_components"
    INSUFFICIENT_LOGGING = "insufficient_logging"
    CRYPTOGRAPHIC = "cryptographic_failures"

@dataclass
class SecurityIssue:
    """Security issue with detailed analysis"""
    id: str
    title: str
    description: str
    severity: SecuritySeverity
    threat_category: ThreatCategory
    file_path: str
    line_number: int
    code_snippet: Optional[str]
    
    # Risk assessment
    exploit_probability: float
    impact_score: float
    risk_score: float
    
    # Classification
    cve_references: List[str] = field(default_factory=list)
    cwe_references: List[str] = field(default_factory=list)
    owasp_category: Optional[str] = None
    
    # Context
    affected_systems: List[str] = field(default_factory=list)
    business_impact: str = "unknown"
    remediation_effort: str = "unknown"
    
    # Tracking
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    status: str = "open"
    
    # Metadata
    source: str = "coderabbit"
    confidence: float = 0.0
    false_positive: bool = False
    suppressed: bool = False

@dataclass
class AlertRule:
    """Alert rule configuration"""
    id: str
    name: str
    severity_threshold: SecuritySeverity
    threat_categories: List[ThreatCategory]
    channels: List[AlertChannel]
    escalation_delay: timedelta
    max_alerts_per_hour: int = 10
    enabled: bool = True

@dataclass
class AlertInstance:
    """Individual alert instance"""
    id: str
    rule_id: str
    issue_id: str
    channel: AlertChannel
    sent_at: datetime
    acknowledged_at: Optional[datetime] = None
    escalated: bool = False
    delivery_status: str = "pending"

class SecurityAlertingSystem:
    """Comprehensive security alerting and prioritization system"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config = self._load_configuration(config_path)
        self.security_issues = {}
        self.alert_rules = {}
        self.alert_history = []
        self.escalated_issues = set()
        
        # Threat intelligence
        self.cve_database = {}
        self.threat_patterns = self._load_threat_patterns()
        self.risk_models = self._load_risk_models()
        
        # Alert tracking
        self.alert_stats = {
            "total_issues": 0,
            "critical_issues": 0,
            "alerts_sent": 0,
            "false_positives": 0,
            "escalations": 0
        }
        
        # Rate limiting
        self.alert_rate_limiter = {}
        
        self._initialize_default_rules()
        self._load_threat_intelligence()
    
    def _load_configuration(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load alerting system configuration"""
        try:
            if config_path:
                with open(config_path, 'r') as f:
                    return yaml.safe_load(f)
            else:
                # Default configuration
                return {
                    "email": {
                        "smtp_server": "localhost",
                        "smtp_port": 587,
                        "username": "",
                        "password": "",
                        "from_address": "security@warroom.dev",
                        "to_addresses": ["security-team@warroom.dev"]
                    },
                    "slack": {
                        "webhook_url": "",
                        "channel": "#security-alerts"
                    },
                    "github": {
                        "token": "",
                        "repository": "",
                        "labels": ["security", "urgent"]
                    },
                    "escalation": {
                        "critical_delay_minutes": 15,
                        "high_delay_minutes": 60,
                        "medium_delay_minutes": 240
                    }
                }
        except Exception as e:
            logger.warning(f"Could not load configuration: {e}")
            return {}
    
    def _load_threat_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Load known threat patterns and signatures"""
        return {
            "sql_injection": {
                "patterns": [
                    r"execute\s*\(\s*['\"].*\+.*['\"]",
                    r"query\s*\(\s*['\"].*\%.*['\"]",
                    r"SELECT.*FROM.*WHERE.*=.*\+",
                    r"INSERT.*VALUES.*\+",
                    r"UPDATE.*SET.*=.*\+"
                ],
                "severity": SecuritySeverity.CRITICAL,
                "category": ThreatCategory.INJECTION,
                "cwe": ["CWE-89"],
                "owasp": "A03:2021"
            },
            "xss": {
                "patterns": [
                    r"innerHTML\s*=.*\+",
                    r"document\.write\s*\(.*\+",
                    r"eval\s*\(.*user.*\)",
                    r"setTimeout\s*\(.*user.*\)",
                    r"<script>.*</script>"
                ],
                "severity": SecuritySeverity.HIGH,
                "category": ThreatCategory.XSS,
                "cwe": ["CWE-79"],
                "owasp": "A03:2021"
            },
            "hardcoded_secrets": {
                "patterns": [
                    r"api[_-]?key\s*=\s*['\"][a-zA-Z0-9]{20,}",
                    r"password\s*=\s*['\"][^'\"]{8,}",
                    r"secret\s*=\s*['\"][^'\"]{16,}",
                    r"token\s*=\s*['\"][^'\"]{20,}",
                    r"private[_-]?key.*BEGIN.*PRIVATE.*KEY"
                ],
                "severity": SecuritySeverity.HIGH,
                "category": ThreatCategory.SENSITIVE_DATA,
                "cwe": ["CWE-798"],
                "owasp": "A02:2021"
            },
            "unsafe_deserialization": {
                "patterns": [
                    r"pickle\.loads?\s*\(",
                    r"yaml\.load\s*\(",
                    r"json\.loads\s*\(.*user",
                    r"ObjectInputStream\s*\(",
                    r"unserialize\s*\("
                ],
                "severity": SecuritySeverity.CRITICAL,
                "category": ThreatCategory.DESERIALIZATION,
                "cwe": ["CWE-502"],
                "owasp": "A08:2021"
            },
            "path_traversal": {
                "patterns": [
                    r"\.\.\/",
                    r"\.\.\\",
                    r"file.*\+.*user",
                    r"open\s*\(.*user.*\)",
                    r"readFile\s*\(.*user.*\)"
                ],
                "severity": SecuritySeverity.HIGH,
                "category": ThreatCategory.BROKEN_ACCESS,
                "cwe": ["CWE-22"],
                "owasp": "A01:2021"
            },
            "weak_crypto": {
                "patterns": [
                    r"md5\s*\(",
                    r"sha1\s*\(",
                    r"DES\s*\(",
                    r"RC4\s*\(",
                    r"ECB\s*mode"
                ],
                "severity": SecuritySeverity.MEDIUM,
                "category": ThreatCategory.CRYPTOGRAPHIC,
                "cwe": ["CWE-327", "CWE-328"],
                "owasp": "A02:2021"
            }
        }
    
    def _load_risk_models(self) -> Dict[str, Dict[str, Any]]:
        """Load risk assessment models"""
        return {
            "exploit_probability": {
                "critical_severity": 0.9,
                "high_severity": 0.7,
                "medium_severity": 0.4,
                "low_severity": 0.1,
                "public_cve": 0.8,
                "known_exploit": 0.9,
                "authentication_required": -0.3,
                "network_access_required": -0.2
            },
            "impact_scoring": {
                "data_exposure": 8.0,
                "system_compromise": 10.0,
                "denial_of_service": 6.0,
                "privilege_escalation": 9.0,
                "information_disclosure": 5.0,
                "code_execution": 10.0
            },
            "business_impact": {
                "authentication_system": 10.0,
                "payment_processing": 10.0,
                "user_data": 8.0,
                "admin_functions": 9.0,
                "public_api": 7.0,
                "internal_tools": 5.0
            }
        }
    
    def _initialize_default_rules(self):
        """Initialize default alert rules"""
        # Critical security issues - immediate alert
        self.alert_rules["critical_immediate"] = AlertRule(
            id="critical_immediate",
            name="Critical Security Issues - Immediate",
            severity_threshold=SecuritySeverity.CRITICAL,
            threat_categories=list(ThreatCategory),
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.GITHUB_ISSUE],
            escalation_delay=timedelta(minutes=15),
            max_alerts_per_hour=50
        )
        
        # High severity issues
        self.alert_rules["high_priority"] = AlertRule(
            id="high_priority",
            name="High Priority Security Issues",
            severity_threshold=SecuritySeverity.HIGH,
            threat_categories=[
                ThreatCategory.INJECTION, ThreatCategory.XSS,
                ThreatCategory.BROKEN_AUTH, ThreatCategory.SENSITIVE_DATA
            ],
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK],
            escalation_delay=timedelta(hours=1),
            max_alerts_per_hour=20
        )
        
        # Medium severity issues - business hours only
        self.alert_rules["medium_business_hours"] = AlertRule(
            id="medium_business_hours",
            name="Medium Severity - Business Hours",
            severity_threshold=SecuritySeverity.MEDIUM,
            threat_categories=list(ThreatCategory),
            channels=[AlertChannel.EMAIL],
            escalation_delay=timedelta(hours=4),
            max_alerts_per_hour=10
        )
    
    def _load_threat_intelligence(self):
        """Load threat intelligence data"""
        # This would typically load from external sources
        # For now, we'll use a basic hardcoded set
        self.cve_database = {
            "CVE-2021-44228": {  # Log4j
                "severity": "critical",
                "description": "Log4j Remote Code Execution",
                "exploit_probability": 0.95,
                "active_exploits": True
            },
            "CVE-2021-34527": {  # PrintNightmare
                "severity": "critical",
                "description": "Windows Print Spooler Remote Code Execution",
                "exploit_probability": 0.9,
                "active_exploits": True
            }
        }
    
    async def process_security_feedback(self, feedback_list: List[ParsedFeedback]) -> Dict[str, Any]:
        """Process feedback and generate security issues"""
        security_feedback = [
            fb for fb in feedback_list 
            if fb.category == FeedbackCategory.SECURITY
        ]
        
        if not security_feedback:
            return {
                "status": "no_security_issues",
                "processed": 0
            }
        
        # Convert feedback to security issues
        new_issues = []
        for feedback in security_feedback:
            issue = await self._create_security_issue(feedback)
            if issue:
                new_issues.append(issue)
                self.security_issues[issue.id] = issue
        
        # Prioritize issues
        prioritized_issues = self._prioritize_issues(new_issues)
        
        # Generate alerts
        alert_results = []
        for issue in prioritized_issues:
            result = await self._process_issue_alerts(issue)
            alert_results.append(result)
        
        # Update statistics
        self.alert_stats["total_issues"] += len(new_issues)
        self.alert_stats["critical_issues"] += len([
            i for i in new_issues if i.severity == SecuritySeverity.CRITICAL
        ])
        
        return {
            "status": "completed",
            "new_issues": len(new_issues),
            "critical_issues": len([i for i in new_issues if i.severity == SecuritySeverity.CRITICAL]),
            "alerts_generated": len(alert_results),
            "escalations": len([r for r in alert_results if r.get("escalated")]),
            "issues": [self._issue_to_dict(issue) for issue in new_issues]
        }
    
    async def _create_security_issue(self, feedback: ParsedFeedback) -> Optional[SecurityIssue]:
        """Create security issue from parsed feedback"""
        try:
            # Analyze threat patterns
            threat_analysis = self._analyze_threat_patterns(feedback)
            if not threat_analysis:
                return None
            
            # Calculate risk scores
            exploit_prob = self._calculate_exploit_probability(feedback, threat_analysis)
            impact_score = self._calculate_impact_score(feedback, threat_analysis)
            risk_score = exploit_prob * impact_score
            
            # Determine severity
            severity = self._determine_severity(risk_score, threat_analysis)
            
            # Extract references
            cve_refs = self._extract_cve_references(feedback.description)
            cwe_refs = threat_analysis.get("cwe", [])
            
            issue = SecurityIssue(
                id=self._generate_issue_id(feedback),
                title=f"Security Issue: {feedback.title}",
                description=feedback.description,
                severity=severity,
                threat_category=threat_analysis["category"],
                file_path=feedback.file_path,
                line_number=feedback.line_number,
                code_snippet=feedback.code_snippet,
                exploit_probability=exploit_prob,
                impact_score=impact_score,
                risk_score=risk_score,
                cve_references=cve_refs,
                cwe_references=cwe_refs,
                owasp_category=threat_analysis.get("owasp"),
                business_impact=self._assess_business_impact(feedback),
                remediation_effort=self._estimate_remediation_effort(feedback),
                confidence=getattr(feedback.confidence, 'value', 0.5) if hasattr(feedback.confidence, 'value') else 0.5
            )
            
            logger.info(f"Created security issue: {issue.id} (severity: {severity.value})")
            return issue
        
        except Exception as e:
            logger.error(f"Error creating security issue from feedback: {e}")
            return None
    
    def _analyze_threat_patterns(self, feedback: ParsedFeedback) -> Optional[Dict[str, Any]]:
        """Analyze feedback against known threat patterns"""
        combined_text = f"{feedback.description} {feedback.code_snippet or ''}".lower()
        
        for pattern_name, pattern_info in self.threat_patterns.items():
            for pattern in pattern_info["patterns"]:
                if re.search(pattern, combined_text, re.IGNORECASE):
                    return pattern_info
        
        # Default analysis if no specific pattern matches
        return {
            "category": ThreatCategory.SECURITY_MISCONFIG,
            "severity": SecuritySeverity.MEDIUM,
            "cwe": ["CWE-16"],
            "owasp": "A05:2021"
        }
    
    def _calculate_exploit_probability(self, feedback: ParsedFeedback, threat_analysis: Dict[str, Any]) -> float:
        """Calculate probability of successful exploitation"""
        base_prob = 0.3
        
        # Adjust based on severity
        severity_adjustments = self.risk_models["exploit_probability"]
        if threat_analysis["severity"] == SecuritySeverity.CRITICAL:
            base_prob += 0.4
        elif threat_analysis["severity"] == SecuritySeverity.HIGH:
            base_prob += 0.3
        elif threat_analysis["severity"] == SecuritySeverity.MEDIUM:
            base_prob += 0.1
        
        # Check for known CVEs
        cve_refs = self._extract_cve_references(feedback.description)
        if cve_refs:
            for cve in cve_refs:
                if cve in self.cve_database:
                    cve_data = self.cve_database[cve]
                    if cve_data.get("active_exploits"):
                        base_prob += 0.3
                    base_prob += 0.2
        
        # Adjust based on file location
        if any(path in feedback.file_path.lower() for path in ["auth", "login", "admin"]):
            base_prob += 0.2
        
        if any(path in feedback.file_path.lower() for path in ["test", "mock", "example"]):
            base_prob -= 0.3
        
        return max(0.0, min(1.0, base_prob))
    
    def _calculate_impact_score(self, feedback: ParsedFeedback, threat_analysis: Dict[str, Any]) -> float:
        """Calculate potential impact score"""
        base_impact = 5.0
        
        # Category-based impact
        category_impacts = {
            ThreatCategory.INJECTION: 9.0,
            ThreatCategory.BROKEN_AUTH: 9.0,
            ThreatCategory.SENSITIVE_DATA: 8.0,
            ThreatCategory.XXE: 7.0,
            ThreatCategory.BROKEN_ACCESS: 8.0,
            ThreatCategory.SECURITY_MISCONFIG: 6.0,
            ThreatCategory.XSS: 7.0,
            ThreatCategory.DESERIALIZATION: 9.0,
            ThreatCategory.COMPONENTS: 6.0,
            ThreatCategory.INSUFFICIENT_LOGGING: 4.0,
            ThreatCategory.CRYPTOGRAPHIC: 6.0
        }
        
        base_impact = category_impacts.get(threat_analysis["category"], 5.0)
        
        # File-based adjustments
        business_impacts = self.risk_models["business_impact"]
        for system, multiplier in business_impacts.items():
            if system in feedback.file_path.lower():
                base_impact = max(base_impact, multiplier)
        
        return base_impact
    
    def _determine_severity(self, risk_score: float, threat_analysis: Dict[str, Any]) -> SecuritySeverity:
        """Determine severity based on risk score and threat analysis"""
        # Use pattern-defined severity as baseline
        base_severity = threat_analysis.get("severity", SecuritySeverity.MEDIUM)
        
        # Adjust based on risk score
        if risk_score >= 8.0:
            return SecuritySeverity.CRITICAL
        elif risk_score >= 6.0:
            return SecuritySeverity.HIGH
        elif risk_score >= 4.0:
            return SecuritySeverity.MEDIUM
        elif risk_score >= 2.0:
            return SecuritySeverity.LOW
        else:
            return SecuritySeverity.INFORMATIONAL
    
    def _extract_cve_references(self, text: str) -> List[str]:
        """Extract CVE references from text"""
        cve_pattern = r"CVE-\d{4}-\d{4,7}"
        matches = re.findall(cve_pattern, text, re.IGNORECASE)
        return [match.upper() for match in matches]
    
    def _assess_business_impact(self, feedback: ParsedFeedback) -> str:
        """Assess business impact of the security issue"""
        file_path_lower = feedback.file_path.lower()
        
        if any(keyword in file_path_lower for keyword in ["payment", "billing", "checkout"]):
            return "critical"
        elif any(keyword in file_path_lower for keyword in ["auth", "login", "user", "admin"]):
            return "high"
        elif any(keyword in file_path_lower for keyword in ["api", "service", "controller"]):
            return "medium"
        else:
            return "low"
    
    def _estimate_remediation_effort(self, feedback: ParsedFeedback) -> str:
        """Estimate effort required for remediation"""
        if feedback.suggested_fix:
            if len(feedback.suggested_fix) < 100:
                return "low"
            elif len(feedback.suggested_fix) < 500:
                return "medium"
            else:
                return "high"
        
        # Estimate based on complexity
        if feedback.fix_complexity == "high":
            return "high"
        elif feedback.fix_complexity == "medium":
            return "medium"
        else:
            return "low"
    
    def _prioritize_issues(self, issues: List[SecurityIssue]) -> List[SecurityIssue]:
        """Prioritize security issues by risk score and severity"""
        return sorted(
            issues,
            key=lambda x: (x.severity.value, -x.risk_score, x.created_at),
            reverse=True
        )
    
    async def _process_issue_alerts(self, issue: SecurityIssue) -> Dict[str, Any]:
        """Process alerts for a security issue"""
        alerts_sent = []
        escalated = False
        
        # Find applicable alert rules
        applicable_rules = self._find_applicable_rules(issue)
        
        for rule in applicable_rules:
            # Check rate limiting
            if not self._check_rate_limit(rule):
                logger.warning(f"Rate limit exceeded for rule {rule.id}")
                continue
            
            # Send alerts for each channel
            for channel in rule.channels:
                try:
                    alert_result = await self._send_alert(issue, channel, rule)
                    if alert_result["status"] == "success":
                        alerts_sent.append({
                            "channel": channel.value,
                            "rule_id": rule.id,
                            "sent_at": datetime.utcnow().isoformat()
                        })
                        
                        # Record alert instance
                        self._record_alert_instance(issue, rule, channel)
                
                except Exception as e:
                    logger.error(f"Failed to send alert via {channel.value}: {e}")
            
            # Schedule escalation if needed
            if issue.severity == SecuritySeverity.CRITICAL:
                escalated = await self._schedule_escalation(issue, rule)
        
        self.alert_stats["alerts_sent"] += len(alerts_sent)
        if escalated:
            self.alert_stats["escalations"] += 1
        
        return {
            "issue_id": issue.id,
            "alerts_sent": len(alerts_sent),
            "channels": [alert["channel"] for alert in alerts_sent],
            "escalated": escalated,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _find_applicable_rules(self, issue: SecurityIssue) -> List[AlertRule]:
        """Find alert rules applicable to an issue"""
        applicable = []
        
        for rule in self.alert_rules.values():
            if not rule.enabled:
                continue
            
            # Check severity threshold
            severity_order = [s.value for s in SecuritySeverity]
            if severity_order.index(issue.severity.value) > severity_order.index(rule.severity_threshold.value):
                continue
            
            # Check threat categories
            if rule.threat_categories and issue.threat_category not in rule.threat_categories:
                continue
            
            applicable.append(rule)
        
        return applicable
    
    def _check_rate_limit(self, rule: AlertRule) -> bool:
        """Check if rule is within rate limits"""
        current_time = datetime.utcnow()
        hour_ago = current_time - timedelta(hours=1)
        
        # Count alerts in the last hour for this rule
        recent_alerts = [
            alert for alert in self.alert_history
            if alert.rule_id == rule.id and alert.sent_at >= hour_ago
        ]
        
        return len(recent_alerts) < rule.max_alerts_per_hour
    
    async def _send_alert(self, issue: SecurityIssue, channel: AlertChannel, rule: AlertRule) -> Dict[str, Any]:
        """Send alert via specified channel"""
        try:
            if channel == AlertChannel.EMAIL:
                return await self._send_email_alert(issue, rule)
            elif channel == AlertChannel.SLACK:
                return await self._send_slack_alert(issue, rule)
            elif channel == AlertChannel.GITHUB_ISSUE:
                return await self._create_github_issue(issue, rule)
            elif channel == AlertChannel.WEBHOOK:
                return await self._send_webhook_alert(issue, rule)
            elif channel == AlertChannel.SMS:
                return await self._send_sms_alert(issue, rule)
            elif channel == AlertChannel.TEAMS:
                return await self._send_teams_alert(issue, rule)
            else:
                return {"status": "error", "message": f"Unsupported channel: {channel}"}
        
        except Exception as e:
            logger.error(f"Alert sending failed for {channel}: {e}")
            return {"status": "error", "message": str(e)}
    
    async def _send_email_alert(self, issue: SecurityIssue, rule: AlertRule) -> Dict[str, Any]:
        """Send email alert"""
        try:
            email_config = self.config.get("email", {})
            
            msg = MIMEMultipart()
            msg['From'] = email_config.get("from_address", "security@warroom.dev")
            msg['To'] = ", ".join(email_config.get("to_addresses", []))
            msg['Subject'] = f"🚨 Security Alert: {issue.severity.value.upper()} - {issue.title}"
            
            # Create email body
            body = self._create_email_body(issue)
            msg.attach(MIMEText(body, 'html'))
            
            # Send email
            server = smtplib.SMTP(email_config.get("smtp_server"), email_config.get("smtp_port", 587))
            if email_config.get("username"):
                server.starttls()
                server.login(email_config.get("username"), email_config.get("password"))
            
            server.send_message(msg)
            server.quit()
            
            return {"status": "success", "channel": "email"}
        
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def _send_slack_alert(self, issue: SecurityIssue, rule: AlertRule) -> Dict[str, Any]:
        """Send Slack alert"""
        try:
            slack_config = self.config.get("slack", {})
            webhook_url = slack_config.get("webhook_url")
            
            if not webhook_url:
                return {"status": "error", "message": "Slack webhook URL not configured"}
            
            # Create Slack payload
            payload = {
                "text": f"🚨 Security Alert: {issue.severity.value.upper()}",
                "attachments": [
                    {
                        "color": self._get_severity_color(issue.severity),
                        "title": issue.title,
                        "text": issue.description,
                        "fields": [
                            {"title": "File", "value": issue.file_path, "short": True},
                            {"title": "Line", "value": str(issue.line_number), "short": True},
                            {"title": "Risk Score", "value": f"{issue.risk_score:.2f}", "short": True},
                            {"title": "Category", "value": issue.threat_category.value, "short": True}
                        ],
                        "footer": "CodeRabbit Security Monitor",
                        "ts": int(issue.created_at.timestamp())
                    }
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(webhook_url, json=payload) as response:
                    if response.status == 200:
                        return {"status": "success", "channel": "slack"}
                    else:
                        return {"status": "error", "message": f"Slack API error: {response.status}"}
        
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def _create_github_issue(self, issue: SecurityIssue, rule: AlertRule) -> Dict[str, Any]:
        """Create GitHub issue for security alert"""
        try:
            github_config = self.config.get("github", {})
            token = github_config.get("token")
            repository = github_config.get("repository")
            
            if not token or not repository:
                return {"status": "error", "message": "GitHub configuration incomplete"}
            
            # Create issue payload
            payload = {
                "title": f"🚨 Security: {issue.title}",
                "body": self._create_github_issue_body(issue),
                "labels": github_config.get("labels", ["security"])
            }
            
            headers = {
                "Authorization": f"token {token}",
                "Accept": "application/vnd.github.v3+json"
            }
            
            url = f"https://api.github.com/repos/{repository}/issues"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as response:
                    if response.status == 201:
                        issue_data = await response.json()
                        return {
                            "status": "success",
                            "channel": "github_issue",
                            "issue_url": issue_data.get("html_url")
                        }
                    else:
                        return {"status": "error", "message": f"GitHub API error: {response.status}"}
        
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def _send_webhook_alert(self, issue: SecurityIssue, rule: AlertRule) -> Dict[str, Any]:
        """Send webhook alert"""
        # Implementation for custom webhook alerts
        return {"status": "not_implemented"}
    
    async def _send_sms_alert(self, issue: SecurityIssue, rule: AlertRule) -> Dict[str, Any]:
        """Send SMS alert"""
        # Implementation for SMS alerts (e.g., via Twilio)
        return {"status": "not_implemented"}
    
    async def _send_teams_alert(self, issue: SecurityIssue, rule: AlertRule) -> Dict[str, Any]:
        """Send Microsoft Teams alert"""
        # Implementation for Teams alerts
        return {"status": "not_implemented"}
    
    def _create_email_body(self, issue: SecurityIssue) -> str:
        """Create HTML email body for security alert"""
        return f"""
        <html>
        <head><title>Security Alert</title></head>
        <body>
            <h2 style="color: {self._get_severity_color(issue.severity)}">
                🚨 Security Alert: {issue.severity.value.upper()}
            </h2>
            <h3>{issue.title}</h3>
            
            <table border="1" cellpadding="5" cellspacing="0">
                <tr><td><strong>File:</strong></td><td>{issue.file_path}</td></tr>
                <tr><td><strong>Line:</strong></td><td>{issue.line_number}</td></tr>
                <tr><td><strong>Category:</strong></td><td>{issue.threat_category.value}</td></tr>
                <tr><td><strong>Risk Score:</strong></td><td>{issue.risk_score:.2f}</td></tr>
                <tr><td><strong>Business Impact:</strong></td><td>{issue.business_impact}</td></tr>
                <tr><td><strong>Created:</strong></td><td>{issue.created_at.isoformat()}</td></tr>
            </table>
            
            <h4>Description:</h4>
            <p>{issue.description}</p>
            
            {f'<h4>Code Snippet:</h4><pre>{issue.code_snippet}</pre>' if issue.code_snippet else ''}
            
            {f'<h4>CVE References:</h4><ul>{"".join([f"<li>{cve}</li>" for cve in issue.cve_references])}</ul>' if issue.cve_references else ''}
            
            <p><em>Generated by CodeRabbit Security Monitor</em></p>
        </body>
        </html>
        """
    
    def _create_github_issue_body(self, issue: SecurityIssue) -> str:
        """Create GitHub issue body for security alert"""
        body = f"""## 🚨 Security Alert: {issue.severity.value.upper()}

**File:** `{issue.file_path}`
**Line:** {issue.line_number}
**Category:** {issue.threat_category.value}
**Risk Score:** {issue.risk_score:.2f}
**Business Impact:** {issue.business_impact}

### Description
{issue.description}
"""
        
        if issue.code_snippet:
            body += f"\n### Code Snippet\n```\n{issue.code_snippet}\n```\n"
        
        if issue.cve_references:
            body += f"\n### CVE References\n" + "\n".join([f"- {cve}" for cve in issue.cve_references])
        
        if issue.cwe_references:
            body += f"\n### CWE References\n" + "\n".join([f"- {cwe}" for cwe in issue.cwe_references])
        
        body += f"\n\n**Created:** {issue.created_at.isoformat()}\n**Source:** CodeRabbit Security Monitor"
        
        return body
    
    def _get_severity_color(self, severity: SecuritySeverity) -> str:
        """Get color code for severity level"""
        colors = {
            SecuritySeverity.CRITICAL: "#FF0000",
            SecuritySeverity.HIGH: "#FF6600",
            SecuritySeverity.MEDIUM: "#FFAA00",
            SecuritySeverity.LOW: "#FFFF00",
            SecuritySeverity.INFORMATIONAL: "#00AA00"
        }
        return colors.get(severity, "#808080")
    
    async def _schedule_escalation(self, issue: SecurityIssue, rule: AlertRule) -> bool:
        """Schedule escalation for critical issues"""
        if issue.id in self.escalated_issues:
            return False
        
        try:
            # Mark for escalation
            self.escalated_issues.add(issue.id)
            
            # Schedule escalation (in a real implementation, this would use a job queue)
            # For now, we'll just log the escalation
            logger.critical(f"ESCALATION SCHEDULED: Security issue {issue.id} - {issue.title}")
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to schedule escalation: {e}")
            return False
    
    def _record_alert_instance(self, issue: SecurityIssue, rule: AlertRule, channel: AlertChannel):
        """Record alert instance for tracking"""
        alert_instance = AlertInstance(
            id=self._generate_alert_id(issue, rule, channel),
            rule_id=rule.id,
            issue_id=issue.id,
            channel=channel,
            sent_at=datetime.utcnow(),
            delivery_status="sent"
        )
        
        self.alert_history.append(alert_instance)
    
    def _generate_issue_id(self, feedback: ParsedFeedback) -> str:
        """Generate unique issue ID"""
        content = f"{feedback.file_path}:{feedback.line_number}:{feedback.description}"
        return f"SEC-{hashlib.md5(content.encode()).hexdigest()[:8].upper()}"
    
    def _generate_alert_id(self, issue: SecurityIssue, rule: AlertRule, channel: AlertChannel) -> str:
        """Generate unique alert ID"""
        content = f"{issue.id}:{rule.id}:{channel.value}:{datetime.utcnow().isoformat()}"
        return f"ALERT-{hashlib.md5(content.encode()).hexdigest()[:8].upper()}"
    
    def _issue_to_dict(self, issue: SecurityIssue) -> Dict[str, Any]:
        """Convert security issue to dictionary"""
        return {
            "id": issue.id,
            "title": issue.title,
            "description": issue.description[:200] + "..." if len(issue.description) > 200 else issue.description,
            "severity": issue.severity.value,
            "threat_category": issue.threat_category.value,
            "file_path": issue.file_path,
            "line_number": issue.line_number,
            "risk_score": issue.risk_score,
            "business_impact": issue.business_impact,
            "created_at": issue.created_at.isoformat(),
            "status": issue.status,
            "cve_references": issue.cve_references,
            "confidence": issue.confidence
        }
    
    def get_security_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive security dashboard data"""
        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        
        # Recent issues
        recent_issues = [
            issue for issue in self.security_issues.values()
            if issue.created_at >= last_24h
        ]
        
        # Severity breakdown
        severity_breakdown = {}
        for severity in SecuritySeverity:
            severity_breakdown[severity.value] = len([
                issue for issue in self.security_issues.values()
                if issue.severity == severity and issue.status == "open"
            ])
        
        # Category breakdown
        category_breakdown = {}
        for category in ThreatCategory:
            category_breakdown[category.value] = len([
                issue for issue in self.security_issues.values()
                if issue.threat_category == category and issue.status == "open"
            ])
        
        return {
            "summary": {
                "total_open_issues": len([i for i in self.security_issues.values() if i.status == "open"]),
                "critical_issues": severity_breakdown.get("critical", 0),
                "high_issues": severity_breakdown.get("high", 0),
                "recent_issues_24h": len(recent_issues),
                "average_risk_score": sum(i.risk_score for i in self.security_issues.values()) / max(len(self.security_issues), 1)
            },
            "breakdown": {
                "by_severity": severity_breakdown,
                "by_category": category_breakdown
            },
            "alerts": {
                **self.alert_stats,
                "recent_alerts_24h": len([
                    alert for alert in self.alert_history
                    if alert.sent_at >= last_24h
                ]),
                "escalated_issues": len(self.escalated_issues)
            },
            "top_issues": [
                self._issue_to_dict(issue) for issue in 
                sorted(self.security_issues.values(), key=lambda x: x.risk_score, reverse=True)[:10]
            ],
            "timestamp": now.isoformat()
        }