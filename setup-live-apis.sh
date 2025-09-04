#!/bin/bash

# War Room - Setup Live APIs Script
# This script configures the environment to use live APIs instead of mock data

echo "🚀 Setting up War Room for LIVE API data..."

# Create a backup of current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Create production .env with proper prefixes
cat > .env.production.temp << 'EOF'
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbnJhZndza3hheGhhY3p2d2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjc2MTQsImV4cCI6MjA2NzY0MzYxNH0.d7lM7Jp6CVxPesip1JVYPMUEkifQ39biLQNzEhNfd-w

# Meta/Facebook Business API - MUST BE CONFIGURED WITH REAL VALUES
VITE_META_APP_ID=${META_APP_ID:-YOUR_META_APP_ID_HERE}
VITE_META_APP_SECRET=${META_APP_SECRET:-YOUR_META_APP_SECRET_HERE}
VITE_META_ACCESS_TOKEN=${META_ACCESS_TOKEN:-YOUR_META_ACCESS_TOKEN_HERE}

# Google Ads API - MUST BE CONFIGURED WITH REAL VALUES
VITE_GOOGLE_ADS_CLIENT_ID=${GOOGLE_ADS_CLIENT_ID:-YOUR_GOOGLE_CLIENT_ID_HERE}
VITE_GOOGLE_ADS_CLIENT_SECRET=${GOOGLE_ADS_CLIENT_SECRET:-YOUR_GOOGLE_CLIENT_SECRET_HERE}
VITE_GOOGLE_ADS_DEVELOPER_TOKEN=${GOOGLE_ADS_DEVELOPER_TOKEN:-YOUR_DEVELOPER_TOKEN_HERE}

# Force live mode (disable mocks)
VITE_FORCE_MOCK_MODE=false

# Other services (optional)
VITE_OPENAI_API_KEY=${OPENAI_API_KEY:-}
VITE_SENDGRID_API_KEY=${SENDGRID_API_KEY:-}
VITE_TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID:-}
VITE_TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN:-}

# Environment Configuration
REACT_APP_ENV=production
EOF

echo "⚠️  IMPORTANT: You need to set your API credentials!"
echo ""
echo "Please edit .env.production.temp and replace:"
echo "  - YOUR_META_APP_ID_HERE with your Meta App ID"
echo "  - YOUR_META_APP_SECRET_HERE with your Meta App Secret"
echo "  - YOUR_META_ACCESS_TOKEN_HERE with your Meta Access Token"
echo "  - YOUR_GOOGLE_CLIENT_ID_HERE with your Google Ads Client ID"
echo "  - YOUR_GOOGLE_CLIENT_SECRET_HERE with your Google Ads Client Secret"
echo "  - YOUR_DEVELOPER_TOKEN_HERE with your Google Ads Developer Token"
echo ""
echo "Once configured, copy .env.production.temp to .env and rebuild:"
echo "  cp .env.production.temp .env"
echo "  npm run build"
echo ""
echo "For Render deployment, add these as environment variables in the Render dashboard."