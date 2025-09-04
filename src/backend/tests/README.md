# Backend Test Suite

This directory contains the test suite for the War Room backend application.

## Test Structure

```
tests/
├── conftest.py           # Pytest configuration and fixtures
├── utils.py              # Test utilities and helpers
├── test_analytics_service.py      # Analytics service tests
├── test_cache_service.py          # Cache service tests
├── test_websocket.py              # WebSocket functionality tests
├── test_export_service.py         # Export service tests
├── test_analytics_endpoints.py    # Analytics API endpoint tests
└── test_platform_admin.py         # Platform admin tests
```

## Running Tests

### Run all tests
```bash
pytest
```

### Run with coverage
```bash
pytest --cov=app --cov-report=term-missing
```

### Run specific test file
```bash
pytest tests/test_analytics_service.py
```

### Run with verbose output
```bash
pytest -vv
```

### Using the test runner script
```bash
# Run all tests with coverage
./run_tests.py --coverage

# Run only unit tests
./run_tests.py --unit

# Run specific test file
./run_tests.py tests/test_cache_service.py

# Run with HTML coverage report
./run_tests.py --coverage --html-coverage
```

## Test Categories

Tests are marked with the following categories:
- `unit`: Unit tests that test individual components
- `integration`: Integration tests that test multiple components
- `slow`: Tests that take longer to run

Run specific categories:
```bash
pytest -m unit
pytest -m integration
pytest -m "not slow"
```

## Key Test Fixtures

### Authentication
- `test_user`: Creates a test user with admin role
- `test_token`: Creates a valid JWT token
- `auth_headers`: Authorization headers for API requests
- `platform_admin_headers`: Headers with platform admin permissions

### Database
- `test_db_session`: Async database session for tests
- `test_org`: Test organization
- `test_db_engine`: Test database engine

### Services
- `test_cache_service`: Cache service with fake Redis
- `analytics_service`: Analytics service instance
- `export_service`: Export service instance

### Mock Data
- `sample_analytics_data`: Sample analytics dashboard data
- `sample_platform_admin_data`: Sample platform admin data

## Writing New Tests

1. Create a new test file following the naming convention `test_*.py`
2. Import necessary fixtures from `conftest.py`
3. Use the utilities from `utils.py` for generating test data
4. Follow the existing test patterns

Example test:
```python
import pytest
from app.services.my_service import MyService

class TestMyService:
    @pytest.fixture
    def my_service(self):
        return MyService()
    
    @pytest.mark.asyncio
    async def test_my_method(self, my_service, test_db_session):
        result = await my_service.my_method(test_db_session)
        assert result is not None
```

## Test Coverage

The project aims for a minimum of 80% test coverage. Coverage reports are generated in:
- Terminal: Shows missing lines directly in output
- HTML: `htmlcov/index.html` for detailed browsable report
- XML: `coverage.xml` for CI/CD integration

## Continuous Integration

Tests are automatically run on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

The CI pipeline will fail if:
- Any test fails
- Coverage drops below 80%
- Linting errors are found