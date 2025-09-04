# War Room TestSprite Test Suite

Comprehensive test suite for the War Room campaign management platform using TestSprite MCP Server.

## Overview

This test suite provides complete coverage for:
- Authentication and authorization flows
- Core API endpoints (users, organizations, events, volunteers, donations)
- WebSocket real-time features
- Document intelligence capabilities
- End-to-end user workflows
- Platform administration
- Performance and security testing

## Test Structure

```
tests/testsprite/
├── auth/                    # Authentication tests
│   └── auth_flow.test.ts
├── api/                     # API endpoint tests
│   └── core_endpoints.test.ts
├── websocket/               # Real-time feature tests
│   └── realtime.test.ts
├── integration/             # Full user workflow tests
│   └── user_workflows.test.ts
├── document-intelligence/   # AI/ML feature tests
├── testsprite.config.ts     # Test configuration
└── README.md               # This file
```

## Prerequisites

1. **TestSprite MCP Server**
   ```bash
   npm install -g @testsprite/mcp-server
   testsprite init
   ```

2. **Environment Setup**
   ```bash
   cp .env.test.example .env.test
   ```

3. **Database**
   - PostgreSQL 14+ with test database
   - Redis for caching

4. **Required Environment Variables**
   ```
   DATABASE_URL=postgresql://user:pass@localhost:5432/warroom_test
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=test-secret-key
   PLATFORM_ADMIN_SECRET=test-admin-secret
   ```

## Running Tests

### All Tests
```bash
testsprite run
```

### Specific Test Suites
```bash
# Authentication tests only
testsprite run auth/

# API tests only
testsprite run api/

# Integration tests
testsprite run integration/

# WebSocket tests
testsprite run websocket/
```

### Test Categories
```bash
# Unit tests only
testsprite run --suite unit

# Integration tests only
testsprite run --suite integration

# Performance tests
testsprite run --suite performance

# Security tests
testsprite run --suite security
```

### With Coverage
```bash
testsprite run --coverage
```

## Test Configuration

The `testsprite.config.ts` file contains:
- Environment configurations (local, staging, production)
- Performance benchmarks
- Coverage requirements (80% minimum)
- Security testing rules
- Retry policies
- Plugin configurations

## Key Test Scenarios

### 1. Authentication Flow Tests
- User registration with validation
- Login/logout flows
- JWT token management
- Password reset process
- Role-based access control
- Security testing (SQL injection, XSS)

### 2. Core API Tests
- Users management
- Organizations CRUD
- Events lifecycle
- Volunteer coordination
- Donation tracking
- Performance benchmarks
- Error handling

### 3. WebSocket Real-time Tests
- Connection management
- Real-time notifications
- Live dashboard updates
- Presence tracking
- Message broadcasting
- Error recovery

### 4. Integration Tests
Complete end-to-end workflows for:
- Campaign organizer setup
- Volunteer journey
- Donor experience
- Event management
- Platform administration

## Performance Benchmarks

| Metric | Target | P95 | P99 |
|--------|--------|-----|-----|
| API Response Time | 200ms | 500ms | 1000ms |
| Page Load Time | 3s | 5s | 8s |
| WebSocket Latency | 50ms | 100ms | 200ms |

## Coverage Requirements

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## Security Testing

Includes OWASP Top 10 testing:
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Authentication Failures
- A08: Data Integrity Failures
- A09: Security Logging Failures
- A10: Server-Side Request Forgery

## Best Practices

1. **Test Isolation**: Each test runs in a transaction that's rolled back
2. **Data Generation**: Use test data generators for consistency
3. **Async Testing**: Proper handling of promises and async operations
4. **Cleanup**: Automatic cleanup after each test
5. **Mocking**: External services are mocked for reliability

## Debugging

### Enable Debug Mode
```bash
testsprite run --debug
```

### View Test Logs
```bash
testsprite logs --tail
```

### Interactive Mode
```bash
testsprite run --interactive
```

## Continuous Integration

### GitHub Actions
```yaml
- name: Run TestSprite Tests
  run: |
    testsprite run --ci --coverage
    testsprite report --format junit
```

### Coverage Reports
Coverage reports are generated in:
- `./coverage/` - HTML reports
- `./test-results/junit.xml` - JUnit format
- `./test-results/lcov.info` - LCOV format

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env.test
   - Run migrations: `alembic upgrade head`

2. **WebSocket Test Failures**
   - Check if WebSocket server is running
   - Verify WS_URL configuration
   - Check for port conflicts

3. **Timeout Errors**
   - Increase timeout in testsprite.config.ts
   - Check for slow database queries
   - Ensure Redis is running

### Getting Help

- TestSprite Docs: https://testsprite.dev/docs
- War Room Wiki: internal wiki link
- Support: #testing channel on Slack

## Contributing

1. Write tests for new features
2. Ensure tests pass locally
3. Maintain 80%+ coverage
4. Follow test naming conventions
5. Document complex test scenarios

## Test Maintenance

### Weekly Tasks
- Review flaky tests
- Update test data
- Check coverage trends

### Monthly Tasks
- Performance benchmark review
- Security test updates
- Test suite optimization

---

*Last Updated: June 2024*
*Test Suite Version: 1.0.0*