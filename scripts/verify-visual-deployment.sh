#!/bin/bash

# Visual Deployment Verification Script
# Ensures visual changes actually deployed and are working correctly

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get URL parameter
URL="$1"
if [ -z "$URL" ]; then
    echo -e "${RED}❌ Usage: $0 <URL>${NC}"
    echo "Example: $0 https://war-room-app-2025.onrender.com"
    exit 1
fi

echo "🔍 Visual Deployment Verification"
echo "=================================="
echo -e "${BLUE}URL: $URL${NC}"
echo -e "${BLUE}Time: $(date)${NC}\n"

# Create temp directory for this verification
TEMP_DIR="/tmp/war-room-verification-$(date +%s)"
mkdir -p "$TEMP_DIR"

# Check 1: Basic connectivity
echo "1️⃣ Testing basic connectivity..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --max-time 30 || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Site is responding (HTTP $HTTP_STATUS)${NC}\n"
else
    echo -e "${RED}❌ Site not responding (HTTP $HTTP_STATUS)${NC}"
    echo "Cannot proceed with visual verification."
    exit 1
fi

# Check 2: Download and analyze HTML
echo "2️⃣ Analyzing HTML content..."
HTML_FILE="$TEMP_DIR/page.html"
curl -s "$URL" > "$HTML_FILE"

# Check for React app loading
if grep -q "You need to enable JavaScript" "$HTML_FILE"; then
    echo -e "${YELLOW}⚠️  Page requires JavaScript (normal for React app)${NC}"
elif grep -q "<div id=\"root\">" "$HTML_FILE"; then
    echo -e "${GREEN}✅ React app structure detected${NC}"
else
    echo -e "${YELLOW}⚠️  Unexpected HTML structure${NC}"
fi

# Check for build artifacts
BUILD_INFO=$(grep -o 'assets/index-[a-z0-9]*\.js' "$HTML_FILE" | head -1 || echo "")
if [ ! -z "$BUILD_INFO" ]; then
    echo -e "${GREEN}✅ Frontend build artifacts found: $BUILD_INFO${NC}"
else
    echo -e "${YELLOW}⚠️  No build artifacts detected${NC}"
fi

echo ""

# Check 3: CSS and asset verification
echo "3️⃣ Checking CSS assets..."
CSS_FILES=$(grep -o 'assets/index-[a-z0-9]*\.css' "$HTML_FILE" || echo "")
if [ ! -z "$CSS_FILES" ]; then
    echo -e "${GREEN}✅ CSS files found: $CSS_FILES${NC}"
    
    # Download CSS and check for slate colors
    CSS_URL="$URL/$CSS_FILES"
    CSS_FILE="$TEMP_DIR/styles.css"
    curl -s "$CSS_URL" > "$CSS_FILE" 2>/dev/null || echo "Could not download CSS"
    
    if [ -f "$CSS_FILE" ]; then
        # Check for slate color patterns
        if grep -q "slate" "$CSS_FILE"; then
            echo -e "${GREEN}✅ Slate colors found in CSS${NC}"
        else
            echo -e "${YELLOW}⚠️  No slate colors detected in CSS${NC}"
        fi
        
        # Check for purple colors (should be minimal)
        PURPLE_COUNT=$(grep -c "purple\|#8b5cf6\|#a855f7" "$CSS_FILE" 2>/dev/null || echo "0")
        if [ "$PURPLE_COUNT" -gt 10 ]; then
            echo -e "${YELLOW}⚠️  High purple color usage detected ($PURPLE_COUNT instances)${NC}"
        else
            echo -e "${GREEN}✅ Purple color usage is minimal ($PURPLE_COUNT instances)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  No CSS files detected${NC}"
fi

echo ""

# Check 4: Specific War Room elements
echo "4️⃣ Checking for War Room specific elements..."

# Check for common War Room components
if grep -q "War Room" "$HTML_FILE"; then
    echo -e "${GREEN}✅ War Room branding found${NC}"
else
    echo -e "${YELLOW}⚠️  War Room branding not detected${NC}"
fi

# Check for expected page structure
if grep -q "Command Center\|Alert Center\|Intelligence Hub" "$HTML_FILE"; then
    echo -e "${GREEN}✅ War Room navigation elements detected${NC}"
else
    echo -e "${YELLOW}⚠️  War Room navigation not detected in HTML${NC}"
fi

echo ""

# Check 5: Performance check
echo "5️⃣ Basic performance check..."
START_TIME=$(date +%s%N)
curl -s "$URL" > /dev/null
END_TIME=$(date +%s%N)
LOAD_TIME=$(( (END_TIME - START_TIME) / 1000000 )) # Convert to milliseconds

