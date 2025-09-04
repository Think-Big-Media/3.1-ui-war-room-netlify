#!/bin/bash

echo "Restarting MCP Servers for Cursor..."

# Step 1: Kill all existing MCP processes
echo "Stopping existing MCP processes..."
pkill -f "mcp|npx.*mcp" || true
docker stop $(docker ps -q --filter ancestor=ghcr.io/github/github-mcp-server) 2>/dev/null || true

# Step 2: Wait for processes to fully stop
sleep 2

# Step 3: Check if GitHub token is set
if [ -z "$GITHUB_TOKEN" ] || [ "$GITHUB_TOKEN" == "your-token-here" ]; then
    echo "ERROR: GITHUB_TOKEN is not properly set!"
    echo "Please export a valid GitHub Personal Access Token:"
    echo "  export GITHUB_TOKEN='your-actual-github-token'"
    echo ""
    echo "To create a token:"
    echo "1. Go to https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Give it a name and select 'repo' scope"
    echo "4. Copy the token and run: export GITHUB_TOKEN='your-token-here'"
    exit 1
fi

# Step 4: Restart Cursor
echo "Please restart Cursor manually to reload MCP configuration"
echo ""
echo "After restarting Cursor:"
echo "1. Open a new chat in Agent mode"
echo "2. Check if MCP servers are available in the Tools & Integrations"
echo "3. If still not working, check logs at:"
echo "   ~/Library/Application Support/Cursor/logs/*/exthost/anysphere.cursor-retrieval/MCP Logs.log"

echo ""
echo "MCP configuration has been updated at ~/.cursor/mcp.json"
echo "GitHub MCP server has been added to the configuration." 