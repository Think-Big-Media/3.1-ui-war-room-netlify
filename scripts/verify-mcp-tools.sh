#!/bin/bash
# Verify MCP Tools Status

echo "🔍 MCP Tools Verification"
echo "========================"

# Check CodeRabbit
echo -n "CodeRabbit: "
if grep -q "coderabbit.enabled.*true" "/Users/rodericandrews/Library/Application Support/Cursor/User/settings.json"; then
    echo "✅ Configured"
else
    echo "❌ Not configured"
fi

# Check Pieces
echo -n "Pieces App: "
if pgrep -f "Pieces" > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

echo -n "Pieces API: "
if curl -s "http://localhost:39300/" &> /dev/null; then
    echo "✅ Accessible"
elif curl -s "http://localhost:1000/health" &> /dev/null; then
    echo "✅ Accessible (port 1000)"
else
    echo "❌ Not accessible"
fi

# Check AMP
echo -n "AMP: "
if grep -q "amp.tab.enabled.*true" "/Users/rodericandrews/Library/Application Support/Cursor/User/settings.json"; then
    echo "✅ Configured"
else
    echo "❌ Not configured"
fi

echo ""
echo "To fix issues, run: ./scripts/fix-mcp-connections.sh"
