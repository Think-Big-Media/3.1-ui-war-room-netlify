#!/bin/bash
# CodeRabbit Verification Script
# Comprehensive testing of CodeRabbit MCP setup and integration

set -e

echo "🔍 CodeRabbit Setup Verification"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_critical() {
    echo -e "${PURPLE}[CRITICAL]${NC} $1"
}

# Configuration paths
CURSOR_SETTINGS="/Users/rodericandrews/Library/Application Support/Cursor/User/settings.json"
CLAUDE_CONFIG_DIR="/Users/rodericandrews/.claude"
PROJECT_DIR="/Users/rodericandrews/WarRoom_Development/1.0-war-room"
ENV_FILE="$PROJECT_DIR/.env.mcp"

echo "📦 STEP 1: CodeRabbit MCP Installation Check"
echo "============================================="

# Check if CodeRabbit MCP is installed globally
print_status "Checking global npm installation..."
if npm list -g coderabbitai-mcp &> /dev/null; then
    GLOBAL_VERSION=$(npm list -g coderabbitai-mcp 2>/dev/null | grep coderabbitai-mcp | head -1)
    print_success "✅ CodeRabbit MCP installed globally: $GLOBAL_VERSION"
    GLOBAL_INSTALLED=true
else
    print_warning "❌ CodeRabbit MCP not found in global npm packages"
    GLOBAL_INSTALLED=false
fi

# Check if binary is accessible
print_status "Checking CodeRabbit MCP binary..."
if command -v coderabbitai-mcp &> /dev/null; then
    BINARY_PATH=$(which coderabbitai-mcp)
    print_success "✅ CodeRabbit MCP binary found: $BINARY_PATH"
    BINARY_AVAILABLE=true
else
    print_warning "❌ CodeRabbit MCP binary not in PATH"
    BINARY_AVAILABLE=false
fi

# Try to get version information
print_status "Testing CodeRabbit MCP executable..."
if $BINARY_AVAILABLE; then
    if coderabbitai-mcp --version &> /dev/null; then
        VERSION_OUTPUT=$(coderabbitai-mcp --version 2>&1)
        print_success "✅ CodeRabbit MCP version: $VERSION_OUTPUT"
    elif coderabbitai-mcp --help &> /dev/null; then
        print_success "✅ CodeRabbit MCP responds to --help"
    else
        print_warning "❌ CodeRabbit MCP executable may not be working properly"
    fi
fi

echo ""
echo "⚙️  STEP 2: Configuration Files Check"
echo "====================================="

# Check Cursor settings
print_status "Checking Cursor settings configuration..."
if [ -f "$CURSOR_SETTINGS" ]; then
    print_success "✅ Cursor settings file found"
    
    # Check for CodeRabbit configuration
    if grep -q "coderabbit" "$CURSOR_SETTINGS"; then
        print_success "✅ CodeRabbit configuration found in Cursor settings"
        
        # Show specific CodeRabbit settings
        print_status "CodeRabbit settings in Cursor:"
        grep -E "\"coderabbit\.[^\"]*\":" "$CURSOR_SETTINGS" | while read -r line; do
            echo "   $line"
        done
    else
        print_error "❌ No CodeRabbit configuration found in Cursor settings"
    fi
else
    print_error "❌ Cursor settings file not found: $CURSOR_SETTINGS"
fi

# Check Claude MCP configuration
print_status "Checking Claude Desktop MCP configuration..."
CLAUDE_MCP_CONFIG="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
if [ -f "$CLAUDE_MCP_CONFIG" ]; then
    print_success "✅ Claude MCP configuration file found"
    
    if grep -q "coderabbit" "$CLAUDE_MCP_CONFIG"; then
        print_success "✅ CodeRabbit server configured in Claude MCP"
        
        # Show CodeRabbit MCP server config
        print_status "CodeRabbit MCP server configuration:"
        python3 -c "
