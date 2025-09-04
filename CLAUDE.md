# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: NOTIFICATION SYSTEM - READ FIRST 🚨

**BEFORE EVERY ACTION, ASK YOURSELF: "DOES THIS REQUIRE A NOTIFICATION?"**

### MANDATORY Apple Watch Notifications:
1. **BEFORE asking ANY yes/no question**: 
   ```bash
   /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh approval "Your question here" "What will happen next"
   ```

2. **AFTER completing ANY task**:
   ```bash
   /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh complete "What was accomplished" "Next steps available"
   ```

3. **WHEN providing next steps**:
   ```bash
   /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh next "Current status" "Available options"
   ```

4. **WHEN errors occur**:
   ```bash
   /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh error "What went wrong" "How to fix it"
   ```

**NO EXCEPTIONS** - The user relies on Apple Watch notifications for workflow management.

### MANDATORY MCP Usage:
- **Context7 MCP**: For ALL documentation, framework updates, best practices
- **Perplexity MCP**: For ALL current information, deprecations, breaking changes
- **Use EVERY TIME** you need current information about external services

---

## 🚀 CRITICAL: LOCAL DEVELOPMENT IS THE DEFAULT 🚀

### The Golden Rule:
**"You have to deploy every time we make changes? Jeez, that's annoying."** - Rod (Aug 14, 2025)

**ALWAYS START WITH LOCAL DEVELOPMENT FOR ANY CODE CHANGES**

### Your FIRST Action for ANY Development Task:
```bash
# One command to start everything:
./START_LOCAL.sh

# Or manually:
npm run dev                                    # Terminal 1
cd src/backend && python3 serve_bulletproof.py # Terminal 2
```

### Decision Framework:

| Task Type | Use Local Dev | Deploy to Render | 
|-----------|--------------|------------------|
| UI Changes | ✅ ALWAYS | ❌ Only when done |
| CSS/Styling | ✅ ALWAYS | ❌ Only when done |
| Component Dev | ✅ ALWAYS | ❌ Only when done |
| API Testing | ✅ ALWAYS | ❌ Only when done |
| Bug Fixing | ✅ ALWAYS | ❌ Only when done |
| Browser Scaling | ✅ ALWAYS | ❌ Never |
| Quick Tests | ✅ ALWAYS | ❌ Never |
| Client Demo | ❌ | ✅ When Ready |
| Production | ❌ | ✅ After Local Testing |

### Benefits of Local Dev:
- **Instant Changes**: Save file → See immediately (hot reload)
- **No Deploy Wait**: 0 seconds vs 5-10 minutes
- **Test Everything**: Browser scaling, responsive design, API calls
- **Full Stack**: Frontend + Backend + Database all running

### Local URLs:
- Frontend: http://localhost:5173 (may be 5174 or 5175)
- Backend: http://localhost:10000
- API Docs: http://localhost:10000/docs

**IMPORTANT**: Only deploy to Render when changes are fully tested locally and ready for production/sharing.

---

## 🎯 CRITICAL: FRONTEND ARCHITECTURE 🎯

### ⚡ PRODUCTION FRONTEND: App.tsx ⚡
**This is the ACTIVE integrated frontend in production!**

**Visual Identification:**
- ✅ War Room Platform with integrated theme system
- ✅ Dashboard with CommandCenter and real-time monitoring
- ✅ Navigation bar with proper routing
- ✅ Builder.io structure + V2Dashboard + Theme System
- ✅ Supabase auth and background theme provider

**File Structure:**
- Entry: `src/index.tsx` imports from `'./App'`
- Main Component: `src/App.tsx`
- Dashboard: `src/pages/Dashboard.tsx`
- CommandCenter: `src/pages/CommandCenter.tsx`
- Layout: Various page-specific layouts

### 📋 Alternative App Versions (Available but not in use):
1. **AppNoAuth.tsx** - Testing version without authentication
2. **AppSimple.tsx** - Simplified version for testing

### 🔍 How to Verify:
```bash
# Check which app is active:
grep "import App from" src/index.tsx
# Should show: import App from './App';
```

---

## 🎨 CRITICAL: VISUAL CHANGE PROTOCOL 🎨

### The Purple Gradient Issue - Never Again!
**What happened**: Custom CSS classes were purged by Tailwind, causing purple gradients instead of slate. This protocol prevents visual regressions.

### MANDATORY Steps for ANY Visual Change:

#### 1. Pre-Development Safety Check
```bash
# ALWAYS run before starting visual work
./scripts/check-css-safety.sh
```

#### 2. Local Development First (MANDATORY)
```bash
# Test ALL visual changes locally first
./START_LOCAL.sh
# Verify changes at http://localhost:5173
# Take screenshots for comparison
```

