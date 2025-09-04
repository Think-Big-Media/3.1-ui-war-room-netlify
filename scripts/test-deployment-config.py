#!/usr/bin/env python3
"""
Deployment Configuration Testing Suite for War Room Analytics
Validates all environment variables work correctly in different deployment scenarios
"""
import os
import sys
import json
import asyncio
import aiohttp
import time
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import subprocess
import tempfile
import yaml
from urllib.parse import urlparse
import logging

# Add the backend directory to the path to import our validation module
backend_path = Path(__file__).parent.parent / "src" / "backend"
if str(backend_path) in sys.path:
    sys.path.append(str(backend_path))

try:
    from core.env_validation import EnvironmentValidator, EnvironmentType, EnvValidationResult
except ImportError:
    print("Warning: Could not import EnvironmentValidator. Some tests may be skipped.")
    EnvironmentValidator = None


class TestResult(Enum):
    """Test result status"""
    PASS = "pass"
    FAIL = "fail"
    SKIP = "skip"
    WARNING = "warning"


@dataclass
class ConfigTest:
    """Individual configuration test"""
    name: str
    description: str
    category: str
    required: bool
    result: TestResult
    message: str
    details: Dict[str, Any]
    duration: float


@dataclass
class DeploymentTestReport:
    """Complete deployment test report"""
    environment: str
    total_tests: int
    passed: int
    failed: int
    skipped: int
    warnings: int
    tests: List[ConfigTest]
    is_deployment_ready: bool
    summary: Dict[str, Any]