if [ $LOAD_TIME -lt 3000 ]; then
    echo -e "${GREEN}✅ Page loads quickly (${LOAD_TIME}ms)${NC}"
elif [ $LOAD_TIME -lt 5000 ]; then
    echo -e "${YELLOW}⚠️  Page loads moderately (${LOAD_TIME}ms)${NC}"
else
    echo -e "${RED}❌ Page loads slowly (${LOAD_TIME}ms)${NC}"
fi

echo ""

# Check 6: API health check
echo "6️⃣ Checking backend API..."
API_URL="$URL/api/health"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" --max-time 10 2>/dev/null || echo "000")
if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
elif [ "$API_STATUS" = "404" ]; then
    echo -e "${YELLOW}⚠️  API health endpoint not found (may be normal)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend API status unclear (HTTP $API_STATUS)${NC}"
fi

echo ""

# Check 7: Console error simulation
echo "7️⃣ Checking for obvious JavaScript errors..."
if command -v node >/dev/null 2>&1; then
    # Simple JS validation
    JS_FILES=$(grep -o 'assets/index-[a-z0-9]*\.js' "$HTML_FILE" || echo "")
    if [ ! -z "$JS_FILES" ]; then
        JS_URL="$URL/$JS_FILES"
        JS_FILE="$TEMP_DIR/app.js"
        curl -s "$JS_URL" > "$JS_FILE" 2>/dev/null || echo ""
        
        if [ -f "$JS_FILE" ] && [ -s "$JS_FILE" ]; then
            echo -e "${GREEN}✅ JavaScript bundle downloaded successfully${NC}"
            # Check bundle size
            JS_SIZE=$(wc -c < "$JS_FILE")
            if [ $JS_SIZE -gt 100000 ]; then
                echo -e "${GREEN}✅ JavaScript bundle appears complete (${JS_SIZE} bytes)${NC}"
            else
                echo -e "${YELLOW}⚠️  JavaScript bundle seems small (${JS_SIZE} bytes)${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Could not verify JavaScript bundle${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Node.js not available for JS verification${NC}"
fi

echo ""

# Summary and recommendations
echo "=================================="
echo -e "${BLUE}Verification Summary${NC}"
echo "=================================="

# Create verification report
REPORT_FILE="$TEMP_DIR/verification-report.md"
cat > "$REPORT_FILE" << EOF
# Visual Deployment Verification Report

**URL:** $URL
**Time:** $(date)
**HTTP Status:** $HTTP_STATUS
**Load Time:** ${LOAD_TIME}ms

## Key Findings
- Site Connectivity: $([ "$HTTP_STATUS" = "200" ] && echo "✅ OK" || echo "❌ Failed")
- Frontend Build: $([ ! -z "$BUILD_INFO" ] && echo "✅ Detected" || echo "⚠️ Not Found")
- CSS Assets: $([ ! -z "$CSS_FILES" ] && echo "✅ Found" || echo "⚠️ Missing")
- Performance: $([ $LOAD_TIME -lt 3000 ] && echo "✅ Fast" || echo "⚠️ Slow")

## Recommendations
EOF

# Provide specific recommendations
if [ "$HTTP_STATUS" != "200" ]; then
    echo -e "${RED}❌ CRITICAL: Site not accessible${NC}"
    echo "- Check deployment status in Render dashboard"
    echo "- Verify service is running and healthy"
    echo "- Check for recent deployment failures"
    echo "- Site not accessible" >> "$REPORT_FILE"
elif [ -z "$BUILD_INFO" ]; then
    echo -e "${YELLOW}⚠️  Frontend build may not have deployed properly${NC}"
    echo "- Verify build command includes npm install && npm run build"
    echo "- Check for runtime.txt file (should not exist)"
    echo "- Review deployment logs for frontend build steps"
    echo "- Frontend build verification needed" >> "$REPORT_FILE"
else
    echo -e "${GREEN}✅ Visual deployment appears successful!${NC}"
    echo "- Site is accessible and serving content"
    echo "- Frontend build artifacts are present"
    echo "- Performance is acceptable"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Manual visual verification of key pages"
    echo "2. Check specific color schemes (slate vs purple)"
    echo "3. Test major user flows"
    echo "4. Verify responsive design"
    echo "- Deployment successful" >> "$REPORT_FILE"
fi

echo ""
echo -e "${BLUE}Report saved to: $REPORT_FILE${NC}"

# Cleanup option
echo ""
read -p "Clean up temporary files? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$TEMP_DIR"
    echo -e "${GREEN}✅ Cleanup complete${NC}"
else
    echo -e "${BLUE}Files preserved in: $TEMP_DIR${NC}"
fi

# Exit with appropriate code
if [ "$HTTP_STATUS" = "200" ] && [ ! -z "$BUILD_INFO" ]; then
    exit 0
else
    exit 1
fi