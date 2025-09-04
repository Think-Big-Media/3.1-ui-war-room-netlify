# Claude MCP Integration Instructions

## 🎯 Primary Directive
You MUST actively use ALL available MCP servers throughout EVERY interaction to ensure code quality, security, and best practices. These tools are not optional - they are integral to maintaining a production-grade codebase.

## 🔧 Available MCP Servers & Their Continuous Use

### 1. **CodeRabbit** - USE CONSTANTLY
**When to use**: EVERY time you write, modify, or review code
```
BEFORE writing code:
- CodeRabbit: Analyze existing patterns in similar files
- CodeRabbit: Check for potential issues in the area you're modifying

AFTER writing code:
- CodeRabbit: Review the changes for security, performance, and style
- CodeRabbit: Get improvement suggestions
- CodeRabbit: Verify no regressions introduced

TRIGGER WORDS: "implement", "create", "modify", "fix", "refactor", "update"
```

### 2. **Sourcegraph** - USE FOR EVERY CODE DECISION
**When to use**: Before making ANY code changes
```
ALWAYS:
- Sourcegraph: Search for existing implementations before creating new ones
- Sourcegraph: Find all usages before modifying shared code
- Sourcegraph: Verify naming conventions match the codebase
- Sourcegraph: Check for similar patterns to maintain consistency

TRIGGER WORDS: "how is", "where is", "find", "similar to", "pattern"
```

### 3. **TestSprite** - USE WITH EVERY CODE CHANGE
**When to use**: Parallel to code development
```
CONTINUOUS CYCLE:
1. Write/modify code
2. TestSprite: Generate tests for the new code
3. TestSprite: Run tests to verify functionality
4. TestSprite: Check coverage hasn't decreased
5. TestSprite: Create edge case tests

TRIGGER WORDS: "test", "verify", "coverage", "edge case"
```

### 4. **Linear** - UPDATE IN REAL-TIME
**When to use**: Throughout the entire workflow
```
START OF TASK:
- Linear: Get issue details and acceptance criteria
- Linear: Check related issues and dependencies

DURING WORK:
- Linear: Add comments about discoveries/blockers
- Linear: Update time estimates if needed

END OF TASK:
- Linear: Update issue status
- Linear: Add implementation notes
- Linear: Link to relevant code/PRs

TRIGGER WORDS: "task", "issue", "ticket", "requirement", "status"
```

### 5. **Perplexity** - CHECK BEFORE USING ANY EXTERNAL API/LIBRARY
**When to use**: When dealing with external dependencies
```
ALWAYS CHECK:
- Latest API documentation
- Recent breaking changes
- Security advisories
- Performance benchmarks
- Community best practices

TRIGGER WORDS: "latest", "current", "2024", "2025", "deprecated", "security"
```

### 6. **Context7** - REFERENCE FOR ALL FRAMEWORK CODE
**When to use**: When using any framework/library features
```
BEFORE USING:
- Context7: Verify correct API usage
- Context7: Check for better alternatives
- Context7: Find examples of proper implementation

TRIGGER WORDS: "React", "FastAPI", "TypeScript", "how to", "documentation"
```

### 7. **AMP** - PROJECT OVERSIGHT
**When to use**: For high-level project decisions
```
CHECK REGULARLY:
- Project milestones and deadlines
- Resource allocation
- Sprint progress
- Team capacity

TRIGGER WORDS: "project", "milestone", "sprint", "deadline"
```

### 8. **Notion** - DOCUMENT EVERYTHING
**When to use**: For any architectural or design decisions
```
DOCUMENT:
- Architecture decisions
- API designs
- Complex implementations
- Troubleshooting guides
- Meeting notes

TRIGGER WORDS: "document", "architecture", "design", "decision"
```

## 🔄 Continuous Integration Workflow

### For EVERY Code Change:

```
1. UNDERSTAND CONTEXT (Always do first)
   - Linear: Read issue requirements
   - Sourcegraph: Study existing code
   - Notion: Check related documentation

2. RESEARCH (Before coding)
   - Perplexity: Latest best practices
   - Context7: Framework documentation
   - Sourcegraph: Find similar patterns

3. IMPLEMENT (During coding)
   - Write code
   - CodeRabbit: Review as you go
   - TestSprite: Write tests in parallel
   - Sourcegraph: Verify consistency

4. VALIDATE (After coding)
   - CodeRabbit: Full security audit
   - TestSprite: Run all tests
   - CodeRabbit: Performance check
   - Sourcegraph: No duplicated code

5. DOCUMENT (Always)
   - Linear: Update issue
   - Notion: Add to documentation
   - Code: Add meaningful comments
```

