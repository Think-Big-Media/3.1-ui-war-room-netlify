#!/bin/bash

# Linear MCP Setup Script
# This script helps you get your Linear API key and complete the setup

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Linear MCP Setup for War Room ===${NC}"
echo ""

# Step 1: Open Linear API page
echo -e "${YELLOW}Step 1: Getting your Linear API Key${NC}"
echo "Opening Linear API settings..."
open "https://linear.app/settings/api"

echo ""
echo -e "${GREEN}Instructions:${NC}"
echo "1. Click 'Create new API key'"
echo "2. Name it: 'War Room MCP Integration'"
echo "3. Copy the API key (starts with lin_api_)"
echo ""

# Step 2: Get API key from user
read -p "Paste your Linear API key here: " LINEAR_API_KEY

if [[ ! "$LINEAR_API_KEY" =~ ^lin_api_ ]]; then
    echo -e "${RED}Error: Invalid API key format. Should start with 'lin_api_'${NC}"
    exit 1
fi

# Step 3: Update Claude config
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

echo -e "${YELLOW}Step 2: Updating Claude configuration...${NC}"

# Create backup
cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
echo "Created backup at: $CONFIG_FILE.backup"

# Update the config with the actual API key
sed -i '' "s/YOUR_LINEAR_API_KEY_HERE/$LINEAR_API_KEY/" "$CONFIG_FILE"

echo -e "${GREEN}✓ Configuration updated!${NC}"

# Step 4: Test the connection
echo ""
echo -e "${YELLOW}Step 3: Testing Linear connection...${NC}"
echo -e "${BLUE}Please restart Claude Desktop, then try typing:${NC}"
echo "  linear list"
echo ""

# Step 5: Create initial Linear setup
echo -e "${YELLOW}Step 4: Creating War Room project in Linear...${NC}"
echo "Opening Linear to create project..."
open "https://linear.app/new/project"

echo ""
echo -e "${GREEN}Manual steps in Linear:${NC}"
echo "1. Create new project called 'War Room'"
echo "2. Set up these labels:"
echo "   - bug (red)"
echo "   - feature (blue)"
echo "   - security (orange)"
echo "   - performance (yellow)"
echo "   - deployment (purple)"
echo ""

# Step 6: GitHub integration
echo -e "${YELLOW}Step 5: Connect GitHub integration...${NC}"
open "https://linear.app/settings/integrations/github"

echo ""
echo -e "${GREEN}GitHub Integration steps:${NC}"
echo "1. Click 'Connect GitHub'"
echo "2. Select 'Think-Big-Media' organization"
echo "3. Choose '1.0-war-room' repository"
echo "4. Enable all sync options"
echo ""

# Summary
echo -e "${BLUE}=== Setup Complete! ===${NC}"
echo ""
echo -e "${GREEN}✓ Linear MCP configured${NC}"
echo -e "${GREEN}✓ API key saved${NC}"
echo -e "${GREEN}✓ Ready for automatic task sync${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Restart Claude Desktop"
echo "2. Test with: linear list"
echo "3. Create tasks automatically as you code!"
echo ""
echo -e "${BLUE}Your tasks will now sync automatically between Linear and your code!${NC}"