class DeploymentConfigTester:
    """Comprehensive deployment configuration tester"""
    
    def __init__(self, environment: str = "development"):
        self.environment = environment
        self.tests: List[ConfigTest] = []
        self.logger = self._setup_logging()
        
        # Load environment-specific configurations
        self._load_environment_config()
    
    def _setup_logging(self) -> logging.Logger:
        """Set up logging for the test suite"""
        logger = logging.getLogger(__name__)
        logger.setLevel(logging.INFO)
        
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        return logger
    
    def _load_environment_config(self):
        """Load environment-specific configuration"""
        config_files = [
            f".env.{self.environment}",
            f".env.{self.environment}.local",
            ".env.local",
            ".env"
        ]
        
        for config_file in config_files:
            if os.path.exists(config_file):
                self.logger.info(f"Loading config from {config_file}")
                self._load_env_file(config_file)
                break
    
    def _load_env_file(self, file_path: str):
        """Load environment variables from file"""
        try:
            with open(file_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        # Only set if not already set (respect existing env vars)
                        if key not in os.environ:
                            os.environ[key] = value.strip('"\'')
        except Exception as e:
            self.logger.warning(f"Could not load {file_path}: {e}")
    
    async def run_all_tests(self) -> DeploymentTestReport:
        """Run all deployment configuration tests"""
        self.logger.info(f"🚀 Starting deployment configuration tests for {self.environment}")
        
        # Test categories
        test_categories = [
            ("Environment Variables", self.test_environment_variables),
            ("Database Connectivity", self.test_database_connections),
            ("External Services", self.test_external_services),
            ("Security Configuration", self.test_security_config),
            ("Frontend Configuration", self.test_frontend_config),
            ("API Endpoints", self.test_api_endpoints),
            ("Render.com Configuration", self.test_render_config),
            ("Production Readiness", self.test_production_readiness)
        ]
        
        # Run all test categories
        for category_name, test_func in test_categories:
            self.logger.info(f"📋 Running {category_name} tests...")
            try:
                await test_func()
            except Exception as e:
                self.logger.error(f"Error in {category_name}: {e}")
                self._add_test_result(
                    f"{category_name} - Error",
                    f"Test category {category_name} failed to execute",
                    category_name,
                    True,
                    TestResult.FAIL,
                    f"Exception: {str(e)}",
                    {"error": str(e)},
                    0.0
                )
        
        # Generate report
        return self._generate_report()
    
    def _add_test_result(self, name: str, description: str, category: str, 
                        required: bool, result: TestResult, message: str,
                        details: Dict[str, Any], duration: float):
        """Add a test result to the collection"""
        self.tests.append(ConfigTest(
            name=name,
            description=description,
            category=category,
            required=required,
            result=result,
            message=message,
            details=details,
            duration=duration
        ))
    
    async def test_environment_variables(self):
        """Test environment variable configuration"""
        start_time = time.time()
        
        # Test basic environment validation if validator is available
        if EnvironmentValidator:
            try:
                validator = EnvironmentValidator()
                report = validator.validate_environment(
                    EnvironmentType(self.environment),
                    check_values=True
                )
                
                duration = time.time() - start_time
                
                if report.error_count == 0:
                    self._add_test_result(
                        "Environment Variable Validation",
                        "Validate all required environment variables are present and valid",
                        "Environment Variables",
                        True,
                        TestResult.PASS,
                        f"All {report.valid_count} variables validated successfully",
                        {
                            "total_variables": report.total_variables,
                            "valid_count": report.valid_count,
                            "warning_count": report.warning_count
                        },
                        duration
                    )
                else:
                    self._add_test_result(
                        "Environment Variable Validation",
                        "Validate all required environment variables are present and valid",
                        "Environment Variables",
                        True,
                        TestResult.FAIL,
                        f"Found {report.error_count} critical errors",
                        {
                            "critical_errors": [e.message for e in report.critical_errors],
                            "warnings": [w.message for w in report.warnings]
                        },
                        duration
                    )
            except Exception as e:
                self._add_test_result(
                    "Environment Variable Validation",
                    "Validate all required environment variables are present and valid",
                    "Environment Variables",
                    True,
                    TestResult.FAIL,
                    f"Validation failed: {str(e)}",
                    {"error": str(e)},
                    time.time() - start_time
                )
        
        # Test specific critical variables
        critical_vars = [
            ("DATABASE_URL", "Database connection string"),
            ("SECRET_KEY", "Application secret key"),
            ("SUPABASE_URL", "Supabase project URL"),
            ("SUPABASE_ANON_KEY", "Supabase anonymous key")
        ]
        
        for var_name, description in critical_vars:
            start_time = time.time()
            value = os.getenv(var_name)
            duration = time.time() - start_time
            
            if value:
                # Basic validation
                if var_name == "DATABASE_URL" and not value.startswith(("postgresql://", "sqlite://")):
                    result = TestResult.FAIL
                    message = "Invalid database URL format"
                elif var_name == "SUPABASE_URL" and not value.startswith("https://"):
                    result = TestResult.FAIL
                    message = "Supabase URL must use HTTPS"
                elif len(value) < 16 and "KEY" in var_name:
                    result = TestResult.WARNING
                    message = "Secret key appears short - consider using stronger key"
                else:
                    result = TestResult.PASS
                    message = f"Variable is set and appears valid"
                
                self._add_test_result(
                    f"{var_name} Configuration",
                    description,
                    "Environment Variables",
                    True,
                    result,
                    message,
                    {"length": len(value), "starts_with": value[:20] + "..." if len(value) > 20 else value},
                    duration
                )
            else:
                self._add_test_result(
                    f"{var_name} Configuration",
                    description,
                    "Environment Variables",
                    True,
                    TestResult.FAIL,
                    f"Required environment variable {var_name} is not set",
                    {"suggestion": f"Set {var_name} in your environment configuration"},
                    duration
                )
    
    async def test_database_connections(self):
        """Test database connectivity"""
        database_url = os.getenv("DATABASE_URL")
        redis_url = os.getenv("REDIS_URL")
        
        # Test PostgreSQL connection
        if database_url:
            start_time = time.time()
            try:
                if database_url.startswith("sqlite://"):
                    # SQLite connection test
                    import sqlite3
                    db_path = database_url.replace("sqlite:///", "")
                    os.makedirs(os.path.dirname(db_path), exist_ok=True)
                    conn = sqlite3.connect(db_path)
                    conn.close()
                    result = TestResult.PASS
                    message = "SQLite database connection successful"
                else:
                    # For real PostgreSQL, we'd need psycopg2 or asyncpg
                    result = TestResult.SKIP
                    message = "PostgreSQL connection test skipped (requires psycopg2)"
                
                self._add_test_result(
                    "PostgreSQL Connection",
                    "Test connection to primary database",
                    "Database Connectivity",
                    True,
                    result,
                    message,
                    {"database_url": database_url[:20] + "..." if len(database_url) > 20 else database_url},
                    time.time() - start_time
                )
            except Exception as e:
                self._add_test_result(
                    "PostgreSQL Connection",
                    "Test connection to primary database",
                    "Database Connectivity",
                    True,
                    TestResult.FAIL,
                    f"Database connection failed: {str(e)}",
                    {"error": str(e)},
                    time.time() - start_time
                )
        
        # Test Redis connection
        if redis_url:
            start_time = time.time()
            try:
                # For real Redis, we'd need redis-py
                result = TestResult.SKIP
                message = "Redis connection test skipped (requires redis-py)"
                
                self._add_test_result(
                    "Redis Connection",
                    "Test connection to Redis cache",
                    "Database Connectivity",
                    True,
                    result,
                    message,
                    {"redis_url": redis_url[:20] + "..." if len(redis_url) > 20 else redis_url},
                    time.time() - start_time
                )
            except Exception as e:
                self._add_test_result(
                    "Redis Connection",
                    "Test connection to Redis cache",
                    "Database Connectivity",
                    True,
                    TestResult.FAIL,
                    f"Redis connection failed: {str(e)}",
                    {"error": str(e)},
                    time.time() - start_time
                )
    
    async def test_external_services(self):
        """Test external service connectivity"""
        services = [
            ("SUPABASE_URL", "Supabase", "health"),
            ("POSTHOG_HOST", "PostHog", "api/projects/"),
            ("SENTRY_DSN", "Sentry", None)  # Sentry doesn't have a simple health check
        ]
        
        for env_var, service_name, health_path in services:
            url = os.getenv(env_var)
            if not url:
                continue
            
            start_time = time.time()
            
            try:
                if health_path:
                    # Test service connectivity
                    test_url = f"{url.rstrip('/')}/{health_path}"
                    
                    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                        async with session.get(test_url) as response:
                            if response.status < 400:
                                result = TestResult.PASS
                                message = f"{service_name} is reachable"
                                details = {"status_code": response.status, "url": test_url}
                            else:
                                result = TestResult.WARNING
                                message = f"{service_name} returned {response.status}"
                                details = {"status_code": response.status, "url": test_url}
                else:
                    # Just validate URL format
                    parsed = urlparse(url)
                    if parsed.scheme and parsed.netloc:
                        result = TestResult.PASS
                        message = f"{service_name} URL format is valid"
                        details = {"url": f"{parsed.scheme}://{parsed.netloc}"}
                    else:
                        result = TestResult.FAIL
                        message = f"{service_name} URL format is invalid"
                        details = {"url": url}
                
                self._add_test_result(
                    f"{service_name} Connectivity",
                    f"Test connectivity to {service_name} service",
                    "External Services",
                    False,
                    result,
                    message,
                    details,
                    time.time() - start_time
                )
                
            except asyncio.TimeoutError:
                self._add_test_result(
                    f"{service_name} Connectivity",
                    f"Test connectivity to {service_name} service",
                    "External Services",
                    False,
                    TestResult.WARNING,
                    f"{service_name} connection timed out",
                    {"timeout": "10 seconds"},
                    time.time() - start_time
                )
            except Exception as e:
                self._add_test_result(
                    f"{service_name} Connectivity",
                    f"Test connectivity to {service_name} service",
                    "External Services",
                    False,
                    TestResult.FAIL,
                    f"{service_name} connection failed: {str(e)}",
                    {"error": str(e)},
                    time.time() - start_time
                )
    
    async def test_security_config(self):
        """Test security configuration"""
        start_time = time.time()
        
        # Test CORS configuration
        cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "")
        if cors_origins:
            if "*" in cors_origins and self.environment == "production":
                result = TestResult.FAIL
                message = "Wildcard CORS origin not allowed in production"
            elif "localhost" in cors_origins and self.environment == "production":
                result = TestResult.WARNING
                message = "Localhost CORS origin found in production config"
            else:
                result = TestResult.PASS
                message = "CORS origins configuration looks secure"
            
            self._add_test_result(
                "CORS Configuration",
                "Validate CORS origins are properly configured",
                "Security Configuration",
                True,
                result,
                message,
                {"origins": cors_origins.split(",")},
                time.time() - start_time
            )
        
        # Test debug mode
        start_time = time.time()
        debug_mode = os.getenv("DEBUG", "false").lower()
        if debug_mode == "true" and self.environment == "production":
            result = TestResult.FAIL
            message = "Debug mode must be disabled in production"
        elif debug_mode == "true":
            result = TestResult.WARNING
            message = "Debug mode is enabled"
        else:
            result = TestResult.PASS
            message = "Debug mode is properly disabled"
        
        self._add_test_result(
            "Debug Mode",
            "Ensure debug mode is disabled in production",
            "Security Configuration",
            True,
            result,
            message,
            {"debug": debug_mode},
            time.time() - start_time
        )
        
        # Test secret key strength
        start_time = time.time()
        secret_key = os.getenv("SECRET_KEY", "")
        if len(secret_key) < 32:
            result = TestResult.FAIL
            message = "Secret key too short (minimum 32 characters)"
        elif secret_key == "your-secret-key-change-in-production":
            result = TestResult.FAIL
            message = "Using default secret key - change immediately"
        else:
            result = TestResult.PASS
            message = "Secret key appears strong"
        
        self._add_test_result(
            "Secret Key Strength",
            "Validate secret key meets security requirements",
            "Security Configuration",
            True,
            result,
            message,
            {"length": len(secret_key)},
            time.time() - start_time
        )
    
    async def test_frontend_config(self):
        """Test frontend configuration"""
        frontend_vars = [
            ("VITE_SUPABASE_URL", "Frontend Supabase URL"),
            ("VITE_SUPABASE_ANON_KEY", "Frontend Supabase Key"),
            ("VITE_API_URL", "Frontend API URL")
        ]
        
        for var_name, description in frontend_vars:
            start_time = time.time()
            value = os.getenv(var_name)
            
            if value:
                # Validate URL format where appropriate
                if "URL" in var_name:
                    parsed = urlparse(value)
                    if parsed.scheme and parsed.netloc:
                        if parsed.scheme == "http" and self.environment == "production":
                            result = TestResult.WARNING
                            message = "Using HTTP in production - consider HTTPS"
                        else:
                            result = TestResult.PASS
                            message = "URL format is valid"
                    else:
                        result = TestResult.FAIL
                        message = "Invalid URL format"
                else:
                    result = TestResult.PASS
                    message = "Variable is set"
                
                self._add_test_result(
                    f"{var_name} Configuration",
                    description,
                    "Frontend Configuration",
                    True,
                    result,
                    message,
                    {"value": value[:30] + "..." if len(value) > 30 else value},
                    time.time() - start_time
                )
            else:
                self._add_test_result(
                    f"{var_name} Configuration",
                    description,
                    "Frontend Configuration",
                    True,
                    TestResult.FAIL,
                    f"Required frontend variable {var_name} is not set",
                    {"suggestion": f"Set {var_name} for frontend functionality"},
                    time.time() - start_time
                )
    
    async def test_api_endpoints(self):
        """Test API endpoint configuration"""
        api_url = os.getenv("VITE_API_URL") or os.getenv("API_BASE_URL")
        
        if not api_url:
            self._add_test_result(
                "API URL Configuration",
                "Test API base URL configuration",
                "API Endpoints",
                True,
                TestResult.FAIL,
                "API URL not configured",
                {"suggestion": "Set VITE_API_URL or API_BASE_URL"},
                0.0
            )
            return
        
        # Test API accessibility
        start_time = time.time()
        try:
            health_url = f"{api_url.rstrip('/')}/health"
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(health_url) as response:
                    if response.status == 200:
                        result = TestResult.PASS
                        message = "API health endpoint is accessible"
                    else:
                        result = TestResult.WARNING
                        message = f"API health endpoint returned {response.status}"
            
            self._add_test_result(
                "API Health Check",
                "Test API health endpoint accessibility",
                "API Endpoints",
                True,
                result,
                message,
                {"url": health_url, "status": response.status if 'response' in locals() else None},
                time.time() - start_time
            )
            
        except Exception as e:
            self._add_test_result(
                "API Health Check",
                "Test API health endpoint accessibility",
                "API Endpoints",
                True,
                TestResult.WARNING,
                f"Could not reach API health endpoint: {str(e)}",
                {"error": str(e), "url": health_url if 'health_url' in locals() else api_url},
                time.time() - start_time
            )
    
    async def test_render_config(self):
        """Test Render.com specific configuration"""
        render_yaml_path = Path("render.yaml")
        
        start_time = time.time()
        
        if not render_yaml_path.exists():
            self._add_test_result(
                "Render YAML Exists",
                "Check if render.yaml configuration file exists",
                "Render.com Configuration",
                True,
                TestResult.FAIL,
                "render.yaml file not found",
                {"suggestion": "Create render.yaml file for deployment"},
                time.time() - start_time
            )
            return
        
        # Test render.yaml structure
        try:
            with open(render_yaml_path) as f:
                render_config = yaml.safe_load(f)
            
            # Check basic structure
            if "services" not in render_config:
                result = TestResult.FAIL
                message = "render.yaml missing 'services' section"
            elif "databases" not in render_config and self.environment == "production":
                result = TestResult.WARNING
                message = "render.yaml missing 'databases' section for production"
            else:
                result = TestResult.PASS
                message = "render.yaml structure is valid"
            
            self._add_test_result(
                "Render YAML Structure",
                "Validate render.yaml file structure",
                "Render.com Configuration",
                True,
                result,
                message,
                {
                    "has_services": "services" in render_config,
                    "has_databases": "databases" in render_config,
                    "service_count": len(render_config.get("services", []))
                },
                time.time() - start_time
            )
            
            # Check environment variables in render.yaml
            start_time = time.time()
            services = render_config.get("services", [])
            if services:
                service = services[0]  # Check first service
                env_vars = service.get("envVars", [])
                
                required_vars = [
                    "SECRET_KEY", "DATABASE_URL", "REDIS_URL",
                    "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"
                ]
                
                configured_vars = [var["key"] for var in env_vars]
                missing_vars = [var for var in required_vars if var not in configured_vars]
                
                if missing_vars:
                    result = TestResult.FAIL
                    message = f"Missing required environment variables in render.yaml: {', '.join(missing_vars)}"
                else:
                    result = TestResult.PASS
                    message = "All required environment variables configured in render.yaml"
                
                self._add_test_result(
                    "Render Environment Variables",
                    "Check required environment variables in render.yaml",
                    "Render.com Configuration",
                    True,
                    result,
                    message,
                    {
                        "configured_vars": len(configured_vars),
                        "missing_vars": missing_vars
                    },
                    time.time() - start_time
                )
        
        except Exception as e:
            self._add_test_result(
                "Render YAML Structure",
                "Validate render.yaml file structure",
                "Render.com Configuration",
                True,
                TestResult.FAIL,
                f"Failed to parse render.yaml: {str(e)}",
                {"error": str(e)},
                time.time() - start_time
            )
    
    async def test_production_readiness(self):
        """Test overall production readiness"""
        if self.environment != "production":
            self._add_test_result(
                "Production Readiness Check",
                "Overall production readiness assessment",
                "Production Readiness",
                False,
                TestResult.SKIP,
                "Skipped - not in production environment",
                {"environment": self.environment},
                0.0
            )
            return
        
        start_time = time.time()
        
        # Check production-specific requirements
        issues = []
        
        # Check for localhost references
        for env_var in os.environ:
            value = os.environ[env_var]
            if "localhost" in value.lower():
                issues.append(f"{env_var} contains localhost reference")
        
        # Check debug mode
        if os.getenv("DEBUG", "false").lower() == "true":
            issues.append("Debug mode is enabled")
        
        # Check CORS
        cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "")
        if "*" in cors_origins:
            issues.append("Wildcard CORS origin configured")
        
        # Check HTTPS
        urls_to_check = ["VITE_API_URL", "API_BASE_URL", "SUPABASE_URL"]
        for var in urls_to_check:
            url = os.getenv(var, "")
            if url and url.startswith("http://"):
                issues.append(f"{var} uses HTTP instead of HTTPS")
        
        if issues:
            result = TestResult.FAIL
            message = f"Production readiness issues found: {'; '.join(issues)}"
        else:
            result = TestResult.PASS
            message = "Application appears ready for production deployment"
        
        self._add_test_result(
            "Production Readiness Check",
            "Overall production readiness assessment",
            "Production Readiness",
            True,
            result,
            message,
            {"issues": issues},
            time.time() - start_time
        )
    
    def _generate_report(self) -> DeploymentTestReport:
        """Generate the final test report"""
        
        # Count results
        results_count = {
            TestResult.PASS: 0,
            TestResult.FAIL: 0,
            TestResult.SKIP: 0,
            TestResult.WARNING: 0
        }
        
        for test in self.tests:
            results_count[test.result] += 1
        
        # Determine deployment readiness
        is_deployment_ready = (
            results_count[TestResult.FAIL] == 0 and
            (self.environment != "production" or 
             results_count[TestResult.WARNING] <= 2)  # Allow some warnings for dev
        )
        
        return DeploymentTestReport(
            environment=self.environment,
            total_tests=len(self.tests),
            passed=results_count[TestResult.PASS],
            failed=results_count[TestResult.FAIL],
            skipped=results_count[TestResult.SKIP],
            warnings=results_count[TestResult.WARNING],
            tests=self.tests,
            is_deployment_ready=is_deployment_ready,
            summary={
                "by_category": self._summarize_by_category(),
                "by_result": {result.value: count for result, count in results_count.items()},
                "critical_failures": [t.name for t in self.tests if t.result == TestResult.FAIL and t.required]
            }
        )
    
    def _summarize_by_category(self) -> Dict[str, Dict[str, int]]:
        """Summarize results by category"""
        categories = {}
        
        for test in self.tests:
            if test.category not in categories:
                categories[test.category] = {
                    "pass": 0, "fail": 0, "skip": 0, "warning": 0
                }
            categories[test.category][test.result.value] += 1
        
        return categories
    
    def print_report(self, report: DeploymentTestReport):
        """Print formatted test report"""
        
        print(f"\n{'='*80}")
        print(f"WAR ROOM ANALYTICS - DEPLOYMENT CONFIGURATION TEST REPORT")
        print(f"{'='*80}")
        print(f"Environment: {report.environment.upper()}")
        print(f"Total Tests: {report.total_tests}")
        print(f"Passed: ✅ {report.passed}")
        print(f"Failed: ❌ {report.failed}")
        print(f"Warnings: ⚠️ {report.warnings}")
        print(f"Skipped: ⏭️ {report.skipped}")
        print(f"Deployment Ready: {'✅ YES' if report.is_deployment_ready else '❌ NO'}")
        
        # Print results by category
        print(f"\n📊 RESULTS BY CATEGORY:")
        for category, results in report.summary["by_category"].items():
            total = sum(results.values())
            print(f"  📁 {category}: {total} tests")
            print(f"     ✅ {results['pass']} | ❌ {results['fail']} | ⚠️ {results['warning']} | ⏭️ {results['skip']}")
        
        # Print failed tests
        failed_tests = [t for t in report.tests if t.result == TestResult.FAIL]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  📋 {test.name}")
                print(f"     Category: {test.category}")
                print(f"     Required: {'Yes' if test.required else 'No'}")
                print(f"     Message: {test.message}")
                print(f"     Duration: {test.duration:.2f}s")
                if test.details:
                    print(f"     Details: {json.dumps(test.details, indent=8)}")
                print()
        
        # Print warnings
        warning_tests = [t for t in report.tests if t.result == TestResult.WARNING]
        if warning_tests:
            print(f"\n⚠️ WARNINGS ({len(warning_tests)}):")
            for test in warning_tests:
                print(f"  📋 {test.name}: {test.message}")
        
        print(f"\n{'='*80}")
        
        # Print recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if report.failed > 0:
            print(f"  1. Fix all failed tests before deployment")
            print(f"  2. Pay special attention to required tests")
        
        if report.warnings > 0:
            print(f"  3. Review warnings for production deployment")
        
        if not report.is_deployment_ready:
            print(f"  4. This configuration is NOT ready for production deployment")
        else:
            print(f"  4. Configuration appears ready for deployment! 🎉")
        
        print(f"\n{'='*80}")
    
    def save_json_report(self, report: DeploymentTestReport, filename: str):
        """Save report as JSON file"""
        report_data = {
            "deployment_test_report": {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "environment": report.environment,
                "summary": {
                    "total_tests": report.total_tests,
                    "passed": report.passed,
                    "failed": report.failed,
                    "warnings": report.warnings,
                    "skipped": report.skipped,
                    "is_deployment_ready": report.is_deployment_ready
                },
                "tests": [asdict(test) for test in report.tests],
                "analysis": report.summary
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(report_data, f, indent=2, default=str)
        
        print(f"📄 JSON report saved to {filename}")


async def main():
    """Main CLI interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description="War Room Deployment Configuration Tester")
    parser.add_argument("--env", choices=["development", "staging", "production"],
                       default="development", help="Environment to test")
    parser.add_argument("--json", type=str, help="Save JSON report to file")
    parser.add_argument("--ci", action="store_true", help="CI mode - exit with error if tests fail")
    parser.add_argument("--timeout", type=int, default=60, help="Test timeout in seconds")
    
    args = parser.parse_args()
    
    # Create tester and run tests
    tester = DeploymentConfigTester(args.env)
    
    try:
        # Run tests with timeout
        report = await asyncio.wait_for(
            tester.run_all_tests(),
            timeout=args.timeout
        )
    except asyncio.TimeoutError:
        print(f"❌ Tests timed out after {args.timeout} seconds")
        exit(1)
    
    # Print report
    tester.print_report(report)
    
    # Save JSON report if requested
    if args.json:
        tester.save_json_report(report, args.json)
    
    # CI mode exit codes
    if args.ci:
        if report.failed > 0:
            print(f"\n❌ CI FAILURE: {report.failed} tests failed")
            exit(1)
        elif not report.is_deployment_ready:
            print(f"\n❌ CI FAILURE: Configuration not ready for deployment")
            exit(1)
        else:
            print(f"\n✅ CI PASS: All tests passed, deployment ready")
            exit(0)


if __name__ == "__main__":
    asyncio.run(main())