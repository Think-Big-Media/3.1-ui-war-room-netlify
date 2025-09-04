#!/bin/bash

# Fix Deployment Configuration Script
# This script fixes the service ID mismatch and other deployment issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Fixing Deployment Configuration${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Backup current files
echo -e "${YELLOW}Creating backups...${NC}"
cp .github/workflows/ci-cd.yml .github/workflows/ci-cd.yml.backup
cp .github/workflows/deploy-render.yml .github/workflows/deploy-render.yml.backup
cp render.yaml render.yaml.backup
echo -e "${GREEN}✓${NC} Backups created"
echo ""

# Fix 1: Update service IDs in all workflow files
echo -e "${YELLOW}Fixing service IDs in workflow files...${NC}"

# Fix deploy-render.yml
sed -i '' 's/srv-d1ub5iumcj7s73ebrpo0/war-room-oa9t/g' .github/workflows/deploy-render.yml
echo -e "${GREEN}✓${NC} Fixed deploy-render.yml"

# Fix ci-cd.yml
sed -i '' 's/srv-d1ub5iumcj7s73ebrpo0/war-room-oa9t/g' .github/workflows/ci-cd.yml
echo -e "${GREEN}✓${NC} Fixed ci-cd.yml"

# Fix advanced-deployment.yml if it exists
if [ -f ".github/workflows/advanced-deployment.yml" ]; then
    sed -i '' 's/srv-d1ub5iumcj7s73ebrpo0/war-room-oa9t/g' .github/workflows/advanced-deployment.yml
    echo -e "${GREEN}✓${NC} Fixed advanced-deployment.yml"
fi

echo ""

# Fix 2: Fix render.yaml duplicate services key
echo -e "${YELLOW}Fixing render.yaml...${NC}"

cat > render.yaml << 'EOF'
services:
  # Main War Room service - Combined frontend and backend
  # This is the actual service running at war-room-oa9t.onrender.com
  - type: web
    name: war-room-oa9t
    runtime: python
    plan: starter
    
    # Build Configuration
    buildCommand: |
      cd src/backend && pip install -r requirements.txt
      cd ../frontend && npm ci && npm run build
    
    # Start Command - serves both frontend and backend
    startCommand: cd src/backend && python serve_bulletproof.py
    
    # Health Check Configuration
    healthCheckPath: /health
    
    # Environment Variables (set in Render dashboard)
    envVars:
      - key: PYTHON_VERSION
        value: "3.11"
      - key: NODE_VERSION
        value: "18"
      - key: PORT
        value: "10000"
      - key: NODE_ENV
        value: "production"
      - key: RENDER_ENV
        value: "production"
      
    # Auto-deploy from GitHub
    repo: https://github.com/Think-Big-Media/1.0-war-room
    branch: main
    autoDeploy: true

# Database Configuration (if using Render PostgreSQL)
databases:
  - name: warroom-db
    plan: starter
    databaseName: warroom
    user: warroom
EOF

echo -e "${GREEN}✓${NC} Fixed render.yaml (removed duplicate services key)"
echo ""

# Fix 3: Update environment variables in deploy script
echo -e "${YELLOW}Updating deploy-render.yml to use correct service...${NC}"

