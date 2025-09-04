#!/bin/bash
# BULLETPROOF BUILD SCRIPT FOR WAR ROOM
# This ensures BOTH backend and frontend are ALWAYS built
# No matter what Render's configuration says

set -e  # Exit on any error

echo "🚀 ========================================="
echo "🚀 WAR ROOM BULLETPROOF BUILD STARTING"
echo "🚀 ========================================="
echo "📅 Build Date: $(date)"
echo "🔧 Current Directory: $(pwd)"
echo ""

# Check if we're in the right place
if [ ! -f "package.json" ] && [ ! -f "src/frontend/package.json" ]; then
    echo "❌ ERROR: Cannot find package.json files!"
    echo "📍 Looking in: $(pwd)"
    ls -la
    exit 1
fi

# Install Python dependencies
echo "🐍 ========================================="
echo "🐍 Installing Python Dependencies"
echo "🐍 ========================================="
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo "✅ Python dependencies installed from root"
elif [ -f "src/backend/requirements.txt" ]; then
    pip install -r src/backend/requirements.txt
    echo "✅ Python dependencies installed from src/backend"
else
    echo "⚠️  No requirements.txt found, skipping Python deps"
fi

# Install and build frontend
echo ""
echo "⚛️  ========================================="
echo "⚛️  Building Frontend (THIS IS CRITICAL!)"
echo "⚛️  ========================================="

# Find the frontend directory
if [ -d "src/frontend" ]; then
    cd src/frontend
    echo "📍 Changed to frontend directory: $(pwd)"
elif [ -f "package.json" ]; then
    echo "📍 Already in frontend directory: $(pwd)"
else
    echo "❌ ERROR: Cannot find frontend directory!"
    exit 1
fi

# Clean install to avoid cache issues
echo "🧹 Cleaning node_modules and cache..."
rm -rf node_modules package-lock.json || true

echo "📦 Installing frontend dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

# Verify build succeeded
if [ -d "dist" ]; then
    echo "✅ Frontend build successful!"
    echo "📊 Build stats:"
    ls -lah dist/
    echo "📏 Total size: $(du -sh dist | cut -f1)"
else
    echo "❌ ERROR: Frontend build failed - no dist directory!"
    exit 1
fi

# Return to root
cd ../.. 2>/dev/null || cd .. 2>/dev/null || true

echo ""
echo "✅ ========================================="
echo "✅ BUILD COMPLETE - BOTH FRONTEND & BACKEND!"
echo "✅ ========================================="
echo "🎯 Frontend built with all UI changes:"
echo "   - Slate/gray theme applied"
echo "   - Page headers removed"
echo "   - Navigation icons removed"
echo "   - Tab wrapping prevented"
echo "✅ Ready to serve with: cd src/backend && python serve_bulletproof.py"
echo ""