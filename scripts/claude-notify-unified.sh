#!/bin/bash
# Unified notification system for Claude Code
# Combines Apple Watch (Pushcut) + Mac sounds + clear prompts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Pushcut webhook for Apple Watch
PUSHCUT_WEBHOOK="https://api.pushcut.io/chMJ_FtCA2om9-cTbnGX9/notifications/Claude%20code"

# Log file for debugging
LOG_FILE="/tmp/claude-notifications.log"

# Log function
log_notification() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to send notifications
notify_user() {
    local notification_type="${1:-approval}"  # approval, complete, next, error
    local message="${2:-Claude Code needs your attention}"
    local next_action="${3:-}"
    
    # Log the notification attempt
    log_notification "NOTIFY CALLED - Type: $notification_type, Message: $message"
    
    # Print the message FIRST so it's ready when user arrives
    case $notification_type in
        "approval")
            echo -e "${YELLOW}🚨 APPROVAL NEEDED 🚨${NC}"
            echo -e "${YELLOW}$message${NC}"
            if [ -n "$next_action" ]; then
                echo -e "${BLUE}Next: $next_action${NC}"
            fi
            echo -e "${YELLOW}Proceed? (y/n)${NC}"
            ;;
        "complete")
            echo -e "${GREEN}✅ TASK COMPLETE${NC}"
            echo -e "${GREEN}$message${NC}"
            if [ -n "$next_action" ]; then
                echo -e "${BLUE}Next: $next_action${NC}"
            fi
            ;;
        "next")
            echo -e "${BLUE}📋 WHAT'S NEXT?${NC}"
            echo -e "$message"
            if [ -n "$next_action" ]; then
                echo -e "${YELLOW}Options:${NC}"
                echo -e "$next_action"
            fi
            ;;
        "error")
            echo -e "${RED}❌ ERROR OCCURRED${NC}"
            echo -e "${RED}$message${NC}"
            if [ -n "$next_action" ]; then
                echo -e "${YELLOW}Suggested action: $next_action${NC}"
            fi
            ;;
    esac
    
    # THEN send Apple Watch notification with type-specific title and sound
    local watch_title=""
    local watch_sound=""
    
    case $notification_type in
        "approval")
            watch_title="🚨 APPROVAL"
            watch_sound="alarm"
            ;;
        "complete")
            watch_title="✅ COMPLETE"
            watch_sound="success"
            ;;
        "next")
            watch_title="📋 NEXT"
            watch_sound="question"
            ;;
        "error")
            watch_title="❌ ERROR"
            watch_sound="failure"
            ;;
    esac
    
    curl -s -X POST "$PUSHCUT_WEBHOOK" \
         -H "Content-Type: application/json" \
         -d "{
           \"title\": \"$watch_title\",
           \"text\": \"$message\",
           \"sound\": \"$watch_sound\"
         }" > /dev/null 2>&1
    
    # AND play Mac sound
    if command -v afplay &> /dev/null; then
        osascript -e "set volume output volume 100"
        # Different sounds for different notification types
        case $notification_type in
            "approval")
                # Frog sound - rapid knock pattern for approvals
                afplay /System/Library/Sounds/Frog.aiff & 
                sleep 0.15
                afplay /System/Library/Sounds/Frog.aiff & 
                sleep 0.15
                afplay /System/Library/Sounds/Frog.aiff
                ;;
            "complete")
                # Glass sound for completion
                afplay /System/Library/Sounds/Glass.aiff
                ;;
            "next")
                # Pop sound for "what's next"
                afplay /System/Library/Sounds/Pop.aiff
                ;;
            "error")
                # Sosumi sound for errors
                afplay /System/Library/Sounds/Sosumi.aiff
                ;;
        esac
    fi
}

# Batch approval function
batch_approval() {
    local action_count=$1
    shift
    local actions=("$@")
    
    # Build the message
    local message="I need to perform $action_count actions:"
    for action in "${actions[@]}"; do
        message="$message\n  • $action"
    done
    
    # Show message and notify
    echo -e "$message"
    notify_user "approval" "Batch of $action_count actions needs approval" "I'll execute these in sequence"
    
    # Wait for response
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Starting batch execution...${NC}"
        return 0
    else
        echo -e "${YELLOW}Batch cancelled.${NC}"
        return 1
    fi
}

# Quick functions for common scenarios
need_approval() {
    notify_user "approval" "$1" "$2"
    read -r response
    [[ "$response" =~ ^[Yy]$ ]]
}

task_complete() {
    notify_user "complete" "$1" "$2"
}

whats_next() {
    notify_user "next" "$1" "$2"
}

report_error() {
    notify_user "error" "$1" "$2"
}

# Test function
test_notifications() {
    echo "🔔 Testing all notification types..."
    
    sleep 2
    need_approval "Test approval notification" "This is just a test"
    
    sleep 2
    task_complete "Test task completed successfully" "Ready for next task"
    
    sleep 2
    whats_next "All tests complete. What would you like to do?" "1. Continue with next task\n2. Review what we did\n3. Take a break"
    
    sleep 2
    report_error "Test error notification" "No action needed - this is just a test"
}

# Handle command line usage
case "${1:-}" in
    "test")
        test_notifications
        ;;
    "approval")
        need_approval "$2" "$3"
        ;;
    "complete")
        task_complete "$2" "$3"
        ;;
    "next")
        whats_next "$2" "$3"
        ;;
    "error")
        report_error "$2" "$3"
        ;;
    "batch")
        shift
        batch_approval "$@"
        ;;
    *)
        echo "Claude Code Unified Notification System"
        echo ""
        echo "Usage:"
        echo "  $0 test                    # Test all notification types"
        echo "  $0 approval <msg> <next>   # Request approval"
        echo "  $0 complete <msg> <next>   # Task complete notification"
        echo "  $0 next <msg> <options>    # What's next prompt"
        echo "  $0 error <msg> <action>    # Error notification"
        echo "  $0 batch <count> <actions...> # Batch approval"
        echo ""
        echo "Examples:"
        echo "  $0 approval 'Run database migration?' 'Will update schema'"
        echo "  $0 complete 'Sentry integration added' 'Ready to test error tracking'"
        echo "  $0 next 'Sentry is set up' '1. Test it\n2. Move to next task\n3. Review docs'"
        ;;
esac