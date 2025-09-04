#!/bin/bash
# Safe merge script for War Room deployment fix

echo "🚀 War Room - Merge to Main for Vercel Deployment"
echo "================================================"
echo ""
echo "This will merge all fixes from feature/automation-engine to main"
echo "Current branch: $(git branch --show-current)"
echo ""

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ ERROR: You have uncommitted changes!"
    echo "Please commit or stash them first."
    exit 1
fi

echo "✅ Working directory is clean"
echo ""
echo "📋 Summary of changes to be merged:"
git log --oneline origin/main..HEAD | head -10
echo ""
echo "Total commits: $(git rev-list --count origin/main..HEAD)"
echo ""

read -p "Do you want to proceed with the merge? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Fetching latest changes..."
    git fetch origin
    
    echo "🔀 Switching to main branch..."
    git checkout main
    
    echo "📥 Pulling latest main..."
    git pull origin main
    
    echo "🔗 Merging feature/automation-engine..."
    git merge feature/automation-engine -m "Merge feature/automation-engine with all Vercel fixes

This merge includes:
- Root package.json for Vercel build
- Fixed import paths
- Brand BOS dashboard
- Node.js 22.x configuration
- All build fixes for Vercel deployment"
    
    if [ $? -eq 0 ]; then
        echo "✅ Merge successful!"
        echo ""
        echo "📤 Push to deploy? (y/n) "
        read -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            echo "✅ Pushed to main! Vercel will now deploy your Brand BOS dashboard!"
            echo "🌐 Check: https://1-0-war-room.vercel.app/ in 2-3 minutes"
        else
            echo "ℹ️  Merge complete but not pushed. Run 'git push origin main' when ready."
        fi
    else
        echo "❌ Merge failed! Please resolve conflicts manually."
    fi
else
    echo "ℹ️  Merge cancelled. No changes made."
fi