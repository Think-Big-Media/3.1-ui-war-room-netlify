# Programming Rules for War Room AI

## Technology Stack

### Core Technologies
- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand or Redux Toolkit (TBD based on complexity)
- **Backend**: Supabase (Auth, Database, Realtime)
- **Database**: PostgreSQL (via Supabase)
- **AI/ML**: OpenAI API (GPT-4, Whisper)
- **Vector Database**: Pinecone
- **Automation**: n8n (self-hosted)
- **Data Management**: Airtable (hybrid with Pinecone)
- **Monitoring**: Mentionlytics (primary), NewsWhip
- **Communications**: Twilio (SMS), SendGrid (Email)
- **Security**: Vanta-ready architecture

### Deployment Strategy
- **Phase 1**: Railway deployment (initial 6-8 weeks)
- **Phase 2**: AWS migration (post-launch)

## 🚨 CRITICAL: File Naming & Import Rules (PREVENT BROKEN LINKS)

### File Naming Conventions - STRICT RULES
```
✅ ALWAYS USE:
- lowercase-kebab-case for ALL files: dashboard-view.tsx, user-service.ts
- Lowercase extensions: .tsx, .ts, .css (never .TSX or .TS)
- Hyphens for spaces: user-profile.tsx (NOT userProfile.tsx or user_profile.tsx)
- Descriptive names: user-dashboard.tsx (NOT dashboard.tsx)

❌ NEVER USE:
- PascalCase for files: DashboardView.tsx ❌
- camelCase for files: dashboardView.tsx ❌
- Spaces in filenames: user profile.tsx ❌
- Generic names: index.tsx, styles.css ❌ (except for barrel exports)
```

### Import Rules - PREVENT BROKEN LINKS
```typescript
// ✅ CORRECT: Always use explicit extensions for relative imports
import { UserProfile } from './components/user-profile.tsx';
import { formatDate } from '../utils/format-date.ts';
import type { User } from '../types/user.types.ts';

// ❌ WRONG: Missing extensions cause breaks
import { UserProfile } from './components/user-profile';  // ❌ BREAKS!

// ✅ CORRECT: Use path aliases for deep imports
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

// ❌ WRONG: Deep relative paths are fragile
import { Button } from '../../../components/ui/button'; // ❌ FRAGILE!
```

### Component Export/Import Pattern
```typescript
// ✅ CORRECT: Named exports with consistent naming
// File: components/user-profile.tsx
export const UserProfile: React.FC<UserProfileProps> = () => { ... };

// Import:
import { UserProfile } from '@/components/user-profile.tsx';

// ❌ WRONG: Default exports lead to naming inconsistencies
export default UserProfile; // ❌ Can be imported with any name!
```

### Path Alias Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

### File Organization Rules
```
src/
├── components/
│   ├── ui/               # shadcn/ui components (don't modify)
│   ├── common/           # Reusable components
│   │   ├── button-group.tsx
│   │   └── loading-spinner.tsx
│   ├── features/         # Feature-specific components
│   │   ├── dashboard/
│   │   │   ├── dashboard-header.tsx
│   │   │   ├── dashboard-sidebar.tsx
│   │   │   └── dashboard-metrics.tsx
│   │   └── monitoring/
│   │       ├── alert-feed.tsx
│   │       └── sentiment-chart.tsx
│   └── layouts/
│       ├── app-layout.tsx
│       └── auth-layout.tsx
```

### Import Verification Checklist
Before ANY commit, AI agents must:
1. ✅ Verify all imports have correct file extensions
2. ✅ Check all file paths are lowercase-kebab-case
3. ✅ Ensure no broken imports by checking file existence
4. ✅ Use path aliases for all non-relative imports
5. ✅ Verify case sensitivity (especially for deployments)

### Common Import Errors & Solutions
```typescript
// ERROR: Cannot find module './Dashboard'
// CAUSE: File is actually 'dashboard.tsx' (lowercase)
// FIX: Match exact case
import { Dashboard } from './dashboard.tsx'; // ✅

// ERROR: Module not found './components/UserProfile'
// CAUSE: File renamed but imports not updated
// FIX: Always update ALL imports when renaming
// Use: Find & Replace in entire project

// ERROR: Cannot resolve '@/components/Button'
// CAUSE: Path alias not configured
// FIX: Ensure tsconfig.json has proper paths configuration
```

### AI Agent Instructions for File Operations
```
When creating or modifying files, ALWAYS:
1. Use lowercase-kebab-case for ALL new files
2. Include file extensions in ALL imports
3. Use path aliases (@/) for non-relative imports
4. Run a "find all references" before renaming any file
5. Update ALL imports when moving/renaming files
6. Verify imports work before committing
```

### Git Pre-commit Hook (add to project)
```bash
#!/bin/sh
# Check for PascalCase or camelCase files in src/
if find src -name "*[A-Z]*" -type f | grep -E '\.(tsx?|jsx?|css)$'; then
  echo "❌ Error: Found files with uppercase letters!"
  echo "Please rename all files to lowercase-kebab-case"
  exit 1
fi
```

## Code Standards

### General Principles
- **AI-First Development**: All code should be generated using AI tools (Claude, Cursor)
- **Documentation**: Every function, component, and module must be well-documented
- **Type Safety**: Strict TypeScript usage throughout
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Security**: Follow OWASP best practices, implement proper authentication/authorization

