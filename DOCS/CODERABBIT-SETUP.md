# CodeRabbit Setup Guide for War Room

## Overview
CodeRabbit is an AI-powered code review tool that automatically reviews pull requests, providing insights on code quality, security, and best practices.

## Installation Steps

### 1. Install CodeRabbit GitHub App
1. Go to: https://coderabbit.ai
2. Click "Install" or "Get Started"
3. Select "Think-Big-Media" organization
4. Choose "Only select repositories" and select "1.0-war-room"
5. Click "Install & Authorize"

### 2. Configuration File
The `.github/.coderabbit.yaml` configuration file has been created with War Room-specific settings:

- **Auto-review enabled** for PRs to main/develop branches
- **Security scanning** for vulnerabilities
- **Framework-specific checks** for React/FastAPI
- **Path-based review rules** for frontend/backend
- **Ignored paths** for build artifacts and dependencies

### 3. Verify Installation
After installation, CodeRabbit will:
- Automatically comment on new PRs
- Provide code suggestions and security alerts
- Generate PR summaries
- Be available via `@coderabbitai` mentions in PR comments

### 4. Usage

#### For New Pull Requests:
1. Create a PR as normal
2. CodeRabbit will automatically start reviewing
3. Address any critical issues it identifies
4. Use `@coderabbitai` to ask questions

#### Manual Triggers:
- Comment `@coderabbitai review` to trigger a review
- Comment `@coderabbitai summary` for PR summary
- Comment `@coderabbitai help` for available commands

### 5. Best Practices

1. **Don't ignore security warnings** - CodeRabbit catches common vulnerabilities
2. **Consider performance suggestions** - It identifies inefficient patterns
3. **Use the chat feature** - Ask CodeRabbit to explain complex suggestions
4. **Configure team preferences** - Adjust `.coderabbit.yaml` as needed

### 6. Configuration Customization

The current configuration focuses on:
- React/TypeScript best practices
- FastAPI security patterns
- SQL injection prevention
- XSS prevention
- Test coverage
- Code maintainability

To modify settings, edit `.github/.coderabbit.yaml`

### 7. Troubleshooting

If CodeRabbit isn't working:

1. **Check installation**: 
   - Go to Settings → Integrations → GitHub Apps
   - Verify CodeRabbit is installed and has repo access

2. **Check configuration**:
   - Ensure `.github/.coderabbit.yaml` exists
   - Validate YAML syntax

3. **Check PR status**:
   - CodeRabbit skips draft PRs by default
   - Ensure PR is marked "Ready for review"

4. **Manual trigger**:
   - Comment `@coderabbitai review` on the PR

### 8. Cost Considerations

CodeRabbit pricing tiers:
- **Free tier**: Limited reviews per month
- **Pro tier**: Unlimited reviews, priority support
- **Enterprise**: Custom limits, SLA

Check current usage at: https://app.coderabbit.ai/settings/usage

### 9. Integration with CI/CD

CodeRabbit works alongside our existing CI/CD:
- `frontend-ci.yml` - Runs tests and linting
- `ci-cd.yml` - Full deployment pipeline
- CodeRabbit - Code review and security analysis

All three work together to ensure code quality.

### 10. Team Guidelines

1. **Developers**: Address CodeRabbit comments before requesting human review
2. **Reviewers**: Use CodeRabbit insights to focus on business logic
3. **Maintainers**: Monitor CodeRabbit settings and adjust as needed

---

## Quick Commands Reference

```bash
# In PR comments:
@coderabbitai review          # Trigger full review
@coderabbitai summary         # Generate PR summary
@coderabbitai resolve         # Mark thread as resolved
@coderabbitai help           # Show all commands
@coderabbitai ignore         # Ignore this PR
@coderabbitai configuration  # Show current config
```

## Support

- CodeRabbit Docs: https://docs.coderabbit.ai
- GitHub Issues: https://github.com/coderabbitai/coderabbit/issues
- Email: support@coderabbit.ai

---

*Last updated: 2025-07-22*