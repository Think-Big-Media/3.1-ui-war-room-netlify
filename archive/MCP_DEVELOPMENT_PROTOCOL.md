# MCP Development Protocol for War Room Project

## Overview
This protocol defines how to effectively use all available MCP (Model Context Protocol) servers to create a comprehensive, AI-powered development workflow for the War Room project.

## Available MCP Servers

### 1. **CodeRabbit** - AI Code Review & Analysis
- Automated code review
- Security vulnerability detection
- Performance optimization suggestions
- Best practices enforcement

### 2. **Sourcegraph** - Code Intelligence & Search
- Semantic code search across repositories
- Find references and implementations
- Code navigation and understanding
- Cross-repository insights

### 3. **AMP (Authenticated MCP)** - Project Management
- Sprint planning and tracking
- Task assignment and prioritization
- Progress monitoring
- Team collaboration

### 4. **TestSprite** - Automated Testing
- Test generation and execution
- Coverage analysis
- Regression testing
- Performance testing

### 5. **Linear** - Issue Tracking & Workflow
- Issue creation and management
- Sprint planning
- Roadmap visualization
- Team workload balancing

### 6. **Perplexity** - Real-time Information
- Current API documentation
- Latest framework updates
- Security advisories
- Industry best practices

### 7. **Context7** - Documentation Search
- Framework documentation
- Library references
- Code examples
- Migration guides

### 8. **Notion** - Knowledge Management
- Project documentation
- Meeting notes
- Architecture decisions
- Team wiki

## Development Workflow Protocol

### Phase 1: Planning & Discovery

#### 1.1 Requirements Gathering
```
1. Use Linear to review current sprint issues
2. Use AMP to check project priorities
3. Use Notion to review requirements documentation
4. Use Perplexity to research current best practices
```

**Example Command Sequence:**
```
- Linear: Get all issues in current sprint
- AMP: Check project milestones and deadlines
- Notion: Search for "requirements" or "PRD"
- Perplexity: Search for "[technology] best practices 2025"
```

#### 1.2 Technical Research
```
1. Use Sourcegraph to understand existing codebase
2. Use Context7 for framework documentation
3. Use Perplexity for latest updates/deprecations
4. Use CodeRabbit to analyze current code quality
```

**Example Command Sequence:**
```
- Sourcegraph: Search for similar implementations
- Context7: Get React/FastAPI documentation
- Perplexity: Check for breaking changes in dependencies
- CodeRabbit: Analyze existing module for patterns
```

### Phase 2: Implementation

#### 2.1 Code Development
```
1. Use Sourcegraph to find code patterns
2. Use Context7 for API references
3. Use CodeRabbit for real-time code review
4. Use TestSprite to generate tests
```

**Development Loop:**
```
REPEAT:
  1. Sourcegraph: Find similar code patterns
  2. Implement feature
  3. CodeRabbit: Review implementation
  4. Fix issues identified by CodeRabbit
  5. TestSprite: Generate/update tests
UNTIL: CodeRabbit approves && Tests pass
```

#### 2.2 Testing Strategy
```
1. TestSprite: Generate comprehensive test suite
2. TestSprite: Run tests with coverage analysis
3. CodeRabbit: Review test quality
4. Linear: Update issue with test results
```

### Phase 3: Review & Integration

#### 3.1 Code Review Process
```
1. CodeRabbit: Automated security scan
2. CodeRabbit: Performance analysis
3. Sourcegraph: Check for code duplication
4. Linear: Create review checklist
```

#### 3.2 Documentation
```
1. Notion: Update technical documentation
2. CodeRabbit: Generate code documentation
3. Linear: Update issue documentation
4. AMP: Update project wiki
```

### Phase 4: Deployment & Monitoring

#### 4.1 Pre-deployment
```
1. TestSprite: Run full regression suite
2. CodeRabbit: Final security audit
3. Linear: Check deployment checklist
4. AMP: Verify deployment approval
```

#### 4.2 Post-deployment
```
1. TestSprite: Run smoke tests
2. Linear: Update issue status
3. Notion: Document deployment notes
4. AMP: Update project status
```

## Specific Use Cases

### Use Case 1: Adding a New Feature

```markdown
1. **Planning**
   - Linear: Create feature issue with acceptance criteria
   - AMP: Assign to sprint and set priority
   - Notion: Document feature requirements

2. **Research**
   - Sourcegraph: Find similar features in codebase
   - Context7: Research required APIs/libraries
   - Perplexity: Check for security considerations

3. **Implementation**
   - Write code following patterns from Sourcegraph
   - CodeRabbit: Continuous review during development
   - TestSprite: Generate tests for new code

4. **Integration**
   - CodeRabbit: Final review and approval
   - Linear: Update issue with PR link
   - Notion: Update feature documentation
```

### Use Case 2: Debugging Production Issue

