#!/usr/bin/env python3
"""
CodeRabbit Integration Deployment Script

Comprehensive deployment system for SUB-AGENT 3 - CodeRabbit Integration:
- Environment setup and validation
- Service configuration and deployment
- Health checks and monitoring setup
- Database initialization
- Security configuration
- Integration testing
"""

import os
import sys
import json
import yaml
import logging
import subprocess
import asyncio
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
import aiohttp
import psutil

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from coderabbit_integration import CodeRabbitIntegration
from github_webhook_server import GitHubWebhookServer
from security_alerting import SecurityAlertingSystem
from pieces_integration import PiecesIntegration
from cicd_integration import CICDIntegration

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/tmp/coderabbit_deployment.log')
    ]
)
logger = logging.getLogger(__name__)

class CodeRabbitDeployment:
    """Comprehensive CodeRabbit integration deployment manager"""
    
    def __init__(self, config_path: str = "config/coderabbit_config.yaml"):
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.deployment_status = {
            "environment_setup": False,
            "dependencies_installed": False,
            "database_initialized": False,
            "services_configured": False,
            "security_setup": False,
            "monitoring_configured": False,
            "integration_tests_passed": False,
            "health_checks_passed": False
        }
        
        # Deployment metadata
        self.deployment_id = f"cr-deploy-{int(datetime.utcnow().timestamp())}"
        self.start_time = datetime.utcnow()
        
    def _load_config(self) -> Dict[str, Any]:
        """Load deployment configuration"""
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r') as f:
                    config = yaml.safe_load(f)
                    # Expand environment variables
                    return self._expand_env_vars(config)
            else:
                logger.error(f"Configuration file not found: {self.config_path}")
                sys.exit(1)
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            sys.exit(1)
    
    def _expand_env_vars(self, config: Any) -> Any:
        """Recursively expand environment variables in config"""
        if isinstance(config, dict):
            return {k: self._expand_env_vars(v) for k, v in config.items()}
        elif isinstance(config, list):
            return [self._expand_env_vars(item) for item in config]
        elif isinstance(config, str) and config.startswith("${") and config.endswith("}"):
            env_var = config[2:-1]
            return os.getenv(env_var, config)
        else:
            return config
    
    async def deploy(self, environment: str = "production") -> bool:
        """Execute complete deployment process"""
        logger.info(f"Starting CodeRabbit Integration deployment (ID: {self.deployment_id})")
        logger.info(f"Environment: {environment}")
        logger.info(f"Configuration: {self.config_path}")
        
        try:
            # Pre-deployment checks
            logger.info("Running pre-deployment checks...")
            if not await self._pre_deployment_checks():
                logger.error("Pre-deployment checks failed")
                return False
            
            # Step 1: Environment setup
            logger.info("Setting up environment...")
            if not await self._setup_environment():
                logger.error("Environment setup failed")
                return False
            self.deployment_status["environment_setup"] = True
            
            # Step 2: Install dependencies
            logger.info("Installing dependencies...")
            if not await self._install_dependencies():
                logger.error("Dependency installation failed")
                return False
            self.deployment_status["dependencies_installed"] = True
            
            # Step 3: Initialize database
            logger.info("Initializing database...")
            if not await self._initialize_database():
                logger.error("Database initialization failed")
                return False
            self.deployment_status["database_initialized"] = True
            
            # Step 4: Configure services
            logger.info("Configuring services...")
            if not await self._configure_services():
                logger.error("Service configuration failed")
                return False
            self.deployment_status["services_configured"] = True
            
            # Step 5: Setup security
            logger.info("Setting up security...")
            if not await self._setup_security():
                logger.error("Security setup failed")
                return False
            self.deployment_status["security_setup"] = True
            
            # Step 6: Configure monitoring
            logger.info("Configuring monitoring...")
            if not await self._configure_monitoring():
                logger.error("Monitoring configuration failed")
                return False
            self.deployment_status["monitoring_configured"] = True
            
            # Step 7: Run integration tests
            logger.info("Running integration tests...")
            if not await self._run_integration_tests():
                logger.error("Integration tests failed")
                return False
            self.deployment_status["integration_tests_passed"] = True
            
            # Step 8: Final health checks
            logger.info("Running final health checks...")
            if not await self._run_health_checks():
                logger.error("Health checks failed")
                return False
            self.deployment_status["health_checks_passed"] = True
            
            # Post-deployment tasks
            await self._post_deployment_tasks()
            
            duration = (datetime.utcnow() - self.start_time).total_seconds()
            logger.info(f"✅ Deployment completed successfully in {duration:.1f} seconds")
            
            # Generate deployment report
            await self._generate_deployment_report(True)
            
            return True
            
        except Exception as e:
            logger.error(f"Deployment failed: {e}")
            await self._handle_deployment_failure(e)
            return False
    
    async def _pre_deployment_checks(self) -> bool:
        """Run pre-deployment validation checks"""
        checks = []
        
        # Check Python version
        python_version = sys.version_info
        if python_version < (3, 8):
            logger.error(f"Python 3.8+ required, got {python_version.major}.{python_version.minor}")
            return False
        checks.append("✅ Python version check passed")
        
        # Check required environment variables
        required_env_vars = [
            "GITHUB_TOKEN", "CODERABBIT_API_KEY", "GITHUB_WEBHOOK_SECRET"
        ]
        
        missing_vars = [var for var in required_env_vars if not os.getenv(var)]
        if missing_vars:
            logger.error(f"Missing required environment variables: {missing_vars}")
            return False
        checks.append("✅ Environment variables check passed")
        
        # Check system resources
        memory_gb = psutil.virtual_memory().total / (1024**3)
        if memory_gb < 2:
            logger.warning(f"Low memory: {memory_gb:.1f}GB (recommended: 4GB+)")
        checks.append(f"✅ System memory: {memory_gb:.1f}GB")
        
        # Check disk space
        disk_usage = psutil.disk_usage('/')
        free_gb = disk_usage.free / (1024**3)
        if free_gb < 1:
            logger.error(f"Insufficient disk space: {free_gb:.1f}GB free")
            return False
        checks.append(f"✅ Disk space: {free_gb:.1f}GB free")
        
        # Check network connectivity
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("https://api.github.com", timeout=10) as response:
                    if response.status != 200:
                        logger.error("GitHub API not accessible")
                        return False
            checks.append("✅ Network connectivity check passed")
        except Exception as e:
            logger.error(f"Network connectivity check failed: {e}")
            return False
        
        for check in checks:
            logger.info(check)
        
        return True
    
    async def _setup_environment(self) -> bool:
        """Setup deployment environment"""
        try:
            # Create necessary directories
            directories = [
                "/var/log/coderabbit",
                "/var/lib/coderabbit",
                "/etc/coderabbit",
                str(Path.home() / ".coderabbit"),
                "logs",
                "data",
                "backups"
            ]
            
            for directory in directories:
                path = Path(directory)
                path.mkdir(parents=True, exist_ok=True)
                logger.info(f"Created directory: {path}")
            
            # Copy configuration files
            config_dest = Path("/etc/coderabbit/config.yaml")
            if not config_dest.exists():
                import shutil
                shutil.copy2(self.config_path, config_dest)
                logger.info(f"Copied configuration to {config_dest}")
            
            # Set up environment variables file
            env_file = Path(".env")
            if not env_file.exists():
                with open(env_file, 'w') as f:
                    f.write("# CodeRabbit Integration Environment Variables\n")
                    f.write(f"DEPLOYMENT_ID={self.deployment_id}\n")
                    f.write(f"DEPLOYMENT_TIME={self.start_time.isoformat()}\n")
                    f.write(f"ENVIRONMENT={self.config.get('deployment', {}).get('environment', 'production')}\n")
                logger.info("Created environment variables file")
            
            return True
            
        except Exception as e:
            logger.error(f"Environment setup failed: {e}")
            return False
    
    async def _install_dependencies(self) -> bool:
        """Install required dependencies"""
        try:
            # Requirements for the CodeRabbit integration
            requirements = [
                "aiohttp>=3.8.0",
                "pyyaml>=6.0",
                "psutil>=5.8.0",
                "asyncio-throttle>=1.0.2",
                "backoff>=2.2.0",
                "aiofiles>=0.8.0",
                "cryptography>=3.4.0",
                "sqlalchemy>=1.4.0",
                "alembic>=1.7.0",
                "prometheus-client>=0.12.0",
                "watchdog>=2.1.0"
            ]
            
            # Check if requirements are already satisfied
            import importlib
            missing_packages = []
            
            for req in requirements:
                package_name = req.split(">=")[0].split("==")[0]
                try:
                    importlib.import_module(package_name.replace("-", "_"))
                except ImportError:
                    missing_packages.append(req)
            
            if missing_packages:
                logger.info(f"Installing {len(missing_packages)} missing packages...")
                
                # Create requirements file
                req_file = Path("requirements.txt")
                with open(req_file, 'w') as f:
                    for req in requirements:
                        f.write(f"{req}\n")
                
                # Install using pip
                result = subprocess.run([
                    sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
                ], capture_output=True, text=True)
                
                if result.returncode != 0:
                    logger.error(f"pip install failed: {result.stderr}")
                    return False
                
                logger.info("Dependencies installed successfully")
            else:
                logger.info("All dependencies already satisfied")
            
            return True
            
        except Exception as e:
            logger.error(f"Dependency installation failed: {e}")
            return False
    
    async def _initialize_database(self) -> bool:
        """Initialize database for persistent storage"""
        try:
            db_config = self.config.get("database", {})
            db_type = db_config.get("type", "sqlite")
            
            if db_type == "sqlite":
                db_path = Path(db_config.get("sqlite", {}).get("path", "data/coderabbit.db"))
                db_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Create SQLite database schema
                schema_sql = """
                CREATE TABLE IF NOT EXISTS pipeline_executions (
                    id TEXT PRIMARY KEY,
                    repository TEXT NOT NULL,
                    commit_sha TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    metadata TEXT
                );
                
                CREATE TABLE IF NOT EXISTS security_issues (
                    id TEXT PRIMARY KEY,
                    severity TEXT NOT NULL,
                    category TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'open',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    resolved_at TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS fix_attempts (
                    id TEXT PRIMARY KEY,
                    file_path TEXT NOT NULL,
                    fix_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT
                );
                
                CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_executions(status);
                CREATE INDEX IF NOT EXISTS idx_security_severity ON security_issues(severity);
                CREATE INDEX IF NOT EXISTS idx_fix_status ON fix_attempts(status);
                """
                
                import sqlite3
                with sqlite3.connect(db_path) as conn:
                    conn.executescript(schema_sql)
                
                logger.info(f"SQLite database initialized: {db_path}")
            
            elif db_type in ["postgresql", "mysql"]:
                logger.info(f"Database type {db_type} requires external setup")
                # In production, this would connect to external database
                # and run migrations
            
            return True
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            return False
    
    async def _configure_services(self) -> bool:
        """Configure all services and components"""
        try:
            # Generate systemd service files if on Linux
            if sys.platform.startswith('linux'):
                await self._create_systemd_services()
            
            # Create service configuration files
            service_configs = {
                "webhook_server": {
                    "host": self.config.get("webhook_server", {}).get("host", "0.0.0.0"),
                    "port": self.config.get("webhook_server", {}).get("port", 8080),
                    "ssl_enabled": self.config.get("webhook_server", {}).get("ssl_enabled", False)
                },
                "coderabbit_agent": {
                    "review_timeout": self.config.get("performance", {}).get("review_timeout_minutes", 30),
                    "max_concurrent_reviews": self.config.get("performance", {}).get("max_concurrent_reviews", 5)
                }
            }
            
            # Write service configurations
            for service, config in service_configs.items():
                config_file = Path(f"config/{service}.json")
                with open(config_file, 'w') as f:
                    json.dump(config, f, indent=2)
                logger.info(f"Created configuration: {config_file}")
            
            return True
            
        except Exception as e:
            logger.error(f"Service configuration failed: {e}")
            return False
    
    async def _create_systemd_services(self):
        """Create systemd service files"""
        webhook_service = f"""[Unit]
Description=CodeRabbit GitHub Webhook Server
After=network.target

[Service]
Type=simple
User=coderabbit
WorkingDirectory={Path.cwd()}
Environment=PYTHONPATH={Path.cwd()}
ExecStart={sys.executable} -m github_webhook_server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
        
        integration_service = f"""[Unit]
