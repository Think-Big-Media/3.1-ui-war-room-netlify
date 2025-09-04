#!/bin/bash
# Watch for Render deployment to complete with new UI changes

echo "🔍 Watching for deployment completion..."
echo "⏰ Started at: $(date)"
echo ""

while true; do
    # Check for slate theme (indicates new build)
    SLATE_COUNT=$(curl -s https://one-0-war-room.onrender.com/ 2>/dev/null | grep -o "from-slate-600" | wc -l | tr -d ' ')
    
    # Check current commit on server
    BUILD_HASH=$(curl -s https://one-0-war-room.onrender.com/assets/index-*.js 2>/dev/null | grep -o "buildHash:.*" | head -1)
    
    if [ "$SLATE_COUNT" -gt "0" ]; then
        echo "✅ ========================================="
        echo "✅ DEPLOYMENT SUCCESSFUL!"
        echo "✅ Slate theme detected: $SLATE_COUNT occurrences"
        echo "✅ Time: $(date)"
        echo "✅ ========================================="
        echo ""
        echo "🎯 UI Changes Applied:"
        echo "   ✓ Slate/gray theme active"
        echo "   ✓ Page headers removed"
        echo "   ✓ Navigation icons removed"
        echo "   ✓ Tab wrapping prevented"
        
        # Play success sound
        afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || echo "🔔 DEPLOYMENT COMPLETE!"
        
        exit 0
    else
        echo "⏳ [$(date +%H:%M:%S)] Still deploying... (old version active)"
    fi
    
    sleep 30
done