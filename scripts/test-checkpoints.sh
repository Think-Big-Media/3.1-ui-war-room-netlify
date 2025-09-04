#!/bin/bash

# Test Checkpoint Functionality
# This script tests all checkpoint features before deployment

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo "=================================="
echo "War Room Checkpoint Test Suite"
echo "=================================="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Test 1: Deployment Checkpoint
echo "Test 1: Deployment Checkpoint Validation"
echo "---------------------------------------"
if [ -x "./scripts/create-checkpoint.sh" ]; then
    ./scripts/create-checkpoint.sh deployment --skip-tests
    if [ $? -eq 0 ]; then
        print_status "Deployment checkpoint validation passed"
    else
        print_error "Deployment checkpoint validation failed"
        exit 1
    fi
else
    print_error "Checkpoint script not found"
    exit 1
fi

echo ""

# Test 2: Database Checkpoint (if database is available)
echo "Test 2: Database Backup Checkpoint"
echo "---------------------------------------"
if [ -n "$DATABASE_URL" ]; then
    ./scripts/create-checkpoint.sh database --name "test-checkpoint-$(date +%Y%m%d-%H%M%S)"
    if [ $? -eq 0 ]; then
        print_status "Database checkpoint creation successful"
        
        # Verify backup file exists
        LATEST_BACKUP=$(ls -t backups/database/*.sql 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            SIZE=$(du -h "$LATEST_BACKUP" | awk '{print $1}')
            print_info "Backup file: $LATEST_BACKUP (Size: $SIZE)"
        fi
    else
        print_warning "Database checkpoint creation failed (non-critical)"
    fi
else
    print_warning "DATABASE_URL not set, skipping database checkpoint test"
fi

echo ""

# Test 3: API Endpoint Test (if backend is running)
echo "Test 3: Checkpoint API Endpoints"
echo "---------------------------------------"

# Check if backend is running
if curl -s http://localhost:8000/api/v1/monitoring/health > /dev/null 2>&1; then
    print_info "Backend is running, testing API endpoints"
    
    # Test deployment checkpoint endpoint
    print_info "Testing deployment checkpoint endpoint..."
    RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/checkpoints/deployment \
        -H "Authorization: Bearer $TEST_TOKEN" \
        -H "Content-Type: application/json")
    
    if [ $? -eq 0 ]; then
        print_status "Deployment checkpoint API endpoint accessible"
    else
        print_warning "Could not access deployment checkpoint API"
    fi
else
    print_warning "Backend not running, skipping API tests"
    print_info "Start the backend with: cd src/backend && uvicorn main:app --reload"
fi

echo ""

# Test 4: Checkpoint Directory Permissions
echo "Test 4: Directory Permissions"
echo "---------------------------------------"

# Check checkpoint directories
DIRS_TO_CHECK=(
    "/tmp/warroom/checkpoints"
    "/tmp/warroom/db_backups"
    "backups/database"
    "backups/deployment"
)

for dir in "${DIRS_TO_CHECK[@]}"; do
    if [ -d "$dir" ] || mkdir -p "$dir" 2>/dev/null; then
        if [ -w "$dir" ]; then
            print_status "$dir is writable"
        else
            print_error "$dir is not writable"
        fi
    else
        print_warning "Could not create $dir"
    fi
done

echo ""

# Test 5: Python Import Test
echo "Test 5: Python Module Import Test"
echo "---------------------------------------"

cd src/backend
python3 -c "
try:
    from services.checkpoint_service import checkpoint_service, CheckpointType
    print('✓ Checkpoint service imported successfully')
    
    from api.checkpoints import router
    print('✓ Checkpoint API router imported successfully')
    
    from schemas.checkpoint import CheckpointResponse
    print('✓ Checkpoint schemas imported successfully')
except ImportError as e:
    print(f'✗ Import error: {e}')
    exit(1)
"

if [ $? -eq 0 ]; then
    print_status "All Python modules imported successfully"
else
    print_error "Python import test failed"
    exit 1
fi

cd ../..

echo ""

# Test 6: Railway Configuration Validation
echo "Test 6: Railway Configuration"
echo "---------------------------------------"

if [ -f "railway.json" ]; then
    # Check if railway.json is valid JSON
    if python3 -m json.tool railway.json > /dev/null 2>&1; then
        print_status "railway.json is valid JSON"
        
        # Check for checkpoint volumes
        if grep -q "checkpoint-storage" railway.json; then
            print_status "Checkpoint volume configured in railway.json"
        else
            print_warning "Checkpoint volume not found in railway.json"
        fi
        
        if grep -q "backup-storage" railway.json; then
            print_status "Backup volume configured in railway.json"
        else
            print_warning "Backup volume not found in railway.json"
        fi
    else
        print_error "railway.json is not valid JSON"
        exit 1
    fi
else
    print_error "railway.json not found"
    exit 1
fi

echo ""

# Summary
echo "=================================="
echo "Test Summary"
echo "=================================="

TESTS_PASSED=0
TESTS_TOTAL=6

# Count passed tests based on previous outputs
if [ -f "backups/deployment/checkpoint_"* ]; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

echo ""
print_info "Tests completed. Review the output above for any issues."
print_info "Fix any errors before deploying to Railway."

echo ""
echo "Next steps:"
echo "1. If all tests passed, you can deploy with: ./scripts/deploy-railway.sh"
echo "2. Monitor the deployment with: railway logs"
echo "3. Check checkpoint status after deployment: railway run python -m scripts.check_checkpoint_status"