Description=CodeRabbit Integration Service
After=network.target

[Service]
Type=simple
User=coderabbit
WorkingDirectory={Path.cwd()}
Environment=PYTHONPATH={Path.cwd()}
ExecStart={sys.executable} -m coderabbit_integration
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
        
        # Write service files
        services = {
            "coderabbit-webhook.service": webhook_service,
            "coderabbit-integration.service": integration_service
        }
        
        for filename, content in services.items():
            service_path = Path("/tmp") / filename  # Would be /etc/systemd/system in production
            with open(service_path, 'w') as f:
                f.write(content)
            logger.info(f"Created systemd service: {service_path}")
    
    async def _setup_security(self) -> bool:
        """Setup security configuration"""
        try:
            security_config = self.config.get("security", {})
            
            # Create SSL certificates if needed
            if self.config.get("webhook_server", {}).get("ssl_enabled"):
                ssl_cert_path = self.config.get("webhook_server", {}).get("ssl_cert_path")
                ssl_key_path = self.config.get("webhook_server", {}).get("ssl_key_path")
                
                if not ssl_cert_path or not ssl_key_path:
                    # Generate self-signed certificate for development
                    await self._generate_ssl_certificate()
            
            # Set up file permissions
            sensitive_files = [
                self.config_path,
                Path(".env"),
                Path("data/coderabbit.db")
            ]
            
            for file_path in sensitive_files:
                if file_path.exists():
                    os.chmod(file_path, 0o600)  # Read/write for owner only
                    logger.info(f"Set secure permissions for {file_path}")
            
            # Validate webhook secret
            webhook_secret = os.getenv("GITHUB_WEBHOOK_SECRET")
            if not webhook_secret or len(webhook_secret) < 20:
                logger.warning("Webhook secret is weak or missing")
            
            return True
            
        except Exception as e:
            logger.error(f"Security setup failed: {e}")
            return False
    
    async def _generate_ssl_certificate(self):
        """Generate self-signed SSL certificate for development"""
        try:
            from cryptography import x509
            from cryptography.x509.oid import NameOID
            from cryptography.hazmat.primitives import hashes, serialization
            from cryptography.hazmat.primitives.asymmetric import rsa
            import ipaddress
            
            # Generate private key
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
            )
            
            # Create certificate
            subject = issuer = x509.Name([
                x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
                x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "CA"),
                x509.NameAttribute(NameOID.LOCALITY_NAME, "San Francisco"),
                x509.NameAttribute(NameOID.ORGANIZATION_NAME, "War Room CodeRabbit"),
                x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
            ])
            
            cert = x509.CertificateBuilder().subject_name(
                subject
            ).issuer_name(
                issuer
            ).public_key(
                private_key.public_key()
            ).serial_number(
                x509.random_serial_number()
            ).not_valid_before(
                datetime.utcnow()
            ).not_valid_after(
                datetime.utcnow() + timedelta(days=365)
            ).add_extension(
                x509.SubjectAlternativeName([
                    x509.DNSName("localhost"),
                    x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
                ]),
                critical=False,
            ).sign(private_key, hashes.SHA256())
            
            # Write certificate and key
            cert_path = Path("ssl/cert.pem")
            key_path = Path("ssl/key.pem")
            cert_path.parent.mkdir(exist_ok=True)
            
            with open(cert_path, "wb") as f:
                f.write(cert.public_bytes(serialization.Encoding.PEM))
            
            with open(key_path, "wb") as f:
                f.write(private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                ))
            
            logger.info(f"Generated SSL certificate: {cert_path}")
            
        except ImportError:
            logger.warning("cryptography package required for SSL certificate generation")
        except Exception as e:
            logger.error(f"SSL certificate generation failed: {e}")
    
    async def _configure_monitoring(self) -> bool:
        """Configure monitoring and logging"""
        try:
            monitoring_config = self.config.get("monitoring", {})
            
            # Setup log rotation
            log_file = Path(monitoring_config.get("logging", {}).get("file", "logs/coderabbit.log"))
            log_file.parent.mkdir(exist_ok=True)
            
            # Create logrotate configuration
            logrotate_config = f"""
{log_file} {{
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 coderabbit coderabbit
}}
"""
            
            logrotate_file = Path("/tmp/coderabbit.logrotate")  # Would be /etc/logrotate.d/ in production
            with open(logrotate_file, 'w') as f:
                f.write(logrotate_config)
            logger.info(f"Created logrotate configuration: {logrotate_file}")
            
            # Setup metrics collection
            if monitoring_config.get("metrics", {}).get("enabled"):
                metrics_port = monitoring_config["metrics"]["port"]
                logger.info(f"Metrics endpoint will be available on port {metrics_port}")
            
            # Create monitoring scripts
            health_check_script = f"""#!/bin/bash
# CodeRabbit Health Check Script

echo "Checking CodeRabbit Integration Health..."

# Check webhook server
curl -f http://localhost:{self.config.get("webhook_server", {}).get("port", 8080)}/health || exit 1

# Check database connectivity
python3 -c "import sqlite3; sqlite3.connect('data/coderabbit.db').execute('SELECT 1')" || exit 1

echo "All health checks passed"
"""
            
            health_script_path = Path("scripts/health_check.sh")
            health_script_path.parent.mkdir(exist_ok=True)
            with open(health_script_path, 'w') as f:
                f.write(health_check_script)
            os.chmod(health_script_path, 0o755)
            logger.info(f"Created health check script: {health_script_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"Monitoring configuration failed: {e}")
            return False
    
    async def _run_integration_tests(self) -> bool:
        """Run integration tests to validate deployment"""
        try:
            logger.info("Running integration tests...")
            
            # Test 1: CodeRabbit integration initialization
            try:
                agent = CodeRabbitIntegration()
                logger.info("✅ CodeRabbit agent initialization test passed")
            except Exception as e:
                logger.error(f"❌ CodeRabbit agent initialization failed: {e}")
                return False
            
            # Test 2: Webhook server initialization
            try:
                server = GitHubWebhookServer()
                logger.info("✅ Webhook server initialization test passed")
            except Exception as e:
                logger.error(f"❌ Webhook server initialization failed: {e}")
                return False
            
            # Test 3: Security alerting system
            try:
                alerting = SecurityAlertingSystem()
                logger.info("✅ Security alerting system initialization test passed")
            except Exception as e:
                logger.error(f"❌ Security alerting system initialization failed: {e}")
                return False
            
            # Test 4: Pieces integration
            try:
                pieces_api_key = os.getenv("PIECES_API_KEY")
                if pieces_api_key:
                    async with PiecesIntegration(pieces_api_key) as pieces:
                        logger.info("✅ Pieces integration initialization test passed")
                else:
                    logger.info("⚠️ Pieces integration test skipped (no API key)")
            except Exception as e:
                logger.error(f"❌ Pieces integration initialization failed: {e}")
                return False
            
            # Test 5: CI/CD integration
            try:
                cicd = CICDIntegration()
                logger.info("✅ CI/CD integration initialization test passed")
            except Exception as e:
                logger.error(f"❌ CI/CD integration initialization failed: {e}")
                return False
            
            # Test 6: Configuration validation
            required_config_keys = [
                "github_token", "coderabbit_api_key", "webhook_secret"
            ]
            
            for key in required_config_keys:
                if not self.config.get(key):
                    logger.error(f"❌ Missing required configuration: {key}")
                    return False
            
            logger.info("✅ Configuration validation test passed")
            
            logger.info("All integration tests passed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Integration tests failed: {e}")
            return False
    
    async def _run_health_checks(self) -> bool:
        """Run final health checks"""
        try:
            logger.info("Running health checks...")
            
            # Health check 1: System resources
            memory = psutil.virtual_memory()
            if memory.percent > 90:
                logger.warning(f"High memory usage: {memory.percent}%")
            else:
                logger.info(f"✅ Memory usage: {memory.percent}%")
            
            # Health check 2: Disk space
            disk = psutil.disk_usage('/')
            if disk.percent > 90:
                logger.warning(f"High disk usage: {disk.percent}%")
            else:
                logger.info(f"✅ Disk usage: {disk.percent}%")
            
            # Health check 3: Database connectivity
            try:
                import sqlite3
                db_path = self.config.get("database", {}).get("sqlite", {}).get("path", "data/coderabbit.db")
                with sqlite3.connect(db_path) as conn:
                    conn.execute("SELECT 1")
                logger.info("✅ Database connectivity check passed")
            except Exception as e:
                logger.error(f"❌ Database connectivity check failed: {e}")
                return False
            
            # Health check 4: External API accessibility
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get("https://api.github.com", timeout=10) as response:
                        if response.status == 200:
                            logger.info("✅ GitHub API accessibility check passed")
                        else:
                            logger.warning(f"GitHub API returned status: {response.status}")
            except Exception as e:
                logger.warning(f"GitHub API accessibility check failed: {e}")
            
            # Health check 5: Configuration file integrity
            if self.config_path.exists():
                logger.info("✅ Configuration file integrity check passed")
            else:
                logger.error("❌ Configuration file missing")
                return False
            
            logger.info("All health checks passed")
            return True
            
        except Exception as e:
            logger.error(f"Health checks failed: {e}")
            return False
    
    async def _post_deployment_tasks(self):
        """Execute post-deployment tasks"""
        try:
            # Create deployment manifest
            manifest = {
                "deployment_id": self.deployment_id,
                "deployment_time": self.start_time.isoformat(),
                "environment": self.config.get("deployment", {}).get("environment", "production"),
                "version": "1.0.0",
                "components": [
                    "coderabbit_integration",
                    "github_webhook_server", 
                    "security_alerting",
                    "pieces_integration",
                    "cicd_integration"
                ],
                "status": self.deployment_status
            }
            
            manifest_file = Path("data/deployment_manifest.json")
            with open(manifest_file, 'w') as f:
                json.dump(manifest, f, indent=2)
            logger.info(f"Created deployment manifest: {manifest_file}")
            
            # Send deployment notification
            await self._send_deployment_notification(True)
            
        except Exception as e:
            logger.warning(f"Post-deployment tasks failed: {e}")
    
    async def _send_deployment_notification(self, success: bool):
        """Send deployment completion notification"""
        try:
            notification_config = self.config.get("deployment", {}).get("notifications", {})
            
            status = "SUCCESS" if success else "FAILED"
            message = f"""
🚀 CodeRabbit Integration Deployment {status}

Deployment ID: {self.deployment_id}
Environment: {self.config.get("deployment", {}).get("environment", "production")}
Duration: {(datetime.utcnow() - self.start_time).total_seconds():.1f}s
Status: {"✅ All components deployed successfully" if success else "❌ Deployment failed"}

Components:
- CodeRabbit Integration Agent
- GitHub Webhook Server
- Security Alerting System
- Pieces Integration
- CI/CD Integration

Next Steps:
1. Configure GitHub webhook URL: http://your-server:8080/webhook/github
2. Test integration with a sample commit
3. Monitor logs and metrics
"""
            
            # Send Slack notification if configured
            slack_config = notification_config.get("slack")
            if slack_config and slack_config.get("webhook"):
                payload = {"text": message}
                async with aiohttp.ClientSession() as session:
                    await session.post(slack_config["webhook"], json=payload)
                logger.info("Sent Slack deployment notification")
            
        except Exception as e:
            logger.warning(f"Failed to send deployment notification: {e}")
    
    async def _generate_deployment_report(self, success: bool):
        """Generate comprehensive deployment report"""
        try:
            duration = (datetime.utcnow() - self.start_time).total_seconds()
            
            report = {
                "deployment_summary": {
                    "id": self.deployment_id,
                    "status": "SUCCESS" if success else "FAILED",
                    "start_time": self.start_time.isoformat(),
                    "end_time": datetime.utcnow().isoformat(),
                    "duration_seconds": duration,
                    "environment": self.config.get("deployment", {}).get("environment", "production")
                },
                "component_status": self.deployment_status,
                "configuration": {
                    "auto_fix_enabled": self.config.get("settings", {}).get("auto_fix_enabled", False),
                    "security_threshold": self.config.get("settings", {}).get("security_threshold", "medium"),
                    "webhook_port": self.config.get("webhook_server", {}).get("port", 8080),
                    "features_enabled": self.config.get("features", {})
                },
                "system_info": {
                    "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
                    "platform": sys.platform,
                    "memory_gb": psutil.virtual_memory().total / (1024**3),
                    "disk_free_gb": psutil.disk_usage('/').free / (1024**3)
                }
            }
            
            report_file = Path(f"reports/deployment_report_{self.deployment_id}.json")
            report_file.parent.mkdir(exist_ok=True)
            
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            logger.info(f"Generated deployment report: {report_file}")
            
        except Exception as e:
            logger.warning(f"Failed to generate deployment report: {e}")
    
    async def _handle_deployment_failure(self, error: Exception):
        """Handle deployment failure and cleanup"""
        logger.error(f"Deployment failed: {error}")
        
        # Generate failure report
        await self._generate_deployment_report(False)
        
        # Send failure notification
        await self._send_deployment_notification(False)
        
        # Log detailed error information
        logger.error("Deployment status at failure:")
        for step, status in self.deployment_status.items():
            status_icon = "✅" if status else "❌"
            logger.error(f"  {status_icon} {step}: {status}")

async def main():
    """Main deployment entry point"""
    parser = argparse.ArgumentParser(description="Deploy CodeRabbit Integration")
    parser.add_argument("--config", default="config/coderabbit_config.yaml", 
                       help="Configuration file path")
    parser.add_argument("--environment", default="production",
                       choices=["development", "staging", "production"],
                       help="Deployment environment")
    parser.add_argument("--dry-run", action="store_true",
                       help="Run pre-deployment checks only")
    
    args = parser.parse_args()
    
    deployment = CodeRabbitDeployment(args.config)
    
    if args.dry_run:
        logger.info("Running pre-deployment checks only...")
        success = await deployment._pre_deployment_checks()
        if success:
            logger.info("✅ Pre-deployment checks passed - ready for deployment")
        else:
            logger.error("❌ Pre-deployment checks failed")
        sys.exit(0 if success else 1)
    
    success = await deployment.deploy(args.environment)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())