#### 3. CSS Safety Rules
- ✅ **ONLY use native Tailwind classes**: `bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800`
- ❌ **NEVER use custom classes**: `.bg-slate-gradient` gets purged
- ✅ **Test production build**: `npm run build && npm run preview`
- ✅ **Follow CSS_SAFETY_RULES.md**: Complete guide to safe CSS

#### 4. Staging Deployment (MANDATORY)
```bash
# Deploy to staging first - NO EXCEPTIONS
git checkout staging
git merge feature/your-branch
git push origin staging

# Verify at https://one-0-war-room.onrender.com
# Get user approval before production
```

#### 5. Production Deployment
```bash
# Only after staging approval
git checkout production
git merge staging
git push origin production

# Verify immediately
./scripts/verify-visual-deployment.sh https://war-room-app-2025.onrender.com
```

### Visual Change Checklist
- [ ] **Local testing completed**: Changes work at localhost:5173
- [ ] **CSS safety verified**: No custom classes that could be purged
- [ ] **Production build tested**: `npm run build && npm run preview`
- [ ] **Staging deployed**: Visual changes verified on staging URL
- [ ] **User approval received**: Stakeholder confirmed changes look correct
- [ ] **Production deployed**: Final deployment with verification
- [ ] **Post-deployment check**: Screenshots confirm changes are live

### Emergency Visual Rollback
```bash
# If visual issues appear in production
git checkout production
git reset --hard HEAD~1
git push --force origin production

# Notify user immediately
./scripts/claude-notify-unified.sh error "Visual regression detected" "Rolling back to previous version"
```

### Key Documentation
- **CSS_SAFETY_RULES.md**: Prevent Tailwind purging issues
- **DEPLOYMENT_VERIFICATION_CHECKLIST.md**: Complete deployment process
- **BRANCH_RULES.md**: Branch strategy that prevents conflicts

---

## Project Overview

War Room is a comprehensive campaign management platform for political campaigns, advocacy groups, and non-profit organizations. It provides tools for volunteer coordination, event management, communication, and data analytics.

## Architecture

### Backend (FastAPI + Python)
- **Framework**: FastAPI with async/await patterns
- **Database**: PostgreSQL with SQLAlchemy/SQLModel ORM
- **Real-time**: WebSocket support for live features
- **Auth**: JWT-based with Supabase integration
- **AI/ML**: OpenAI, Pinecone, LangChain for document intelligence

### Frontend (React + TypeScript)
- **Build**: Vite with TypeScript
- **State**: Redux Toolkit
- **UI**: Tailwind CSS, Framer Motion, Lucide icons
- **Forms**: React Hook Form with Yup validation
- **Analytics**: PostHog integration

