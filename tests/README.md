# War Room AI - Test Suite

Comprehensive testing framework for the War Room political marketing platform.

## Test Structure

```
tests/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests for API endpoints
├── e2e/           # End-to-end tests with Playwright
└── fixtures/      # Test data and mock responses
```

## Testing Strategy

### Unit Tests
- React component testing with Jest + React Testing Library
- Backend function testing with Vitest
- Vector search and RAG pipeline testing
- Authentication and authorization testing

### Integration Tests
- API endpoint testing with FastAPI TestClient
- Database integration with test transactions
- External service mocking (Meta Ads, Google Ads)
- Real-time websocket testing

### End-to-End Tests
- User authentication flows
- Document upload and processing
- Chat interface with RAG responses
- Dashboard functionality
- Crisis detection workflows

## Political Data Testing

### Compliance Testing
- Row-Level Security (RLS) validation
- Data encryption verification
- Audit log completeness
- GDPR/FEC compliance checks

### Security Testing
- Authentication bypass attempts
- SQL injection prevention
- XSS vulnerability scanning
- Rate limiting validation

## AI/RAG Testing

### Vector Search Testing
- Embedding quality validation
- Citation accuracy verification
- Query performance benchmarking
- Contextual retrieval accuracy

### LLM Response Testing
- Response quality evaluation
- Hallucination detection
- Cost optimization validation
- Prompt engineering effectiveness

## Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:all
```

## Test Data Management

### Fixtures
- Sample political documents (PDFs, CSVs)
- Mock API responses from external services
- Test user accounts and organizations
- Sample ad metrics and monitoring data

### Database Seeding
- Test organizations with proper RLS setup
- Sample documents with embeddings
- Historical metrics data for testing
- User roles and permissions

## Performance Testing

### Load Testing
- Chat interface under concurrent users
- Document processing pipeline stress testing
- Real-time monitoring system capacity
- Database query performance

### Benchmarking
- Response time targets (<3s chat, <60s ingestion)
- Memory usage optimization
- Vector search performance
- Cost per query optimization

## Continuous Integration

### GitHub Actions
- Automated test execution on PR
- Code coverage reporting
- Security vulnerability scanning
- Deployment validation

### Test Environment
- Isolated test database
- Mock external services
- Staging environment validation
- Production smoke tests

---

*All tests must pass before deployment to production. Maintain >90% code coverage for critical paths.*