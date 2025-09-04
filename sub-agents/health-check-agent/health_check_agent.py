#!/usr/bin/env python3
"""
SUB-AGENT 1 - HEALTH_CHECK_AGENT
Comprehensive War Room Platform Health Validation System

MISSION: Complete health validation of War Room platform for Render.com migration readiness
TARGET: https://war-room-oa9t.onrender.com/

This agent provides comprehensive health validation including:
- API Health Validation
- Performance Testing (< 3 second SLA)
- Fallback Mechanism Testing
- Database Connectivity
- Infrastructure Checks
"""

import asyncio
import aiohttp
import json
import time
import sys
import os
import logging
import subprocess
import psutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import ssl
import socket
from urllib.parse import urljoin

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class HealthCheckResult:
    """Single health check result"""
    name: str
    status: str  # "pass", "fail", "warning"
    response_time_ms: float
    details: Dict[str, Any]
    error: Optional[str] = None
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()

@dataclass
class SystemHealth:
    """Overall system health assessment"""
    overall_status: str
    health_score: int
    migration_ready: bool
    critical_issues: List[str]
    warnings: List[str]
    recommendations: List[str]
    timestamp: str
    check_duration_seconds: float

class HealthCheckAgent:
    """Main Health Check Agent for War Room Platform"""
    
    def __init__(self, target_url: str = "https://war-room-oa9t.onrender.com"):
        self.target_url = target_url
        self.timeout = 10.0  # seconds
        self.max_response_time = 3000  # 3 seconds in milliseconds
        self.results: List[HealthCheckResult] = []
        self.session: Optional[aiohttp.ClientSession] = None
        
        # API endpoints to validate
        self.api_endpoints = [
            "/",  # Root endpoint
            "/health",  # Main health check
            "/api/health",  # Backend health
            "/api/v1/status",  # API status
            "/docs",  # FastAPI docs
            "/api/v1/analytics/status",  # Analytics
            "/api/v1/monitoring/status",  # Monitoring
            "/api/v1/alerts/status",  # Alerts
            "/api/v1/checkpoints/status",  # Checkpoints
            "/api/meta/status",  # Meta API
            "/api/timeout/status",  # Timeout monitoring
            "/api/google/auth/status",  # Google Ads auth
        ]
        
        # Performance test configurations
        self.perf_test_requests = 10
        self.perf_test_concurrent = 3
        
    async def __aenter__(self):
        """Async context manager entry"""
        connector = aiohttp.TCPConnector(
            limit=20,
            limit_per_host=10,
            ttl_dns_cache=300,
            use_dns_cache=True,
            ssl=False,  # Disable SSL verification for now
        )
        
        timeout = aiohttp.ClientTimeout(
            total=self.timeout,
            connect=5.0,
            sock_read=5.0
        )
        
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={
                'User-Agent': 'WarRoom-HealthCheckAgent/1.0',
                'Accept': 'application/json,text/html,*/*'
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    def add_result(self, result: HealthCheckResult):
        """Add a health check result"""
        self.results.append(result)
        status_emoji = "✅" if result.status == "pass" else "⚠️" if result.status == "warning" else "❌"
        logger.info(f"{status_emoji} {result.name}: {result.status} ({result.response_time_ms:.2f}ms)")
        
        if result.error:
            logger.error(f"   Error: {result.error}")

    async def check_site_availability(self) -> HealthCheckResult:
        """Check if the main site is available"""
        start_time = time.time()
        
        try:
            async with self.session.get(self.target_url, allow_redirects=True) as response:
                response_time = (time.time() - start_time) * 1000
                content = await response.text()
                
                status = "pass" if response.status < 400 else "fail"
                if response_time > self.max_response_time:
                    status = "warning" if status == "pass" else "fail"
                
                return HealthCheckResult(
                    name="Site Availability",
                    status=status,
                    response_time_ms=response_time,
                    details={
                        "status_code": response.status,
                        "content_length": len(content),
                        "headers": dict(response.headers),
                        "ssl_cert_valid": self.target_url.startswith('https'),
                        "redirects": len(response.history) if hasattr(response, 'history') else 0
                    },
                    error=f"Status {response.status}" if response.status >= 400 else None
                )
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name="Site Availability",
                status="fail",
                response_time_ms=response_time,
                details={"error_type": type(e).__name__},
                error=str(e)
            )

    async def check_api_endpoint(self, endpoint: str) -> HealthCheckResult:
        """Check individual API endpoint"""
        url = urljoin(self.target_url, endpoint)
        start_time = time.time()
        
        try:
            async with self.session.get(url) as response:
                response_time = (time.time() - start_time) * 1000
                
                # Try to parse JSON if possible
                content_type = response.headers.get('content-type', '').lower()
                data = None
                if 'application/json' in content_type:
                    try:
                        data = await response.json()
                    except:
                        data = None
                
                # Status determination
                if response.status == 404 and endpoint in ['/docs']:
                    # Some endpoints might be expected to return 404
                    status = "warning"
                    error = f"Endpoint not found (404) - might be expected"
                elif response.status >= 500:
                    status = "fail"
                    error = f"Server error: {response.status}"
                elif response.status >= 400:
                    status = "warning"
                    error = f"Client error: {response.status}"
                else:
                    status = "pass"
                    error = None
                    
                if response_time > self.max_response_time and status == "pass":
                    status = "warning"
                
                return HealthCheckResult(
                    name=f"API Endpoint {endpoint}",
                    status=status,
                    response_time_ms=response_time,
                    details={
                        "status_code": response.status,
                        "content_type": content_type,
                        "data": data if data and isinstance(data, dict) else None,
                        "url": url
                    },
                    error=error
                )
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name=f"API Endpoint {endpoint}",
                status="fail",
                response_time_ms=response_time,
                details={"url": url, "error_type": type(e).__name__},
                error=str(e)
            )

    async def check_all_api_endpoints(self) -> List[HealthCheckResult]:
        """Check all API endpoints"""
        logger.info("🔌 Checking API endpoints...")
        
        # Create semaphore to limit concurrent requests
        semaphore = asyncio.Semaphore(5)
        
        async def check_with_semaphore(endpoint):
            async with semaphore:
                return await self.check_api_endpoint(endpoint)
        
        tasks = [check_with_semaphore(endpoint) for endpoint in self.api_endpoints]
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def run_performance_test(self) -> HealthCheckResult:
        """Run performance benchmark test"""
        logger.info("⚡ Running performance benchmark...")
        start_time = time.time()
        
        results = []
        semaphore = asyncio.Semaphore(self.perf_test_concurrent)
        
        async def single_request():
            async with semaphore:
                request_start = time.time()
                try:
                    async with self.session.get(self.target_url) as response:
                        request_time = (time.time() - request_start) * 1000
                        return {
                            "success": response.status < 400,
                            "response_time": request_time,
                            "status_code": response.status
                        }
                except Exception as e:
                    request_time = (time.time() - request_start) * 1000
                    return {
                        "success": False,
                        "response_time": request_time,
                        "error": str(e)
                    }
        
        # Run concurrent requests
        tasks = [single_request() for _ in range(self.perf_test_requests)]
        results = await asyncio.gather(*tasks)
        
        total_time = (time.time() - start_time) * 1000
        
        # Calculate statistics
        successful = [r for r in results if r["success"]]
        response_times = [r["response_time"] for r in successful]
        
        if response_times:
            avg_response = sum(response_times) / len(response_times)
            min_response = min(response_times)
            max_response = max(response_times)
            p95_response = sorted(response_times)[int(len(response_times) * 0.95)]
            success_rate = len(successful) / len(results) * 100
            consistency = max_response - min_response
            
            # Determine status
            status = "pass"
            error_messages = []
            
            if success_rate < 95:
                status = "fail"
                error_messages.append(f"Low success rate: {success_rate:.1f}%")
            elif success_rate < 99:
                status = "warning"
                error_messages.append(f"Moderate success rate: {success_rate:.1f}%")
                
            if avg_response > self.max_response_time:
                status = "fail" if status != "fail" else "fail"
                error_messages.append(f"Average response time too slow: {avg_response:.2f}ms")
            elif p95_response > self.max_response_time * 1.5:
                status = "warning" if status == "pass" else status
                error_messages.append(f"95th percentile response time concerning: {p95_response:.2f}ms")
            
            return HealthCheckResult(
                name="Performance Benchmark",
                status=status,
                response_time_ms=avg_response,
                details={
                    "total_requests": len(results),
                    "successful_requests": len(successful),
                    "success_rate_percent": success_rate,
                    "avg_response_time_ms": avg_response,
                    "min_response_time_ms": min_response,
                    "max_response_time_ms": max_response,
                    "p95_response_time_ms": p95_response,
                    "consistency_ms": consistency,
                    "total_test_time_ms": total_time,
                    "concurrent_requests": self.perf_test_concurrent,
                    "sla_threshold_ms": self.max_response_time
                },
                error="; ".join(error_messages) if error_messages else None
            )
        else:
            return HealthCheckResult(
                name="Performance Benchmark",
                status="fail",
                response_time_ms=total_time,
                details={
                    "total_requests": len(results),
                    "successful_requests": 0,
                    "success_rate_percent": 0.0
                },
                error="All performance test requests failed"
            )

    def check_system_resources(self) -> HealthCheckResult:
        """Check system resource usage"""
        logger.info("💻 Checking system resources...")
        start_time = time.time()
        
        try:
            # Memory information
            memory = psutil.virtual_memory()
            
            # CPU information
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            load_avg = os.getloadavg() if hasattr(os, 'getloadavg') else (0, 0, 0)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Process information
            process = psutil.Process()
            process_memory = process.memory_info()
            
            response_time = (time.time() - start_time) * 1000
            
            # Determine status based on resource usage
            status = "pass"
            warnings = []
            
            memory_usage_percent = memory.percent
            if memory_usage_percent > 90:
                status = "fail"
                warnings.append(f"Critical memory usage: {memory_usage_percent:.1f}%")
            elif memory_usage_percent > 80:
                status = "warning"
                warnings.append(f"High memory usage: {memory_usage_percent:.1f}%")
            
            cpu_load_ratio = load_avg[0] / cpu_count if cpu_count > 0 else 0
            if cpu_load_ratio > 0.9:
                status = "fail" if status != "fail" else "fail"
                warnings.append(f"Critical CPU load: {cpu_load_ratio:.2f}")
            elif cpu_load_ratio > 0.7:
                status = "warning" if status == "pass" else status
                warnings.append(f"High CPU load: {cpu_load_ratio:.2f}")
            
            disk_usage_percent = disk.percent
            if disk_usage_percent > 95:
                status = "fail" if status != "fail" else "fail"
                warnings.append(f"Critical disk usage: {disk_usage_percent:.1f}%")
            elif disk_usage_percent > 85:
                status = "warning" if status == "pass" else status
                warnings.append(f"High disk usage: {disk_usage_percent:.1f}%")
            
            return HealthCheckResult(
                name="System Resources",
                status=status,
                response_time_ms=response_time,
                details={
                    "memory": {
                        "total_gb": round(memory.total / (1024**3), 2),
                        "available_gb": round(memory.available / (1024**3), 2),
                        "used_percent": memory_usage_percent,
                        "process_rss_mb": round(process_memory.rss / (1024**2), 2),
                        "process_vms_mb": round(process_memory.vms / (1024**2), 2)
                    },
                    "cpu": {
                        "cores": cpu_count,
                        "usage_percent": cpu_percent,
                        "load_1min": load_avg[0],
                        "load_5min": load_avg[1],
                        "load_15min": load_avg[2],
                        "load_ratio": cpu_load_ratio
                    },
                    "disk": {
                        "total_gb": round(disk.total / (1024**3), 2),
                        "free_gb": round(disk.free / (1024**3), 2),
                        "used_percent": disk_usage_percent
                    }
                },
                error="; ".join(warnings) if warnings else None
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name="System Resources",
                status="fail",
                response_time_ms=response_time,
                details={"error_type": type(e).__name__},
                error=str(e)
            )

    async def check_ssl_certificate(self) -> HealthCheckResult:
        """Check SSL certificate validity"""
        logger.info("🔒 Checking SSL certificate...")
        start_time = time.time()
        
        if not self.target_url.startswith('https'):
            return HealthCheckResult(
                name="SSL Certificate",
                status="warning",
                response_time_ms=0,
                details={"ssl_enabled": False},
                error="Site is not using HTTPS"
            )
        
        try:
            # Parse hostname from URL
            from urllib.parse import urlparse
            parsed = urlparse(self.target_url)
            hostname = parsed.hostname
            port = parsed.port or 443
            
            # Get certificate info
            context = ssl.create_default_context()
            
            with socket.create_connection((hostname, port), timeout=self.timeout) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    
            response_time = (time.time() - start_time) * 1000
            
            # Parse certificate dates
            from datetime import datetime
            not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
            not_before = datetime.strptime(cert['notBefore'], '%b %d %H:%M:%S %Y %Z')
            
            now = datetime.utcnow()
            days_until_expiry = (not_after - now).days
            
            # Determine status
            status = "pass"
            warnings = []
            
            if now < not_before:
                status = "fail"
                warnings.append("Certificate is not yet valid")
            elif now > not_after:
                status = "fail"
                warnings.append("Certificate has expired")
            elif days_until_expiry < 7:
                status = "fail"
                warnings.append(f"Certificate expires in {days_until_expiry} days")
            elif days_until_expiry < 30:
                status = "warning"
                warnings.append(f"Certificate expires in {days_until_expiry} days")
            
            return HealthCheckResult(
                name="SSL Certificate",
                status=status,
                response_time_ms=response_time,
                details={
                    "subject": dict(x[0] for x in cert.get('subject', [])),
                    "issuer": dict(x[0] for x in cert.get('issuer', [])),
                    "valid_from": cert.get('notBefore'),
                    "valid_until": cert.get('notAfter'),
                    "days_until_expiry": days_until_expiry,
                    "serial_number": cert.get('serialNumber'),
                    "version": cert.get('version')
                },
                error="; ".join(warnings) if warnings else None
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name="SSL Certificate",
                status="fail",
                response_time_ms=response_time,
                details={"error_type": type(e).__name__},
                error=str(e)
            )

    async def check_database_connectivity(self) -> HealthCheckResult:
        """Check database connectivity through API"""
        logger.info("🗄️ Checking database connectivity...")
        
        # We'll check through the health API endpoint which should validate DB
        try:
            result = await self.check_api_endpoint("/api/health")
            
            # If health endpoint responds with DB info, extract it
            if result.status == "pass" and result.details.get("data"):
                data = result.details["data"]
                if isinstance(data, dict) and "services" in data:
                    services = data["services"]
                    db_status = services.get("database", "unknown")
                    
                    if db_status == "operational":
                        return HealthCheckResult(
                            name="Database Connectivity",
                            status="pass",
                            response_time_ms=result.response_time_ms,
                            details={
                                "database_status": db_status,
                                "checked_via": "/api/health endpoint"
                            }
                        )
                    else:
                        return HealthCheckResult(
                            name="Database Connectivity",
                            status="fail",
                            response_time_ms=result.response_time_ms,
                            details={
                                "database_status": db_status,
                                "checked_via": "/api/health endpoint"
                            },
                            error=f"Database status: {db_status}"
                        )
            
            # If no specific DB info, use the health endpoint result as proxy
            return HealthCheckResult(
                name="Database Connectivity",
                status="warning" if result.status == "pass" else "fail",
                response_time_ms=result.response_time_ms,
                details={
                    "checked_via": "/api/health endpoint",
                    "health_endpoint_status": result.status
                },
                error="Could not determine database status from health endpoint"
            )
            
        except Exception as e:
            return HealthCheckResult(
                name="Database Connectivity",
                status="fail",
                response_time_ms=0,
                details={"error_type": type(e).__name__},
                error=str(e)
            )

    async def check_fallback_mechanisms(self) -> HealthCheckResult:
        """Check fallback mechanisms and error boundaries"""
        logger.info("🛡️ Checking fallback mechanisms...")
        start_time = time.time()
        
        try:
            # Test with invalid API endpoint to trigger fallbacks
            invalid_endpoint = "/api/v1/nonexistent-endpoint-test"
            url = urljoin(self.target_url, invalid_endpoint)
            
            async with self.session.get(url) as response:
                response_time = (time.time() - start_time) * 1000
                
                # A good fallback should return 404 or proper error structure
                if response.status == 404:
                    try:
                        error_data = await response.json()
                        # Check if error response has proper structure
                        has_proper_structure = (
                            isinstance(error_data, dict) and 
                            ("detail" in error_data or "message" in error_data or "error" in error_data)
                        )
                        
                        return HealthCheckResult(
                            name="Fallback Mechanisms",
                            status="pass",
                            response_time_ms=response_time,
                            details={
                                "error_handling": "proper_404_response",
                                "error_structure": error_data if has_proper_structure else None,
                                "has_error_boundaries": has_proper_structure
                            }
                        )
                    except:
                        # Non-JSON 404 is still acceptable
                        return HealthCheckResult(
                            name="Fallback Mechanisms",
                            status="pass",
                            response_time_ms=response_time,
                            details={
                                "error_handling": "404_response",
                                "content_type": response.headers.get('content-type', 'unknown')
                            }
                        )
                elif response.status >= 500:
                    return HealthCheckResult(
                        name="Fallback Mechanisms",
                        status="fail",
                        response_time_ms=response_time,
                        details={"status_code": response.status},
                        error=f"Server error on invalid endpoint: {response.status}"
                    )
                else:
                    return HealthCheckResult(
                        name="Fallback Mechanisms",
                        status="warning",
                        response_time_ms=response_time,
                        details={"status_code": response.status},
                        error=f"Unexpected response for invalid endpoint: {response.status}"
                    )
                    
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                name="Fallback Mechanisms",
                status="fail",
                response_time_ms=response_time,
                details={"error_type": type(e).__name__},
                error=str(e)
            )

    def calculate_health_score(self) -> int:
        """Calculate overall health score (0-100)"""
        if not self.results:
            return 0
            
        total_score = 0
        weights = {
            "Site Availability": 25,
            "Performance Benchmark": 20,
            "Database Connectivity": 15,
            "System Resources": 15,
            "SSL Certificate": 10,
            "Fallback Mechanisms": 10,
            # API endpoints share remaining 5 points
        }
        
        # Safely calculate API endpoint weight
        api_endpoints = [r for r in self.results if r.name.startswith("API Endpoint")]
        api_endpoint_weight = 5 / len(api_endpoints) if api_endpoints else 0
        
        for result in self.results:
            if result.name in weights:
                weight = weights[result.name]
            elif result.name.startswith("API Endpoint"):
                weight = api_endpoint_weight
            else:
                weight = 0
                
            if result.status == "pass":
                score = 100
            elif result.status == "warning":
                score = 70
            else:  # fail
                score = 0
                
            total_score += score * weight / 100
            
        return min(100, max(0, int(total_score)))

    def assess_migration_readiness(self) -> Tuple[bool, List[str], List[str]]:
        """Assess if system is ready for migration"""
        critical_issues = []
        warnings = []
        
        # Check for critical failures
        for result in self.results:
            if result.status == "fail":
                if result.name == "Site Availability":
                    critical_issues.append("Site is not available - CRITICAL")
                elif result.name == "Database Connectivity":
                    critical_issues.append("Database connectivity failed - CRITICAL")
                elif result.name == "Performance Benchmark":
                    critical_issues.append("Performance tests failed - CRITICAL")
                elif result.name.startswith("API Endpoint") and "health" in result.name:
                    critical_issues.append(f"Critical API endpoint failed: {result.name}")
                else:
                    warnings.append(f"Component failure: {result.name}")
                    
            elif result.status == "warning":
                warnings.append(f"Performance concern: {result.name}")
        
        # Migration readiness decision
        has_critical_issues = len(critical_issues) > 0
        health_score = self.calculate_health_score()
        
        migration_ready = (
            not has_critical_issues and 
            health_score >= 80 and
            any(r.name == "Site Availability" and r.status == "pass" for r in self.results)
        )
        
        return migration_ready, critical_issues, warnings

    def generate_system_health(self) -> SystemHealth:
        """Generate overall system health assessment"""
        health_score = self.calculate_health_score()
        migration_ready, critical_issues, warnings = self.assess_migration_readiness()
        
        # Generate recommendations
        recommendations = []
        
        if health_score < 80:
            recommendations.append("Address failing health checks before migration")
        
        if critical_issues:
            recommendations.append("URGENT: Resolve all critical issues immediately")
            
        # Performance recommendations
        slow_components = [r for r in self.results if r.response_time_ms > self.max_response_time]
        if slow_components:
            recommendations.append(f"Optimize performance for: {', '.join(r.name for r in slow_components)}")
            
        # SSL recommendations
        ssl_result = next((r for r in self.results if r.name == "SSL Certificate"), None)
        if ssl_result and ssl_result.status != "pass":
            recommendations.append("Review SSL certificate configuration")
            
        # Overall status
        if critical_issues:
            overall_status = "CRITICAL"
        elif health_score >= 90:
            overall_status = "EXCELLENT"
        elif health_score >= 80:
            overall_status = "GOOD"
        elif health_score >= 60:
            overall_status = "DEGRADED"
        else:
            overall_status = "POOR"
            
        return SystemHealth(
            overall_status=overall_status,
            health_score=health_score,
            migration_ready=migration_ready,
            critical_issues=critical_issues,
            warnings=warnings,
            recommendations=recommendations,
            timestamp=datetime.now(timezone.utc).isoformat(),
            check_duration_seconds=0  # Will be set by caller
        )

    async def run_comprehensive_health_check(self) -> SystemHealth:
        """Run complete health check suite"""
        logger.info("🚀 Starting comprehensive War Room health check...")
        start_time = time.time()
        
        try:
            # Site availability (must pass for other checks)
            site_result = await self.check_site_availability()
            self.add_result(site_result)
            
            if site_result.status == "fail":
                logger.error("❌ Site is not available. Skipping remaining checks.")
                # Still run some local checks
                system_result = self.check_system_resources()
                self.add_result(system_result)
            else:
                # Run all checks
                tasks = [
                    self.run_performance_test(),
                    self.check_database_connectivity(),
                    self.check_ssl_certificate(),
                    self.check_fallback_mechanisms(),
                ]
                
                # Add API endpoint checks
                api_results = await self.check_all_api_endpoints()
                for result in api_results:
                    if isinstance(result, HealthCheckResult):
                        self.add_result(result)
                    elif isinstance(result, Exception):
                        logger.error(f"API check exception: {result}")
                
                # Wait for other async tasks
                other_results = await asyncio.gather(*tasks, return_exceptions=True)
                for result in other_results:
                    if isinstance(result, HealthCheckResult):
                        self.add_result(result)
                    elif isinstance(result, Exception):
                        logger.error(f"Health check exception: {result}")
                
                # System resources check
                system_result = self.check_system_resources()
                self.add_result(system_result)
            
            # Generate final assessment
            system_health = self.generate_system_health()
            system_health.check_duration_seconds = time.time() - start_time
            
            logger.info(f"🏁 Health check completed in {system_health.check_duration_seconds:.2f}s")
            logger.info(f"📊 Overall Status: {system_health.overall_status}")
            logger.info(f"🎯 Health Score: {system_health.health_score}/100")
            logger.info(f"🚀 Migration Ready: {'YES' if system_health.migration_ready else 'NO'}")
            
            return system_health
            
        except Exception as e:
            logger.error(f"Fatal error during health check: {e}")
            # Return emergency health assessment
            return SystemHealth(
                overall_status="CRITICAL",
                health_score=0,
                migration_ready=False,
                critical_issues=[f"Health check system failure: {str(e)}"],
                warnings=[],
                recommendations=["Investigate health check system issues"],
                timestamp=datetime.now(timezone.utc).isoformat(),
                check_duration_seconds=time.time() - start_time
            )

    def generate_detailed_report(self, system_health: SystemHealth) -> Dict[str, Any]:
        """Generate comprehensive report"""
        return {
            "war_room_health_report": {
                "metadata": {
                    "agent": "SUB-AGENT 1 - HEALTH_CHECK_AGENT",
                    "version": "1.0.0",
                    "target_url": self.target_url,
                    "timestamp": system_health.timestamp,
                    "check_duration_seconds": system_health.check_duration_seconds
                },
                "summary": {
                    "overall_status": system_health.overall_status,
                    "health_score": system_health.health_score,
                    "migration_ready": system_health.migration_ready,
                    "total_checks": len(self.results),
                    "passed_checks": len([r for r in self.results if r.status == "pass"]),
                    "warning_checks": len([r for r in self.results if r.status == "warning"]),
                    "failed_checks": len([r for r in self.results if r.status == "fail"])
                },
                "migration_assessment": {
                    "ready_for_migration": system_health.migration_ready,
                    "critical_blockers": system_health.critical_issues,
                    "recommendations": system_health.recommendations,
                    "go_no_go_decision": "GO" if system_health.migration_ready else "NO-GO"
                },
                "detailed_results": [asdict(result) for result in self.results],
                "performance_metrics": {
                    "response_times_ms": {
                        r.name: r.response_time_ms for r in self.results
                    },
                    "sla_compliance": {
                        "threshold_ms": self.max_response_time,
                        "compliant_checks": len([r for r in self.results if r.response_time_ms <= self.max_response_time]),
                        "total_checks": len(self.results)
                    }
                },
                "system_health": asdict(system_health)
            }
        }

async def main():
    """Main execution function"""
    target_url = sys.argv[1] if len(sys.argv) > 1 else "https://war-room-oa9t.onrender.com"
    
    async with HealthCheckAgent(target_url) as agent:
        system_health = await agent.run_comprehensive_health_check()
        report = agent.generate_detailed_report(system_health)
        
        # Output results
        print("\n" + "="*80)
        print("SUB-AGENT 1 - HEALTH_CHECK_AGENT REPORT")
        print("="*80)
        print(json.dumps(report, indent=2))
        
        # Save report to file
        report_dir = Path(__file__).parent / "reports"
        report_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = report_dir / f"health_report_{timestamp}.json"
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"📄 Full report saved to: {report_file}")
        
        # Exit code based on migration readiness
        exit_code = 0 if system_health.migration_ready else 1
        sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())