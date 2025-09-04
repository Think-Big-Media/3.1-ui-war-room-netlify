#!/bin/bash

echo "=== Fixing MCP Servers for Cursor ==="
echo ""

# Step 1: Kill all existing MCP processes
echo "Step 1: Stopping all MCP processes..."
pkill -f "mcp|npx.*mcp|node.*mcp" || true
docker stop $(docker ps -q --filter ancestor=ghcr.io/github/github-mcp-server) 2>/dev/null || true
killall Cursor 2>/dev/null || true
sleep 2

# Step 2: Check critical tokens
echo ""
echo "Step 2: Checking API tokens..."

# Check GitHub token
if [ -z "$GITHUB_TOKEN" ] || [ "$GITHUB_TOKEN" == "your-token-here" ]; then
    echo "❌ GITHUB_TOKEN needs to be set!"
    echo ""
    echo "To create a GitHub token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Name: 'Cursor MCP Access'"
    echo "4. Select scope: 'repo' (full control)"
    echo "5. Generate and copy the token"
    echo ""
    echo "Then run:"
    echo "  export GITHUB_TOKEN='ghp_YOUR_ACTUAL_TOKEN_HERE'"
    echo "  echo \"export GITHUB_TOKEN='ghp_YOUR_ACTUAL_TOKEN_HERE'\" >> ~/.zshrc"
    echo ""
else
    echo "✅ GITHUB_TOKEN is set"
fi

# Step 3: Verify MCP configuration
echo ""
echo "Step 3: Verifying MCP configuration..."
if [ -f ~/.cursor/mcp.json ]; then
    echo "✅ MCP config file exists"
    echo ""
    echo "Configured servers:"
    jq -r '.mcpServers | keys[]' ~/.cursor/mcp.json 2>/dev/null | while read server; do
        echo "  ✓ $server"
    done
    
    # Verify critical servers
    echo ""
    echo "Critical server status:"
    if jq -e '.mcpServers.github' ~/.cursor/mcp.json > /dev/null 2>&1; then
        echo "  ✅ GitHub MCP configured"
    else
        echo "  ❌ GitHub MCP missing"
    fi
    
    if jq -e '.mcpServers.coderabbit' ~/.cursor/mcp.json > /dev/null 2>&1; then
        echo "  ✅ CodeRabbit configured"
        CODERABBIT_KEY=$(jq -r '.mcpServers.coderabbit.env.CODERABBIT_API_KEY' ~/.cursor/mcp.json 2>/dev/null)
        if [ "$CODERABBIT_KEY" == "cr-eba862ea7018f81f8ca537ccc729756c856e4fd10e4d0df8dd81083e3a" ]; then
            echo "     ✓ API key matches"
        fi
    else
        echo "  ❌ CodeRabbit missing"
    fi
    
    if jq -e '.mcpServers."sourcegraph-mcp"' ~/.cursor/mcp.json > /dev/null 2>&1; then
        echo "  ✅ Sourcegraph configured"
    else
        echo "  ❌ Sourcegraph missing"
    fi
else
    echo "❌ MCP config file not found!"
fi

# Step 4: Clear Cursor cache (optional but can help)
echo ""
echo "Step 4: Clearing Cursor MCP cache..."
rm -rf ~/Library/Application\ Support/Cursor/Cache/Cache_Data/*mcp* 2>/dev/null || true
rm -rf ~/Library/Application\ Support/Cursor/CachedData/*mcp* 2>/dev/null || true

# Step 5: Final instructions
echo ""
echo "=== NEXT STEPS ==="
echo ""
echo "1. Make sure GITHUB_TOKEN is properly set (see above if needed)"
echo ""
echo "2. Restart Cursor completely:"
echo "   - Press Cmd+Q to quit Cursor"
echo "   - Wait 5 seconds"
echo "   - Open Cursor again"
echo ""
echo "3. Test MCP servers:"
echo "   - Open a new Agent chat"
echo "   - Type: @"
echo "   - You should see available MCP tools"
echo "   - Or check Tools & Integrations in the chat"
echo ""
echo "4. If still not working:"
echo "   - Run: ./scripts/diagnose-mcp-issues.sh"
echo "   - Check the latest log file shown"
echo ""
echo "Critical servers that MUST work:"
echo "  • GitHub (for repository access)"
echo "  • CodeRabbit (for code reviews)"
echo "  • Sourcegraph (for code search)"
echo ""

# Create a test script
cat > scripts/test-mcp-connection.sh << 'EOF'
#!/bin/bash
echo "Testing MCP server connections..."
echo ""

# Test if processes are running after Cursor restart
sleep 5
echo "MCP processes running:"
ps aux | grep -E "mcp|npx.*mcp" | grep -v grep | wc -l

echo ""
echo "Docker containers:"
docker ps --filter ancestor=ghcr.io/github/github-mcp-server --format "table {{.Image}}\t{{.Status}}"

echo ""
echo "Recent MCP log entries:"
LATEST_LOG=$(find ~/Library/Application\ Support/Cursor/logs -name "MCP Logs.log" -type f -mtime -1 | sort -r | head -1)
if [ -n "$LATEST_LOG" ]; then
    tail -10 "$LATEST_LOG" | grep -E "github|coderabbit|sourcegraph"
fi
EOF

chmod +x scripts/test-mcp-connection.sh

echo "Created test script: ./scripts/test-mcp-connection.sh"
echo "Run this after restarting Cursor to verify connections." 