#!/bin/bash

# War Room Health Check Runner
# Runs Playwright health checks against the live deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🏥 War Room Health Check Runner"
echo "================================"

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd "$PROJECT_ROOT"
    npm install
fi

# Install Playwright if not already installed
if ! npm list @playwright/test >/dev/null 2>&1; then
    echo "🎭 Installing Playwright..."
    cd "$PROJECT_ROOT"
    npm install -D @playwright/test
    npx playwright install chromium
fi

# Run directly with ts-node
echo "🚀 Running health checks..."
cd "$PROJECT_ROOT"

# Install ts-node if not present
if ! npm list ts-node >/dev/null 2>&1; then
    echo "📦 Installing ts-node..."
    npm install -D ts-node @types/node
fi

# Use tsx instead (works better with ESM)
if ! npm list tsx >/dev/null 2>&1; then
    echo "📦 Installing tsx..."
    npm install -D tsx
fi

# Run with tsx
npx tsx tests/monitoring/playwright-health-check.ts

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ All health checks passed!"
    
    # Send success notification
    if [ -f "$PROJECT_ROOT/scripts/claude-notify-unified.sh" ]; then
        "$PROJECT_ROOT/scripts/claude-notify-unified.sh" complete "Health check passed" "All endpoints operational"
    fi
else
    echo "❌ Health checks failed!"
    
    # Send failure notification
    if [ -f "$PROJECT_ROOT/scripts/claude-notify-unified.sh" ]; then
        "$PROJECT_ROOT/scripts/claude-notify-unified.sh" error "Health check failed" "Check logs for details"
    fi
    
    exit 1
fi