#!/bin/bash

# Setup OAuth Environment Variables for Render
# This script provides the exact environment variables needed for OAuth

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   OAuth Configuration for Render${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create the OAuth environment variables file
cat << 'EOF' > render-oauth-env.txt
# ===================================
# War Room - OAuth Environment Variables for Render
# ===================================
# Add these to Render Dashboard:
# 1. Go to https://dashboard.render.com
# 2. Select war-room-oa9t service
# 3. Go to Environment tab
# 4. Add each variable below

# ===== NEXTAUTH CONFIGURATION =====
NEXTAUTH_URL=https://war-room-oa9t.onrender.com
NEXTAUTH_SECRET=generate-a-secure-random-string-here-use-openssl-rand-base64-32

# ===== GOOGLE OAUTH =====
# From Google Cloud Console (OAuth 2.0 Client)
GOOGLE_CLIENT_ID=808203781238-dgqv5sga2q1r1ls6n77fc40g3idu8h1o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Alternative naming (some libraries use these)
GOOGLE_OAUTH_CLIENT_ID=808203781238-dgqv5sga2q1r1ls6n77fc40g3idu8h1o.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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

# ===== META/FACEBOOK OAUTH =====
# From Facebook App Dashboard
META_CLIENT_ID=917316510623086
META_CLIENT_SECRET=a5c0f9c8c939797bbfc1b623c1e8e8e5

# Alternative naming (some libraries use these)
FACEBOOK_CLIENT_ID=917316510623086
FACEBOOK_CLIENT_SECRET=a5c0f9c8c939797bbfc1b623c1e8e8e5

# Facebook App credentials (for API access)
FACEBOOK_APP_ID=917316510623086
FACEBOOK_APP_SECRET=a5c0f9c8c939797bbfc1b623c1e8e8e5

# ===== FACEBOOK/META API TOKENS =====
# Production Access Token
FACEBOOK_ACCESS_TOKEN=EAAK4NWxHofgBPB898ZAXnQEdYQ4fwp9PebhQFZBJxvD7QeykdG11pQYzePbovGrazbWVAAUth0GmqS9QWRdbsfvjTRyGVgqegPlZAyNmnByU13Uh04CfBg44VbIwr7ZAwbiQufJa5YGV1jt9kDIfvTudnGdBIzP2T2DRqnPRWom9vGDrP8rgzAnmsNquUKBtQlgavVvm

# Sandbox Token (for testing)
FACEBOOK_SANDBOX_TOKEN=EAAK4NWxHofgBPLyA0ZCB7tx9na6qFZCZCEQJxl21yIfpR7CdaoCRT4l8jsxBDPSXjajzE1bJg4Q2VdGzRZBqtyxeiDRYiDpyZCPtIZB6L0SchBFdizgjxPl3HbMMvZBJogkgZC4cA7sa5yqt9jXnIdnbUBMCR20ZBPyFkekU4mweUEl6lc9JGoYm8H8ibIJ0xX8XoloOxjZBWZC

# ===== GOOGLE ADS API =====
GOOGLE_ADS_CLIENT_ID=808203781238-dgqv5sga2q1r1ls6n77fc40g3idu8h1o.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=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
GOOGLE_ADS_DEVELOPER_TOKEN=h3cQ3ss7lesG9dP0tC56ig

# ===== JWT/AUTH =====
JWT_SECRET=your-secure-jwt-secret-here-generate-with-openssl-rand-base64-32
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ===== DATABASE =====
# DATABASE_URL is auto-configured by Render if using Render PostgreSQL
# If using external database, add:
# DATABASE_URL=postgresql://user:password@host:port/dbname

# ===== SUPABASE (if using for auth) =====
SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbnJhZndza3hheGhhY3p2d2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjc2MTQsImV4cCI6MjA2NzY0MzYxNH0.d7lM7Jp6CVxPesip1JVYPMUEkifQ39biLQNzEhNfd-w

# ===== APPLICATION SETTINGS =====
NODE_ENV=production
PYTHON_ENV=production
RENDER_ENV=production
PORT=10000
VERSION=1.0.0

# ===== CORS SETTINGS =====
BACKEND_CORS_ORIGINS=["https://war-room-oa9t.onrender.com","http://localhost:3000","http://localhost:5173"]

# ===== OPTIONAL SERVICES =====
# Add these if you have accounts:
# OPENAI_API_KEY=your-openai-api-key
# SENDGRID_API_KEY=your-sendgrid-api-key
# TWILIO_ACCOUNT_SID=your-twilio-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
EOF

echo -e "${GREEN}✓ OAuth environment variables file created: render-oauth-env.txt${NC}"
echo ""

# Generate secure secrets
echo -e "${YELLOW}Generating secure secrets...${NC}"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

echo ""
echo -e "${GREEN}Generated Secure Secrets:${NC}"
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Update the file with generated secrets
sed -i '' "s/generate-a-secure-random-string-here-use-openssl-rand-base64-32/$NEXTAUTH_SECRET/g" render-oauth-env.txt
sed -i '' "s/your-secure-jwt-secret-here-generate-with-openssl-rand-base64-32/$JWT_SECRET/g" render-oauth-env.txt

# Create OAuth callback URLs configuration
cat << 'EOF' > oauth-callbacks.txt
# ===================================
# OAuth Callback URLs Configuration
# ===================================

## Google OAuth (Google Cloud Console)
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Add these Authorized redirect URIs:
   - https://war-room-oa9t.onrender.com/api/auth/callback/google
   - https://war-room-oa9t.onrender.com/auth/google/callback
   - https://war-room-oa9t.onrender.com/api/auth/google/callback
   
4. Add Authorized JavaScript origins:
   - https://war-room-oa9t.onrender.com

## Meta/Facebook OAuth (Facebook Developers)
1. Go to: https://developers.facebook.com/apps/917316510623086/settings/basic/
2. Add to "App Domains":
   - war-room-oa9t.onrender.com
   
3. Go to Facebook Login > Settings
4. Add to "Valid OAuth Redirect URIs":
   - https://war-room-oa9t.onrender.com/api/auth/callback/facebook
   - https://war-room-oa9t.onrender.com/auth/facebook/callback
   - https://war-room-oa9t.onrender.com/api/auth/facebook/callback

5. Ensure "Use Strict Mode" is appropriate for your setup
6. Add to "Allowed Domains for the JavaScript SDK":
   - https://war-room-oa9t.onrender.com

## Additional Settings

### Google OAuth
- Ensure "Google Ads API" is enabled in your project
- Add necessary scopes:
  * https://www.googleapis.com/auth/adwords
  * https://www.googleapis.com/auth/userinfo.email
  * https://www.googleapis.com/auth/userinfo.profile

### Facebook OAuth
- Ensure these permissions are requested:
  * email
  * public_profile
  * ads_read
  * ads_management
  * business_management
EOF

echo -e "${GREEN}✓ OAuth callback URLs configuration created: oauth-callbacks.txt${NC}"
echo ""

# Create test script
cat << 'EOF' > test-oauth-health.sh
#!/bin/bash

# Test OAuth Configuration Health

echo "Testing OAuth endpoints on production..."
echo ""

# Test base health
echo "1. Testing base health endpoint:"
curl -s https://war-room-oa9t.onrender.com/api/health | jq '.services.facebook_api, .services.google_ads_api' 2>/dev/null || echo "Health endpoint not available"
echo ""

# Test Facebook OAuth
echo "2. Testing Facebook API configuration:"
curl -s https://war-room-oa9t.onrender.com/api/health/facebook | jq '.configured, .env_vars' 2>/dev/null || echo "Facebook health check not available"
echo ""

# Test Google OAuth
echo "3. Testing Google Ads API configuration:"
curl -s https://war-room-oa9t.onrender.com/api/health/google | jq '.configured, .env_vars' 2>/dev/null || echo "Google health check not available"
echo ""

# Test auth endpoints
echo "4. Testing auth endpoints:"
curl -s -o /dev/null -w "Google Auth: %{http_code}\n" https://war-room-oa9t.onrender.com/api/auth/google 2>/dev/null
curl -s -o /dev/null -w "Facebook Auth: %{http_code}\n" https://war-room-oa9t.onrender.com/api/auth/facebook 2>/dev/null
echo ""

echo "If you see 404 or 500 errors, the OAuth is not configured properly."
echo "If you see 302 redirects, OAuth is working and will redirect to provider."
EOF

chmod +x test-oauth-health.sh

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Setup Instructions${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}Step 1: Add Environment Variables to Render${NC}"
echo "1. Go to: https://dashboard.render.com"
echo "2. Select the war-room-oa9t service"
echo "3. Click on 'Environment' tab"
echo "4. Add ALL variables from render-oauth-env.txt"
echo "5. Click 'Save Changes' (this triggers a redeploy)"
echo ""

echo -e "${YELLOW}Step 2: Configure OAuth Callback URLs${NC}"
echo "1. Follow instructions in oauth-callbacks.txt"
echo "2. Update Google Cloud Console with callback URLs"
echo "3. Update Facebook Developers with callback URLs"
echo ""

echo -e "${YELLOW}Step 3: Verify Configuration${NC}"
echo "After Render redeploys (5-10 minutes):"
echo "1. Run: ./test-oauth-health.sh"
echo "2. Check browser console at https://war-room-oa9t.onrender.com"
echo "3. Try logging in with Google/Facebook"
echo ""

echo -e "${GREEN}Files Created:${NC}"
echo "  • render-oauth-env.txt - Complete environment variables (with generated secrets)"
echo "  • oauth-callbacks.txt - OAuth provider configuration instructions"
echo "  • test-oauth-health.sh - Script to test OAuth configuration"
echo ""

echo -e "${RED}IMPORTANT:${NC}"
echo "  • NEXTAUTH_SECRET has been generated: $NEXTAUTH_SECRET"
echo "  • JWT_SECRET has been generated: $JWT_SECRET"
echo "  • Save these values! They're already in render-oauth-env.txt"
echo ""

echo -e "${BLUE}Common Issues:${NC}"
echo "  • If OAuth redirects fail: Check callback URLs match exactly"
echo "  • If 'unauthorized': Verify NEXTAUTH_SECRET is set"
echo "  • If APIs fail: Check access tokens are valid"
echo ""