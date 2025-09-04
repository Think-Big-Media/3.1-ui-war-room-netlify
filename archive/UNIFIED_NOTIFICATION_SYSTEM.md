# Unified Notification System for Claude Code

## Overview

This system ensures you're always alerted when Claude needs your attention, using both Apple Watch (via Pushcut) and Mac sounds.

## The Core Problem

Claude Code doesn't automatically know when to send notifications. We need to explicitly instruct Claude to use the notification system BEFORE asking questions or needing input.

## Notification Script

**Location**: `/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh`

### Usage Patterns

```bash
# Before asking for approval
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh approval "Deploy to production?" "Will update live site"

# After completing a task
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh complete "Database migration successful" "Ready for next task"

# When asking what to do next
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh next "All tests passing" "1. Deploy\n2. Document\n3. Next feature"

# When an error occurs
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh error "Build failed" "Check error logs"
```

## Notification Types

| Type | Apple Watch Title | Mac Sound | Use Case |
|------|------------------|-----------|----------|
| approval | 🚨 APPROVAL | Frog (3x) | Yes/no questions |
| complete | ✅ COMPLETE | Glass | Task finished |
| next | 📋 NEXT | Pop | What to do next |
| error | ❌ ERROR | Sosumi | Problems occurred |

## Integration Instructions for CLAUDE.md

Add these rules to make Claude use notifications:

```markdown
## Notification Rules

CRITICAL: You MUST use the notification system in these situations:

1. **Before ANY question to the user**:
   - Run: `/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh approval "Your question here" "What happens next"`
   - THEN display the question

2. **After completing a task**:
   - Run: `/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh complete "What was done" "What's next"`
   - ALWAYS tell user what options they have

3. **When asking what to do next**:
   - Run: `/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh next "Current status" "1. Option 1\n2. Option 2"`
   - Never leave user without next steps

4. **When errors occur**:
   - Run: `/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh error "What went wrong" "Suggested fix"`

IMPORTANT: The notification script displays the message AND sends to Apple Watch, then plays the sound. This ensures the text is ready when the user arrives.
```

## Debugging & Logging

To debug why notifications aren't firing, let's add logging:

```bash
# Add to the script
echo "[$(date)] Notification sent: $notification_type - $message" >> /tmp/claude-notifications.log
```

Check the log:
```bash
tail -f /tmp/claude-notifications.log
```

## The Key Insight

The core issue is that Claude Code needs EXPLICIT instructions in CLAUDE.md to use the notification system. Without these instructions, Claude won't know to run the scripts before asking questions.

## Testing

1. Test the script manually:
   ```bash
   /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh test
   ```

2. Check if Claude is using it:
   ```bash
   # Check the log file
   cat /tmp/claude-notifications.log
   ```

## Common Issues

1. **Claude not using notifications**: Add explicit rules to CLAUDE.md
2. **Notifications not arriving**: Check Pushcut app is running
3. **No sound**: Ensure Mac volume is not muted
4. **Wrong timing**: Script already handles proper sequencing

## Migration from Old System

This replaces:
- `approval-batcher.sh` 
- `notify-apple-watch.sh`
- `claude-notify.sh`
- `pushcut-notify.sh` (now integrated)

All functionality is now in one unified script with consistent behavior.