#\!/bin/bash

# Check deployment status
echo "🔍 Checking War Room deployment status..."
echo ""

# Check backend on Render
echo "Backend (Render):"
BACKEND_RESPONSE=$(curl -s https://war-room.onrender.com/health)
if echo "$BACKEND_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
    echo "✅ Backend is operational"
    echo "$BACKEND_RESPONSE" | jq '.'
else
    echo "⏳ Backend deployment in progress or failed"
    echo "Response: $BACKEND_RESPONSE"
fi

echo ""
echo "Frontend (Local):"
if curl -s http://localhost:5173 | grep -q "War Room Platform"; then
    echo "✅ Frontend dev server is running at http://localhost:5173"
else
    echo "❌ Frontend dev server is not running"
fi

echo ""
echo "Next Steps:"
echo "1. If backend shows 'in progress', wait a few minutes and run this script again"
echo "2. Once backend is operational, you can deploy frontend to Vercel"
echo "3. Import the GitHub repo at vercel.com/import"
