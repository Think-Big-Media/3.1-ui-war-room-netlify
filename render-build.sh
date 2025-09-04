#!/bin/bash
# Render.com build script for War Room Platform

echo "🚀 Starting Render build process..."
echo "📅 Build time: $(date)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# List the dist contents to verify
echo "📁 Build output:"
ls -la dist/

# Create a build info file
echo "{\"buildTime\":\"$(date)\",\"version\":\"2.0-integrations\"}" > dist/build-info.json

echo "✅ Build complete!"