### Infrastructure
- **Current**: Render deployment (https://war-room-oa9t.onrender.com)
- **Target**: AWS migration (EC2, RDS, S3, CloudFront)
- **Platform**: Render (Python/Node native, no containers)

### Browser Optimization
- **Recommended Browser Zoom**: 95%
- **Root Font Size**: 16.5px (optimized for 95% zoom)
- **Testing**: Always test at 95% browser zoom level

4. **`/build`** - Rebuild components when needed

## CRITICAL: Notification System

You MUST use the notification system to alert the user BEFORE asking questions or when tasks complete:

### When to Send Notifications

1. **BEFORE asking ANY yes/no question**:
   ```bash
   /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh approval "Your question here" "What will happen next"
   ```
   Then display the question.

2. **After completing a task**:
   ```bash
   /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh complete "What was accomplished" "Next steps available"
   ```
   Always provide next options.

3. **When asking what to do next**:
   ```bash
   /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh next "Current status" "1. Option 1\n2. Option 2\n3. Option 3"
   ```
   Never leave user without clear next steps.

4. **When errors occur**:
   ```bash
   /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh error "What went wrong" "How to fix it"
   ```

### How It Works
- Displays the full message text first
- Sends notification to Apple Watch (shows as 🚨 APPROVAL, ✅ COMPLETE, etc.)
- Plays distinct sound on Mac (Frog, Glass, Pop, or Sosumi)
- User arrives to see completed text, ready to respond

### Example Usage
```bash
# About to run a command that needs approval
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh approval "Run database migration?" "This will update the schema"

# Task completed
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh complete "Monitoring system implemented" "Ready to test or move to next task"
```

IMPORTANT: The script path must be exact. Notifications won't work without calling this script.
## Development Commands

### Frontend
```bash
cd src/frontend
npm install
npm run dev                 # Start development server (http://localhost:5173)
npm run build              # Production build
npm run lint               # ESLint check
npm run lint:fix           # Fix linting issues
npm run type-check         # TypeScript validation
npm run test               # Run tests
npm run test:coverage      # Tests with coverage report
npm run test:stable        # Run stable test subset
```

### Backend
```bash
cd src/backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload   # Start dev server (http://localhost:8000)
alembic upgrade head        # Run database migrations
pytest                      # Run all tests
pytest -v -s               # Verbose test output
black .                    # Format code
ruff check .               # Lint code
mypy .                     # Type checking
```

### Database Operations
```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

### Deployment Scripts
```bash
# Deploy via Render dashboard or Git push
./scripts/test-deployment-readiness.sh   # Pre-deployment validation
./scripts/backup.sh                      # Database backup
```

## Project Structure

```
src/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core config, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   └── main.py           # FastAPI app entry
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── features/     # Feature modules
│   │   ├── hooks/        # Custom React hooks
│   │   ├── store/        # Redux store
│   │   └── utils/        # Utilities
│   └── index.html        # Entry point
└── tests/                # Test suites
```

## Key Patterns

### API Endpoints
- RESTful design: `/api/v1/{resource}`
- Async handlers with dependency injection
- Pydantic models for request/response validation
- OpenAPI auto-documentation at `/docs`

### Frontend Architecture
- Feature-based folder structure
- Protected routes with auth guards
- Error boundaries for graceful failures
- Context providers for global state
- Custom hooks for reusable logic

### Database Schema
- Core entities: users, organizations, events, volunteers, donations
- Platform admin tables for multi-tenancy
- Document intelligence tables
- Automation workflow tables
- Soft deletes with `deleted_at` timestamps

## Testing Requirements

### Backend Testing
- Minimum 80% coverage required
- Test markers: `@pytest.mark.slow`, `@pytest.mark.integration`
- FastAPI TestClient for endpoint testing
- Database rollback after each test

### Frontend Testing
- Jest with React Testing Library
- 80% coverage thresholds
- MSW for API mocking
- Test patterns: `*.test.tsx` or `__tests__/`

## Environment Variables

### Required for Development
```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/warroom

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# PostHog
POSTHOG_KEY=your-posthog-key
POSTHOG_HOST=https://app.posthog.com

# API Keys (optional in dev)
OPENAI_API_KEY=
PINECONE_API_KEY=
TWILIO_ACCOUNT_SID=
SENDGRID_API_KEY=
```

## Security Considerations

- All API endpoints require authentication except `/auth/*`
- Role-based access control (RBAC) with user/admin/platform_admin roles
- Rate limiting on sensitive endpoints
- Input validation on all user inputs
- SQL injection prevention via ORM
- XSS prevention with React's default escaping
- CORS configured for production domains only

## Performance Optimization

- Redis caching for frequently accessed data
- Database query optimization with proper indexes
- Lazy loading for React components
- WebSocket connection pooling
- Pagination for large datasets (default: 20 items)
- Background tasks for heavy operations

## Common Development Tasks

### Adding a New API Endpoint
1. Create router in `app/api/endpoints/`
2. Add Pydantic models in `app/schemas/`
3. Implement service logic in `app/services/`
4. Add tests in `tests/api/`
5. Update OpenAPI tags in `main.py`

### Adding a New Frontend Feature
1. Create feature folder in `src/features/`
2. Add Redux slice if needed
3. Create components with TypeScript
4. Add routing in `App.tsx`
5. Write tests alongside components

### Running Database Migrations
1. Make model changes in `app/models/`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review generated migration file
4. Apply: `alembic upgrade head`
5. Test rollback: `alembic downgrade -1`

## Deployment Checklist

Before deploying:
1. Run `./scripts/test-deployment-readiness.sh`
2. Ensure all tests pass
3. Check environment variables are set
4. Verify database migrations are current
5. Build frontend: `npm run build`
6. Test production build locally

## MCP Server Integration

The project is configured with multiple MCP servers for enhanced capabilities:

- **Perplexity**: Web search and current information
- **DataForSEO**: SEO analysis and keyword research
- **GoHighLevel**: CRM and automation integration
- **Notion**: Documentation and knowledge base
- **Context7**: Library documentation lookup
- **Shadcn UI**: Component references

Use `claude mcp list` to view all configured servers.

## Known Issues

- WebSocket connections may timeout after 5 minutes of inactivity
- Large file uploads (>10MB) require chunking
- PostHog events are batched every 30 seconds
- Redis connection pool limited to 50 connections

## External Dependencies

- **Supabase**: Authentication and real-time database
- **PostHog**: Analytics and feature flags
- **Twilio**: SMS notifications
- **SendGrid**: Email delivery
- **AWS S3**: File storage (future)
- **OpenAI**: Document analysis
- **Pinecone**: Vector search for documents📝 Note to self: User is using Comet Browser (from Perplexity) for browser automation. When I provide Render dashboard instructions, they're being executed by Comet Browser AI agent, not manually.
