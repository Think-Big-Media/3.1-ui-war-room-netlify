#!/bin/bash

# War Room Deployment Readiness Test
# Checks if the project is ready for Render deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test results
PASSED=0
FAILED=0

# Test function
test_item() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" &>/dev/null; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
}

echo "War Room Deployment Readiness Test (Render)"
echo "==========================================="
echo ""

# File existence tests
echo "Checking required files..."
test_item "render.yaml exists" "[ -f render.yaml ]"
test_item "nginx.conf exists" "[ -f nginx.conf ]"
test_item ".env.production exists" "[ -f .env.production ]"
test_item "requirements.txt exists" "[ -f src/backend/requirements.txt ]"
test_item "package.json exists" "[ -f src/frontend/package.json ]"
test_item "alembic.ini exists" "[ -f src/backend/alembic.ini ]"

echo ""
echo "Checking backend structure..."
test_item "main.py exists" "[ -f src/backend/main.py ]"
test_item "serve_bulletproof.py exists" "[ -f src/backend/serve_bulletproof.py ]"
test_item "models directory exists" "[ -d src/backend/models ]"
test_item "api directory exists" "[ -d src/backend/api ]"
test_item "services directory exists" "[ -d src/backend/services ]"
test_item "alembic migrations exist" "[ -d src/backend/alembic/versions ]"

echo ""
echo "Checking frontend structure..."
test_item "Frontend src directory exists" "[ -d src/frontend/src ]"
test_item "Frontend index.html exists" "[ -f src/frontend/index.html ]"
test_item "Frontend vite.config.ts exists" "[ -f src/frontend/vite.config.ts ]"

echo ""
echo "Checking configuration..."
test_item ".gitignore includes .env files" "grep -q '\.env' .gitignore"
test_item "SECRET_KEY is configured in render.yaml" "grep -q 'SECRET_KEY' render.yaml"
test_item "Models import paths are correct" "! grep -q 'from app\.models' src/backend/models/__init__.py"

echo ""
echo "Checking Node.js setup..."
test_item "Node.js is installed" "command -v node"
test_item "npm is installed" "command -v npm"

echo ""
echo "Checking Python setup..."
test_item "Python 3.11+ is available" "python3 --version | grep -E '3\.(1[1-9]|[2-9][0-9])'"

echo ""
echo "==========================================="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Project is ready for Render deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Ensure you have a Render account at https://render.com"
    echo "2. Connect your GitHub repository to Render"
    echo "3. Deploy using the Render dashboard or Git push"
    echo "4. Monitor deployment at https://dashboard.render.com"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please fix the issues before deploying.${NC}"
    exit 1
fi