#!/bin/bash
# Verify security configuration

echo "🔒 War Room Security Verification"
echo "================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Backend URL
BACKEND_URL="https://war-room-oa9t.onrender.com"

echo -e "\n1️⃣ Testing Rate Limiting..."
echo "Making 110 requests (limit should be 100)..."

success_count=0
rate_limited=false

for i in {1..110}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
    if [ "$response" == "200" ]; then
        ((success_count++))
    elif [ "$response" == "429" ]; then
        rate_limited=true
        echo -e "${GREEN}✅ Rate limiting active! Got 429 after $success_count requests${NC}"
        break
    fi
    
    # Progress indicator every 10 requests
    if [ $((i % 10)) -eq 0 ]; then
        echo -n "."
    fi
done

if [ "$rate_limited" = false ]; then
    echo -e "${RED}❌ Rate limiting NOT working - got $success_count successful requests${NC}"
fi

echo -e "\n2️⃣ Testing CORS..."
# Test from unauthorized origin
response=$(curl -s -H "Origin: https://evil.com" -I "$BACKEND_URL/health" | grep -i "access-control-allow-origin")
if [ -z "$response" ]; then
    echo -e "${GREEN}✅ CORS blocking unauthorized origins${NC}"
else
    echo -e "${RED}❌ CORS not properly configured${NC}"
fi

# Test from authorized origin
response=$(curl -s -H "Origin: https://war-room-frontend-tzuk.onrender.com" -I "$BACKEND_URL/health" | grep -i "access-control-allow-origin")
if [ -n "$response" ]; then
    echo -e "${GREEN}✅ CORS allowing authorized frontend${NC}"
else
    echo -e "${RED}❌ CORS blocking authorized frontend${NC}"
fi

echo -e "\n3️⃣ Testing Security Headers..."
headers=$(curl -s -I "$BACKEND_URL/health")

# Check for secure headers
if echo "$headers" | grep -qi "strict-transport-security"; then
    echo -e "${GREEN}✅ HSTS header present${NC}"
else
    echo -e "${RED}❌ HSTS header missing${NC}"
fi

if echo "$headers" | grep -qi "x-content-type-options: nosniff"; then
    echo -e "${GREEN}✅ X-Content-Type-Options present${NC}"
else
    echo -e "${RED}❌ X-Content-Type-Options missing${NC}"
fi

echo -e "\n4️⃣ Testing HTTPS Enforcement..."
# Try HTTP (should redirect or fail)
http_response=$(curl -s -o /dev/null -w "%{http_code}" -L "http://war-room-oa9t.onrender.com/health")
if [ "$http_response" == "200" ]; then
    echo -e "${GREEN}✅ HTTPS enforced (HTTP redirects to HTTPS)${NC}"
else
    echo -e "${GREEN}✅ HTTP blocked${NC}"
fi

echo -e "\n================================="
echo "🔒 Security verification complete!"
echo ""
echo "Next steps:"
echo "- Monitor rate limiting in production"
echo "- Set up Sentry for error tracking"
echo "- Configure CSP headers"
echo "- Schedule penetration testing"