#!/bin/bash

# Setup Render Environment Variables Script
# This script helps you configure all necessary environment variables for Render deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Render Environment Setup Helper${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}This script will help you set up environment variables for Render.${NC}"
echo -e "${YELLOW}You'll need to manually add these to your Render dashboard.${NC}"
echo ""

# Create the environment variables list
cat << 'EOF' > render-env-vars.txt
# ===================================
# War Room - Render Environment Variables
# ===================================
# Copy these to your Render dashboard:
# 1. Go to https://dashboard.render.com
# 2. Select your service (war-room-oa9t)
# 3. Go to Environment tab
# 4. Add each variable below

# Database (Usually auto-configured by Render)
# DATABASE_URL is automatically set by Render if using Render PostgreSQL

# Redis (if using Render Redis)
# REDIS_URL is automatically set by Render if using Render Redis

# Security
JWT_SECRET=your-secure-jwt-secret-here-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Facebook/Meta Business API
FACEBOOK_APP_ID=917316510623086
FACEBOOK_APP_SECRET=a5c0f9c8c939797bbfc1b623c1e8e8e5
FACEBOOK_ACCESS_TOKEN=EAAK4NWxHofgBPB898ZAXnQEdYQ4fwp9PebhQFZBJxvD7QeykdG11pQYzePbovGrazbWVAAUth0GmqS9QWRdbsfvjTRyGVgqegPlZAyNmnByU13Uh04CfBg44VbIwr7ZAwbiQufJa5YGV1jt9kDIfvTudnGdBIzP2T2DRqnPRWom9vGDrP8rgzAnmsNquUKBtQlgavVvm

# Facebook Sandbox (for testing)
FACEBOOK_SANDBOX_TOKEN=EAAK4NWxHofgBPLyA0ZCB7tx9na6qFZCZCEQJxl21yIfpR7CdaoCRT4l8jsxBDPSXjajzE1bJg4Q2VdGzRZBqtyxeiDRYiDpyZCPtIZB6L0SchBFdizgjxPl3HbMMvZBJogkgZC4cA7sa5yqt9jXnIdnbUBMCR20ZBPyFkekU4mweUEl6lc9JGoYm8H8ibIJ0xX8XoloOxjZBWZC

# Google Ads API
GOOGLE_ADS_CLIENT_ID=808203781238-dgqv5sga2q1r1ls6n77fc40g3idu8h1o.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=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
GOOGLE_ADS_DEVELOPER_TOKEN=h3cQ3ss7lesG9dP0tC56ig
# Note: GOOGLE_ADS_REFRESH_TOKEN needs to be obtained through OAuth flow
# GOOGLE_ADS_CUSTOMER_ID should be set to your MCC account ID

# SendGrid Email Service
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=Info@wethinkbig.io

# Supabase (if using)
SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbnJhZndza3hheGhhY3p2d2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjc2MTQsImV4cCI6MjA2NzY0MzYxNH0.d7lM7Jp6CVxPesip1JVYPMUEkifQ39biLQNzEhNfd-w

# PostHog Analytics (optional)
POSTHOG_KEY=your-posthog-key
POSTHOG_HOST=https://app.posthog.com
POSTHOG_ENABLED=true

# OpenAI (for document intelligence)
OPENAI_API_KEY=your-openai-api-key

# Pinecone (for vector search)
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+18139652725

# Application Settings
RENDER_ENV=production
NODE_ENV=production
PYTHON_ENV=production
VERSION=1.0.0

# CORS Settings
BACKEND_CORS_ORIGINS=["https://war-room-oa9t.onrender.com","http://localhost:3000","http://localhost:5173"]

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# Logging
LOG_LEVEL=INFO

EOF

echo -e "${GREEN}✓ Environment variables file created: render-env-vars.txt${NC}"
echo ""

# Create a Python script to test environment variables
cat << 'EOF' > test-env-vars.py
#!/usr/bin/env python3
"""Test if environment variables are properly set."""

import os
import sys
from typing import Dict, List, Tuple