import json
try:
    with open('$CLAUDE_MCP_CONFIG', 'r') as f:
        config = json.load(f)
    if 'mcpServers' in config and 'coderabbit' in config['mcpServers']:
        coderabbit_config = config['mcpServers']['coderabbit']
        print(f'   Command: {coderabbit_config.get(\"command\", \"Not set\")}')
        print(f'   Args: {coderabbit_config.get(\"args\", \"Not set\")}')
        if 'env' in coderabbit_config:
            for key, value in coderabbit_config['env'].items():
                if 'API_KEY' in key:
                    print(f'   {key}: {\"Set\" if value else \"Not set\"}')
                else:
                    print(f'   {key}: {value}')
    else:
        print('   No CodeRabbit configuration found')
except Exception as e:
    print(f'   Error reading config: {e}')
"
    else
        print_warning "❌ No CodeRabbit configuration found in Claude MCP config"
    fi
else
    print_warning "❌ Claude MCP configuration file not found: $CLAUDE_MCP_CONFIG"
fi

# Check environment file
print_status "Checking environment configuration..."
if [ -f "$ENV_FILE" ]; then
    print_success "✅ Environment file found: $ENV_FILE"
    
    if grep -q "CODERABBIT_API_KEY" "$ENV_FILE"; then
        API_KEY_LINE=$(grep "CODERABBIT_API_KEY" "$ENV_FILE")
        if [[ "$API_KEY_LINE" == *"your_coderabbit_api_key_here"* ]]; then
            print_warning "⚠️  CodeRabbit API key is placeholder - needs real key"
        elif [[ "$API_KEY_LINE" == *"="* ]] && [[ "${API_KEY_LINE#*=}" != "" ]]; then
            print_success "✅ CodeRabbit API key appears to be set"
        else
            print_warning "❌ CodeRabbit API key is empty"
        fi
    else
        print_warning "❌ No CodeRabbit API key configuration found"
    fi
else
    print_warning "❌ Environment file not found: $ENV_FILE"
fi

echo ""
echo "📊 STEP 3: Git Repository Analysis"
echo "=================================="

# Check if we're in a git repository
print_status "Checking git repository status..."
if git rev-parse --git-dir &> /dev/null; then
    print_success "✅ Inside git repository"
    
    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)
    print_status "Current branch: $CURRENT_BRANCH"
    
    # Get recent commits (last 5)
    print_status "Recent commits (last 5):"
    git log --oneline -5 | while read -r line; do
        echo "   $line"
    done
    
    # Check for remote repository
    if git remote -v &> /dev/null; then
        print_status "Remote repositories:"
        git remote -v | while read -r line; do
            echo "   $line"
        done
    else
        print_warning "No remote repositories configured"
    fi
    
    # Check for uncommitted changes
    if git diff --quiet && git diff --cached --quiet; then
        print_success "✅ Working directory is clean"
    else
        print_warning "⚠️  Uncommitted changes detected"
        print_status "Modified files:"
        git diff --name-only
        git diff --cached --name-only
    fi
    
else
    print_error "❌ Not inside a git repository"
fi

echo ""
echo "🧪 STEP 4: CodeRabbit API Connection Test"
echo "========================================="

# Test CodeRabbit API if we have an API key
if [ -f "$ENV_FILE" ] && grep -q "CODERABBIT_API_KEY" "$ENV_FILE"; then
    API_KEY_LINE=$(grep "CODERABBIT_API_KEY" "$ENV_FILE")
    API_KEY="${API_KEY_LINE#*=}"
    
    if [[ "$API_KEY" != "your_coderabbit_api_key_here" ]] && [[ "$API_KEY" != "" ]]; then
        print_status "Testing CodeRabbit API connection..."
        
        # Test API connectivity (without exposing the key)
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $API_KEY" \
            -H "Content-Type: application/json" \
            "https://api.coderabbit.ai/v1/user" 2>/dev/null || echo "000")
        
        case $HTTP_STATUS in
            200)
                print_success "✅ CodeRabbit API connection successful"
                ;;
            401)
                print_error "❌ CodeRabbit API authentication failed (invalid API key)"
                ;;
            403)
                print_error "❌ CodeRabbit API access forbidden (check permissions)"
                ;;
            000)
                print_warning "❌ CodeRabbit API connection failed (network/DNS issue)"
                ;;
            *)
                print_warning "❌ CodeRabbit API returned status: $HTTP_STATUS"
                ;;
        esac
    else
        print_warning "⚠️  Cannot test API - no valid API key configured"
        print_status "To get API key: https://app.coderabbit.ai/settings/api-keys"
    fi
