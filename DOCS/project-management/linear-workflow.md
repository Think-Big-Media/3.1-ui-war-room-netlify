# Linear Workflow for War Room Development

## Quick Start Guide

### 1. Setting Up Your Linear Workspace

#### Create Teams
```
War Room Core - Main development
War Room QA - Testing team  
War Room DevOps - Infrastructure
```

#### Create Projects
1. Go to Linear → Teams → War Room Core
2. Create these projects:
   - **Backend Development** (WR-BE)
   - **Frontend Development** (WR-FE)
   - **Infrastructure** (WR-INF)
   - **AI & Automation** (WR-AI)

#### Configure Views
1. **Sprint Board** - Current sprint work
2. **Roadmap** - Long-term planning
3. **My Issues** - Personal assignments
4. **AI Agent Work** - Track agent tasks

### 2. Daily Development Workflow

#### Morning Routine
1. Check Linear inbox for updates
2. Review AI agent overnight work
3. Update issue statuses
4. Plan day's priorities

#### Creating Issues
```bash
# Use Linear CLI (optional)
linear issue create --title "Add checkpoint monitoring dashboard" \
  --description "Create a dashboard to monitor all checkpoints" \
  --project WR-BE \
  --label feature
```

#### Git Integration
```bash
# Branch from Linear issue
git checkout -b feature/WR-123-checkpoint-dashboard

# Commit with Linear reference
git commit -m "feat(WR-123): Add checkpoint monitoring dashboard"

# PR title includes issue
gh pr create --title "WR-123: Checkpoint monitoring dashboard"
```

### 3. AI Agent Collaboration

#### Assigning to AI Agents

**For Implementation Tasks:**
```
@codegen Please implement the checkpoint monitoring API endpoints based on these requirements:
- GET /api/v1/checkpoints/monitor
- Returns last 24 hours of checkpoint activity
- Include success/failure rates
- Follow our existing API patterns
```

**For Documentation:**
```
@chatprd Please write comprehensive API documentation for the new checkpoint endpoints, including:
- Request/response examples
- Error scenarios
- Integration guide
```

**For Code Review:**
```
@devin Please review the checkpoint implementation and check for:
- Security vulnerabilities
- Performance issues
- Code style consistency
```

#### Monitoring AI Work
1. Agents update issue comments with progress
2. Check linked PRs from agents
3. Review and provide feedback
4. Merge when satisfied

### 4. Sprint Management

#### Sprint Planning
1. **Monday Morning**
   - Review backlog
   - Assign sprint issues
   - Set sprint goals
   - Assign AI agent tasks

2. **Issue Prioritization**
   - P0: Critical bugs, security issues
   - P1: Core features, major bugs
   - P2: Enhancements, minor bugs
   - P3: Nice-to-have, technical debt

#### Daily Standups
Post in Linear issue comments:
```
**Yesterday:** Completed checkpoint API (WR-123)
**Today:** Starting monitoring dashboard (WR-124)
**Blockers:** Need AWS credentials for testing
```

#### Sprint Review
- Demo completed features
- Review AI agent contributions
- Update roadmap
- Archive completed issues

### 5. Issue Management Best Practices

#### Issue Titles
```
✅ Good:
- "Add database checkpoint restoration API"
- "Fix memory leak in automation engine"
- "Update checkpoint documentation"

❌ Bad:
- "Bug"
- "Add feature"
- "Fix stuff"
```

#### Description Format
```markdown
## Problem
The checkpoint system lacks monitoring capabilities.

## Solution
Add comprehensive monitoring dashboard with:
- Real-time checkpoint status
- Historical success rates
- Storage usage metrics

## Technical Details
- Use existing analytics WebSocket
- Store metrics in Redis
- 5-minute aggregation intervals

## Acceptance Criteria
- [ ] Dashboard displays all checkpoint types
- [ ] Real-time updates via WebSocket
- [ ] Export functionality for reports
- [ ] Mobile responsive design
```

### 6. Automation Examples

#### Linear + GitHub Actions
```yaml
name: Linear Integration
on:
  pull_request:
    types: [opened, closed]

jobs:
  update-linear:
    runs-on: ubuntu-latest
    steps:
      - name: Update Linear Issue
        uses: linear/linear-action@v1
        with:
          api-key: ${{ secrets.LINEAR_API_KEY }}
          issue-id: ${{ github.event.pull_request.title }}
          status: ${{ github.event.action == 'closed' && 'Done' || 'In Review' }}
```

#### Webhook Handler
```python
@app.post("/webhooks/linear")
async def handle_linear_webhook(request: Request):
    data = await request.json()
    
    if data["type"] == "Issue" and data["action"] == "update":
        issue = data["data"]
        
        # Trigger automation based on status
        if issue["state"]["name"] == "In Progress":
            await assign_ai_agent_if_needed(issue)
        elif issue["state"]["name"] == "Done":
            await trigger_deployment_check(issue)
    
    return {"status": "processed"}
```

### 7. Common Scenarios

#### Hotfix Process
1. Create issue with `hotfix` label
2. Assign to both human and AI agent
3. Fast-track through workflow
4. Deploy immediately after review

#### Feature Development
1. Create epic for large features
2. Break into subtasks
3. Assign research tasks to AI
4. Human implements core logic
5. AI handles tests and docs

#### Bug Triage
1. AI agent does initial analysis
2. Assigns priority based on impact
3. Routes to appropriate team
4. Tracks resolution time

### 8. Metrics Dashboard

Track in Linear's Insights:
- **Velocity**: Story points per sprint
- **AI Efficiency**: Agent task completion rate
- **Bug Resolution**: Time to fix by priority
- **Feature Delivery**: Features shipped monthly

### 9. Tips and Tricks

#### Keyboard Shortcuts
- `C` - Create new issue
- `G then I` - Go to inbox
- `/` - Search everything
- `Cmd+K` - Command palette

#### Bulk Operations
- Select multiple issues with checkboxes
- Update status, labels, assignee together
- Archive completed sprints

#### Custom Workflows
- Create custom issue statuses
- Set up automation rules
- Define team-specific workflows

### 10. Troubleshooting

#### AI Agent Not Responding
1. Check agent permissions in Linear
2. Verify @mention format
3. Ensure issue is assigned to agent
4. Check agent's workload

#### Integration Issues
1. Verify API key is valid
2. Check webhook URL is correct
3. Review Linear audit logs
4. Test with Linear API directly

## Next Steps

1. **Install Linear Desktop App** for better performance
2. **Set up Linear CLI** for command-line access
3. **Configure Slack integration** for notifications
4. **Train team** on AI agent usage
5. **Customize workflows** for your team

## Resources

- [Linear Keyboard Shortcuts](https://linear.app/docs/keyboard-shortcuts)
- [Linear API Reference](https://developers.linear.app)
- [Linear AI Agents Guide](https://linear.app/agents)
- [War Room Linear Templates](/templates/linear)