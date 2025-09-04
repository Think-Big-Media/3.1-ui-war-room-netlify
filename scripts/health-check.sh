#!/bin/bash

# War Room Deployment Health Check Script
# Verifies the site is running without "process is not defined" errors

set -e

SITE_URL="${1:-https://war-room-2025.onrender.com}"
TEMP_FILE="/tmp/warroom-health-check.html"

echo "🔍 War Room Health Check Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Target: $SITE_URL"
echo ""

# Function to check if site is up
check_site_up() {
    echo -n "1. Checking if site is accessible... "
    if curl -s -f -o /dev/null "$SITE_URL"; then
        echo "✅ Site is up"
        return 0
    else
        echo "❌ Site is down"
        return 1
    fi
}

# Function to check HTML structure
check_html_structure() {
    echo -n "2. Checking HTML structure... "
    HTML=$(curl -s "$SITE_URL")
    
    if echo "$HTML" | grep -q '<div id="root">'; then
        echo "✅ Root element found"
        return 0
    else
        echo "❌ Root element missing"
        return 1
    fi
}

# Function to check JavaScript files
check_js_files() {
    echo -n "3. Checking JavaScript bundle... "
    HTML=$(curl -s "$SITE_URL")
    JS_FILE=$(echo "$HTML" | grep -o '/assets/index-[^"]*\.js' | head -1)
    
    if [ -z "$JS_FILE" ]; then
        echo "❌ No JavaScript bundle found"
        return 1
    fi
    
    echo "✅ Found $JS_FILE"
    
    echo -n "4. Checking for process references... "
    JS_CONTENT=$(curl -s "$SITE_URL$JS_FILE")
    
    # Check for dangerous process references (but allow comments)
    if echo "$JS_CONTENT" | grep -q 'process\.env\.' && ! echo "$JS_CONTENT" | grep -q '// *process\.env'; then
        echo "❌ DANGER: Found process.env in bundle!"
        echo "   This will cause 'process is not defined' error"
        return 1
    else
        echo "✅ No dangerous process references"
        return 0
    fi
}

# Function to check critical assets
check_assets() {
    echo -n "5. Checking CSS files... "
    HTML=$(curl -s "$SITE_URL")
    CSS_FILE=$(echo "$HTML" | grep -o '/assets/index-[^"]*\.css' | head -1)
    
    if [ -z "$CSS_FILE" ]; then
        echo "⚠️  No CSS bundle found (may be inlined)"
    else
        if curl -s -f -o /dev/null "$SITE_URL$CSS_FILE"; then
            echo "✅ CSS loaded: $CSS_FILE"
        else
            echo "❌ CSS file not accessible"
            return 1
        fi
    fi
}

# Function to check API health
check_api() {
    echo -n "6. Checking API endpoint... "
    if curl -s -f -o /dev/null "$SITE_URL/api/health" 2>/dev/null; then
        echo "✅ API is responsive"
    else
        echo "⚠️  API health endpoint not available (may be normal)"
    fi
}

# Create test HTML page
create_test_page() {
    cat > "$TEMP_FILE" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>War Room Health Check</title>
    <style>
        body { font-family: monospace; padding: 20px; }
        .status { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .warning { background: #fff3cd; color: #856404; }
        iframe { width: 100%; height: 600px; border: 2px solid #ccc; }
    </style>
</head>
<body>
    <h1>🔍 War Room Health Check</h1>
    <div id="status" class="status">Checking site health...</div>
    
    <h2>Live Site Preview:</h2>
    <iframe id="warroom" src="SITE_URL_PLACEHOLDER"></iframe>
    
    <h2>Console Output:</h2>
    <pre id="console"></pre>
    
    <script>
        const siteUrl = 'SITE_URL_PLACEHOLDER';
        const statusDiv = document.getElementById('status');
        const consoleDiv = document.getElementById('console');
        let hasErrors = false;
        
        // Capture console errors from iframe (limited by CORS)
        window.addEventListener('message', (event) => {
            if (event.data.type === 'console-error') {
                hasErrors = true;
                consoleDiv.textContent += event.data.message + '\n';
            }
        });
        
        // Check after load
        setTimeout(() => {
            if (hasErrors) {
                statusDiv.className = 'status error';
                statusDiv.innerHTML = '❌ Site has console errors! Check the console output below.';
            } else {
                statusDiv.className = 'status success';
                statusDiv.innerHTML = '✅ Site appears healthy! No console errors detected.';
            }
            
            // Add manual check reminder
            statusDiv.innerHTML += '<br><br><strong>Manual Check:</strong> Open DevTools (F12) and check the Console tab for any errors.';
        }, 5000);
    </script>
</body>
</html>
EOF
    
    # Replace placeholder with actual URL
    sed -i.bak "s|SITE_URL_PLACEHOLDER|$SITE_URL|g" "$TEMP_FILE"
    rm -f "$TEMP_FILE.bak"
    
    echo ""
    echo "7. Test page created: $TEMP_FILE"
    echo "   Open this file in your browser for visual verification"
}

# Main execution
main() {
    local ERRORS=0
    
    check_site_up || ((ERRORS++))
    check_html_structure || ((ERRORS++))
    check_js_files || ((ERRORS++))
    check_assets || ((ERRORS++))
    check_api
    create_test_page
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ $ERRORS -eq 0 ]; then
        echo "✅ HEALTH CHECK PASSED"
        echo ""
        echo "The site appears to be healthy!"
        echo "Open $TEMP_FILE in your browser for visual verification."
        exit 0
    else
        echo "❌ HEALTH CHECK FAILED"
        echo ""
        echo "Found $ERRORS critical issues."
        echo "The site may not be working properly."
        echo ""
        echo "Troubleshooting steps:"
        echo "1. Check the browser console for 'process is not defined' errors"
        echo "2. Run 'npm run check:process' locally"
        echo "3. Verify the build was successful"
        echo "4. Check Render deployment logs"
        exit 1
    fi
}

# Run the health check
main