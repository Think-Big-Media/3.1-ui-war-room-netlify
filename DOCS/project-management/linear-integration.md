# Linear Integration Guide for War Room

## Overview

This guide outlines how War Room uses Linear for project management, including AI agents, issue tracking, and development workflows.

## Linear AI Agents

### What Are Linear AI Agents?

Linear AI agents are autonomous teammates that can:
- Be assigned to issues like regular team members
- Be @mentioned in comments for specific tasks
- Have their own user profiles showing work progress
- Update issue statuses and create PRs
- Provide feedback and documentation

### Available AI Agents for War Room

1. **Codegen Agent**
   - Builds features and debugs issues
   - Answers codebase questions
   - Can be assigned to implementation tasks

2. **ChatPRD Agent**
   - Writes product requirements
   - Manages issues and specifications
   - Provides feedback on product work

3. **Devin Agent**
   - Scopes technical issues
   - Drafts pull requests
   - Helps with code reviews

4. **Custom War Room Agent** (Future)
   - Campaign analytics automation
   - Volunteer coordination tasks
   - Event management assistance

## Project Structure in Linear

### Teams
- **War Room Core** - Main development team
- **War Room QA** - Testing and quality assurance
- **War Room DevOps** - Infrastructure and deployment

### Projects
1. **WR-Backend** - API and server development
2. **WR-Frontend** - UI/UX development
3. **WR-Infrastructure** - AWS migration, Railway deployment
4. **WR-AI** - Document intelligence, automation engine
5. **WR-Mobile** - Future mobile app development

### Labels
- `bug` - Something isn't working
- `feature` - New functionality
- `enhancement` - Improvement to existing features
- `documentation` - Documentation updates
- `performance` - Performance improvements
- `security` - Security-related issues
- `checkpoint` - Checkpoint system related
- `deployment` - Deployment and infrastructure
- `ai-agent` - Tasks suitable for AI agents

### Issue Templates

#### Bug Report
```
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. ...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Browser/OS:
- Version:
- Component: [Frontend/Backend/Infrastructure]

**Screenshots**
If applicable
```

#### Feature Request
```
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should we solve it?

**Acceptance Criteria**
- [ ] Criterion 1
- [ ] Criterion 2

**Technical Considerations**
Any technical constraints or considerations

**Priority**
[Critical/High/Medium/Low]
```

#### AI Agent Task
```
**Task Type**
[Implementation/Documentation/Analysis/Testing]

**Description**
What needs to be done

**Context**
Relevant files, PRs, or documentation

**Deliverables**
- [ ] Deliverable 1
- [ ] Deliverable 2

**Agent Assignment**
@codegen / @chatprd / @devin

**Success Criteria**
How we'll know the task is complete
```

## Workflow Integration

### Development Workflow

1. **Issue Creation**
   - Create issue in Linear with appropriate template
   - Add labels and assign to project
   - Optionally assign to AI agent for initial work

2. **Branch Naming**
   ```
   feature/WR-123-checkpoint-system
   fix/WR-456-auth-bug
   chore/WR-789-update-deps
   ```

3. **Commit Messages**
   ```
   feat(WR-123): Add checkpoint system for workflows
   fix(WR-456): Resolve authentication timeout issue
   docs(WR-789): Update deployment documentation
   ```

4. **Pull Request**
   - Title: `WR-123: Add checkpoint system`
   - Description links to Linear issue
   - Linear automatically updates issue status

### AI Agent Workflow

1. **Assigning to Agents**
   ```
   @codegen can you implement the checkpoint API endpoints based on the specification in this issue?
   ```

2. **Agent Collaboration**
   - Agents respond in comments
   - Show their work via linked PRs
   - Update issue status automatically

3. **Human Review**
   - Review agent's work
   - Provide feedback
   - Merge when ready

### Status Workflow

1. **Backlog** - Not started
2. **Todo** - Ready to start
3. **In Progress** - Being worked on
4. **In Review** - PR submitted
5. **Done** - Completed and merged
6. **Canceled** - Won't be done

## Automation Rules

### Auto-Assignment
- Security issues → Security team lead
- Frontend bugs → Frontend team
- AI tasks → Appropriate AI agent

### Status Updates
- PR created → "In Review"
- PR merged → "Done"
- Issue inactive 30 days → Add "stale" label

### Notifications
- Critical bugs → Slack alert
- Deployment issues → PagerDuty
- Sprint completion → Team summary

## Best Practices

### For Human Team Members
1. Write clear issue descriptions
2. Use templates consistently
3. Link related issues
4. Update status promptly
5. @mention AI agents for appropriate tasks

### For AI Agent Tasks
1. Provide clear context and requirements
2. Include relevant code snippets or files
3. Specify deliverables explicitly
4. Review agent work thoroughly
5. Provide feedback for improvements

### Issue Hygiene
1. Close duplicate issues
2. Keep descriptions updated
3. Remove outdated labels
4. Archive completed projects
5. Regular backlog grooming

## Integration with War Room

### Code Integration
```typescript
// Linear webhook handler
app.post('/webhooks/linear', async (req, res) => {
  const { action, data } = req.body;
  
  if (action === 'Issue' && data.state === 'Done') {
    // Trigger deployment check
    await createDeploymentCheckpoint();
  }
});
```

### Analytics Integration
- Track issue completion rates
- Monitor AI agent performance
- Measure sprint velocity
- Analyze bug resolution time

## Metrics and Reporting

### Key Metrics
- **Velocity**: Story points per sprint
- **Cycle Time**: Time from start to done
- **AI Agent Efficiency**: Tasks completed by agents
- **Bug Resolution**: Time to fix critical bugs
- **Feature Delivery**: Features shipped per month

### Regular Reviews
- **Daily**: Check AI agent assignments
- **Weekly**: Sprint progress review
- **Monthly**: Velocity and metrics review
- **Quarterly**: Project roadmap update

## Security Considerations

1. **API Keys**: Store Linear API keys securely
2. **Webhooks**: Validate webhook signatures
3. **Permissions**: Limit AI agent permissions
4. **Audit Trail**: Track all agent actions
5. **Data Privacy**: Don't expose sensitive data in issues

## Future Enhancements

1. **Custom War Room Agent**
   - Specialized for campaign management
   - Integrates with War Room API
   - Handles routine campaign tasks

2. **Advanced Analytics**
   - Linear data in War Room dashboards
   - Predictive sprint planning
   - Team performance insights

3. **Bi-directional Sync**
   - War Room events create Linear issues
   - Linear updates trigger War Room actions
   - Full workflow automation

## Resources

- [Linear API Documentation](https://developers.linear.app)
- [Linear for Agents](https://linear.app/agents)
- [Linear MCP Server](https://github.com/linear/linear-mcp)
- [War Room Linear Integration](/api/v1/integrations/linear)