#!/bin/bash

# Deployment Safety Agent - Ensures safe deployment practices
# CRITICAL: Always staging first, never production without approval

LOG_FILE="/tmp/deployment-safety-agent.log"
ALERT_LOG="/tmp/deployment-safety-alerts.log"
STAGING_URL="https://one-0-war-room.onrender.com"
PRODUCTION_URLS=("https://war-room-2025.onrender.com" "https://war-room-production.onrender.com")

echo "🛡️ Deployment Safety Agent Started" | tee -a "$LOG_FILE"
echo "RULE: Staging first, production only with approval" | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"

# Check for dangerous files
check_dangerous_files() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check for runtime.txt (THE KILLER FILE)
    if [ -f "runtime.txt" ]; then
        echo "[$timestamp] 🚨 CRITICAL: runtime.txt detected!" | tee -a "$LOG_FILE" "$ALERT_LOG"
        echo "  This file BREAKS frontend deployments!" | tee -a "$ALERT_LOG"
        echo "  ACTION REQUIRED: Delete runtime.txt immediately!" | tee -a "$ALERT_LOG"
        
        # Auto-notify user
        /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh error \
            "CRITICAL: runtime.txt detected" \
            "This file breaks frontend deployments. Delete immediately!"
        return 1
    fi
    
    # Check for _DEFUNKT services in configs
    if grep -r "_DEFUNKT" render.yaml 2>/dev/null; then
        echo "[$timestamp] ⚠️  WARNING: _DEFUNKT service reference found!" | tee -a "$LOG_FILE" "$ALERT_LOG"
        echo "  Never deploy to _DEFUNKT services!" | tee -a "$ALERT_LOG"
        return 1
    fi
    
    echo "[$timestamp] ✅ No dangerous files detected" | tee -a "$LOG_FILE"
    return 0
}

# Monitor git branch for deployment safety
check_deployment_branch() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local current_branch=$(git branch --show-current 2>/dev/null)
    
    if [ "$current_branch" = "main" ] || [ "$current_branch" = "master" ]; then
        echo "[$timestamp] ⚠️  CAUTION: On $current_branch branch" | tee -a "$LOG_FILE"
        echo "  Remember: Test on staging branch first!" | tee -a "$LOG_FILE"
    else
        echo "[$timestamp] ✅ On feature branch: $current_branch" | tee -a "$LOG_FILE"
    fi
}

# Verify build commands are complete
check_build_commands() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ -f "render.yaml" ]; then
        # Check for complete build command
        if grep -q "npm install" render.yaml && grep -q "npm run build" render.yaml; then
            echo "[$timestamp] ✅ Build commands include frontend steps" | tee -a "$LOG_FILE"
        else
            echo "[$timestamp] ⚠️  WARNING: Build commands may be missing frontend steps!" | tee -a "$LOG_FILE" "$ALERT_LOG"
            echo "  Ensure: pip install && npm install && npm run build" | tee -a "$ALERT_LOG"
        fi
    fi
}

# Check staging health before any production consideration
check_staging_health() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] Checking staging health..." | tee -a "$LOG_FILE"
    
    # Check if staging has the new theme
    html_content=$(curl -s "$STAGING_URL" --max-time 10)
    
    if echo "$html_content" | grep -q "from-slate-600"; then
        echo "[$timestamp] ✅ Staging has correct slate theme" | tee -a "$LOG_FILE"
        return 0
    else
        echo "[$timestamp] 🔴 Staging does NOT have slate theme yet!" | tee -a "$LOG_FILE" "$ALERT_LOG"
        echo "  DO NOT deploy to production until staging is fixed!" | tee -a "$ALERT_LOG"
        return 1
    fi
}

# Pre-deployment safety check
pre_deployment_check() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local target="${1:-staging}"
    
    echo "[$timestamp] Running pre-deployment safety check for: $target" | tee -a "$LOG_FILE"
    
    # CRITICAL: Block production deployments without approval
    if [ "$target" = "production" ]; then
        echo "[$timestamp] 🛑 PRODUCTION DEPLOYMENT BLOCKED" | tee -a "$LOG_FILE" "$ALERT_LOG"
        echo "  Production deployments require explicit user approval!" | tee -a "$ALERT_LOG"
        
        # Check if staging is healthy first
        if ! check_staging_health; then
            echo "[$timestamp] 🚫 CANNOT deploy to production - staging is not ready!" | tee -a "$ALERT_LOG"
            return 1
        fi
        
        # Notify user for approval
        /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh approval \
            "Production deployment requested" \
            "Staging is healthy. Approve production deployment?"
        
        echo "  Waiting for user approval..." | tee -a "$LOG_FILE"
        return 1
    fi
    
    # Safety checks for any deployment
    local checks_passed=0
    local checks_failed=0
    
    check_dangerous_files && ((checks_passed++)) || ((checks_failed++))
    check_build_commands && ((checks_passed++)) || ((checks_failed++))
    check_deployment_branch && ((checks_passed++)) || ((checks_failed++))
    
    echo "[$timestamp] Safety check complete: $checks_passed passed, $checks_failed failed" | tee -a "$LOG_FILE"
    
    if [ $checks_failed -gt 0 ]; then
        echo "[$timestamp] ⚠️  Deployment has risks - review alerts!" | tee -a "$ALERT_LOG"
        return 1
    fi
    
    echo "[$timestamp] ✅ Safe to deploy to $target" | tee -a "$LOG_FILE"
    return 0
}

# Main monitoring loop
while true; do
    # Regular safety checks
    check_dangerous_files
    check_build_commands
    
    # Check if any git operations are happening
    if [ -d ".git" ]; then
        # Monitor for production push attempts
        git_remote=$(git remote -v | grep push | grep -E "(war-room-2025|war-room-production)" || true)
        if [ ! -z "$git_remote" ]; then
            timestamp=$(date '+%Y-%m-%d %H:%M:%S')
            echo "[$timestamp] ⚠️  Production remote detected - remember staging first!" | tee -a "$LOG_FILE"
        fi
    fi
    
    sleep 60  # Check every minute
done