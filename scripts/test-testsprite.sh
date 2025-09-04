#!/bin/bash

# TestSprite Verification Script

echo "🧪 TestSprite Configuration Check"
echo "================================"

# Check if workflow exists
if [ -f ".github/workflows/testsprite.yml" ]; then
    echo "✅ TestSprite workflow found"
else
    echo "❌ TestSprite workflow missing"
fi

# Check if config exists
if [ -f ".testsprite.yml" ]; then
    echo "✅ TestSprite config found"
    echo ""
    echo "Configuration includes:"
    grep -E "enabled:|url:|check_interval:" .testsprite.yml | head -10
else
    echo "❌ TestSprite config missing"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Add TESTSPRITE_API_KEY to GitHub Secrets"
echo "2. Add TESTSPRITE_PROJECT_ID to GitHub Secrets"
echo "3. Push any change to trigger TestSprite"
echo ""
echo "TestSprite will then:"
echo "- Monitor https://war-room-oa9t.onrender.com every 5 minutes"
echo "- Run visual regression tests on PRs"
echo "- Perform OWASP security scans"
echo "- Alert you via email for any issues"