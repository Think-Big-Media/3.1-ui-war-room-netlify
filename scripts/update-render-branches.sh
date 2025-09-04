#!/bin/bash

# Script to update Render services to use correct branches

RENDER_API_KEY="${RENDER_API_KEY:-rnd_kM791PKT9Ms0ZqlNQPLd65hmUb5K}"

echo "Updating Render services to use proper branches..."

# Update staging service to use staging branch
echo "Updating staging service..."
curl -X PATCH "https://api.render.com/v1/services/srv-d2eb2k0dl3ps73a2tc30" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"branch": "staging"}' \
  -s -o /dev/null -w "Staging: HTTP %{http_code}\n"

# Update production service to use production branch  
echo "Updating war-room-production service..."
curl -X PATCH "https://api.render.com/v1/services/srv-d2csi9juibrs738r02rg" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"branch": "production"}' \
  -s -o /dev/null -w "Production: HTTP %{http_code}\n"

# Suspend duplicate service (war-room-2025)
echo "Suspending duplicate war-room-2025 service..."
curl -X POST "https://api.render.com/v1/services/srv-d2dm57mmcj7s73c76dh0/suspend" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -s -o /dev/null -w "Suspend duplicate: HTTP %{http_code}\n"

echo ""
echo "✓ Service configuration updated!"
echo ""
echo "Branch mapping:"
echo "  staging (srv-d2eb2k0dl3ps73a2tc30) → staging branch"
echo "  war-room-production (srv-d2csi9juibrs738r02rg) → production branch"
echo "  war-room-2025 → SUSPENDED (duplicate)"