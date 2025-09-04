#!/bin/bash

# Fix Cody Authentication in Cursor
# This script ensures persistent authentication for Cody in Cursor

echo "🔧 Fixing Cody Authentication..."

# Define colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Cody config path
CODY_CONFIG="$HOME/Library/Application Support/Cursor/User/cody.json"
CURSOR_SETTINGS="$HOME/Library/Application Support/Cursor/User/settings.json"

# Your Sourcegraph token (from the existing config)
SOURCEGRAPH_TOKEN="sgp_ws019830ca9f607852933114c2ad580470_214da7a9130f431f5aa65810fc074bc331cdda48"
SOURCEGRAPH_URL="https://sourcegraph.com"

# Create backup
cp "$CODY_CONFIG" "${CODY_CONFIG}.backup" 2>/dev/null || true
cp "$CURSOR_SETTINGS" "${CURSOR_SETTINGS}.backup" 2>/dev/null || true

echo -e "${YELLOW}📝 Updating Cody configuration...${NC}"

# Update cody.json with proper formatting
cat > "$CODY_CONFIG" << EOF
{
  "sourcegraph.accessToken": "$SOURCEGRAPH_TOKEN",
  "sourcegraph.url": "$SOURCEGRAPH_URL",
  "cody.auth.token": "$SOURCEGRAPH_TOKEN",
  "cody.serverEndpoint": "$SOURCEGRAPH_URL"
}
EOF

echo -e "${GREEN}✅ Cody configuration updated${NC}"

# Update Cursor settings to include Cody configuration
echo -e "${YELLOW}📝 Updating Cursor settings...${NC}"

# Use jq if available, otherwise use simple text manipulation
if command -v jq &> /dev/null; then
    # Add Cody settings to the main settings.json
    jq '. + {
        "cody.serverEndpoint": "https://sourcegraph.com",
        "cody.accessToken": "'"$SOURCEGRAPH_TOKEN"'",
        "cody.suggestions.mode": "auto-edit",
        "cody.autocomplete.enabled": true,
        "cody.chat.enabled": true
    }' "$CURSOR_SETTINGS" > "${CURSOR_SETTINGS}.tmp" && mv "${CURSOR_SETTINGS}.tmp" "$CURSOR_SETTINGS"
else
    echo -e "${YELLOW}⚠️  jq not found. Please manually add Cody settings to Cursor settings.json${NC}"
fi

# Create a persistent environment variable
echo -e "${YELLOW}📝 Setting up environment variables...${NC}"

# Add to shell profile
SHELL_PROFILE="$HOME/.zshrc"
if [[ ! -f "$SHELL_PROFILE" ]]; then
    SHELL_PROFILE="$HOME/.bash_profile"
fi

# Check if already exists
if ! grep -q "CODY_ACCESS_TOKEN" "$SHELL_PROFILE" 2>/dev/null; then
    echo "" >> "$SHELL_PROFILE"
    echo "# Cody/Sourcegraph Authentication" >> "$SHELL_PROFILE"
    echo "export CODY_ACCESS_TOKEN='$SOURCEGRAPH_TOKEN'" >> "$SHELL_PROFILE"
    echo "export SOURCEGRAPH_ACCESS_TOKEN='$SOURCEGRAPH_TOKEN'" >> "$SHELL_PROFILE"
    echo -e "${GREEN}✅ Environment variables added to $SHELL_PROFILE${NC}"
else
    echo -e "${YELLOW}ℹ️  Environment variables already exist${NC}"
fi

# Create a launchd plist to maintain the token
echo -e "${YELLOW}📝 Creating persistent token storage...${NC}"

LAUNCHD_PLIST="$HOME/Library/LaunchAgents/com.warroom.cody-auth.plist"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$LAUNCHD_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.warroom.cody-auth</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/sh</string>
        <string>-c</string>
        <string>launchctl setenv CODY_ACCESS_TOKEN '$SOURCEGRAPH_TOKEN' && launchctl setenv SOURCEGRAPH_ACCESS_TOKEN '$SOURCEGRAPH_TOKEN'</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
EOF

# Load the launchd job
launchctl unload "$LAUNCHD_PLIST" 2>/dev/null || true
launchctl load "$LAUNCHD_PLIST"

echo -e "${GREEN}✅ Persistent token storage created${NC}"

# Instructions
echo -e "\n${GREEN}🎉 Cody authentication fix complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Restart Cursor completely (Cmd+Q and reopen)"
echo "2. The Cody extension should now stay authenticated"
echo "3. If prompted for a token, use: $SOURCEGRAPH_TOKEN"
echo -e "\n${YELLOW}Troubleshooting:${NC}"
echo "- If still having issues, go to Cursor Settings > Extensions > Cody"
echo "- Ensure 'Server Endpoint' is set to: https://sourcegraph.com"
echo "- Paste the token in the 'Access Token' field"
echo -e "\n${GREEN}Your token is also saved to:${NC}"
echo "- Cody config: $CODY_CONFIG"
echo "- Environment: CODY_ACCESS_TOKEN"
echo "- LaunchAgent: com.warroom.cody-auth"