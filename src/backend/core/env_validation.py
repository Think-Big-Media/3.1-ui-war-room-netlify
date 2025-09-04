"""
Environment Variable Validation System for War Room Analytics
Provides comprehensive validation and type checking for all environment variables
"""
import os
import re
from typing import Dict, List, Optional, Any, Union, Callable
from urllib.parse import urlparse
from pydantic import BaseModel, Field, validator, ValidationError
from pydantic_settings import BaseSettings
import logging
from enum import Enum

logger = logging.getLogger(__name__)


class EnvironmentType(str, Enum):
    """Supported environment types"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


class ValidationSeverity(str, Enum):
    """Validation severity levels"""
    CRITICAL = "critical"  # Must be present and valid
    WARNING = "warning"   # Should be present but not required
    INFO = "info"        # Optional but recommended


class EnvVarSpec(BaseModel):
    """Specification for an environment variable"""
    name: str
    description: str
    required: bool = True
    severity: ValidationSeverity = ValidationSeverity.CRITICAL
    default: Optional[str] = None
    pattern: Optional[str] = None  # Regex pattern for validation
    validator_func: Optional[Callable[[str], bool]] = None
    environments: List[EnvironmentType] = Field(default_factory=lambda: list(EnvironmentType))
    sensitive: bool = False  # Whether this contains sensitive data
    examples: List[str] = Field(default_factory=list)
    
    class Config:
        arbitrary_types_allowed = True


class EnvValidationResult(BaseModel):
    """Result of environment validation"""
    variable: str
    value: Optional[str]
    is_valid: bool
    severity: ValidationSeverity
    message: str
    suggestions: List[str] = Field(default_factory=list)


class EnvValidationReport(BaseModel):
    """Complete environment validation report"""
    environment: EnvironmentType
    total_variables: int
    valid_count: int
    warning_count: int
    error_count: int
    critical_errors: List[EnvValidationResult]
    warnings: List[EnvValidationResult]
    info: List[EnvValidationResult]
    is_deployment_ready: bool


def validate_url(value: str) -> bool:
    """Validate URL format"""
    try:
        result = urlparse(value)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def validate_jwt_secret(value: str) -> bool:
    """Validate JWT secret strength"""
    if len(value) < 32:
        return False
    # Should contain mix of characters
    if not (any(c.isupper() for c in value) or 
            any(c.islower() for c in value) or 
            any(c.isdigit() for c in value)):
        return False
    return True


def validate_email(value: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, value) is not None


def validate_cors_origins(value: str) -> bool:
    """Validate CORS origins list"""
    origins = [origin.strip() for origin in value.split(',')]
    return all(validate_url(origin) or origin in ['*'] for origin in origins)


class EnvironmentValidator:
    """Comprehensive environment variable validator"""
    
    def __init__(self):
        self.specs = self._define_variable_specs()
    
    def _define_variable_specs(self) -> Dict[str, EnvVarSpec]:
        """Define all environment variable specifications"""
        return {
            # Core Application Settings
            "APP_NAME": EnvVarSpec(
                name="APP_NAME",
                description="Application name for branding and logging",
                required=False,
                default="War Room Analytics",
                severity=ValidationSeverity.INFO
            ),
            "ENVIRONMENT": EnvVarSpec(
                name="ENVIRONMENT",
                description="Application environment (development, staging, production)",
                required=True,
                pattern=r"^(development|staging|production)$",
                default="development"
            ),
            "DEBUG": EnvVarSpec(
                name="DEBUG",
                description="Enable debug mode (should be false in production)",
                required=True,
                pattern=r"^(true|false)$",
                default="false"
            ),
            "LOG_LEVEL": EnvVarSpec(
                name="LOG_LEVEL",
                description="Logging level for the application",
                required=False,
                pattern=r"^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$",
                default="INFO",
                severity=ValidationSeverity.WARNING
            ),
            "PORT": EnvVarSpec(
                name="PORT",
                description="Port number for the application server",
                required=False,
                pattern=r"^[1-9]\d{3,4}$",
                default="8000",
                severity=ValidationSeverity.INFO
            ),
            
            # Security Configuration
            "SECRET_KEY": EnvVarSpec(
                name="SECRET_KEY",
                description="Secret key for JWT encoding and application security",
                required=True,
                validator_func=validate_jwt_secret,
                sensitive=True,
                examples=["your-super-secret-key-min-32-chars"]
            ),
            "JWT_SECRET": EnvVarSpec(
                name="JWT_SECRET",
                description="JWT secret key (separate from SECRET_KEY)",
                required=True,
                validator_func=validate_jwt_secret,
                sensitive=True
            ),
            "JWT_ALGORITHM": EnvVarSpec(
                name="JWT_ALGORITHM",
                description="JWT signing algorithm",
                required=False,
                pattern=r"^(HS256|HS384|HS512|RS256|RS384|RS512)$",
                default="HS256",
                severity=ValidationSeverity.INFO
            ),
            
            # Database Configuration
            "DATABASE_URL": EnvVarSpec(
                name="DATABASE_URL",
                description="PostgreSQL database connection string",
                required=True,
                pattern=r"^postgresql://.*",
                sensitive=True,
                examples=["postgresql://user:pass@localhost:5432/warroom"]
            ),
            "REDIS_URL": EnvVarSpec(
                name="REDIS_URL",
                description="Redis connection string for caching",
                required=True,
                pattern=r"^redis://.*",
                sensitive=True,
                examples=["redis://localhost:6379"]
            ),
            
            # CORS Configuration
            "BACKEND_CORS_ORIGINS": EnvVarSpec(
                name="BACKEND_CORS_ORIGINS",
                description="Comma-separated list of allowed CORS origins",
                required=True,
                validator_func=validate_cors_origins,
                examples=["https://your-domain.com,https://api.your-domain.com"]
            ),
            
            # Supabase Configuration
            "SUPABASE_URL": EnvVarSpec(
                name="SUPABASE_URL",
                description="Supabase project URL for authentication and database",
                required=True,
                validator_func=validate_url,
                pattern=r"^https://.*\.supabase\.co$",
                examples=["https://your-project.supabase.co"]
            ),
            "SUPABASE_ANON_KEY": EnvVarSpec(
                name="SUPABASE_ANON_KEY",
                description="Supabase anonymous key for client authentication",
                required=True,
                sensitive=True,
                pattern=r"^eyJ.*",  # JWT format
                examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."]
            ),
            "SUPABASE_SERVICE_ROLE_KEY": EnvVarSpec(
                name="SUPABASE_SERVICE_ROLE_KEY",
                description="Supabase service role key for admin operations",
                required=False,
                sensitive=True,
                pattern=r"^eyJ.*",  # JWT format
                severity=ValidationSeverity.WARNING
            ),
            
            # Frontend Environment Variables
            "VITE_SUPABASE_URL": EnvVarSpec(
                name="VITE_SUPABASE_URL",
                description="Supabase URL for frontend (Vite)",
                required=True,
                validator_func=validate_url,
                pattern=r"^https://.*\.supabase\.co$"
            ),
            "VITE_SUPABASE_ANON_KEY": EnvVarSpec(
                name="VITE_SUPABASE_ANON_KEY",
                description="Supabase anonymous key for frontend",
                required=True,
                sensitive=True,
                pattern=r"^eyJ.*"
            ),
            "VITE_API_URL": EnvVarSpec(
                name="VITE_API_URL",
                description="API base URL for frontend",
                required=True,
                validator_func=validate_url,
                examples=["https://your-api.onrender.com"]
            ),
            
            # Analytics & Monitoring
            "POSTHOG_KEY": EnvVarSpec(
                name="POSTHOG_KEY",
                description="PostHog API key for analytics",
                required=False,
                sensitive=True,
                pattern=r"^phc_.*",
                severity=ValidationSeverity.WARNING,
                examples=["phc_your_api_key_here"]
            ),
            "SENTRY_DSN": EnvVarSpec(
                name="SENTRY_DSN",
                description="Sentry DSN for error tracking",
                required=False,
                validator_func=validate_url,
                pattern=r"^https://.*@.*\.ingest\.sentry\.io/.*",
                severity=ValidationSeverity.WARNING,
                examples=["https://key@sentry.io/project"]
            ),
            
            # Meta/Facebook Marketing API
            "META_APP_ID": EnvVarSpec(
                name="META_APP_ID",
                description="Meta/Facebook App ID for marketing API",
                required=False,
                pattern=r"^\d+$",
                severity=ValidationSeverity.INFO,
                environments=[EnvironmentType.PRODUCTION, EnvironmentType.STAGING]
            ),
            "META_APP_SECRET": EnvVarSpec(
                name="META_APP_SECRET",
                description="Meta/Facebook App Secret",
                required=False,
                sensitive=True,
                severity=ValidationSeverity.INFO,
                environments=[EnvironmentType.PRODUCTION, EnvironmentType.STAGING]
            ),
            
            # Google Ads API
            "GOOGLE_ADS_DEVELOPER_TOKEN": EnvVarSpec(
                name="GOOGLE_ADS_DEVELOPER_TOKEN",
                description="Google Ads API developer token",
                required=False,
                sensitive=True,
                severity=ValidationSeverity.INFO,
                environments=[EnvironmentType.PRODUCTION, EnvironmentType.STAGING]
            ),
            "GOOGLE_ADS_CLIENT_ID": EnvVarSpec(
                name="GOOGLE_ADS_CLIENT_ID",
                description="Google OAuth2 client ID for Ads API",
                required=False,
                pattern=r"^.*\.googleusercontent\.com$",
                severity=ValidationSeverity.INFO
            ),
            
            # AI Services
            "OPENAI_API_KEY": EnvVarSpec(
                name="OPENAI_API_KEY",
                description="OpenAI API key for AI features",
                required=False,
                pattern=r"^sk-.*",
                sensitive=True,
                severity=ValidationSeverity.WARNING,
                examples=["sk-your_openai_key_here"]
            ),
            "PINECONE_API_KEY": EnvVarSpec(
                name="PINECONE_API_KEY",
                description="Pinecone API key for vector database",
                required=False,
                sensitive=True,
                severity=ValidationSeverity.WARNING
            ),
            
            # Communication Services
            "SENDGRID_API_KEY": EnvVarSpec(
                name="SENDGRID_API_KEY",
                description="SendGrid API key for email delivery",
                required=False,
                pattern=r"^SG\..*",
                sensitive=True,
                severity=ValidationSeverity.INFO,
                examples=["SG.your_sendgrid_key"]
            ),
            "TWILIO_ACCOUNT_SID": EnvVarSpec(
                name="TWILIO_ACCOUNT_SID",
                description="Twilio Account SID for SMS/WhatsApp",
                required=False,
                pattern=r"^AC[a-f0-9]{32}$",
                sensitive=True,
                severity=ValidationSeverity.INFO
            ),
            
            # Email Configuration
            "NOTIFICATION_EMAIL": EnvVarSpec(
                name="NOTIFICATION_EMAIL",
                description="Email address for notifications",
                required=False,
                validator_func=validate_email,
                severity=ValidationSeverity.INFO,
                examples=["notifications@your-domain.com"]
            ),
        }
    
    def validate_environment(
        self, 
        environment: EnvironmentType = None,
        check_values: bool = True
    ) -> EnvValidationReport:
        """Validate all environment variables for the current environment"""
        
        if environment is None:
            env_name = os.getenv("ENVIRONMENT", "development").lower()
            environment = EnvironmentType(env_name)
        
        results = []
        
        for var_name, spec in self.specs.items():
            # Skip if not relevant for this environment
            if environment not in spec.environments:
                continue
            
            result = self._validate_variable(spec, check_values)
            results.append(result)
        
        # Categorize results
        critical_errors = [r for r in results if not r.is_valid and r.severity == ValidationSeverity.CRITICAL]
        warnings = [r for r in results if (not r.is_valid and r.severity == ValidationSeverity.WARNING) or 
                   (r.is_valid and r.severity == ValidationSeverity.WARNING and "missing" in r.message.lower())]
        info = [r for r in results if r.severity == ValidationSeverity.INFO]
        
        valid_count = sum(1 for r in results if r.is_valid)
        total_count = len(results)
        
        # Deployment readiness check
        is_deployment_ready = len(critical_errors) == 0 and environment == EnvironmentType.PRODUCTION
        
        return EnvValidationReport(
            environment=environment,
            total_variables=total_count,
            valid_count=valid_count,
            warning_count=len(warnings),
            error_count=len(critical_errors),
            critical_errors=critical_errors,
            warnings=warnings,
            info=info,
            is_deployment_ready=is_deployment_ready
        )
    
    def _validate_variable(self, spec: EnvVarSpec, check_values: bool = True) -> EnvValidationResult:
        """Validate a single environment variable"""
        
        value = os.getenv(spec.name)
        
        # Check if variable exists
        if value is None:
            if spec.required:
                return EnvValidationResult(
                    variable=spec.name,
                    value=None,
                    is_valid=False,
                    severity=spec.severity,
                    message=f"Required environment variable '{spec.name}' is missing",
                    suggestions=[
                        f"Add {spec.name}={spec.examples[0] if spec.examples else 'your_value_here'} to your .env file",
                        f"Description: {spec.description}"
                    ]
                )
            else:
                return EnvValidationResult(
                    variable=spec.name,
                    value=None,
                    is_valid=True,
                    severity=spec.severity,
                    message=f"Optional variable '{spec.name}' is not set (using default: {spec.default})",
                    suggestions=[f"Consider setting for production use: {spec.description}"]
                )
        
        if not check_values:
            return EnvValidationResult(
                variable=spec.name,
                value="[HIDDEN]" if spec.sensitive else value,
                is_valid=True,
                severity=spec.severity,
                message=f"Variable '{spec.name}' is set"
            )
        
        # Validate value format
        validation_errors = []
        
        # Pattern validation
        if spec.pattern and not re.match(spec.pattern, value):
            validation_errors.append(f"Value does not match required pattern: {spec.pattern}")
        
        # Custom validator function
        if spec.validator_func:
            try:
                if not spec.validator_func(value):
                    validation_errors.append("Value failed custom validation")
            except Exception as e:
                validation_errors.append(f"Validation error: {str(e)}")
        
        # Security checks
        if spec.sensitive and len(value) < 16:
            validation_errors.append("Sensitive value appears too short (minimum 16 characters recommended)")
        
        # Environment-specific checks
        current_env = os.getenv("ENVIRONMENT", "development").lower()
        if current_env == "production":
            if "localhost" in value.lower():
                validation_errors.append("Production environment should not use localhost URLs")
            if "dev" in value.lower() or "test" in value.lower():
                validation_errors.append("Production environment contains development/test references")
        
        is_valid = len(validation_errors) == 0
        
        return EnvValidationResult(
            variable=spec.name,
            value="[HIDDEN]" if spec.sensitive else value,
            is_valid=is_valid,
            severity=spec.severity,
            message=f"Variable '{spec.name}' validation: {'PASSED' if is_valid else 'FAILED - ' + '; '.join(validation_errors)}",
            suggestions=[
                f"Description: {spec.description}",
                f"Examples: {', '.join(spec.examples)}" if spec.examples else ""
            ] if not is_valid else []
        )
    
    def generate_env_template(self, environment: EnvironmentType = EnvironmentType.DEVELOPMENT) -> str:
        """Generate a .env template file with all variables for the specified environment"""
        
        template_lines = [
            f"# ==============================================================================",
            f"# WAR ROOM ANALYTICS - ENVIRONMENT CONFIGURATION ({environment.value.upper()})",
            f"# ==============================================================================",
            f"# Generated automatically by environment validation system",
            f"# Copy this file to .env and fill in your actual values",
            f"# ==============================================================================",
            "",
        ]
        
        # Group variables by category
        categories = {
            "Core Application": ["APP_NAME", "ENVIRONMENT", "DEBUG", "LOG_LEVEL", "PORT"],
            "Security": ["SECRET_KEY", "JWT_SECRET", "JWT_ALGORITHM"],
            "Database": ["DATABASE_URL", "REDIS_URL"],
            "CORS": ["BACKEND_CORS_ORIGINS"],
            "Supabase": ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
            "Frontend": ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_API_URL"],
            "Analytics": ["POSTHOG_KEY", "SENTRY_DSN"],
            "Marketing APIs": ["META_APP_ID", "META_APP_SECRET", "GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID"],
            "AI Services": ["OPENAI_API_KEY", "PINECONE_API_KEY"],
            "Communication": ["SENDGRID_API_KEY", "TWILIO_ACCOUNT_SID", "NOTIFICATION_EMAIL"]
        }
        
        for category, var_names in categories.items():
            template_lines.extend([
                f"# ------------------------------------------------------------------------------",
                f"# {category.upper()}",
                f"# ------------------------------------------------------------------------------"
            ])
            
            for var_name in var_names:
                if var_name in self.specs:
                    spec = self.specs[var_name]
                    if environment in spec.environments:
                        
                        # Add description
                        template_lines.append(f"# {spec.description}")
                        
                        # Add severity and requirement info
                        requirement = "REQUIRED" if spec.required else "OPTIONAL"
                        template_lines.append(f"# {requirement} - {spec.severity.value.upper()}")
                        
                        # Add examples
                        if spec.examples:
                            template_lines.append(f"# Examples: {', '.join(spec.examples)}")
                        
                        # Add the variable line
                        if spec.sensitive:
                            template_lines.append(f"{var_name}=# ⚠️  SENSITIVE - Add your actual value here")
                        elif spec.default:
                            template_lines.append(f"{var_name}={spec.default}")
                        else:
                            template_lines.append(f"{var_name}=your-value-here")
                        
                        template_lines.append("")
            
            template_lines.append("")
        
        return "\n".join(template_lines)
    
    def print_validation_report(self, report: EnvValidationReport):
        """Print a formatted validation report"""
        
        print(f"\n{'='*80}")
        print(f"WAR ROOM ANALYTICS - ENVIRONMENT VALIDATION REPORT")
        print(f"{'='*80}")
        print(f"Environment: {report.environment.value.upper()}")
        print(f"Total Variables Checked: {report.total_variables}")
        print(f"Valid: {report.valid_count}")
        print(f"Warnings: {report.warning_count}")
        print(f"Errors: {report.error_count}")
        print(f"Deployment Ready: {'✅ YES' if report.is_deployment_ready else '❌ NO'}")
        
        if report.critical_errors:
            print(f"\n🚨 CRITICAL ERRORS ({len(report.critical_errors)}):")
            for error in report.critical_errors:
                print(f"  ❌ {error.variable}: {error.message}")
                for suggestion in error.suggestions:
                    print(f"     💡 {suggestion}")
        
        if report.warnings:
            print(f"\n⚠️  WARNINGS ({len(report.warnings)}):")
            for warning in report.warnings:
                print(f"  ⚠️  {warning.variable}: {warning.message}")
                for suggestion in warning.suggestions:
                    print(f"     💡 {suggestion}")
        
        if report.info:
            print(f"\n💡 INFO ({len(report.info)}):")
            for info in report.info:
                print(f"  ℹ️  {info.variable}: {info.message}")
        
        print(f"\n{'='*80}")


# CLI Interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="War Room Environment Validator")
    parser.add_argument("--env", choices=["development", "staging", "production"], 
                       default="development", help="Environment to validate")
    parser.add_argument("--generate-template", action="store_true", 
                       help="Generate .env template file")
    parser.add_argument("--output", type=str, help="Output file for template generation")
    parser.add_argument("--check-values", action="store_true", default=True,
                       help="Check environment variable values (default: True)")
    
    args = parser.parse_args()
    
    validator = EnvironmentValidator()
    environment = EnvironmentType(args.env)
    
    if args.generate_template:
        template = validator.generate_env_template(environment)
        if args.output:
            with open(args.output, 'w') as f:
                f.write(template)
            print(f"Template written to {args.output}")
        else:
            print(template)
    else:
        report = validator.validate_environment(environment, args.check_values)
        validator.print_validation_report(report)
        
        # Exit with error code if critical errors exist
        exit(1 if report.error_count > 0 else 0)