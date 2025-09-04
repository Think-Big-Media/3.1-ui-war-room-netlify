# Claude Code Notification Reference

## Quick Usage

The unified notification system (`claude-notify-unified.sh`) ensures you're always alerted when Claude needs your attention.

### For Approvals (Yes/No Questions)
```bash
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh approval "Deploy to production?" "Will update live site"
```
- Apple Watch shows: **🚨 APPROVAL**
- Mac plays: Frog sound (knock-knock-knock)

### For Task Completion
```bash
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh complete "Database migration successful" "Ready for next task"
```
- Apple Watch shows: **✅ COMPLETE**
- Mac plays: Glass sound

### For What's Next
```bash
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh next "All tests passing" "1. Deploy\n2. Document\n3. Next feature"
```
- Apple Watch shows: **📋 NEXT**
- Mac plays: Pop sound

### For Errors
```bash
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh error "Build failed" "Check error logs"
```
- Apple Watch shows: **❌ ERROR**
- Mac plays: Sosumi sound

## Key Principles

1. **Text First, Sound Second**: Full message displays before notification
2. **Always Show Next Steps**: Never leave user wondering what to do
3. **Distinct Notifications**: Each type has unique visual and audio cues
4. **100% Volume**: Ensures you hear it from another room

## Troubleshooting

If notifications aren't working:
1. Check Pushcut app is installed and running
2. Verify webhook URL in script is correct
3. Ensure Mac volume isn't muted
4. Test with: `./scripts/claude-notify-unified.sh test`