### React/TypeScript Standards
```typescript
// Component Structure
- Use functional components with TypeScript
- Implement proper prop types using interfaces
- Use React.FC<Props> for component typing
- Organize components in feature-based folders

// State Management
- Use hooks appropriately (useState, useEffect, useMemo, useCallback)
- Avoid unnecessary re-renders with proper memoization
- Keep component state minimal and lift state when needed

// File Naming
- Components: PascalCase (e.g., DashboardView.tsx)
- Utilities: camelCase (e.g., formatDate.ts)
- Types/Interfaces: PascalCase with 'I' prefix for interfaces
- Constants: UPPER_SNAKE_CASE
```

### API Integration
```typescript
// Supabase Client Setup
- Initialize Supabase client with proper environment variables
- Implement Row Level Security (RLS) policies
- Use proper error handling for all database operations

// API Calls
- Create dedicated service files for API interactions
- Implement proper loading and error states
- Use async/await pattern consistently
- Handle rate limiting appropriately
```

### Component Architecture
```typescript
// Folder Structure
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── common/       # Reusable components
│   ├── features/     # Feature-specific components
│   └── layouts/      # Layout components
├── hooks/            # Custom React hooks
├── services/         # API and external service integrations
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
└── lib/              # Third-party library configurations
```

### Database Patterns
```sql
-- Naming Conventions
- Tables: plural, snake_case (e.g., campaign_messages)
- Columns: snake_case (e.g., created_at)
- Primary keys: id (UUID)
- Foreign keys: {table_singular}_id (e.g., user_id)

-- Required Fields
- id: UUID primary key
- created_at: timestamp with timezone
- updated_at: timestamp with timezone
- deleted_at: timestamp (for soft deletes)

-- Indexes
- Add indexes for all foreign keys
- Add indexes for frequently queried columns
- Use composite indexes for multi-column queries
```

### Security Requirements
```typescript
// Authentication
- Implement JWT-based authentication via Supabase Auth
- Use secure session management
- Implement proper RBAC (Role-Based Access Control)

// Data Protection
- Never store sensitive data in localStorage
- Use environment variables for all secrets
- Implement input validation and sanitization
- Use parameterized queries (handled by Supabase)

// Compliance
- SOC 2 readiness from day one
- GDPR compliance for user data
- FEC compliance for political data
- Audit logging for all sensitive operations
```

### Testing Standards
```typescript
// Test Structure
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user flows

// Testing Libraries
- Jest for unit testing
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

// Coverage Requirements
- Minimum 80% code coverage
- 100% coverage for critical business logic
- All edge cases must be tested
```

### Performance Standards
```typescript
// React Performance
- Lazy load components with React.lazy()
- Implement code splitting at route level
- Use React.memo for expensive components
- Optimize re-renders with useMemo and useCallback

// Data Fetching
- Implement proper caching strategies
- Use React Query or SWR for server state
- Implement pagination for large datasets
- Use optimistic updates where appropriate

// Asset Optimization
- Optimize images with next-gen formats
- Implement proper lazy loading for images
- Minimize bundle size with tree shaking
- Use CDN for static assets
```

### AI Integration Guidelines
```typescript
// OpenAI Integration
- Implement proper error handling for API failures
- Use streaming for long responses
- Implement token usage tracking
- Cache responses where appropriate

// Prompt Engineering
- Store prompts as constants or in configuration
- Version control all prompts
- Implement prompt templates for consistency
- Monitor and log prompt performance

// Vector Database (Pinecone)
- Implement proper indexing strategies
- Use namespaces for data segregation
- Implement proper embedding generation
- Monitor query performance and costs
```

### Real-time Features
```typescript
// Supabase Realtime
- Implement proper subscription management
- Handle connection failures gracefully
- Implement reconnection logic
- Clean up subscriptions on component unmount

// Notification System
- Use Supabase Realtime for in-app notifications
- Implement browser notifications with permission handling
- Queue notifications for offline users
- Implement notification preferences
```

### Monitoring & Analytics
```typescript
// Error Tracking
- Implement Sentry or similar for error tracking
- Log errors with proper context
- Implement user feedback for errors
- Monitor error rates and patterns

// Analytics
- Implement privacy-first analytics
- Track key user actions
- Monitor performance metrics
- Implement custom dashboards for insights
```

## Development Workflow

### Git Conventions
```bash
# Branch Naming
feature/description-of-feature
bugfix/description-of-bug
hotfix/description-of-fix

# Commit Messages
feat: Add new feature
fix: Fix bug description
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### Code Review Checklist
- [ ] Code follows established patterns
- [ ] Proper error handling implemented
- [ ] Security best practices followed
- [ ] Performance optimizations applied
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No console.logs or debug code
- [ ] Accessibility standards met
- [ ] ALL IMPORTS USE CORRECT FILE PATHS WITH EXTENSIONS
- [ ] ALL FILES USE lowercase-kebab-case NAMING

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Security headers configured
- [ ] SSL certificates valid
- [ ] Monitoring alerts set up
- [ ] Backup procedures in place
- [ ] Rollback plan documented
- [ ] All file imports verified working