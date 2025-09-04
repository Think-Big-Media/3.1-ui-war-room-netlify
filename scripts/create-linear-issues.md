# Linear Issues to Create

Copy and paste these formatted issues into Linear:

## Issue 6: Configure Production Environment Variables
**Project:** Infrastructure (WR-INF)
**Priority:** High Priority
**Labels:** infrastructure, deployment, security
**Description:**
```markdown
## Problem
Production environment variables need to be properly configured and documented for Railway deployment, including secure secrets management.

## Solution
Set up comprehensive environment variable configuration:
- Document all required environment variables
- Configure Railway environment variables
- Implement secrets management strategy
- Create environment variable validation

## Technical Details
- Use Railway's environment variable UI
- Implement dotenv for local development
- Add validation at startup
- Document in .env.example

## Acceptance Criteria
- [ ] All production environment variables documented
- [ ] Railway environment configured with all required vars
- [ ] Secrets properly managed (not in version control)
- [ ] Environment validation script created
- [ ] Documentation updated with setup instructions
```

## Issue 7: Implement Error Monitoring and Logging
**Project:** Infrastructure (WR-INF)
**Priority:** High Priority
**Labels:** infrastructure, monitoring, production
**Description:**
```markdown
## Problem
Production environment lacks comprehensive error tracking, logging, and monitoring capabilities.

## Solution
Implement full error monitoring stack:
- Structured logging with log levels
- Error tracking service integration
- Performance monitoring
- Alert configuration

## Technical Details
- Integrate Sentry for error tracking
- Use structured JSON logging
- Implement correlation IDs
- Set up PostHog for analytics
- Configure alerts for critical errors

## Acceptance Criteria
- [ ] Sentry integration complete
- [ ] Structured logging implemented
- [ ] Log aggregation configured
- [ ] Error alerts set up
- [ ] Performance monitoring active
- [ ] Documentation for debugging production issues
```

## Issue 8: Create User Authentication Flow
**Project:** Backend Development (WR-BE)
**Priority:** High Priority
**Labels:** feature, authentication, security
**Description:**
```markdown
## Problem
Complete user authentication system needs to be implemented with JWT tokens, password reset, and OAuth integration.

## Solution
Build comprehensive authentication system:
- JWT token generation and validation
- Password reset flow with email
- OAuth providers (Google, GitHub)
- Session management
- Role-based access control

## Technical Details
- FastAPI security utilities
- Supabase Auth integration
- JWT with refresh tokens
- Secure password hashing (bcrypt)
- Email verification flow

## Acceptance Criteria
- [ ] User registration with email verification
- [ ] Login with JWT tokens
- [ ] Password reset functionality
- [ ] OAuth login (Google, GitHub)
- [ ] Refresh token rotation
- [ ] RBAC implementation
- [ ] Authentication documentation
```

## Issue 9: Build Campaign Dashboard
**Project:** Frontend Development (WR-FE)
**Priority:** High Priority
**Labels:** feature, frontend, dashboard
**Description:**
```markdown
## Problem
Main campaign dashboard needs to be created with analytics, volunteer management, and event tracking capabilities.

## Solution
Create comprehensive campaign dashboard:
- Real-time analytics widgets
- Volunteer activity tracking
- Event calendar and management
- Campaign metrics visualization
- Quick action buttons

## Technical Details
- React with TypeScript
- Redux for state management
- Chart.js for visualizations
- WebSocket for real-time updates
- Responsive grid layout

## Acceptance Criteria
- [ ] Dashboard layout with widget system
- [ ] Analytics charts (donations, volunteers, events)
- [ ] Volunteer activity feed
- [ ] Event calendar integration
- [ ] Campaign goal progress
- [ ] Mobile responsive design
- [ ] Real-time data updates
```

## Issue 10: API Documentation with OpenAPI
**Project:** Backend Development (WR-BE)
**Priority:** Medium Priority
**Labels:** documentation, api, developer-experience
**Description:**
```markdown
## Problem
API documentation needs to be comprehensive and automatically generated using FastAPI's OpenAPI integration.

## Solution
Generate and maintain API documentation:
- Configure OpenAPI metadata
- Add detailed endpoint descriptions
- Include request/response examples
- Generate client SDKs
- Create API usage guide

## Technical Details
- FastAPI automatic OpenAPI generation
- ReDoc and Swagger UI integration
- Postman collection export
- Version documentation
- Authentication examples

## Acceptance Criteria
- [ ] OpenAPI spec fully configured
- [ ] All endpoints documented with examples
- [ ] Authentication documentation complete
- [ ] Error response documentation
- [ ] SDK generation setup
- [ ] API usage guide written
- [ ] Hosted documentation accessible
```

## How to Create These Issues

1. Go to Linear and navigate to your War Room workspace
2. Click the "+" button or press "C" to create a new issue
3. Copy the title and set the appropriate project
4. Paste the description in markdown format
5. Add the specified labels
6. Set the priority level
7. Optionally assign to team members or AI agents

## Bulk Creation Alternative

If you have Linear API access configured:
```bash
# You'll need to set up LINEAR_API_KEY first
# Then use the Linear API to create issues programmatically
```