```markdown
1. **Investigation**
   - Linear: Create bug report with details
   - Sourcegraph: Search for error patterns
   - Perplexity: Search for known issues

2. **Analysis**
   - CodeRabbit: Analyze problematic code
   - TestSprite: Create failing test case
   - Sourcegraph: Find all affected code paths

3. **Resolution**
   - Fix issue based on analysis
   - TestSprite: Verify fix with tests
   - CodeRabbit: Review fix for side effects

4. **Documentation**
   - Linear: Document root cause
   - Notion: Add to troubleshooting guide
   - AMP: Update incident report
```

### Use Case 3: Security Audit

```markdown
1. **Scanning**
   - CodeRabbit: Run security audit on codebase
   - Perplexity: Check latest security advisories
   - Sourcegraph: Find all authentication code

2. **Analysis**
   - CodeRabbit: Deep dive on vulnerabilities
   - Context7: Review security best practices
   - TestSprite: Create security test suite

3. **Remediation**
   - Fix vulnerabilities identified
   - CodeRabbit: Verify fixes
   - TestSprite: Run security tests

4. **Documentation**
   - Linear: Track security issues
   - Notion: Update security documentation
   - AMP: Report security status
```

## Command Templates

### Daily Development Flow
```
Morning:
1. Linear: Get my assigned issues
2. AMP: Check sprint progress
3. Sourcegraph: Review yesterday's code changes

During Development:
1. Sourcegraph: Search for code patterns
2. Context7: Look up API documentation
3. CodeRabbit: Review code changes
4. TestSprite: Run relevant tests

End of Day:
1. Linear: Update issue progress
2. CodeRabbit: Final code review
3. Notion: Update documentation
4. AMP: Log time and progress
```

### Code Review Protocol
```
1. CodeRabbit: Analyze PR for:
   - Security vulnerabilities
   - Performance issues
   - Code style violations
   - Test coverage

2. Sourcegraph: Check for:
   - Code duplication
   - Pattern consistency
   - Cross-cutting concerns

3. TestSprite: Verify:
   - All tests pass
   - Coverage thresholds met
   - No regression

4. Linear: Update issue status
```

### Emergency Response Protocol
```
1. Linear: Create P0 issue
2. Sourcegraph: Find error location
3. Perplexity: Search for immediate fixes
4. CodeRabbit: Quick security check
5. TestSprite: Verify fix doesn't break anything
6. AMP: Notify stakeholders
```

## Best Practices

### 1. Always Start with Context
- Use Sourcegraph to understand existing code
- Use Notion to check documentation
- Use Linear to understand requirements

### 2. Continuous Validation
- Use CodeRabbit throughout development
- Use TestSprite for immediate test feedback
- Use Sourcegraph to ensure consistency

### 3. Document Everything
- Use Notion for permanent documentation
- Use Linear for issue-specific notes
- Use AMP for project-level documentation

### 4. Security First
- Use CodeRabbit for every code change
- Use Perplexity for security updates
- Use TestSprite for security testing

## Integration Points

### Git Workflow
```
pre-commit:
  - CodeRabbit: Lint and security check
  - TestSprite: Run unit tests

pre-push:
  - CodeRabbit: Full analysis
  - TestSprite: Run integration tests
  - Linear: Update issue status
```

### CI/CD Pipeline
```
on-pr:
  - CodeRabbit: Automated review
  - TestSprite: Full test suite
  - Sourcegraph: Code quality check
  - Linear: Update PR status

on-merge:
  - AMP: Update project progress
  - Notion: Update documentation
  - Linear: Close related issues
```

## Troubleshooting MCP Servers

### If a server is not responding:
1. Check server status in MCP dashboard
2. Restart the specific MCP server
3. Verify authentication credentials
4. Check network connectivity

### Common Issues:
- **TestSprite**: Ensure project ID is configured
- **Sourcegraph**: Verify repository access
- **Linear**: Check API key permissions
- **CodeRabbit**: Ensure GitHub integration

## Metrics & Reporting

### Weekly Metrics to Track:
1. **CodeRabbit**: Issues found/fixed ratio
2. **TestSprite**: Test coverage percentage
3. **Linear**: Issue velocity
4. **AMP**: Sprint completion rate

### Monthly Reports:
1. Use AMP to generate project reports
2. Use Linear for velocity trends
3. Use CodeRabbit for code quality trends
4. Use TestSprite for test health

---

## Quick Reference Card

```
🔍 Research & Discovery
- Sourcegraph: Find code patterns
- Context7: Get documentation
- Perplexity: Current best practices

📝 Planning & Tracking
- Linear: Issue management
- AMP: Project oversight
- Notion: Documentation

🔨 Development & Testing
- CodeRabbit: Code review
- TestSprite: Test automation
- Sourcegraph: Code intelligence

🚀 Deployment & Monitoring
- All servers for final validation
- Update all tracking systems
- Document in Notion
```

This protocol ensures maximum efficiency and quality by leveraging the strengths of each MCP server throughout the development lifecycle.