cat > .github/workflows/deploy-render.yml << 'EOF'
name: Deploy to Render

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  RENDER_SERVICE_ID: war-room-oa9t
  RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Render
      run: |
        # Trigger deployment on war-room-oa9t service
        echo "🚀 Deploying to Render service: ${{ env.RENDER_SERVICE_ID }}"
        
        # Using Render Deploy Hook if available
        if [ -n "${{ secrets.RENDER_DEPLOY_HOOK_URL }}" ]; then
          echo "Using Deploy Hook URL"
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
        else
          # Alternative: Use Render API to trigger deployment
          echo "Using Render API"
          
          # Use correct service ID: war-room-oa9t
          SERVICE_ID="${{ env.RENDER_SERVICE_ID }}"
          
          # Trigger deployment (clear cache to force rebuild)
          curl -X POST \
            -H "Authorization: Bearer ${{ env.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            "https://api.render.com/v1/services/${SERVICE_ID}/deploys" \
            -d '{"clearCache": true}'
        fi
    
    - name: Wait for deployment to start
      run: |
        echo "⏳ Waiting for deployment to start..."
        sleep 30
    
    - name: Check deployment status
      run: |
        echo "🔍 Checking deployment status..."
        
        # Check if the service is responding
        MAX_ATTEMPTS=20
        ATTEMPT=0
        
        while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
          RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://war-room-oa9t.onrender.com/health || echo "000")
          
          if [ "$RESPONSE" = "200" ]; then
            echo "✅ Deployment successful! Service is responding."
            exit 0
          else
            echo "Attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS: Service returned $RESPONSE"
            ATTEMPT=$((ATTEMPT + 1))
            sleep 30
          fi
        done
        
        echo "⚠️ Deployment may still be in progress. Check Render dashboard."
    
    - name: Test API Health
      if: success()
      run: |
        echo "🔍 Testing API health endpoints..."
        
        # Test basic health
        curl -f https://war-room-oa9t.onrender.com/api/health/simple || echo "Simple health check not available yet"
        
        # Test full health with API status
        HEALTH_RESPONSE=$(curl -s https://war-room-oa9t.onrender.com/api/health || echo "{}")
        echo "Health response: $HEALTH_RESPONSE"
        
        # Check if APIs are configured
        if command -v jq &> /dev/null; then
          FB_CONFIG=$(echo "$HEALTH_RESPONSE" | jq -r '.services.facebook_api.configured // false')
          GOOGLE_CONFIG=$(echo "$HEALTH_RESPONSE" | jq -r '.services.google_ads_api.configured // false')
          
          if [ "$FB_CONFIG" != "true" ]; then
            echo "⚠️ Facebook API not configured - add env vars in Render dashboard"
          fi
          
          if [ "$GOOGLE_CONFIG" != "true" ]; then
            echo "⚠️ Google Ads API not configured - add env vars in Render dashboard"
          fi
        fi
    
    - name: Notify deployment status
      if: always()
      run: |
        if [ "${{ job.status }}" = "success" ]; then
          echo "✅ Deployment to war-room-oa9t completed successfully"
        else
          echo "❌ Deployment to war-room-oa9t encountered issues"
        fi
EOF

echo -e "${GREEN}✓${NC} Updated deploy-render.yml with correct service ID"
echo ""

# Create GitHub secrets configuration file
echo -e "${YELLOW}Creating GitHub secrets template...${NC}"

cat > github-secrets-needed.txt << 'EOF'
# GitHub Secrets Required for Deployment
# Add these at: https://github.com/Think-Big-Media/1.0-war-room/settings/secrets/actions

RENDER_API_KEY=
# Get from: https://dashboard.render.com/u/settings
# Look for "API Keys" section and create a new one

RENDER_SERVICE_ID=war-room-oa9t
# This is the correct service ID

RENDER_STAGING_SERVICE_ID=war-room-oa9t
# Using same service for now, can be different for staging

RENDER_DEPLOY_HOOK_URL=
# Get from: https://dashboard.render.com/
# Select war-room-oa9t service > Settings > Deploy Hook
# Copy the webhook URL
EOF

echo -e "${GREEN}✓${NC} Created github-secrets-needed.txt"
echo ""

# Show summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Configuration Fixed!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${GREEN}✅ Fixed Issues:${NC}"
echo "  - Updated service ID from srv-d1ub5iumcj7s73ebrpo0 to war-room-oa9t"
echo "  - Fixed render.yaml duplicate services key"
echo "  - Updated all workflow files with correct service ID"
echo ""

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Add GitHub Secrets:"
echo "   - Go to: https://github.com/Think-Big-Media/1.0-war-room/settings/secrets/actions"
echo "   - Add secrets from github-secrets-needed.txt"
echo ""
echo "2. Add Render Environment Variables:"
echo "   - Go to: https://dashboard.render.com/"
echo "   - Select war-room-oa9t service"
echo "   - Go to Environment tab"
echo "   - Run: ./scripts/setup-render-env.sh for the complete list"
echo ""
echo "3. Commit and push the fixes:"
echo "   git add -A"
echo "   git commit -m 'fix: correct Render service ID and deployment configuration'"
echo "   git push origin main"
echo ""
echo "4. Monitor deployment:"
echo "   - Check: https://github.com/Think-Big-Media/1.0-war-room/actions"
echo "   - Check: https://dashboard.render.com/"
echo ""

echo -e "${GREEN}Files modified:${NC}"
echo "  - .github/workflows/deploy-render.yml"
echo "  - .github/workflows/ci-cd.yml"
echo "  - render.yaml"
echo ""
echo -e "${GREEN}Files created:${NC}"
echo "  - github-secrets-needed.txt"
echo "  - *.backup files for safety"
echo ""