# Claude Code Prompt Examples

This document provides comprehensive examples of properly formatted Claude Code prompts for common War Room development tasks.

## 📁 File Operations

### Creating Files

```
CC main agent - Create new React component:
1. Create file src/components/dashboard/MetricsCard.tsx
2. Add TypeScript React functional component boilerplate
3. Include proper imports for React and types
4. Add export statement
5. Verify file creation and syntax
```

### Searching Files

```
CC main agent - Find all API endpoint definitions:
1. Search for files containing "@router" decorator
2. List all matching files with line numbers
3. Group by API version (v1, v2, etc.)
4. Display summary count of endpoints
```

### Modifying Files

```
CC main agent - Update component styling:
1. Open src/components/AlertCard.tsx
2. Add Tailwind classes for dark mode support
3. Update hover states for better UX
4. Ensure responsive design
5. Display the modified sections
```

## 🧪 Testing Operations

### Running All Tests

```
CC main agent - Execute full test suite:
1. Run frontend tests with coverage
2. Run backend tests with coverage
3. Generate combined coverage report
4. Display failed tests if any
5. Show coverage summary percentages
```

### Testing Specific Features

```
CC main agent - Test authentication flow:
1. Run auth-related test files
2. Test login endpoint
3. Test token refresh
4. Test logout functionality
5. Display test results with timing
```

### Debugging Failed Tests

```
CC main agent - Debug failing test:
1. Run the failing test in isolation
2. Display full error message and stack trace
3. Show the test file content around failure
4. Check related component for issues
5. Suggest potential fixes
```

## 🚀 Deployment Operations

### Pre-deployment Checks

```
CC main agent - Validate deployment readiness:
1. Check for uncommitted changes
2. Run all tests
3. Verify build completes successfully
4. Check environment variables are set
5. Display readiness report
```

### Deployment Process

```
CC main agent - Deploy to production:
1. Push changes to main branch
2. Monitor Render build logs
3. Wait for deployment completion
4. Run health check validation
5. Display deployment URL and status
```

### Post-deployment Validation

```
CC main agent - Validate live deployment:
1. Check all health endpoints
2. Test critical user flows
3. Verify frontend assets loading
4. Check API response times
5. Generate validation report
```

## 🔧 Development Environment

### Starting Development

```
CC main agent - Start full development environment:
1. Check Python and Node versions
2. Install/update dependencies if needed
3. Start backend server on port 8000
4. Start frontend server on port 5173
5. Open browser to localhost:5173
6. Display both server logs
```

### Environment Configuration

```
CC main agent - Configure development environment:
1. Create .env.local from template
2. Check for required API keys
3. Validate Supabase connection
4. Test Redis connection
5. Display configuration status
```

### Cleaning Environment

```
CC main agent - Clean development environment:
1. Stop all running servers
2. Clear npm cache
3. Remove node_modules
4. Clean Python cache files
5. Reset to clean state
```

## 🐛 Debugging Operations

### API Debugging

```
CC main agent - Debug API endpoint issue:
1. Test the specific endpoint with curl
2. Check server logs for errors
3. Verify request/response format
4. Test with different parameters
5. Display diagnostic information
```

### Frontend Debugging

```
CC main agent - Debug React component:
1. Check browser console for errors
2. Verify component props
3. Check Redux state if applicable
4. Test component in isolation
5. Display potential issues
```

### Database Debugging

```
CC main agent - Debug database connection:
1. Test database connection
2. Check migration status
3. Verify table existence
4. Test sample query
5. Display connection details
```

## 📊 Performance Operations

### Performance Testing

```
CC main agent - Run performance benchmarks:
1. Start performance test suite
2. Test API endpoint response times
3. Measure frontend load times
4. Check memory usage
5. Generate performance report
```

### Performance Optimization

```
CC main agent - Optimize slow endpoint:
1. Profile the endpoint execution
2. Identify bottlenecks
3. Add appropriate caching
4. Test optimized version
5. Compare before/after metrics
```

## 🔒 Security Operations

### Security Scanning

```
CC main agent - Run security audit:
1. Check for npm vulnerabilities
2. Run Python security scan
3. Check for exposed secrets
4. Verify CORS configuration
5. Generate security report
```

### Security Updates

```
CC main agent - Apply security patches:
1. Update vulnerable dependencies
2. Test after updates
3. Verify functionality unchanged
4. Update lock files
5. Display update summary
```

## 📝 Documentation Operations

### Generating Documentation

```
CC main agent - Generate API documentation:
1. Extract all endpoint definitions
2. Document request/response formats
3. Include example payloads
4. Generate markdown file
5. Update API_DOCS.md
```

### Updating Documentation

```
CC main agent - Update feature documentation:
1. Find relevant documentation files
2. Update with new feature details
3. Add code examples
4. Update table of contents
5. Display changed sections
```

## 🌐 Browser Automation (Comet)

### Environment Configuration

```
CC comet agent - Configure Render environment:
1. Navigate to https://dashboard.render.com
2. Select "war-room" service
3. Go to Environment section
4. Add required API keys
5. Save and trigger redeploy
```

### Testing User Flows

```
CC comet agent - Test user registration flow:
1. Navigate to https://war-room-oa9t.onrender.com
2. Click "Sign Up" button
3. Fill registration form
4. Submit and verify success
5. Check for confirmation email
```

## 🛠️ Git Operations

### Creating Features

```
CC main agent - Start new feature development:
1. Create branch feature/user-analytics
2. Update TASK.md with feature plan
3. Create initial file structure
4. Make initial commit
5. Push branch to remote
```

### Code Review Preparation

```
CC main agent - Prepare for code review:
1. Run all tests
2. Check code coverage
3. Run linting
4. Create pull request description
5. Display PR summary
```

### Merging Changes

```
CC main agent - Merge feature to main:
1. Check PR approval status
2. Update from main branch
3. Resolve any conflicts
4. Run final tests
5. Merge and delete feature branch
```

## 📋 Task Management

### Daily Planning

```
CC main agent - Start daily development:
1. Display current tasks from TASK.md
2. Check PR review requests
3. Show failing tests if any
4. List high-priority bugs
5. Create today's task list
```

### Progress Updates

```
CC main agent - Update task progress:
1. Mark completed tasks in TASK.md
2. Add new discovered tasks
3. Update time estimates
4. Commit task updates
5. Display remaining work
```

## ⚠️ Error Recovery

### Build Failures

```
CC main agent - Fix build failure:
1. Display full build error
2. Identify the failing module
3. Check recent changes
4. Apply fix
5. Verify build succeeds
```

### Server Crashes

```
CC main agent - Diagnose server crash:
1. Check error logs
2. Identify crash point
3. Check memory usage
4. Test with minimal config
5. Display diagnostic summary
```

## 🎯 Best Practices

### Always Include Verification

Every prompt should end with a verification step:
- Display confirmation of success
- Show relevant output
- Verify expected state

### Be Specific About Locations

Always specify exact paths and locations:
- Use full file paths
- Specify port numbers
- Include URL endpoints

### Handle Failures Gracefully

Include error handling in prompts:
- Check for success/failure
- Provide clear error messages
- Suggest recovery steps

---

Remember: **NO raw commands, NO mixed prose and code.** Every technical instruction must be a properly formatted Claude Code prompt.

*Last updated: August 2025*