# War Room Platform - Code Examples

This directory contains comprehensive code examples that demonstrate best practices and patterns for the War Room platform. These examples are used by Claude Code's Context Engineering system to generate consistent, high-quality implementations.

## 📁 Directory Structure

### `/api/` - Backend API Examples
- **volunteer_endpoints.py** - FastAPI CRUD endpoints with filtering, pagination, and error handling
- **event_endpoints.py** - Complex event management with background tasks, caching, and business logic

### `/frontend/` - React/TypeScript Components
- **VolunteerList.tsx** - List component with Material-UI, hooks, filtering, and state management
- **EventForm.tsx** - Multi-step form with React Hook Form, validation, and file uploads

### `/database/` - Database Layer
- **models.py** - SQLAlchemy models with relationships, mixins, constraints, and indexes
- **queries.py** - Complex queries with CTEs, window functions, and aggregations

### `/authentication/` - Security Implementation
- **auth_service.py** - JWT authentication, password hashing, session management, and RBAC
- **auth_endpoints.py** - Login/logout flows, token refresh, password reset, and OAuth2

### `/testing/` - Test Examples
- **test_volunteer_endpoints.py** - Pytest tests for API endpoints with fixtures and mocking
- **VolunteerList.test.tsx** - Jest/React Testing Library tests with MSW for API mocking

## 🎯 Purpose

These examples serve as patterns for Claude Code to follow when implementing new features. They demonstrate:

1. **Consistent Code Style** - Following project conventions and best practices
2. **Error Handling** - Comprehensive error handling and validation
3. **Security** - Authentication, authorization, and data protection
4. **Testing** - Unit and integration tests with good coverage
5. **Documentation** - Clear docstrings and inline comments
6. **Performance** - Caching, pagination, and query optimization

## 🔧 Usage in Context Engineering

When creating a new feature request in `INITIAL.md`, reference these examples:

```markdown
## Examples to Reference

When implementing this feature, refer to these example patterns:
- `/examples/api/volunteer_endpoints.py` - For API endpoint structure
- `/examples/frontend/VolunteerList.tsx` - For React component patterns
- `/examples/database/models.py` - For database schema design
```

## 📝 Adding New Examples

When adding new examples:

1. **Follow Existing Patterns** - Match the style and structure of existing examples
2. **Include Comments** - Add docstrings and inline comments explaining key concepts
3. **Show Best Practices** - Demonstrate error handling, validation, and security
4. **Keep It Focused** - Each example should demonstrate specific patterns clearly
5. **Test Your Examples** - Ensure examples are syntactically correct and functional

## 🚀 Key Patterns Demonstrated

### API Patterns
- RESTful endpoint design
- Request/response validation with Pydantic
- Dependency injection
- Background tasks
- Rate limiting
- Caching strategies

### Frontend Patterns
- Functional components with hooks
- TypeScript interfaces
- Material-UI integration
- Form handling with validation
- API integration with error handling
- Accessibility considerations

### Database Patterns
- Proper indexing strategies
- Soft deletes
- Audit fields
- Complex relationships
- Query optimization
- Migration patterns

### Testing Patterns
- Fixture management
- Mocking external services
- Parametrized tests
- Integration testing
- Component testing
- Accessibility testing

## 💡 Tips for Claude Code

These examples help Claude Code:
- Generate consistent code matching project style
- Implement proper error handling
- Follow security best practices
- Create comprehensive tests
- Optimize for performance
- Maintain code quality

Remember: The more comprehensive and well-structured your examples, the better Claude Code can implement new features following your established patterns!