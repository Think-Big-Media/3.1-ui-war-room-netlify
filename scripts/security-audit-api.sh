#!/bin/bash

# API Security Audit Script
# Uses various tools to audit API service files for security issues

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔐 API Security Audit"
echo "===================="
echo ""

# Define API service directories
API_DIRS=(
  "src/frontend/src/services"
  "src/frontend/src/lib"
  "src/backend/api"
  "src/backend/services"
)

# Create security report directory
REPORT_DIR="$PROJECT_ROOT/security-reports"
mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORT_DIR/api-security-audit-$TIMESTAMP.md"

# Initialize report
cat > "$REPORT_FILE" << EOF
# API Security Audit Report
Generated: $(date)

## Summary
This report contains security analysis of all API service files in the War Room project.

EOF

# Function to check for sensitive data exposure
check_sensitive_data() {
  local file=$1
  echo "### Checking $file for sensitive data exposure" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # Check for hardcoded secrets
  if grep -E "(api[_-]?key|password|secret|token|private[_-]?key)" "$file" | grep -v "process.env" | grep -v "import.meta.env" > /dev/null 2>&1; then
    echo "⚠️  **WARNING**: Potential hardcoded secrets found in $file" >> "$REPORT_FILE"
    grep -n -E "(api[_-]?key|password|secret|token|private[_-]?key)" "$file" | grep -v "process.env" | grep -v "import.meta.env" >> "$REPORT_FILE" || true
  else
    echo "✅ No hardcoded secrets found" >> "$REPORT_FILE"
  fi
  
  # Check for console.log of sensitive data
  if grep -E "console\.(log|error|warn).*\b(token|password|key|secret)\b" "$file" > /dev/null 2>&1; then
    echo "⚠️  **WARNING**: Potential sensitive data in console logs" >> "$REPORT_FILE"
    grep -n -E "console\.(log|error|warn).*\b(token|password|key|secret)\b" "$file" >> "$REPORT_FILE" || true
  fi
  
  echo "" >> "$REPORT_FILE"
}

# Function to check authentication implementation
check_authentication() {
  local file=$1
  echo "### Authentication Check for $file" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # Check for proper error handling on auth failures
  if grep -E "(401|403|unauthorized|forbidden)" "$file" > /dev/null 2>&1; then
    echo "✅ Authentication error handling found" >> "$REPORT_FILE"
  else
    echo "⚠️  **WARNING**: No explicit authentication error handling found" >> "$REPORT_FILE"
  fi
  
  # Check for token refresh logic
  if grep -E "(refresh.*token|token.*refresh)" "$file" > /dev/null 2>&1; then
    echo "✅ Token refresh logic found" >> "$REPORT_FILE"
  fi
  
  echo "" >> "$REPORT_FILE"
}

# Function to check for data validation
check_data_validation() {
  local file=$1
  echo "### Data Validation Check for $file" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # Check for input validation
  if grep -E "(validate|sanitize|escape)" "$file" > /dev/null 2>&1; then
    echo "✅ Data validation logic found" >> "$REPORT_FILE"
  else
    echo "⚠️  **WARNING**: No explicit data validation found" >> "$REPORT_FILE"
  fi
  
  # Check for SQL injection prevention (if applicable)
  if grep -E "(SELECT|INSERT|UPDATE|DELETE).*\$|string interpolation in queries" "$file" > /dev/null 2>&1; then
    echo "⚠️  **WARNING**: Potential SQL injection vulnerability" >> "$REPORT_FILE"
  fi
  
  echo "" >> "$REPORT_FILE"
}

# Function to check API timeout configuration
check_timeout_config() {
  local file=$1
  echo "### Timeout Configuration Check for $file" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # Check for timeout settings
  if grep -E "(timeout|setTimeout)" "$file" > /dev/null 2>&1; then
    echo "✅ Timeout configuration found" >> "$REPORT_FILE"
    grep -n -E "(timeout.*:.*[0-9]+)" "$file" >> "$REPORT_FILE" || true
  else
    echo "⚠️  **WARNING**: No explicit timeout configuration found" >> "$REPORT_FILE"
  fi
  
  echo "" >> "$REPORT_FILE"
}

# Main audit loop
echo "## Detailed Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for dir in "${API_DIRS[@]}"; do
  if [ -d "$PROJECT_ROOT/$dir" ]; then
    echo "Auditing $dir..."
    
    echo "## Directory: $dir" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Find all TypeScript/JavaScript files
    find "$PROJECT_ROOT/$dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read -r file; do
      relative_path="${file#$PROJECT_ROOT/}"
      echo "## File: $relative_path" >> "$REPORT_FILE"
      echo "" >> "$REPORT_FILE"
      
      check_sensitive_data "$file"
      check_authentication "$file"
      check_data_validation "$file"
      check_timeout_config "$file"
      
      echo "---" >> "$REPORT_FILE"
      echo "" >> "$REPORT_FILE"
    done
  fi
done

# Check for HTTPS enforcement
echo "## HTTPS Enforcement Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -r "http://" "$PROJECT_ROOT/src" --include="*.ts" --include="*.tsx" --include="*.js" | grep -v "localhost" | grep -v "127.0.0.1" > /dev/null 2>&1; then
  echo "⚠️  **WARNING**: Non-HTTPS URLs found:" >> "$REPORT_FILE"
  grep -r "http://" "$PROJECT_ROOT/src" --include="*.ts" --include="*.tsx" --include="*.js" | grep -v "localhost" | grep -v "127.0.0.1" >> "$REPORT_FILE" || true
else
  echo "✅ All external URLs use HTTPS" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check for CORS configuration
echo "## CORS Configuration Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -r "Access-Control-Allow-Origin.*\*" "$PROJECT_ROOT/src" > /dev/null 2>&1; then
  echo "⚠️  **WARNING**: Wildcard CORS origin found" >> "$REPORT_FILE"
  grep -r -n "Access-Control-Allow-Origin.*\*" "$PROJECT_ROOT/src" >> "$REPORT_FILE" || true
else
  echo "✅ No wildcard CORS configuration found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check for rate limiting
echo "## Rate Limiting Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -r "rate.*limit\|429\|too.*many.*requests" "$PROJECT_ROOT/src/frontend/src/services" -i > /dev/null 2>&1; then
  echo "✅ Rate limiting handling found in API services" >> "$REPORT_FILE"
else
  echo "⚠️  **WARNING**: No rate limiting handling found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Generate summary
echo "## Summary Statistics" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

WARNING_COUNT=$(grep -c "⚠️" "$REPORT_FILE" || true)
SUCCESS_COUNT=$(grep -c "✅" "$REPORT_FILE" || true)

echo "- Total warnings: $WARNING_COUNT" >> "$REPORT_FILE"
echo "- Total passed checks: $SUCCESS_COUNT" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ $WARNING_COUNT -gt 0 ]; then
  echo "### Action Required" >> "$REPORT_FILE"
  echo "Please review and address the warnings listed above to improve API security." >> "$REPORT_FILE"
else
  echo "### All Clear" >> "$REPORT_FILE"
  echo "No critical security issues found in API services." >> "$REPORT_FILE"
fi

# Display summary
echo ""
echo "📊 Security Audit Complete"
echo "========================="
echo "Warnings found: $WARNING_COUNT"
echo "Checks passed: $SUCCESS_COUNT"
echo ""
echo "📄 Full report saved to: $REPORT_FILE"

# If critical issues found, exit with error
if [ $WARNING_COUNT -gt 10 ]; then
  echo ""
  echo "❌ Critical security issues found. Please review the report."
  exit 1
fi

exit 0