def check_env_vars() -> Tuple[Dict[str, bool], List[str], List[str]]:
    """Check which environment variables are set."""
    
    # Define required and optional variables
    required_vars = [
        "DATABASE_URL",
        "JWT_SECRET",
        "FACEBOOK_APP_ID",
        "FACEBOOK_APP_SECRET",
        "GOOGLE_ADS_CLIENT_ID",
        "GOOGLE_ADS_CLIENT_SECRET",
        "GOOGLE_ADS_DEVELOPER_TOKEN",
    ]
    
    optional_vars = [
        "REDIS_URL",
        "FACEBOOK_ACCESS_TOKEN",
        "GOOGLE_ADS_REFRESH_TOKEN",
        "GOOGLE_ADS_CUSTOMER_ID",
        "SENDGRID_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "POSTHOG_KEY",
        "OPENAI_API_KEY",
        "PINECONE_API_KEY",
        "TWILIO_ACCOUNT_SID",
    ]
    
    status = {}
    missing_required = []
    missing_optional = []
    
    # Check required variables
    for var in required_vars:
        value = os.getenv(var)
        if value and value != "your-" + var.lower().replace("_", "-") + "-here":
            status[var] = True
        else:
            status[var] = False
            missing_required.append(var)
    
    # Check optional variables
    for var in optional_vars:
        value = os.getenv(var)
        if value and value != "your-" + var.lower().replace("_", "-") + "-here":
            status[var] = True
        else:
            status[var] = False
            missing_optional.append(var)
    
    return status, missing_required, missing_optional

def main():
    """Main function to test environment variables."""
    print("=" * 50)
    print("Environment Variables Check")
    print("=" * 50)
    print()
    
    status, missing_required, missing_optional = check_env_vars()
    
    # Display results
    print("Required Variables:")
    for var in ["DATABASE_URL", "JWT_SECRET", "FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET",
                "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_DEVELOPER_TOKEN"]:
        if status.get(var, False):
            print(f"  ✓ {var}: Set")
        else:
            print(f"  ✗ {var}: Missing or invalid")
    
    print()
    print("Optional Variables:")
    for var in status:
        if var not in ["DATABASE_URL", "JWT_SECRET", "FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET",
                       "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_DEVELOPER_TOKEN"]:
            if status[var]:
                print(f"  ✓ {var}: Set")
            else:
                print(f"  ⚠ {var}: Not set")
    
    print()
    print("=" * 50)
    
    if missing_required:
        print(f"❌ Missing {len(missing_required)} required variables!")
        print("Please set these in your Render dashboard:")
        for var in missing_required:
            print(f"  - {var}")
        sys.exit(1)
    else:
        print("✅ All required variables are set!")
        
        if missing_optional:
            print(f"⚠️  {len(missing_optional)} optional variables are not set.")
            print("Consider setting these for full functionality:")
            for var in missing_optional[:5]:  # Show first 5
                print(f"  - {var}")
            if len(missing_optional) > 5:
                print(f"  ... and {len(missing_optional) - 5} more")

if __name__ == "__main__":
    main()
EOF

chmod +x test-env-vars.py

echo -e "${BLUE}Instructions for setting up Render environment variables:${NC}"
echo ""
echo "1. Open render-env-vars.txt and review the variables"
echo "2. Go to https://dashboard.render.com"
echo "3. Select your service: war-room-oa9t"
echo "4. Click on 'Environment' in the left sidebar"
echo "5. Add each variable from render-env-vars.txt"
echo "6. Click 'Save Changes' - this will trigger a redeploy"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo "- Replace placeholder values with your actual credentials"
echo "- JWT_SECRET should be a strong, random string"
echo "- Google Ads requires OAuth setup to get REFRESH_TOKEN"
echo "- Some services (OpenAI, Pinecone, etc.) require paid accounts"
echo ""
echo -e "${GREEN}Files created:${NC}"
echo "  - render-env-vars.txt (list of all environment variables)"
echo "  - test-env-vars.py (Python script to test variables)"
echo ""
echo -e "${BLUE}To test if variables are set locally:${NC}"
echo "  python3 test-env-vars.py"
echo ""
echo -e "${BLUE}To test API health after setting variables:${NC}"
echo "  ./scripts/test-api-health.sh prod"