else
    print_warning "⚠️  Cannot test API - no environment file or API key found"
fi

echo ""
echo "🔧 STEP 5: MCP Integration Test"
echo "==============================="

# Test if CodeRabbit MCP can be invoked
print_status "Testing CodeRabbit MCP invocation..."
if $BINARY_AVAILABLE; then
    # Try to run CodeRabbit MCP with minimal test
    if timeout 5s coderabbitai-mcp 2>&1 | grep -q -E "(error|help|usage|version)" &> /dev/null; then
        print_success "✅ CodeRabbit MCP responds to invocation"
    else
        print_warning "❌ CodeRabbit MCP may not be responding correctly"
    fi
else
    print_warning "⚠️  Cannot test MCP invocation - binary not available"
fi

# Test npm package integrity
print_status "Testing npm package integrity..."
if npm list -g coderabbitai-mcp 2>/dev/null | grep -q "UNMET DEPENDENCY"; then
    print_error "❌ CodeRabbit MCP has unmet dependencies"
elif npm list -g coderabbitai-mcp 2>/dev/null | grep -q "invalid"; then
    print_error "❌ CodeRabbit MCP installation appears invalid"
else
    print_success "✅ CodeRabbit MCP npm package integrity looks good"
fi

echo ""
echo "📋 STEP 6: Summary & Recommendations"
echo "==================================="

# Summary of findings
ISSUES=0
WARNINGS=0

if ! $GLOBAL_INSTALLED; then
    ((ISSUES++))
    print_error "❌ Issue: CodeRabbit MCP not installed globally"
fi

if ! $BINARY_AVAILABLE; then
    ((ISSUES++))
    print_error "❌ Issue: CodeRabbit MCP binary not accessible"
fi

if [ ! -f "$CURSOR_SETTINGS" ] || ! grep -q "coderabbit" "$CURSOR_SETTINGS"; then
    ((ISSUES++))
    print_error "❌ Issue: CodeRabbit not configured in Cursor"
fi

if [ -f "$ENV_FILE" ]; then
    if ! grep -q "CODERABBIT_API_KEY" "$ENV_FILE"; then
        ((WARNINGS++))
        print_warning "⚠️  Warning: No API key configuration found"
    elif grep -q "your_coderabbit_api_key_here" "$ENV_FILE"; then
        ((WARNINGS++))
        print_warning "⚠️  Warning: API key is still placeholder"
    fi
else
    ((WARNINGS++))
    print_warning "⚠️  Warning: No environment file found"
fi

echo ""
if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_success "🎉 PERFECT SETUP! CodeRabbit MCP is fully configured and ready!"
elif [ $ISSUES -eq 0 ]; then
    print_warning "✅ GOOD SETUP! CodeRabbit MCP is configured with $WARNINGS minor warnings"
else
    print_error "⚠️  SETUP INCOMPLETE! Found $ISSUES critical issues and $WARNINGS warnings"
fi

echo ""
print_status "📝 Next Steps:"
if [ $ISSUES -gt 0 ]; then
    echo "1. Run the fix script: ./scripts/fix-mcp-connections.sh"
fi
if [ $WARNINGS -gt 0 ]; then
    echo "2. Get CodeRabbit API key: https://app.coderabbit.ai/settings/api-keys"
    echo "3. Add API key to $ENV_FILE"
fi
echo "4. Restart Cursor to apply changes"
echo "5. Test CodeRabbit in a pull request"

echo ""
print_critical "🚀 CodeRabbit Verification Complete!"
echo ""

# Exit with appropriate code
if [ $ISSUES -gt 0 ]; then
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    exit 2
else
    exit 0
fi