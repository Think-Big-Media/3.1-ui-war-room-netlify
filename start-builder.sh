#!/bin/bash

# War Room Builder.io Startup Script
# This script handles everything needed to get Builder.io development running

echo "🚀 Starting War Room Builder.io Development Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this from the 3.0-ui-war-room directory"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Error: Node.js version $REQUIRED_VERSION or higher is required. Found: $NODE_VERSION"
    exit 1
fi

# Install dependencies if node_modules doesn't exist or is incomplete
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "📦 Installing dependencies (this may take a few minutes)..."
    rm -rf node_modules
    npm install
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

# Check if Builder.io API key is set
if grep -q "YOUR_BUILDER_IO_API_KEY" .env 2>/dev/null; then
    echo "❌ Error: Builder.io API key not configured in .env file"
    echo "Please update VITE_BUILDER_IO_KEY in .env file"
    exit 1
fi

# Check if Builder.io API key is present
BUILDER_KEY=$(grep "VITE_BUILDER_IO_KEY=" .env | cut -d'=' -f2)
if [ -z "$BUILDER_KEY" ] || [ "$BUILDER_KEY" = "YOUR_BUILDER_IO_API_KEY" ]; then
    echo "❌ Error: Builder.io API key not found in .env file"
    exit 1
else
    echo "✅ Builder.io API key configured"
fi

echo ""
echo "🎯 Builder.io Setup Complete!"
echo "   • API Key: ${BUILDER_KEY:0:8}..."
echo "   • Local Dev: http://localhost:5173"
echo "   • Production: https://war-room-3-ui.onrender.com"
echo ""
echo "📝 Next Steps:"
echo "   1. Builder.io Dashboard: https://builder.io/content"
echo "   2. Create test page at /builder/test"
echo "   3. Preview URL is set to: https://war-room-3-ui.onrender.com"
echo ""
echo "🏃 Starting development server..."

# Try different methods to start vite
if [ -f "node_modules/.bin/vite" ]; then
    echo "🔧 Using local vite binary..."
    ./node_modules/.bin/vite --host 0.0.0.0
elif command -v npx &> /dev/null; then
    echo "🔧 Using npx to run vite..."
    npx vite@latest --host 0.0.0.0
else
    echo "❌ Could not find vite. Please install it manually:"
    echo "   npm install -g vite"
    echo "   or"
    echo "   npm install && npm run dev"
    exit 1
fi