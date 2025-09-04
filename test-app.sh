#!/bin/bash

echo "Testing War Room Frontend..."
echo "=============================="

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is running on localhost:3000"
else
    echo "❌ Server is not responding"
    exit 1
fi

# Check for React app
if curl -s http://localhost:3000 | grep -q "root"; then
    echo "✅ React root element found"
else
    echo "❌ React root element not found"
fi

# Check for Vite
if curl -s http://localhost:3000 | grep -q "@vite"; then
    echo "✅ Vite is serving the app"
else
    echo "❌ Vite not detected"
fi

# Check page title
if curl -s http://localhost:3000 | grep -q "War Room Platform"; then
    echo "✅ Page title is correct"
else
    echo "❌ Page title not found"
fi

echo ""
echo "App Status:"
echo "==========="
echo "🌐 URL: http://localhost:3000"
echo "📱 The React app should be loading"
echo "🔐 Navigate to /login to see the Supabase login form"
echo ""