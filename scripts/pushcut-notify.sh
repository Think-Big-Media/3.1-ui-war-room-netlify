#!/bin/bash
# Pushcut notification for Apple Watch

# You'll need to replace this with your actual webhook URL from Pushcut
PUSHCUT_WEBHOOK="https://api.pushcut.io/chMJ_FtCA2om9-cTbnGX9/notifications/Claude%20code"

send_pushcut_notification() {
    local title="${1:-Claude Code}"
    local text="${2:-Action needed}"
    local sound="${3:-default}"
    
    # Pushcut API format
    curl -X POST "$PUSHCUT_WEBHOOK" \
         -H "Content-Type: application/json" \
         -d "{
           \"title\": \"$title\",
           \"text\": \"$text\",
           \"sound\": \"$sound\"
         }"
    
    echo "📱 Sent to Apple Watch via Pushcut"
}

# Test function
test_pushcut() {
    echo "🔔 Testing Pushcut notification..."
    send_pushcut_notification \
        "🎉 Test Success!" \
        "Your Apple Watch notifications are working!" \
        "success"
}

# If called with arguments
if [ "$1" == "test" ]; then
    test_pushcut
elif [ $# -gt 0 ]; then
    send_pushcut_notification "$1" "$2" "$3"
fi