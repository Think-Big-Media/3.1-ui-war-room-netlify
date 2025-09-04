# War Room Contributor Checklist

## 🚨 Pre-Contribution Prompt Hygiene Checklist

Before submitting any pull request, documentation update, or issue, verify that your contribution follows the War Room CTO Communication Protocol.

### ✅ Documentation Checklist

- [ ] **NO raw command line instructions** anywhere in documentation
- [ ] **NO code blocks mixed with prose** - instructions are clear and separated
- [ ] **ALL technical tasks** use "CC main agent" format
- [ ] **ALL browser tasks** use "CC comet agent" format
- [ ] **Manual actions** clearly marked with "MANUAL ACTION REQUIRED:"
- [ ] **Verification steps** included in every prompt
- [ ] **Complex tasks** broken into numbered steps
- [ ] **Examples follow** the approved format

### ✅ Code Comment Checklist

- [ ] **NO command examples** in code comments (e.g., no `// Run: npm test`)
- [ ] **Setup instructions** reference documentation, not inline commands
- [ ] **Error messages** don't suggest raw commands to users
- [ ] **README files** in subdirectories follow prompt hygiene

### ✅ Issue/PR Description Checklist

- [ ] **Reproduction steps** use Claude Code prompts
- [ ] **Fix verification** uses Claude Code prompts
- [ ] **Testing instructions** follow the protocol
- [ ] **Deployment steps** properly formatted

## 📝 Pull Request Template

When creating a PR, use this template:

```markdown
## Description
[Brief description of changes]

## Testing Instructions

CC main agent - Test this PR:
1. Check out this branch
2. Install any new dependencies
3. Run the test suite
4. Verify [specific feature] works
5. Check for regressions in [related area]

## Verification

CC main agent - Verify changes:
1. All tests pass
2. No new linting errors
3. Documentation updated
4. Prompt hygiene followed
```

## 🔍 Self-Review Questions

Before submitting, ask yourself:

1. **Can Claude Code execute every instruction without human interpretation?**
2. **Are all manual steps clearly marked and detailed?**
3. **Would a new developer understand without seeing raw commands?**
4. **Are success criteria clearly defined?**
5. **Do examples show what NOT to do?**

## ❌ Common Violations to Check

### In Documentation

```markdown
❌ "Install dependencies with `npm install`"
❌ "Run `python manage.py migrate` to update the database"
❌ "Use git clone <repo-url> to get started"
```

### In Code Comments

```javascript
❌ // Execute: npm run build
❌ // Run python server.py to start
❌ /* Use curl -X POST... to test */
```

### In Error Messages

```python
❌ raise ValueError("Run 'pip install -r requirements.txt' to fix")
❌ console.error("Execute npm install to resolve")
```

## ✅ Correction Examples

### Documentation Correction

❌ **BEFORE:**
```markdown
To start development, run:
`npm install && npm run dev`
```

✅ **AFTER:**
```markdown
To start development:

CC main agent - Initialize development environment:
1. Install all dependencies
2. Start development server
3. Open browser to http://localhost:5173
4. Verify app loads successfully
```

### Code Comment Correction

❌ **BEFORE:**
```python
# Run: python -m pytest tests/
def test_authentication():
    pass
```

✅ **AFTER:**
```python
# See DOCS/TESTING.md for test execution instructions
def test_authentication():
    pass
```

### Error Message Correction

❌ **BEFORE:**
```javascript
throw new Error('Missing API key. Run: export API_KEY=your-key');
```

✅ **AFTER:**
```javascript
throw new Error('Missing API key. See DOCS/CONFIGURATION.md for setup instructions');
```

## 📋 Final Submission Checklist

- [ ] Ran self-review against this checklist
- [ ] Updated relevant documentation
- [ ] Followed prompt hygiene in all changes
- [ ] Tested using Claude Code prompts
- [ ] PR description uses correct format
- [ ] No raw commands anywhere in submission

## 🚫 Automatic Rejection Criteria

Your contribution will be automatically rejected if:

1. Contains raw command line instructions
2. Mixes prose with code blocks
3. Lacks proper Claude Code formatting
4. Missing verification steps
5. Unclear manual action instructions

## 💡 Tips for Success

1. **When in doubt, check examples** in [CLAUDE_CODE_PROMPT_EXAMPLES.md](CLAUDE_CODE_PROMPT_EXAMPLES.md)
2. **Test your prompts** with Claude Code before submitting
3. **Be explicit** about expected outcomes
4. **Include error handling** in your prompts
5. **Review other merged PRs** for good examples

## 🎯 Remember

Every instruction should be executable by Claude Code without human interpretation. If you find yourself typing a command directly, stop and reformat it as a proper Claude Code prompt.

---

*This checklist is mandatory for all contributors. Non-compliance will result in rejected contributions.*

*Last updated: August 2025*