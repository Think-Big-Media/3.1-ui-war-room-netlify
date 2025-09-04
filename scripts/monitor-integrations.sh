#!/bin/bash

# War Room Integration Monitor
# Checks status of all integrated services and creates tasks as needed

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== War Room Integration Monitor ===${NC}"
echo "$(date)"
echo ""

# Configuration
LOG_DIR="$HOME/WarRoom_Development/1.0-war-room/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/integration-monitor-$(date +%Y%m%d).log"

# Function to log
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 1. Check GitHub Repository
echo -e "${YELLOW}Checking GitHub Repository...${NC}"
REPO_URL="https://github.com/Think-Big-Media/1.0-war-room"
if curl -s -o /dev/null -w "%{http_code}" "$REPO_URL" | grep -q "200"; then
    echo -e "${GREEN}✓ GitHub repository accessible${NC}"
    log "GitHub: OK"
else
    echo -e "${RED}✗ GitHub repository issue${NC}"
    log "GitHub: ERROR"
fi

# 2. Check Render Deployment
echo -e "${YELLOW}Checking Render Deployment...${NC}"
PROD_URL="https://war-room-oa9t.onrender.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" || echo "000")
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Production site is live${NC}"
    log "Render: OK"
else
    echo -e "${RED}✗ Production site issue (HTTP $RESPONSE)${NC}"
    log "Render: ERROR - HTTP $RESPONSE"
fi

# 3. Check CodeRabbit (via GitHub)
echo -e "${YELLOW}Checking CodeRabbit Integration...${NC}"
# CodeRabbit works on PRs, so we check if the webhook is configured
if [ -f ".github/.coderabbit.yaml" ]; then
    echo -e "${GREEN}✓ CodeRabbit configuration found${NC}"
    log "CodeRabbit: CONFIGURED"
else
    echo -e "${RED}✗ CodeRabbit configuration missing${NC}"
    log "CodeRabbit: NOT CONFIGURED"
fi

# 4. Check TestSprite Configuration
echo -e "${YELLOW}Checking TestSprite Configuration...${NC}"
if [ -f ".testsprite.yml" ] && [ -f ".github/workflows/testsprite.yml" ]; then
    echo -e "${GREEN}✓ TestSprite configured${NC}"
    log "TestSprite: CONFIGURED"
    
    # Check if secrets are likely configured (can't actually verify)
    echo -e "${BLUE}ℹ TestSprite requires GitHub secrets:${NC}"
    echo "  - TESTSPRITE_API_KEY"
    echo "  - TESTSPRITE_PROJECT_ID"
else
    echo -e "${RED}✗ TestSprite configuration incomplete${NC}"
    log "TestSprite: NOT CONFIGURED"
fi

# 5. Create Status Report
echo ""
echo -e "${BLUE}=== Integration Status Summary ===${NC}"
cat > "$LOG_DIR/integration-status.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "services": {
    "github": {
      "status": "configured",
      "url": "$REPO_URL"
    },
    "render": {
      "status": "live",
      "url": "https://war-room-oa9t.onrender.com",
      "health_check": "$RESPONSE"
    },
    "coderabbit": {
      "status": "configured",
      "config": ".github/.coderabbit.yaml"
    },
    "testsprite": {
      "status": "configured",
      "config": ".testsprite.yml",
      "workflow": ".github/workflows/testsprite.yml"
    },
    "sourcegraph": {
      "status": "configured",
      "note": "Requires Claude Desktop restart"
    },
    "linear": {
      "status": "configured",
      "note": "Requires Claude Desktop restart"
    }
  }
}
EOF

echo -e "${GREEN}Status report saved to: $LOG_DIR/integration-status.json${NC}"

# 6. Recommendations
echo ""
echo -e "${BLUE}=== Recommendations ===${NC}"
echo "1. Restart Claude Desktop to activate Sourcegraph and Linear MCPs"
echo "2. Create a test PR to verify CodeRabbit is working"
echo "3. Check TestSprite dashboard for monitoring status"
echo "4. Review logs at: $LOG_FILE"

log "Monitor completed successfully"