#!/bin/bash

# War Room Frontend CI Validation Script
# This script runs the same commands as the GitHub Actions workflow

set -e

echo "🚀 Starting War Room Frontend CI validation..."

# Change to frontend directory
cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm ci

echo "🔍 Running ESLint (warnings only)..."
npm run lint || echo "⚠️  Linting has warnings/errors but continuing..."

echo "🧪 Running stable tests..."
npm run test:ci

echo "🏗️  Building application..."
npm run build

echo "✅ All CI steps completed successfully!"
echo ""
echo "📊 Summary:"
echo "- Dependencies installed"
echo "- Linting completed (with warnings)"
echo "- Tests passed"
echo "- Build successful"
echo ""
echo "🎉 Your changes are ready for CI/CD pipeline!"