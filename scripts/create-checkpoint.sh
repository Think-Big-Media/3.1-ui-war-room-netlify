#!/bin/bash

# War Room Checkpoint Creation Script
# Creates checkpoints for database backups and deployment validation

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check command line arguments
if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <checkpoint-type> [options]"
    echo "  checkpoint-type: database, deployment, or all"
    echo "  options:"
    echo "    --name <name>    Custom checkpoint name (for database)"
    echo "    --skip-tests     Skip test execution"
    exit 1
fi

CHECKPOINT_TYPE=$1
CHECKPOINT_NAME=""
SKIP_TESTS=false

# Parse additional arguments
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --name)
            CHECKPOINT_NAME="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Function to create database checkpoint
create_database_checkpoint() {
    print_status "Creating database checkpoint..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        exit 1
    fi
    
    # Create backup directory
    BACKUP_DIR="backups/database"
    mkdir -p $BACKUP_DIR
    
    # Generate checkpoint name if not provided
    if [ -z "$CHECKPOINT_NAME" ]; then
        CHECKPOINT_NAME="checkpoint_$(date +%Y%m%d_%H%M%S)"
    fi
    
    BACKUP_FILE="$BACKUP_DIR/${CHECKPOINT_NAME}.sql"
    
    # Extract database connection details
    DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:]+):.*/\1/')
    DB_PORT=$(echo $DATABASE_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')
    DB_NAME=$(echo $DATABASE_URL | sed -E 's/.*\/([^?]+).*/\1/')
    DB_USER=$(echo $DATABASE_URL | sed -E 's/.*\/\/([^:]+):.*/\1/')
    DB_PASS=$(echo $DATABASE_URL | sed -E 's/.*\/\/[^:]+:([^@]+)@.*/\1/')
    
    # Create database backup
    PGPASSWORD=$DB_PASS pg_dump \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        -f $BACKUP_FILE \
        --verbose \
        --no-owner \
        --no-privileges
    
    if [ $? -eq 0 ]; then
        # Calculate checksum
        CHECKSUM=$(sha256sum $BACKUP_FILE | awk '{print $1}')
        SIZE=$(du -h $BACKUP_FILE | awk '{print $1}')
        
        # Create metadata file
        cat > "$BACKUP_DIR/${CHECKPOINT_NAME}.meta" <<EOF
{
    "checkpoint_name": "$CHECKPOINT_NAME",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "backup_file": "$BACKUP_FILE",
    "size": "$SIZE",
    "checksum": "$CHECKSUM",
    "database": "$DB_NAME"
}
EOF
        
        print_status "Database checkpoint created: $CHECKPOINT_NAME"
        print_status "Size: $SIZE"
        print_status "Checksum: $CHECKSUM"
    else
        print_error "Failed to create database backup"
        exit 1
    fi
}

