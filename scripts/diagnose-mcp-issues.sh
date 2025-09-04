#!/bin/bash

echo "=== MCP Server Diagnostics ==="
echo "Date: $(date)"
echo ""

# Check MCP configuration
echo "1. Checking MCP configuration file..."
if [ -f ~/.cursor/mcp.json ]; then
    echo "✓ MCP config file exists"
    echo "Configured servers:"
    jq -r '.mcpServers | keys[]' ~/.cursor/mcp.json 2>/dev/null | sed 's/^/  - /'
else
    echo "✗ MCP config file not found at ~/.cursor/mcp.json"
fi
echo ""

# Check running processes
echo "2. Checking running MCP processes..."
MCP_PROCESSES=$(ps aux | grep -E "mcp|npx.*mcp" | grep -v grep | wc -l)
echo "Found $MCP_PROCESSES MCP-related processes"
ps aux | grep -E "mcp|npx.*mcp" | grep -v grep | head -5
echo ""

# Check Docker containers
echo "3. Checking Docker MCP containers..."
docker ps --filter ancestor=ghcr.io/github/github-mcp-server --format "table {{.ID}}\t{{.Image}}\t{{.Status}}" 2>/dev/null || echo "No GitHub MCP Docker containers running"
echo ""

# Check environment variables
echo "4. Checking environment variables..."
if [ -z "$GITHUB_TOKEN" ]; then
    echo "✗ GITHUB_TOKEN not set"
elif [ "$GITHUB_TOKEN" == "your-token-here" ]; then
    echo "✗ GITHUB_TOKEN has placeholder value"
else
    echo "✓ GITHUB_TOKEN is set (hidden for security)"
fi
echo ""

# Check recent MCP logs
echo "5. Recent MCP errors (last 20 lines)..."
LATEST_LOG=$(find ~/Library/Application\ Support/Cursor/logs -name "MCP Logs.log" -type f -mtime -1 | sort -r | head -1)
if [ -n "$LATEST_LOG" ]; then
    echo "From: $LATEST_LOG"
    tail -20 "$LATEST_LOG" | grep -i "error" || echo "No recent errors found"
else
    echo "No recent MCP log files found"
fi
echo ""

echo "=== Diagnostic Summary ==="
echo "If MCP servers aren't working:"
echo "1. Ensure GITHUB_TOKEN is properly set"
echo "2. Restart Cursor completely (Cmd+Q, then reopen)"
echo "3. Open a new Agent chat to test"
echo "4. Check Tools & Integrations in the chat interface" 