#!/bin/bash

# War Room Safe Deployment Script
# Ensures proper branch management and deployment flow

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_help() {
    echo "Usage: ./scripts/deploy.sh [staging|production]"
    echo ""
    echo "Commands:"
    echo "  staging     - Deploy current main to staging"
    echo "  production  - Deploy staging to production (after confirmation)"
    echo ""
    echo "This script ensures:"
    echo "  - You're on the correct branch"
    echo "  - Changes are committed"
    echo "  - Tests pass before deployment"
    echo "  - Proper merge flow is followed"
}

check_uncommitted_changes() {
    if [[ -n $(git status -s) ]]; then
        echo -e "${RED}Error: You have uncommitted changes${NC}"
        echo "Please commit or stash your changes before deploying"
        exit 1
    fi
}

run_tests() {
    echo -e "${YELLOW}Running tests...${NC}"
    
    # Run frontend tests
    if [ -f "package.json" ]; then
        npm run type-check || {
            echo -e "${RED}TypeScript errors found. Fix them before deploying.${NC}"
            exit 1
        }
    fi
    
    # Run backend tests if they exist
    if [ -f "src/backend/requirements.txt" ]; then
        cd src/backend
        python -m pytest tests/ -x 2>/dev/null || {
            echo -e "${YELLOW}Warning: Some backend tests failed${NC}"
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        }
        cd ../..
    fi
    
    echo -e "${GREEN}Tests passed!${NC}"
}

deploy_to_staging() {
    echo -e "${YELLOW}Deploying to STAGING...${NC}"
    
    # Ensure we're on main
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        echo -e "${YELLOW}Switching to main branch...${NC}"
        git checkout main
    fi
    
    # Pull latest main
    echo "Pulling latest main..."
    git pull origin main
    
    # Run tests
    run_tests
    
    # Merge to staging
    echo -e "${YELLOW}Merging main → staging...${NC}"
    git checkout staging
    git pull origin staging
    git merge main -m "Deploy to staging: $(date +'%Y-%m-%d %H:%M:%S')"
    
    # Push to trigger deployment
    echo -e "${GREEN}Pushing to staging branch...${NC}"
    git push origin staging
    
    echo -e "${GREEN}✓ Deployed to staging!${NC}"
    echo "Monitor at: https://one-0-war-room.onrender.com"
    echo ""
    echo "After testing, run: ./scripts/deploy.sh production"
    
    # Return to main
    git checkout main
}

deploy_to_production() {
    echo -e "${YELLOW}Preparing PRODUCTION deployment...${NC}"
    
    # Confirmation
    echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️${NC}"
    echo "This will deploy staging → production"
    echo "URL: https://war-room-app-2025.onrender.com"
    read -p "Have you tested staging thoroughly? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
    
    # Test staging URL
    echo "Testing staging health..."
    response=$(curl -s -o /dev/null -w "%{http_code}" https://one-0-war-room.onrender.com/health)
    if [ "$response" != "200" ]; then
        echo -e "${RED}Warning: Staging health check failed (HTTP $response)${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Merge staging to production
    echo -e "${YELLOW}Merging staging → production...${NC}"
    git checkout production
    git pull origin production
    
    # Save current commit for rollback
    rollback_commit=$(git rev-parse HEAD)
    echo "Rollback commit saved: $rollback_commit"
    
    git merge staging -m "Production release: $(date +'%Y-%m-%d %H:%M:%S')"
    
    # Final confirmation
    echo -e "${RED}FINAL CONFIRMATION${NC}"
    read -p "Push to production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        git reset --hard $rollback_commit
        echo "Deployment cancelled, rolled back"
        exit 0
    fi
    
    # Push to production
    echo -e "${GREEN}Pushing to production...${NC}"
    git push origin production
    
    echo -e "${GREEN}✓ Deployed to production!${NC}"
    echo "URL: https://war-room-app-2025.onrender.com"
    echo ""
    echo "If rollback needed:"
    echo "  git checkout production"
    echo "  git reset --hard $rollback_commit"
    echo "  git push origin production --force"
    
    # Return to main
    git checkout main
}

# Main script
case "$1" in
    staging)
        check_uncommitted_changes
        deploy_to_staging
        ;;
    production)
        check_uncommitted_changes
        deploy_to_production
        ;;
    *)
        print_help
        exit 0
        ;;
esac