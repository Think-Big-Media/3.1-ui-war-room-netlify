#!/usr/bin/env python3
"""
Security Audit Script for Environment Configuration
Detects hardcoded secrets, development URLs, and security vulnerabilities
"""
import os
import re
import json
import argparse
from pathlib import Path
from typing import List, Dict, Set, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import subprocess
import fnmatch


class SecurityLevel(Enum):
    """Security issue severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


@dataclass
class SecurityIssue:
    """Represents a security issue found during audit"""
    file_path: str
    line_number: int
    issue_type: str
    severity: SecurityLevel
    description: str
    line_content: str
    suggestions: List[str]
    confidence: float  # 0-1, how confident we are this is a real issue


@dataclass
class SecurityAuditReport:
    """Complete security audit report"""
    total_files_scanned: int
    issues_found: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    issues: List[SecurityIssue]
    summary: Dict[str, int]
    is_secure: bool


class EnvironmentSecurityAuditor:
    """Comprehensive security auditor for environment configuration"""
    
    def __init__(self, root_path: str = "."):
        self.root_path = Path(root_path)
        self.issues: List[SecurityIssue] = []
        self.files_scanned = 0
        
        # File patterns to scan
        self.scan_patterns = [
            "**/*.py", "**/*.js", "**/*.ts", "**/*.tsx", "**/*.jsx",
            "**/*.json", "**/*.yaml", "**/*.yml", "**/*.env*",
            "**/*.config.*", "**/*.conf", "**/Dockerfile*", "**/docker-compose*"
        ]
        
        # File patterns to ignore
        self.ignore_patterns = [
            "**/node_modules/**", "**/venv/**", "**/.git/**", "**/dist/**",
            "**/build/**", "**/.next/**", "**/coverage/**", "**/__pycache__/**",
            "**/*.min.js", "**/*.map", "**/logs/**", "**/tmp/**"
        ]
        
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Compile regex patterns for efficient scanning"""
        
        # Hardcoded secrets patterns
        self.secret_patterns = {
            "api_keys": [
                (r"(?i)(api[_-]?key|apikey)\s*[:=]\s*['\"]([a-zA-Z0-9_\-]{20,})['\"]", SecurityLevel.CRITICAL),
                (r"(?i)(secret[_-]?key|secretkey)\s*[:=]\s*['\"]([a-zA-Z0-9_\-]{20,})['\"]", SecurityLevel.CRITICAL),
                (r"(?i)(access[_-]?token|accesstoken)\s*[:=]\s*['\"]([a-zA-Z0-9_\-]{20,})['\"]", SecurityLevel.CRITICAL),
                (r"sk-[a-zA-Z0-9]{48}", SecurityLevel.CRITICAL),  # OpenAI API key
                (r"pk_live_[0-9a-zA-Z]{24}", SecurityLevel.CRITICAL),  # Stripe live key
                (r"pk_test_[0-9a-zA-Z]{24}", SecurityLevel.MEDIUM),  # Stripe test key
                (r"SG\.[a-zA-Z0-9_\-\.]{22}\.[a-zA-Z0-9_\-\.]{43}", SecurityLevel.CRITICAL),  # SendGrid
                (r"AIza[0-9A-Za-z_\-]{35}", SecurityLevel.CRITICAL),  # Google API key
                (r"ya29\.[0-9A-Za-z_\-]{68,}", SecurityLevel.CRITICAL),  # Google OAuth2 access token
            ],
            "database_urls": [
                (r"(?i)(database[_-]?url|db[_-]?url)\s*[:=]\s*['\"]?(postgresql|mysql|mongodb)://[^'\"\\s]+['\"]?", SecurityLevel.CRITICAL),
                (r"(?i)(redis[_-]?url)\s*[:=]\s*['\"]?redis://[^'\"\\s]+['\"]?", SecurityLevel.HIGH),
            ],
            "jwt_secrets": [
                (r"(?i)(jwt[_-]?secret|jwtsecret)\s*[:=]\s*['\"]([a-zA-Z0-9_\-]{16,})['\"]", SecurityLevel.CRITICAL),
                (r"(?i)Bearer\s+[a-zA-Z0-9_\-\.]{20,}", SecurityLevel.HIGH),
            ],
            "passwords": [
                (r"(?i)(password|passwd|pwd)\s*[:=]\s*['\"]([^'\"]{8,})['\"]", SecurityLevel.CRITICAL),
                (r"(?i)(admin[_-]?password|root[_-]?password)\s*[:=]\s*['\"]([^'\"]{4,})['\"]", SecurityLevel.CRITICAL),
            ],
            "cloud_tokens": [
                (r"AKIA[0-9A-Z]{16}", SecurityLevel.CRITICAL),  # AWS Access Key
                (r"(?i)aws[_-]?secret[_-]?access[_-]?key.{0,10}[:=].{0,5}['\"]([A-Za-z0-9/+=]{40})['\"]", SecurityLevel.CRITICAL),
                (r"(?i)(facebook|meta)[_-]?app[_-]?secret.{0,10}[:=].{0,5}['\"]([a-f0-9]{32})['\"]", SecurityLevel.CRITICAL),
                (r"(?i)github[_-]?token.{0,10}[:=].{0,5}['\"]([a-zA-Z0-9_]{36,})['\"]", SecurityLevel.CRITICAL),
            ]
        }
        
        # Development/test patterns
        self.dev_patterns = [
            (r"(?i)localhost[:\/]", SecurityLevel.MEDIUM, "localhost reference found"),
            (r"127\.0\.0\.1", SecurityLevel.MEDIUM, "localhost IP reference found"),
            (r"(?i)\.local", SecurityLevel.LOW, "local domain reference found"),
            (r"(?i)(dev|test|staging)\..*\.com", SecurityLevel.LOW, "development/test domain found"),
            (r"(?i)http://[^'\"\\s]+", SecurityLevel.MEDIUM, "insecure HTTP URL found"),
            (r"(?i)(debug|test)[_-]?mode\s*[:=]\s*true", SecurityLevel.LOW, "debug/test mode enabled"),
        ]
        
        # Suspicious configuration patterns
        self.config_patterns = [
            (r"(?i)cors[_-]?origin.*\*", SecurityLevel.HIGH, "wildcard CORS origin detected"),
            (r"(?i)(ssl|tls)[_-]?(verify|check)\s*[:=]\s*(false|0)", SecurityLevel.HIGH, "SSL/TLS verification disabled"),
            (r"(?i)(security|auth)[_-]?disabled\s*[:=]\s*(true|1)", SecurityLevel.CRITICAL, "security/auth disabled"),
            (r"(?i)allow[_-]?all[_-]?origins", SecurityLevel.HIGH, "allow all origins configuration"),
        ]
        
        # Environment variable exposure patterns
        self.env_exposure_patterns = [
            (r"process\.env\.[A-Z_]+\s*\|\|\s*['\"]([^'\"]+)['\"]", SecurityLevel.MEDIUM, "hardcoded fallback for env var"),
            (r"import\.meta\.env\.[A-Z_]+\s*\|\|\s*['\"]([^'\"]+)['\"]", SecurityLevel.MEDIUM, "hardcoded fallback for env var"),
            (r"(?i)(console\.log|print|echo).*process\.env", SecurityLevel.LOW, "environment variable logging"),
        ]
        
        # Compile all patterns
        self.compiled_patterns = {}
        for category, patterns in self.secret_patterns.items():
            self.compiled_patterns[f"secret_{category}"] = [
                (re.compile(pattern), severity) for pattern, severity in patterns
            ]
        
        self.compiled_patterns["development"] = [
            (re.compile(pattern), severity, description) for pattern, severity, description in self.dev_patterns
        ]
        
        self.compiled_patterns["configuration"] = [
            (re.compile(pattern), severity, description) for pattern, severity, description in self.config_patterns
        ]
        
        self.compiled_patterns["env_exposure"] = [
            (re.compile(pattern), severity, description) for pattern, severity, description in self.env_exposure_patterns
        ]
    
    def should_scan_file(self, file_path: Path) -> bool:
        """Determine if a file should be scanned"""
        str_path = str(file_path.relative_to(self.root_path))
        
        # Check ignore patterns
        for ignore_pattern in self.ignore_patterns:
            if fnmatch.fnmatch(str_path, ignore_pattern):
                return False
        
        # Check scan patterns
        for scan_pattern in self.scan_patterns:
            if fnmatch.fnmatch(str_path, scan_pattern):
                return True
        
        return False
    
    def scan_file(self, file_path: Path) -> List[SecurityIssue]:
        """Scan a single file for security issues"""
        issues = []
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            
            for line_num, line in enumerate(lines, 1):
                line_strip = line.strip()
                
                # Skip empty lines and comments
                if not line_strip or line_strip.startswith('#'):
                    continue
                
                # Check all pattern categories
                for category, patterns in self.compiled_patterns.items():
                    for pattern_data in patterns:
                        if category.startswith("secret_"):
                            pattern, severity = pattern_data
                            matches = pattern.finditer(line)
                            for match in matches:
                                issues.append(SecurityIssue(
                                    file_path=str(file_path.relative_to(self.root_path)),
                                    line_number=line_num,
                                    issue_type=f"hardcoded_{category[7:]}",
                                    severity=severity,
                                    description=f"Potential hardcoded {category[7:].replace('_', ' ')} detected",
                                    line_content=line_strip,
                                    suggestions=[
                                        "Move this value to an environment variable",
                                        "Use a secure secret management system",
                                        "Ensure this value is not committed to version control"
                                    ],
                                    confidence=0.8
                                ))
                        else:
                            pattern, severity, description = pattern_data
                            if pattern.search(line):
                                confidence = 0.9 if severity in [SecurityLevel.CRITICAL, SecurityLevel.HIGH] else 0.7
                                issues.append(SecurityIssue(
                                    file_path=str(file_path.relative_to(self.root_path)),
                                    line_number=line_num,
                                    issue_type=category,
                                    severity=severity,
                                    description=description,
                                    line_content=line_strip,
                                    suggestions=self._get_suggestions(category, description),
                                    confidence=confidence
                                ))
        
        except Exception as e:
            print(f"Error scanning {file_path}: {e}")
        
        return issues
    
    def _get_suggestions(self, category: str, description: str) -> List[str]:
        """Get appropriate suggestions based on issue category"""
        if "localhost" in description.lower():
            return [
                "Use environment variables for URLs in production",
                "Configure proper production URLs",
                "Consider using relative URLs where appropriate"
            ]
        elif "http://" in description.lower():
            return [
                "Use HTTPS instead of HTTP in production",
                "Configure SSL/TLS certificates",
                "Ensure secure connections for sensitive data"
            ]
        elif "cors" in description.lower():
            return [
                "Restrict CORS origins to specific domains",
                "Avoid using wildcard (*) in production",
                "Configure proper CORS policies"
            ]
        elif "debug" in description.lower():
            return [
                "Disable debug mode in production",
                "Use environment-specific configuration",
                "Remove debug statements from production code"
            ]
        else:
            return [
                "Review this configuration for security implications",
                "Use environment variables for sensitive values",
                "Follow security best practices"
            ]
    
    def scan_directory(self) -> SecurityAuditReport:
        """Scan entire directory structure"""
        print(f"🔍 Starting security audit of {self.root_path}")
        
        # Find all files to scan
        files_to_scan = []
        for pattern in self.scan_patterns:
            files_to_scan.extend(self.root_path.glob(pattern))
        
        # Filter files
        files_to_scan = [f for f in files_to_scan if f.is_file() and self.should_scan_file(f)]
        
        print(f"📁 Found {len(files_to_scan)} files to scan")
        
        all_issues = []
        for file_path in files_to_scan:
            issues = self.scan_file(file_path)
            all_issues.extend(issues)
            self.files_scanned += 1
        
        # Count issues by severity
        severity_counts = {
            SecurityLevel.CRITICAL: 0,
            SecurityLevel.HIGH: 0,
            SecurityLevel.MEDIUM: 0,
            SecurityLevel.LOW: 0,
            SecurityLevel.INFO: 0
        }
        
        for issue in all_issues:
            severity_counts[issue.severity] += 1
        
        # Determine if deployment is secure
        is_secure = (
            severity_counts[SecurityLevel.CRITICAL] == 0 and
            severity_counts[SecurityLevel.HIGH] == 0
        )
        
        return SecurityAuditReport(
            total_files_scanned=self.files_scanned,
            issues_found=len(all_issues),
            critical_count=severity_counts[SecurityLevel.CRITICAL],
            high_count=severity_counts[SecurityLevel.HIGH],
            medium_count=severity_counts[SecurityLevel.MEDIUM],
            low_count=severity_counts[SecurityLevel.LOW],
            info_count=severity_counts[SecurityLevel.INFO],
            issues=all_issues,
            summary={"total": len(all_issues), **{s.value: c for s, c in severity_counts.items()}},
            is_secure=is_secure
        )
    
    def print_report(self, report: SecurityAuditReport):
        """Print formatted security audit report"""
        
        print(f"\n{'='*80}")
        print(f"WAR ROOM ANALYTICS - SECURITY AUDIT REPORT")
        print(f"{'='*80}")
        print(f"Files Scanned: {report.total_files_scanned}")
        print(f"Issues Found: {report.issues_found}")
        print(f"Security Status: {'✅ SECURE' if report.is_secure else '❌ ISSUES FOUND'}")
        print()
        print(f"Issue Breakdown:")
        print(f"  🚨 Critical: {report.critical_count}")
        print(f"  ⚠️  High:     {report.high_count}")
        print(f"  📋 Medium:   {report.medium_count}")
        print(f"  💡 Low:      {report.low_count}")
        print(f"  ℹ️  Info:     {report.info_count}")
        
        # Group issues by severity
        issues_by_severity = {}
        for issue in report.issues:
            if issue.severity not in issues_by_severity:
                issues_by_severity[issue.severity] = []
            issues_by_severity[issue.severity].append(issue)
        
        # Print issues by severity
        severity_icons = {
            SecurityLevel.CRITICAL: "🚨",
            SecurityLevel.HIGH: "⚠️",
            SecurityLevel.MEDIUM: "📋",
            SecurityLevel.LOW: "💡",
            SecurityLevel.INFO: "ℹ️"
        }
        
        for severity in [SecurityLevel.CRITICAL, SecurityLevel.HIGH, SecurityLevel.MEDIUM, SecurityLevel.LOW, SecurityLevel.INFO]:
            if severity in issues_by_severity and issues_by_severity[severity]:
                print(f"\n{severity_icons[severity]} {severity.value.upper()} ISSUES ({len(issues_by_severity[severity])}):")
                
                for issue in issues_by_severity[severity]:
                    print(f"  📄 {issue.file_path}:{issue.line_number}")
                    print(f"     Type: {issue.issue_type}")
                    print(f"     Description: {issue.description}")
                    print(f"     Line: {issue.line_content[:100]}{'...' if len(issue.line_content) > 100 else ''}")
                    print(f"     Confidence: {issue.confidence:.1%}")
                    
                    if issue.suggestions:
                        print(f"     Suggestions:")
                        for suggestion in issue.suggestions:
                            print(f"       • {suggestion}")
                    print()
        
        print(f"{'='*80}")
        
        # Recommendations
        print(f"\n🔒 SECURITY RECOMMENDATIONS:")
        if report.critical_count > 0:
            print(f"  1. ADDRESS ALL CRITICAL ISSUES IMMEDIATELY")
            print(f"     - These represent serious security vulnerabilities")
            print(f"     - Do not deploy to production with critical issues")
        
        if report.high_count > 0:
            print(f"  2. Resolve high severity issues before production deployment")
        
        if report.medium_count > 0:
            print(f"  3. Review medium severity issues for production readiness")
        
        print(f"  4. Use environment variables for all sensitive configuration")
        print(f"  5. Never commit secrets to version control")
        print(f"  6. Use HTTPS for all production URLs")
        print(f"  7. Implement proper CORS policies")
        print(f"  8. Disable debug mode in production")
        
        print(f"\n{'='*80}")
    
    def generate_json_report(self, report: SecurityAuditReport, output_file: str):
        """Generate JSON report for CI/CD integration"""
        report_data = {
            "security_audit": {
                "timestamp": "2025-01-08",  # In a real implementation, use datetime.now()
                "summary": {
                    "files_scanned": report.total_files_scanned,
                    "issues_found": report.issues_found,
                    "is_secure": report.is_secure,
                    "severity_breakdown": {
                        "critical": report.critical_count,
                        "high": report.high_count,
                        "medium": report.medium_count,
                        "low": report.low_count,
                        "info": report.info_count
                    }
                },
                "issues": [
                    {
                        "file": issue.file_path,
                        "line": issue.line_number,
                        "type": issue.issue_type,
                        "severity": issue.severity.value,
                        "description": issue.description,
                        "confidence": issue.confidence,
                        "suggestions": issue.suggestions
                    }
                    for issue in report.issues
                ],
                "recommendations": [
                    "Use environment variables for all sensitive configuration",
                    "Never commit secrets to version control",
                    "Use HTTPS for all production URLs",
                    "Implement proper CORS policies",
                    "Disable debug mode in production"
                ]
            }
        }
        
        with open(output_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"📄 JSON report saved to {output_file}")


