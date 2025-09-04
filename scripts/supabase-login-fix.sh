#!/bin/bash

# Supabase CLI Login Fix Script
# Handles the verification code issue

echo "🔧 Fixing Supabase CLI Login Issue"
echo "=================================="
echo ""
echo "📝 Verification Code: e0f89c17"
echo ""
echo "If you're seeing a verification code prompt, follow these steps:"
echo ""
echo "1. Open your browser and go to: https://app.supabase.com/account/tokens"
echo "2. Click 'Generate New Token'"
echo "3. Give it a name like 'War Room CLI'"
echo "4. Copy the generated token"
echo ""
echo "Then run this command with your token:"
echo "export SUPABASE_ACCESS_TOKEN=your-token-here"
echo ""
echo "Or use the manual login method:"
echo "supabase login --token your-token-here"
echo ""
echo "Alternatively, if you have the verification code e0f89c17:"
echo "1. Go to https://supabase.com/dashboard/account/tokens"
echo "2. Enter the code when prompted"
echo "3. The CLI should complete the login"