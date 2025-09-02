#!/bin/bash

echo "🔍 Testing Backend API JSON Responses"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test health endpoint
echo -e "\n📍 Testing /api/v1/health endpoint:"
curl -s -H "Accept: application/json" \
  "https://war-room-3-backend-d2msjrk82vjjq794glog.lp.dev/api/v1/health" | \
  python3 -m json.tool 2>/dev/null || echo "❌ Not returning valid JSON"

# Test auth health
echo -e "\n📍 Testing /auth/health endpoint:"
curl -s -H "Accept: application/json" \
  "https://war-room-3-backend-d2msjrk82vjjq794glog.lp.dev/auth/health" | \
  python3 -m json.tool 2>/dev/null || echo "❌ Not returning valid JSON"

# Test root to ensure it's not serving HTML
echo -e "\n📍 Testing root (should 404 or redirect, not serve HTML):"
curl -s -I "https://war-room-3-backend-d2msjrk82vjjq794glog.lp.dev/" | head -n 1

echo -e "\n✅ If you see JSON responses above, the backend is fixed!"
echo "❌ If you see HTML or errors, re-run the Leap.new prompt with more specific instructions."