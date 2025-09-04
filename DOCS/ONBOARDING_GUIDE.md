# War Room Developer Onboarding Guide

Welcome to the War Room project! This guide will help you get started with our development workflow and ensure you follow our strict communication protocols.

## 🎯 Before You Begin

### Critical Protocol: Prompt Hygiene

**⚠️ MANDATORY READING:** [PROMPT_HYGIENE_PROTOCOL.md](PROMPT_HYGIENE_PROTOCOL.md)

The War Room project uses Claude Code as the primary development interface. All instructions must follow our prompt hygiene protocol to ensure smooth AI-assisted development.

### Key Rules:
1. **NO raw command line instructions** - Always use Claude Code prompts
2. **NO mixed prose and code** - Keep instructions clear and structured
3. **ALWAYS use proper agent format** - CC main agent, CC comet agent, etc.
4. **CLEARLY mark manual actions** - Use "MANUAL ACTION REQUIRED:"

## 🚀 Getting Started

### Step 1: Environment Setup

```
CC main agent - Set up War Room development environment:
1. Clone the repository from GitHub
2. Create frontend and backend virtual environments
3. Install all dependencies for both frontend and backend
4. Create .env.local files from templates
5. Verify Python 3.11+ and Node 18+ are available
6. Display confirmation of successful setup
```

### Step 2: Configure Local Environment

```
MANUAL ACTION REQUIRED:
1. Copy src/frontend/.env.example to src/frontend/.env.local
2. Add your Supabase credentials:
   - VITE_SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
   - VITE_SUPABASE_ANON_KEY=[your-key]
3. Save the file
```

### Step 3: Start Development Servers

```
CC main agent - Launch development environment:
1. Start backend server on port 8000
2. Start frontend server on port 5173
3. Verify health endpoint at http://localhost:8000/health
4. Open browser to http://localhost:5173
5. Display both server logs
```

## 📋 Daily Development Workflow

### Morning Setup

```
CC main agent - Start daily development session:
1. Pull latest changes from main branch
2. Check for any new dependencies to install
3. Run database migrations if needed
4. Start development servers
5. Run health check validation
6. Display today's task list from TASK.md
```

### Before Committing

```
CC main agent - Pre-commit validation:
1. Run frontend linting and fix issues
2. Run frontend tests with coverage
3. Check for TypeScript errors
4. Run backend tests
5. Verify no security vulnerabilities
6. Display summary of all checks
```

### Creating a Feature

```
CC main agent - Create new feature branch:
1. Create branch named 'feature/[your-feature-name]'
2. Update TASK.md with feature description
3. Create initial test files for the feature
4. Set up feature flag if needed
5. Commit initial feature structure
```

## 🧪 Testing Guidelines

### Running Tests

```
CC main agent - Execute comprehensive test suite:
1. Run frontend unit tests
2. Run frontend integration tests
3. Run backend unit tests
4. Run backend integration tests
5. Generate combined coverage report
6. Display summary with pass/fail counts
```

### Testing a Specific Component

```
CC main agent - Test specific component:
1. Run tests for [component-name]
2. Run tests in watch mode
3. Generate coverage for this component
4. Display detailed test results
```

## 🚨 Common Pitfalls to Avoid

### ❌ DON'T Do This:

```bash
# Never provide raw commands like this:
cd src/frontend
npm install
npm run dev
```

### ✅ DO This Instead:

```
CC main agent - Start frontend development:
1. Navigate to frontend directory
2. Install dependencies
3. Launch development server
4. Verify running on http://localhost:5173
```

### ❌ DON'T Mix Instructions:

"First run `npm test` to check everything, then if it passes you can commit"

### ✅ DO Structure Clearly:

```
CC main agent - Validate before commit:
1. Run all tests
2. If tests pass, proceed to commit
3. If tests fail, display failing tests
4. Do not commit if any tests fail
```

## 📚 Project Structure Overview

```
war-room/
├── src/
│   ├── frontend/        # React + TypeScript app
│   └── backend/         # FastAPI Python app
├── scripts/             # Deployment and utility scripts
├── DOCS/               # Documentation
├── logs/               # Deployment logs
└── tests/              # E2E and integration tests
```

## 🔧 Key Development Commands

### Database Operations

```
CC main agent - Database management:
1. Check current migration status
2. Create new migration for [description]
3. Apply pending migrations
4. Verify database schema
5. Display migration history
```

### Performance Testing

```
CC main agent - Run performance tests:
1. Start performance test suite
2. Test all API endpoints
3. Verify response times < 3s
4. Generate performance report
5. Display slowest endpoints
```

### Deployment Validation

```
CC main agent - Validate deployment:
1. Run deployment readiness check
2. Validate all health endpoints
3. Check for legacy platform references
4. Verify frontend build
5. Generate validation report
```

## 🤝 Getting Help

### When Stuck

```
CC main agent - Troubleshooting help:
1. Display current error with full context
2. Check logs for related errors
3. Search codebase for similar patterns
4. Suggest potential solutions
5. Create detailed error report
```

### Finding Documentation

```
CC main agent - Find documentation:
1. List all documentation files
2. Search for documentation on [topic]
3. Display table of contents
4. Show relevant examples
```

## ✅ Onboarding Checklist

Before you start contributing:

- [ ] Read and understand PROMPT_HYGIENE_PROTOCOL.md
- [ ] Set up local development environment
- [ ] Successfully run the application locally
- [ ] Run and pass all tests
- [ ] Make a test commit following guidelines
- [ ] Review TASK.md for current priorities
- [ ] Join team communication channels

## 🎉 Welcome to the Team!

Remember: **Every instruction should be a Claude Code prompt.** This ensures consistency, reduces errors, and enables smooth AI-assisted development.

If you have questions, use:

```
CC main agent - Help with [your question]:
1. Search documentation for [topic]
2. Display relevant information
3. Provide example if applicable
```

---

*Last updated: August 2025*