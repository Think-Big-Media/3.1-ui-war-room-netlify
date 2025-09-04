# War Room Technical Documentation

This directory contains all technical documentation for the War Room project.

## 🚨 CRITICAL: Prompt Hygiene Protocol

**ALL documentation MUST follow the War Room CTO Communication Protocol.**

### Required Reading (In Order):

1. **[PROMPT_HYGIENE_PROTOCOL.md](PROMPT_HYGIENE_PROTOCOL.md)** - Complete protocol guide
2. **[PROMPT_HYGIENE_QUICK_REFERENCE.md](PROMPT_HYGIENE_QUICK_REFERENCE.md)** - Quick reference card
3. **[CLAUDE_CODE_PROMPT_EXAMPLES.md](CLAUDE_CODE_PROMPT_EXAMPLES.md)** - Comprehensive examples
4. **[CONTRIBUTOR_CHECKLIST.md](CONTRIBUTOR_CHECKLIST.md)** - Pre-submission checklist
5. **[ONBOARDING_GUIDE.md](ONBOARDING_GUIDE.md)** - New developer guide

### Key Rules:
- **NO raw command line instructions** (no `npm`, `git`, `python` commands)
- **NO mixed prose and code blocks**
- **ALWAYS use Claude Code prompt format**
- **ALWAYS mark manual actions clearly**

## 📚 Documentation Index

### Core Documentation
- **[PROMPT_HYGIENE_PROTOCOL.md](PROMPT_HYGIENE_PROTOCOL.md)** - Communication standards
- **[ONBOARDING_GUIDE.md](ONBOARDING_GUIDE.md)** - Getting started guide
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API reference
- **[DEPLOYMENT_BEST_PRACTICES.md](../DEPLOYMENT_BEST_PRACTICES.md)** - Deployment guide

### Development Guides
- **[CLAUDE_CODE_PROMPT_EXAMPLES.md](CLAUDE_CODE_PROMPT_EXAMPLES.md)** - Prompt examples
- **[CONTRIBUTOR_CHECKLIST.md](CONTRIBUTOR_CHECKLIST.md)** - Contribution guidelines
- **[META_API_INTEGRATION.md](META_API_INTEGRATION.md)** - Meta API setup
- **[GOOGLE_ADS_SECURITY_PATTERNS.md](GOOGLE_ADS_SECURITY_PATTERNS.md)** - Google Ads integration

### Security & Operations
- **[SECURITY_ASSESSMENT.md](SECURITY_ASSESSMENT.md)** - Security analysis
- **[IMPORTANT-SECURITY-NOTE.md](IMPORTANT-SECURITY-NOTE.md)** - Security warnings
- **[CLOUD-BACKUP-GUIDE.md](CLOUD-BACKUP-GUIDE.md)** - Backup procedures

### Tool Integrations
- **[SOURCEGRAPH-SETUP.md](SOURCEGRAPH-SETUP.md)** - Code search setup
- **[LINEAR-MCP-SETUP.md](LINEAR-MCP-SETUP.md)** - Project management
- **[CODERABBIT-SETUP.md](CODERABBIT-SETUP.md)** - Code review automation
- **[PREMIUM-SERVICES-SETUP.md](PREMIUM-SERVICES-SETUP.md)** - Premium integrations

## 📝 Documentation Standards

### When Writing Documentation:

1. **Use Claude Code Prompts:**
   ```
   CC main agent - Set up development environment:
   1. Clone repository
   2. Install dependencies
   3. Configure environment
   4. Verify setup success
   ```

2. **Mark Manual Actions:**
   ```
   MANUAL ACTION REQUIRED:
   1. Open browser to [URL]
   2. Click [specific button]
   3. Enter [specific value]
   ```

3. **Provide Examples:**
   - Show what NOT to do (❌)
   - Show what TO do (✅)
   - Include verification steps

### File Naming Convention

Use descriptive names with hyphens:
- `PROMPT-HYGIENE-PROTOCOL.md`
- `API-DOCUMENTATION.md`
- `SECURITY-BEST-PRACTICES.md`

### Document Structure

Every document should include:
1. Clear title and purpose
2. Table of contents (for long docs)
3. Examples following prompt hygiene
4. Verification steps
5. Last updated date

## ✅ Before Adding Documentation

Run through the [CONTRIBUTOR_CHECKLIST.md](CONTRIBUTOR_CHECKLIST.md) to ensure:
- No raw commands
- Proper prompt formatting
- Clear manual action marking
- Examples follow protocol

## 🚫 Documentation Anti-Patterns

Never include:
- Raw shell commands
- Mixed prose and code
- Ambiguous instructions
- Missing verification steps

## 🎯 Goal

Every piece of documentation should be executable by Claude Code without human interpretation. If you find yourself writing a command, stop and reformat as a Claude Code prompt.

---

*All documentation must follow the War Room CTO Communication Protocol. Non-compliant documentation will be rejected.*

*Last updated: August 2025*