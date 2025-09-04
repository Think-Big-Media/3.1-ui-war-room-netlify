#!/bin/bash

# War Room Frontend Verification Script
# Ensures the correct frontend is configured and running

echo "🔍 War Room Frontend Verification"
echo "=================================="
echo ""

# Check which app is imported in index.tsx
echo "📋 Checking index.tsx configuration..."
CURRENT_APP=$(grep "^import App from" src/index.tsx | sed "s/.*from '\(.*\)'.*/\1/")

if [ "$CURRENT_APP" = "./AppBrandBOS" ]; then
    echo "✅ CORRECT: Using AppBrandBOS (Production Frontend)"
    echo "   - Purple/blue gradient theme"
    echo "   - CommandCenter dashboard"
    echo "   - Top navigation with WR logo"
elif [ "$CURRENT_APP" = "./App" ]; then
    echo "❌ WRONG: Using App.tsx (Legacy Frontend)"
    echo "   This is NOT the production frontend!"
    echo "   To fix: Change import in src/index.tsx to:"
    echo "   import App from './AppBrandBOS';"
elif [ "$CURRENT_APP" = "./AppNoAuth" ]; then
    echo "⚠️  WARNING: Using AppNoAuth (Testing Only)"
    echo "   This should only be used for local testing!"
    echo "   To fix: Change import in src/index.tsx to:"
    echo "   import App from './AppBrandBOS';"
else
    echo "❓ UNKNOWN: Could not determine which app is in use"
    echo "   Current import: $CURRENT_APP"
fi

echo ""
echo "📂 Frontend File Structure:"
echo "   Entry Point: src/index.tsx"
echo "   Production App: src/AppBrandBOS.tsx"
echo "   Main Dashboard: src/pages/CommandCenter.tsx"
echo "   Layout: src/components/shared/PageLayout.tsx"
echo ""

# Check if dev server is running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "🚀 Dev server is running on http://localhost:5173"
    echo ""
    echo "👀 Visual Verification Checklist:"
    echo "   □ Purple/blue gradient background?"
    echo "   □ 'War Room' text with WR logo in top nav?"
    echo "   □ Glassmorphic cards with blur effects?"
    echo "   □ Orange hover states on navigation?"
    echo "   □ CommandCenter with 4 KPI tiles?"
else
    echo "⚠️  Dev server is not running"
    echo "   Start it with: npm run dev"
fi

echo ""
echo "🔧 Browser Settings:"
echo "   Recommended Zoom: 95%"
echo "   Root Font Size: 16.5px"
echo ""

# Check for console debug messages
echo "🐛 Debug Messages to Look For:"
echo "   - '🔴🔴🔴 AppBrandBOS IS LOADING!'"
echo "   - '🟢🟢🟢 COMMANDCENTER IS RENDERING!'"
echo ""

echo "📚 Documentation:"
echo "   - APP_ARCHITECTURE.md - Full frontend architecture guide"
echo "   - CLAUDE.md - Development instructions"
echo "   - LOCAL_DEVELOPMENT_GUIDE.md - Local dev setup"
echo ""
echo "=================================="
echo "✨ Verification Complete"