def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description="War Room Security Audit Tool")
    parser.add_argument("--path", type=str, default=".", help="Path to scan (default: current directory)")
    parser.add_argument("--json", type=str, help="Output JSON report to file")
    parser.add_argument("--ci", action="store_true", help="CI mode - exit with error code if issues found")
    parser.add_argument("--severity", choices=["critical", "high", "medium", "low"], 
                       default="high", help="Minimum severity to fail CI (default: high)")
    
    args = parser.parse_args()
    
    # Create auditor and run scan
    auditor = EnvironmentSecurityAuditor(args.path)
    report = auditor.scan_directory()
    
    # Print report
    auditor.print_report(report)
    
    # Generate JSON report if requested
    if args.json:
        auditor.generate_json_report(report, args.json)
    
    # CI mode exit codes
    if args.ci:
        min_severity = SecurityLevel(args.severity)
        should_fail = False
        
        if min_severity == SecurityLevel.CRITICAL and report.critical_count > 0:
            should_fail = True
        elif min_severity == SecurityLevel.HIGH and (report.critical_count > 0 or report.high_count > 0):
            should_fail = True
        elif min_severity == SecurityLevel.MEDIUM and (report.critical_count > 0 or report.high_count > 0 or report.medium_count > 0):
            should_fail = True
        elif min_severity == SecurityLevel.LOW and report.issues_found > 0:
            should_fail = True
        
        if should_fail:
            print(f"\n❌ CI FAILURE: Security issues found above {min_severity.value} threshold")
            exit(1)
        else:
            print(f"\n✅ CI PASS: No security issues found above {min_severity.value} threshold")
            exit(0)


if __name__ == "__main__":
    main()