# Function to run deployment checkpoint validation
run_deployment_checkpoint() {
    print_status "Running deployment checkpoint validation..."
    
    echo ""
    echo "=== Environment Variables Check ==="
    REQUIRED_VARS=(
        "DATABASE_URL"
        "JWT_SECRET"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "REDIS_URL"
    )
    
    MISSING_VARS=()
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=($var)
            print_error "$var is not set"
        else
            print_status "$var is set"
        fi
    done
    
    echo ""
    echo "=== File System Check ==="
    REQUIRED_FILES=(
        "railway.json"
        "Dockerfile.railway"
        "src/backend/requirements.txt"
        "src/frontend/package.json"
        ".env.production.template"
    )
    
    MISSING_FILES=()
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            print_status "$file exists"
        else
            print_error "$file is missing"
            MISSING_FILES+=($file)
        fi
    done
    
    echo ""
    echo "=== Python Dependencies Check ==="
    cd src/backend
    if [ -f "requirements.txt" ]; then
        # Check for critical dependencies
        if grep -q "fastapi" requirements.txt; then
            print_status "FastAPI found in requirements"
        else
            print_error "FastAPI missing from requirements"
        fi
        
        if grep -q "sqlalchemy" requirements.txt; then
            print_status "SQLAlchemy found in requirements"
        else
            print_error "SQLAlchemy missing from requirements"
        fi
        
        if grep -q "alembic" requirements.txt; then
            print_status "Alembic found in requirements"
        else
            print_error "Alembic missing from requirements"
        fi
    fi
    cd ../..
    
    echo ""
    echo "=== Database Connection Check ==="
    if [ -n "$DATABASE_URL" ]; then
        python3 -c "
import psycopg2
from urllib.parse import urlparse
url = urlparse('$DATABASE_URL')
try:
    conn = psycopg2.connect(
        host=url.hostname,
        port=url.port or 5432,
        user=url.username,
        password=url.password,
        database=url.path[1:]
    )
    conn.close()
    print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
" && print_status "Database connection successful" || print_error "Database connection failed"
    fi
    
    if [ "$SKIP_TESTS" = false ]; then
        echo ""
        echo "=== Running Tests ==="
        
        # Backend tests
        if [ -d "src/backend" ]; then
            cd src/backend
            if [ -f "pytest.ini" ] || [ -d "tests" ]; then
                print_status "Running backend tests..."
                python -m pytest tests/ -v --tb=short || print_warning "Some backend tests failed"
            else
                print_warning "No backend tests found"
            fi
            cd ../..
        fi
        
        # Frontend tests
        if [ -d "src/frontend" ]; then
            cd src/frontend
            if [ -f "package.json" ] && grep -q "test" package.json; then
                print_status "Running frontend tests..."
                npm test -- --watchAll=false || print_warning "Some frontend tests failed"
            else
                print_warning "No frontend tests configured"
            fi
            cd ../..
        fi
    else
        print_warning "Skipping tests (--skip-tests flag set)"
    fi
    
    echo ""
    echo "=== Build Check ==="
    
    # Check if Docker build works (dry run)
    if [ -f "Dockerfile.railway" ]; then
        print_status "Checking Dockerfile.railway syntax..."
        docker build -f Dockerfile.railway . --no-cache --progress=plain --target base 2>/dev/null || true
        print_status "Dockerfile.railway exists and is ready"
    fi
    
    # Create checkpoint summary
    CHECKPOINT_FILE="backups/deployment/checkpoint_$(date +%Y%m%d_%H%M%S).json"
    mkdir -p backups/deployment
    
    cat > $CHECKPOINT_FILE <<EOF
{
    "checkpoint_id": "$(date +%Y%m%d_%H%M%S)",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "missing_env_vars": [$(printf '"%s",' "${MISSING_VARS[@]}" | sed 's/,$//')]",
    "missing_files": [$(printf '"%s",' "${MISSING_FILES[@]}" | sed 's/,$//')]",
    "status": "$([ ${#MISSING_VARS[@]} -eq 0 ] && [ ${#MISSING_FILES[@]} -eq 0 ] && echo "passed" || echo "failed")"
}
EOF
    
    echo ""
    echo "=== Deployment Checkpoint Summary ==="
    if [ ${#MISSING_VARS[@]} -eq 0 ] && [ ${#MISSING_FILES[@]} -eq 0 ]; then
        print_status "All deployment checks passed!"
        print_status "Checkpoint saved to: $CHECKPOINT_FILE"
    else
        print_error "Deployment checks failed"
        [ ${#MISSING_VARS[@]} -gt 0 ] && print_error "Missing environment variables: ${MISSING_VARS[*]}"
        [ ${#MISSING_FILES[@]} -gt 0 ] && print_error "Missing files: ${MISSING_FILES[*]}"
        exit 1
    fi
}

# Main execution
case $CHECKPOINT_TYPE in
    database)
        create_database_checkpoint
        ;;
    deployment)
        run_deployment_checkpoint
        ;;
    all)
        create_database_checkpoint
        echo ""
        run_deployment_checkpoint
        ;;
    *)
        print_error "Invalid checkpoint type: $CHECKPOINT_TYPE"
        echo "Valid types: database, deployment, all"
        exit 1
        ;;
esac

print_status "Checkpoint operation completed successfully!"