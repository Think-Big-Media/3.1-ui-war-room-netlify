#!/bin/bash
# 🚀 ONE-CLICK LOCAL DEVELOPMENT STARTUP
# Just run: ./START_LOCAL.sh

echo "🚀 Starting War Room Local Development..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kill any existing servers to start fresh
echo "🧹 Cleaning up old processes..."
pkill -f "npm run dev" 2>/dev/null
pkill -f "serve_bulletproof.py" 2>/dev/null
lsof -ti:5173,5174,5175,10000 | xargs kill -9 2>/dev/null

sleep 2

# Start Frontend
echo "📦 Starting Frontend (React + Vite)..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Start Backend
echo "🔧 Starting Backend (FastAPI)..."
cd src/backend && python3 serve_bulletproof.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Clear screen and show status
clear
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "    🎉 WAR ROOM LOCAL DEVELOPMENT IS RUNNING! 🎉"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Frontend:  http://localhost:5173 (or 5174/5175)"
echo "⚙️  Backend:   http://localhost:10000"
echo "📚 API Docs:  http://localhost:10000/docs"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ HOT RELOAD ENABLED - Changes appear instantly!"
echo "🔍 Test browser scaling: Cmd+Plus/Minus"
echo "💾 Just save files to see changes - NO DEPLOYMENT NEEDED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Keep script running and handle shutdown
trap "echo '🛑 Stopping servers...'; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit" INT TERM

# Wait for processes
wait