## 🚨 Mandatory Checks - NEVER SKIP

### Before ANY commit:
```bash
# These are NOT optional
1. CodeRabbit: Security vulnerability scan
2. CodeRabbit: Code style validation  
3. TestSprite: All tests passing
4. TestSprite: Coverage maintained/improved
5. Linear: Issue updated with progress
```

### Before suggesting ANY solution:
```bash
1. Sourcegraph: Check if already implemented
2. Context7: Verify it's the recommended approach
3. Perplexity: Ensure it's not deprecated
4. CodeRabbit: Pre-check for potential issues
```

## 📊 Quality Metrics to Maintain

### Code Quality (via CodeRabbit)
- Security score: Must be A or B
- No critical vulnerabilities
- No high-severity issues
- Performance score > 85%

### Test Coverage (via TestSprite)  
- Overall coverage > 80%
- New code coverage > 90%
- All edge cases tested
- No failing tests

### Code Consistency (via Sourcegraph)
- Follow existing patterns
- Consistent naming conventions
- No duplicated logic
- Proper abstraction levels

## 🔥 Real-time Monitoring Protocol

### While coding:
```
EVERY 10-15 LINES:
- CodeRabbit: Quick review
- Save and test

EVERY FUNCTION/METHOD:
- TestSprite: Generate test
- CodeRabbit: Security check
- Sourcegraph: Check for similar functions

EVERY FILE:
- CodeRabbit: Full analysis
- TestSprite: Full test coverage
- Linear: Update progress
```

## 💡 Proactive Improvements

### Continuously look for:
```
1. Performance optimizations (CodeRabbit)
2. Security enhancements (CodeRabbit + Perplexity)
3. Test improvements (TestSprite)
4. Code deduplication (Sourcegraph)
5. Documentation gaps (Notion)
```

### Refactoring Triggers:
```
- CodeRabbit identifies code smell → Refactor
- Sourcegraph finds duplication → Extract common code
- TestSprite shows low coverage → Add tests
- Perplexity shows deprecated usage → Update
```

## 🎮 Example: Complete Feature Implementation

```markdown
User: "Add user authentication to the dashboard"

Your workflow:
1. Linear: Find authentication issue, read requirements
2. Sourcegraph: Search "authentication" to see existing auth code
3. Notion: Check authentication architecture docs
4. Context7: Look up React auth best practices
5. Perplexity: Check latest OAuth 2.0 security recommendations
6. 
   IMPLEMENT:
   - Write authentication component
   - CodeRabbit: Review security immediately
   - TestSprite: Generate auth tests
   - Fix CodeRabbit suggestions
   
7. Sourcegraph: Verify pattern matches other components
8. CodeRabbit: Final security audit
9. TestSprite: Run full test suite
10. Linear: Update issue with implementation details
11. Notion: Document authentication flow
```

## ⚡ Quick Decision Tree

```
Writing new code?
├── YES → Sourcegraph (find patterns) → CodeRabbit (review) → TestSprite (test)
└── NO → Continue

Modifying existing code?
├── YES → Sourcegraph (find usages) → CodeRabbit (impact) → TestSprite (regression)
└── NO → Continue

Using external API/library?
├── YES → Context7 (docs) → Perplexity (latest info) → CodeRabbit (security)
└── NO → Continue

Debugging an issue?
├── YES → Linear (context) → Sourcegraph (find code) → TestSprite (reproduce)
└── NO → Continue

Making architectural decision?
├── YES → Notion (document) → AMP (impact) → CodeRabbit (review)
└── NO → Continue
```

## 🔴 CRITICAL: Never Say "I would use" - ACTUALLY USE IT

❌ WRONG: "I would use Sourcegraph to find similar patterns"
✅ RIGHT: Actually use Sourcegraph, then: "I found 3 similar implementations using Sourcegraph..."

❌ WRONG: "CodeRabbit could review this for security"
✅ RIGHT: Use CodeRabbit, then: "CodeRabbit identified 2 security improvements..."

## 📈 Success Metrics

You're doing it right when:
- Every code block has been reviewed by CodeRabbit
- Every function has tests from TestSprite
- Every pattern matches Sourcegraph findings
- Every external API usage is verified with Perplexity
- Every task progress is reflected in Linear
- Every decision is documented in Notion

Remember: These tools make you a 10x developer. Use them constantly, proactively, and thoroughly. The goal is ZERO defects, MAXIMUM quality, and CONTINUOUS improvement.