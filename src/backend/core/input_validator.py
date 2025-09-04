"""
Comprehensive Input Validation and Sanitization Service
Provides security-focused validation for all user inputs.
"""
import re
import html
import json
import logging
from typing import Any, Dict, List, Optional, Union, Set
from datetime import datetime, date
from enum import Enum
import ipaddress
from urllib.parse import urlparse
import bleach
from email_validator import validate_email, EmailNotValidError

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Custom validation error with detailed information."""

    def __init__(self, message: str, field: str = None, code: str = None):
        self.message = message
        self.field = field
        self.code = code
        super().__init__(self.message)


class SanitizationLevel(Enum):
    """Levels of input sanitization."""

    BASIC = "basic"  # HTML escape only
    MODERATE = "moderate"  # HTML escape + basic cleaning
    STRICT = "strict"  # Aggressive sanitization
    PARANOID = "paranoid"  # Maximum security, minimal functionality


class InputValidator:
    """
    Comprehensive input validation and sanitization service.

    Provides validation for common input types with security-first approach.
    All inputs are validated and sanitized to prevent various attack vectors.
    """

    # Dangerous patterns that should never appear in inputs
    DANGEROUS_PATTERNS = [
        r"<script[^>]*>.*?</script>",  # Script tags
        r"javascript:",  # JavaScript protocol
        r"vbscript:",  # VBScript protocol
        r"data:text/html",  # Data URLs with HTML
        r"on\w+\s*=",  # Event handlers
        r"expression\s*\(",  # CSS expressions
        r"@import",  # CSS imports
        r"<iframe[^>]*>.*?</iframe>",  # Iframes
        r"<object[^>]*>.*?</object>",  # Objects
        r"<embed[^>]*>.*?</embed>",  # Embeds
        r"<form[^>]*>.*?</form>",  # Forms
        r"<input[^>]*>",  # Inputs
        r"<link[^>]*>",  # Links
        r"<meta[^>]*>",  # Meta tags
    ]

    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        r"(union\s+select)",
        r"(drop\s+table)",
        r"(delete\s+from)",
        r"(insert\s+into)",
        r"(update\s+\w+\s+set)",
        r"(exec\s*\()",
        r"(script\s*:)",
        r"(-{2,})",  # SQL comments
        r"(/\*.*?\*/)",  # Block comments
    ]

    # Command injection patterns
    COMMAND_INJECTION_PATTERNS = [
        r"[;&|`]",  # Command separators
        r"\$\(",  # Command substitution
        r"`[^`]*`",  # Backticks
        r"\.\./+",  # Directory traversal
        r"[<>]",  # Redirects
    ]

    def __init__(self):
        # Configure HTML sanitizer
        self.allowed_tags = [
            "b",
            "i",
            "em",
            "strong",
            "span",
            "p",
            "br",
            "ul",
            "ol",
            "li",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
        ]
        self.allowed_attributes = {
            "*": ["class"],
            "span": ["style"],
        }
        self.allowed_styles = ["color", "font-weight", "font-style"]

    def validate_and_sanitize(
        self,
        value: Any,
        field_name: str,
        validation_rules: Dict[str, Any],
        sanitization_level: SanitizationLevel = SanitizationLevel.MODERATE,
    ) -> Any:
        """
        Main validation and sanitization method.

        Args:
            value: Input value to validate
            field_name: Name of the field for error reporting
            validation_rules: Validation configuration
            sanitization_level: Level of sanitization to apply

        Returns:
            Validated and sanitized value

        Raises:
            ValidationError: If validation fails
        """
        try:
            # Handle None values
            if value is None:
                if validation_rules.get("required", False):
                    raise ValidationError(
                        f"{field_name} is required", field_name, "required"
                    )
                return None

            # Convert to string for initial processing
            if not isinstance(value, str):
                value = str(value)

            # Basic security checks
            self._check_dangerous_patterns(value, field_name)

            # Apply sanitization
            sanitized_value = self._sanitize_input(value, sanitization_level)

            # Type-specific validation
            field_type = validation_rules.get("type", "string")
            validated_value = self._validate_by_type(
                sanitized_value, field_type, field_name, validation_rules
            )

            # Additional custom validation
            custom_rules = validation_rules.get("custom_rules", [])
            for rule in custom_rules:
                validated_value = self._apply_custom_rule(
                    validated_value, rule, field_name
                )

            return validated_value

        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Validation error for {field_name}: {e}")
            raise ValidationError(
                f"Validation failed for {field_name}: {str(e)}",
                field_name,
                "validation_error",
            )

    def _check_dangerous_patterns(self, value: str, field_name: str):
        """Check for dangerous patterns in input."""
        value_lower = value.lower()

        # Check for XSS patterns
        for pattern in self.DANGEROUS_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE | re.DOTALL):
                raise ValidationError(
                    f"Potentially dangerous content detected in {field_name}",
                    field_name,
                    "security_violation",
                )

        # Check for SQL injection
        for pattern in self.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                raise ValidationError(
                    f"SQL injection attempt detected in {field_name}",
                    field_name,
                    "sql_injection",
                )

        # Check for command injection (only for certain fields)
        if any(
            keyword in field_name.lower()
            for keyword in ["path", "file", "command", "exec"]
        ):
            for pattern in self.COMMAND_INJECTION_PATTERNS:
                if re.search(pattern, value):
                    raise ValidationError(
                        f"Command injection attempt detected in {field_name}",
                        field_name,
                        "command_injection",
                    )

    def _sanitize_input(self, value: str, level: SanitizationLevel) -> str:
        """Apply sanitization based on level."""
        if level == SanitizationLevel.BASIC:
            return html.escape(value)

        elif level == SanitizationLevel.MODERATE:
            # HTML escape + basic cleaning
            value = html.escape(value)
            value = re.sub(
                r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", value
            )  # Remove control chars
            value = value.strip()
            return value

        elif level == SanitizationLevel.STRICT:
            # Use bleach for HTML sanitization
            value = bleach.clean(
                value,
                tags=self.allowed_tags,
                attributes=self.allowed_attributes,
                styles=self.allowed_styles,
                strip=True,
            )
            # Remove additional dangerous characters
            value = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", value)
            value = value.strip()
            return value

        elif level == SanitizationLevel.PARANOID:
            # Maximum sanitization - only allow alphanumeric and basic punctuation
            value = re.sub(r"[^\w\s\-.,!?@]", "", value)
            value = value.strip()
            return value

        return value

    def _validate_by_type(
        self, value: str, field_type: str, field_name: str, rules: Dict[str, Any]
    ) -> Any:
        """Validate value based on its expected type."""
        if field_type == "string":
            return self._validate_string(value, field_name, rules)
        elif field_type == "email":
            return self._validate_email(value, field_name, rules)
        elif field_type == "url":
            return self._validate_url(value, field_name, rules)
        elif field_type == "integer":
            return self._validate_integer(value, field_name, rules)
        elif field_type == "float":
            return self._validate_float(value, field_name, rules)
        elif field_type == "boolean":
            return self._validate_boolean(value, field_name, rules)
        elif field_type == "date":
            return self._validate_date(value, field_name, rules)
        elif field_type == "datetime":
            return self._validate_datetime(value, field_name, rules)
        elif field_type == "ip_address":
            return self._validate_ip_address(value, field_name, rules)
        elif field_type == "phone":
            return self._validate_phone(value, field_name, rules)
        elif field_type == "json":
            return self._validate_json(value, field_name, rules)
        elif field_type == "uuid":
            return self._validate_uuid(value, field_name, rules)
        else:
            # Default to string validation
            return self._validate_string(value, field_name, rules)

    def _validate_string(
        self, value: str, field_name: str, rules: Dict[str, Any]
    ) -> str:
        """Validate string input."""
        # Length validation
        min_length = rules.get("min_length", 0)
        max_length = rules.get("max_length", 10000)  # Default reasonable limit

        if len(value) < min_length:
            raise ValidationError(
                f"{field_name} must be at least {min_length} characters",
                field_name,
                "min_length",
            )

        if len(value) > max_length:
            raise ValidationError(
                f"{field_name} must be no more than {max_length} characters",
                field_name,
                "max_length",
            )

        # Pattern validation
        pattern = rules.get("pattern")
        if pattern and not re.match(pattern, value):
            raise ValidationError(
                f"{field_name} format is invalid", field_name, "pattern_mismatch"
            )

        # Allowed values
        allowed_values = rules.get("allowed_values")
        if allowed_values and value not in allowed_values:
            raise ValidationError(
                f"{field_name} must be one of: {', '.join(allowed_values)}",
                field_name,
                "invalid_choice",
            )

        return value

    def _validate_email(
        self, value: str, field_name: str, rules: Dict[str, Any]
    ) -> str:
        """Validate email address."""
        try:
            # Use email-validator library for comprehensive validation
            valid = validate_email(value)
            return valid.email
        except EmailNotValidError as e:
            raise ValidationError(
                f"Invalid email address in {field_name}: {str(e)}",
                field_name,
                "invalid_email",
            )

    def _validate_url(self, value: str, field_name: str, rules: Dict[str, Any]) -> str:
        """Validate URL."""
        try:
            parsed = urlparse(value)

            # Check scheme
            allowed_schemes = rules.get("allowed_schemes", ["http", "https"])
            if parsed.scheme not in allowed_schemes:
                raise ValidationError(
                    f"URL scheme must be one of: {', '.join(allowed_schemes)}",
                    field_name,
                    "invalid_scheme",
                )

            # Check if hostname exists
            if not parsed.netloc:
                raise ValidationError(
                    "URL must include a hostname", field_name, "missing_hostname"
                )

            # Block localhost and private IPs in production
            if rules.get("block_private", True):
                hostname = parsed.hostname
                if hostname:
                    if hostname.lower() in ["localhost", "127.0.0.1", "::1"]:
                        raise ValidationError(
                            "Localhost URLs are not allowed",
                            field_name,
                            "localhost_blocked",
                        )

                    # Check for private IP ranges
                    try:
                        ip = ipaddress.ip_address(hostname)
                        if ip.is_private:
                            raise ValidationError(
                                "Private IP addresses are not allowed",
                                field_name,
                                "private_ip_blocked",
                            )
                    except ValueError:
                        # Not an IP address, hostname is OK
                        pass

            return value

        except Exception as e:
            if isinstance(e, ValidationError):
                raise
            raise ValidationError(
                f"Invalid URL format in {field_name}", field_name, "invalid_url"
            )

    def _validate_integer(
        self, value: str, field_name: str, rules: Dict[str, Any]
    ) -> int:
        """Validate integer input."""
        try:
            int_value = int(value)

            # Range validation
            min_value = rules.get("min_value")
            max_value = rules.get("max_value")

            if min_value is not None and int_value < min_value:
                raise ValidationError(
                    f"{field_name} must be at least {min_value}",
                    field_name,
                    "min_value",
                )

            if max_value is not None and int_value > max_value:
                raise ValidationError(
                    f"{field_name} must be no more than {max_value}",
                    field_name,
                    "max_value",
                )

            return int_value

        except ValueError:
            raise ValidationError(
                f"{field_name} must be a valid integer", field_name, "invalid_integer"
            )

    def _validate_float(
        self, value: str, field_name: str, rules: Dict[str, Any]
    ) -> float:
        """Validate float input."""
        try:
            float_value = float(value)

            # Range validation
            min_value = rules.get("min_value")
            max_value = rules.get("max_value")

            if min_value is not None and float_value < min_value:
                raise ValidationError(
                    f"{field_name} must be at least {min_value}",
                    field_name,
                    "min_value",
                )

            if max_value is not None and float_value > max_value:
                raise ValidationError(
                    f"{field_name} must be no more than {max_value}",
                    field_name,
                    "max_value",
                )

            return float_value

        except ValueError:
            raise ValidationError(
                f"{field_name} must be a valid number", field_name, "invalid_float"
            )

    def _validate_boolean(
        self, value: str, field_name: str, rules: Dict[str, Any]
    ) -> bool:
        """Validate boolean input."""
        true_values = {"true", "1", "yes", "on", "t", "y"}
        false_values = {"false", "0", "no", "off", "f", "n"}

        value_lower = value.lower().strip()

        if value_lower in true_values:
            return True
        elif value_lower in false_values:
            return False
        else:
            raise ValidationError(
                f"{field_name} must be a valid boolean value",
                field_name,
                "invalid_boolean",
            )

    def _validate_date(
        self, value: str, field_name: str, rules: Dict[str, Any]
    ) -> date:
        """Validate date input."""
        date_format = rules.get("format", "%Y-%m-%d")

        try:
            date_obj = datetime.strptime(value, date_format).date()

            # Range validation
            min_date = rules.get("min_date")
            max_date = rules.get("max_date")

            if min_date and date_obj < min_date:
                raise ValidationError(
                    f"{field_name} must be after {min_date}", field_name, "min_date"
                )

            if max_date and date_obj > max_date:
                raise ValidationError(
                    f"{field_name} must be before {max_date}", field_name, "max_date"
                )

            return date_obj

        except ValueError:
            raise ValidationError(
                f"{field_name} must be a valid date in format {date_format}",
                field_name,
                "invalid_date",
            )

    def _validate_datetime(
        self, value: str, field_name: str, rules: Dict[str, Any]
    ) -> datetime:
        """Validate datetime input."""
        datetime_format = rules.get("format", "%Y-%m-%d %H:%M:%S")

        try:
            datetime_obj = datetime.strptime(value, datetime_format)

            # Range validation
            min_datetime = rules.get("min_datetime")
            max_datetime = rules.get("max_datetime")

            if min_datetime and datetime_obj < min_datetime:
                raise ValidationError(
                    f"{field_name} must be after {min_datetime}",
                    field_name,
                    "min_datetime",
                )

            if max_datetime and datetime_obj > max_datetime:
                raise ValidationError(
                    f"{field_name} must be before {max_datetime}",
                    field_name,
                    "max_datetime",
                )

            return datetime_obj

        except ValueError:
            raise ValidationError(
                f"{field_name} must be a valid datetime in format {datetime_format}",
                field_name,
                "invalid_datetime",
            )

    def _validate_ip_address(
        self, value: str, field_name: str, rules: Dict[str, Any]
    ) -> str:
        """Validate IP address."""
        try:
            ip = ipaddress.ip_address(value)

            # Check IP version requirements
            allowed_versions = rules.get("allowed_versions", [4, 6])
            if ip.version not in allowed_versions:
                raise ValidationError(
                    f"IP version {ip.version} not allowed",
                    field_name,
                    "invalid_ip_version",
                )

            # Block private IPs if required
            if rules.get("block_private", False) and ip.is_private:
                raise ValidationError(
                    "Private IP addresses are not allowed",
                    field_name,
                    "private_ip_blocked",
                )

            return str(ip)

        except ValueError:
            raise ValidationError(
                f"{field_name} must be a valid IP address", field_name, "invalid_ip"
            )

    def _validate_phone(
        self, value: str, field_name: str, rules: Dict[str, Any]
    ) -> str:
        """Validate phone number."""
        # Remove all non-digit characters for validation
        digits_only = re.sub(r"\D", "", value)

        # Basic length check
        min_length = rules.get("min_length", 10)
        max_length = rules.get("max_length", 15)

        if len(digits_only) < min_length:
            raise ValidationError(
                f"Phone number must have at least {min_length} digits",
                field_name,
                "phone_too_short",
            )

        if len(digits_only) > max_length:
            raise ValidationError(
                f"Phone number must have no more than {max_length} digits",
                field_name,
                "phone_too_long",
            )

        # Format validation
        pattern = rules.get("pattern", r"^\+?[\d\s\-\(\)\.]{10,}$")
        if not re.match(pattern, value):
            raise ValidationError(
                "Invalid phone number format", field_name, "invalid_phone_format"
            )

        return value

    def _validate_json(
        self, value: str, field_name: str, rules: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate JSON input."""
        try:
            parsed_json = json.loads(value)

            # Size limit
            max_size = rules.get("max_size", 1024 * 1024)  # 1MB default
            if len(value) > max_size:
                raise ValidationError(
                    f"JSON data too large (max {max_size} bytes)",
                    field_name,
                    "json_too_large",
                )

            return parsed_json

        except json.JSONDecodeError as e:
            raise ValidationError(
                f"Invalid JSON format: {str(e)}", field_name, "invalid_json"
            )

    def _validate_uuid(self, value: str, field_name: str, rules: Dict[str, Any]) -> str:
        """Validate UUID."""
        import uuid

        try:
            # This will raise ValueError if invalid
            uuid_obj = uuid.UUID(value)

            # Check UUID version if specified
            required_version = rules.get("version")
            if required_version and uuid_obj.version != required_version:
                raise ValidationError(
                    f"UUID must be version {required_version}",
                    field_name,
                    "invalid_uuid_version",
                )

            return str(uuid_obj)

        except ValueError:
            raise ValidationError(
                f"{field_name} must be a valid UUID", field_name, "invalid_uuid"
            )

    def _apply_custom_rule(
        self, value: Any, rule: Dict[str, Any], field_name: str
    ) -> Any:
        """Apply custom validation rule."""
        rule_type = rule.get("type")

        if rule_type == "regex":
            pattern = rule["pattern"]
            if not re.match(pattern, str(value)):
                raise ValidationError(
                    rule.get("message", f"{field_name} format is invalid"),
                    field_name,
                    "custom_rule_failed",
                )

        elif rule_type == "function":
            validator_func = rule["function"]
            if not validator_func(value):
                raise ValidationError(
                    rule.get("message", f"{field_name} validation failed"),
                    field_name,
                    "custom_function_failed",
                )

        elif rule_type == "blacklist":
            blacklist = rule["values"]
            if value in blacklist:
                raise ValidationError(
                    rule.get("message", f"{field_name} contains prohibited value"),
                    field_name,
                    "blacklisted_value",
                )

        elif rule_type == "whitelist":
            whitelist = rule["values"]
            if value not in whitelist:
                raise ValidationError(
                    rule.get("message", f"{field_name} must be one of allowed values"),
                    field_name,
                    "not_whitelisted",
                )

        return value

    def validate_dict(
        self,
        data: Dict[str, Any],
        schema: Dict[str, Dict[str, Any]],
        sanitization_level: SanitizationLevel = SanitizationLevel.MODERATE,
    ) -> Dict[str, Any]:
        """
        Validate an entire dictionary against a schema.

        Args:
            data: Input data to validate
            schema: Validation schema
            sanitization_level: Level of sanitization

        Returns:
            Validated and sanitized data
        """
        validated_data = {}
        errors = {}

        # Check for required fields
        for field_name, rules in schema.items():
            if rules.get("required", False) and field_name not in data:
                errors[field_name] = "Field is required"

        # Validate each field
        for field_name, value in data.items():
            if field_name not in schema:
                # Unknown field - either ignore or error based on strict mode
                if schema.get("_strict", False):
                    errors[field_name] = "Unknown field"
                continue

            try:
                validated_data[field_name] = self.validate_and_sanitize(
                    value, field_name, schema[field_name], sanitization_level
                )
            except ValidationError as e:
                errors[field_name] = e.message

        if errors:
            raise ValidationError(
                f"Validation failed: {errors}", None, "multiple_validation_errors"
            )

        return validated_data


# Singleton instance
input_validator = InputValidator()


# Utility functions
def validate_input(
    value: Any,
    field_name: str,
    validation_rules: Dict[str, Any],
    sanitization_level: SanitizationLevel = SanitizationLevel.MODERATE,
) -> Any:
    """Helper function for quick input validation."""
    return input_validator.validate_and_sanitize(
        value, field_name, validation_rules, sanitization_level
    )


def sanitize_html(
    html_content: str, level: SanitizationLevel = SanitizationLevel.STRICT
) -> str:
    """Helper function for HTML sanitization."""
    return input_validator._sanitize_input(html_content, level)


# Export main components
__all__ = [
    "InputValidator",
    "ValidationError",
    "SanitizationLevel",
    "input_validator",
    "validate_input",
    "sanitize_html",
]
