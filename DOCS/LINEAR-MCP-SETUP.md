# Linear MCP Integration Setup

## Overview
Linear MCP enables automatic task synchronization between your code and Linear project management.

## 1. Get Linear API Key

### Steps:
1. Go to: https://linear.app/settings/api
2. Click "Create new API key"
3. Name it: "War Room MCP Integration"
4. Copy the API key (starts with `lin_api_`)

## 2. Install Linear MCP

### Option A: Using npx (Recommended)
```bash
# Install globally
npm install -g @modelcontextprotocol/server-linear

# Or run directly
npx @modelcontextprotocol/server-linear
```

### Option B: From source
```bash
cd ~/WarRoom_Development
git clone https://github.com/modelcontextprotocol/servers.git mcp-servers
cd mcp-servers/src/linear
npm install
npm run build
```

## 3. Configure Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-linear"
      ],
      "env": {
        "LINEAR_API_KEY": "YOUR_LINEAR_API_KEY_HERE"
      }
    }
  }
}
```

## 4. Set Up Linear Workspace

### Create War Room Project:
1. Go to Linear
2. Create new project: "War Room"
3. Set up workflow states:
   - Backlog
   - Todo
   - In Progress
   - In Review
   - Done

### Create Labels:
- `bug` - For bug fixes
- `feature` - New features
- `security` - Security issues
- `performance` - Performance improvements
- `documentation` - Docs updates
- `deployment` - Deployment related

## 5. Automation Rules

### GitHub Integration:
1. Go to Linear Settings → Integrations → GitHub
2. Connect your GitHub account
3. Select "Think-Big-Media/1.0-war-room" repository
4. Enable:
   - ✅ Create issues from PR/commits
   - ✅ Auto-link PRs to issues
   - ✅ Update issue status from PR

### Automation Templates:

#### PR Creates Issue:
- When: PR opened with "Fixes #" in description
- Then: Create Linear issue with PR details

#### Commit Updates Issue:
- When: Commit message contains Linear ID (e.g., "WAR-123")
- Then: Move issue to "In Progress"

#### PR Merged:
- When: PR merged with Linear ID
- Then: Move issue to "Done"

## 6. Linear MCP Commands

Once configured, you can use these commands in Claude:

```
# List all issues
linear list

# Create new issue
linear create "Fix logo display issue" --project "War Room" --label bug

# Update issue status
linear update WAR-123 --status "In Progress"

# Add comment
linear comment WAR-123 "Started working on this"

# Search issues
linear search "filter error"
```

## 7. Workflow Integration

### Automatic Task Creation:
1. When you mention a bug/feature in Claude
2. Linear MCP can create an issue automatically
3. Links it to your current work

### Status Updates:
1. As you work on code
2. Linear MCP updates issue status
3. Adds relevant comments

### Daily Sync:
1. Morning: Pull today's tasks from Linear
2. During work: Update progress automatically
3. End of day: Mark completed tasks

## 8. Configure Project Settings

Create `.linear.yml` in your project:

```yaml
project: War Room
team: Engineering
defaults:
  priority: 3
  estimate: 3
  
issue_templates:
  bug:
    title: "[Bug] {description}"
    labels: ["bug"]
    priority: 2
    
  feature:
    title: "[Feature] {description}"
    labels: ["feature"]
    priority: 3
    
  security:
    title: "[Security] {description}"
    labels: ["security", "critical"]
    priority: 1

auto_sync:
  enabled: true
  frequency: "on_change"
  
github_sync:
  enabled: true
  auto_create_from_pr: true
  auto_close_on_merge: true
```

## 9. Test the Integration

1. Restart Claude Desktop
2. Type: `linear list` to see your issues
3. Create a test issue: `linear create "Test Linear MCP integration"`
4. Check Linear web app to confirm

## 10. Advanced Features

### Bulk Operations:
```bash
# Move all bugs to In Progress
linear bulk-update --label bug --status "In Progress"

# Close all completed PRs
linear bulk-close --status "Done" --age "7d"
```

### Custom Workflows:
- Set up cycles (sprints)
- Configure estimates
- Add custom fields
- Set up SLAs

### Reporting:
- Velocity tracking
- Burndown charts
- Issue analytics
- Team performance

---

## Troubleshooting

### MCP Not Working:
1. Check API key is correct
2. Restart Claude Desktop
3. Check logs: `~/Library/Logs/Claude/`

### Issues Not Syncing:
1. Verify GitHub integration
2. Check Linear webhook settings
3. Ensure branch naming includes issue ID

### Performance Issues:
1. Limit sync frequency
2. Use filters to reduce data
3. Archive old issues

---
*Last updated: 2025-07-22*