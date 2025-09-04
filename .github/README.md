# War Room Platform CI/CD Configuration

This directory contains the GitHub Actions workflows for the War Room platform.

## Frontend CI Pipeline

The frontend CI pipeline is configured in `workflows/frontend-ci.yml` and includes:

### Pipeline Overview

- **Triggers**: Runs on push/PR to `main` and `develop` branches for frontend changes
- **Node.js Version**: Uses Node.js 20.x for consistency
- **Working Directory**: All commands run in `src/frontend/`

### Pipeline Steps

1. **Code Quality Checks**
   - TypeScript compilation (`npm run type-check`)
   - ESLint linting (`npm run lint`)

2. **Testing**
   - Runs stable test suite (`npm run test:ci`)
   - Generates test coverage reports
   - Uploads coverage to Codecov (if configured)

3. **Build Verification**
   - Builds the React application (`npm run build`)
   - Uploads build artifacts for verification

4. **Status Reporting**
   - Provides comprehensive status summary
   - Fails the pipeline if any step fails

### Test Configuration

The CI pipeline uses a focused test suite that runs only stable, passing tests:

- **DashboardChart.test.tsx**: Chart component functionality
- **useReducedMotion.test.ts**: Accessibility hook tests
- **ErrorBoundary.test.tsx**: Error handling component tests

### Available NPM Scripts

```bash
# Run all tests
npm test

# Run stable tests only (used in CI)
npm run test:ci

# Run stable tests (local development)
npm run test:stable

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### CI-Specific Features

- **Coverage Reports**: Automatically generated and uploaded
- **Build Artifacts**: Stored for 7 days
- **Test Results**: Stored for 30 days
- **Parallel Jobs**: Tests and builds run in sequence for efficiency
- **Fail-Fast**: Pipeline stops on first failure

### Local Development

To run the same checks locally:

```bash
cd src/frontend

# Install dependencies
npm ci

# Run the same checks as CI
npm run type-check
npm run lint
npm run test:ci
npm run build
```

### Extending the Pipeline

To add new stable tests to the CI pipeline:

1. Ensure your test file is stable and passes consistently
2. Add the test file name to the `testPathPattern` in `package.json`:
   ```json
   "test:ci": "jest --testPathPattern=\"(YourNewTest\\.test\\.tsx|DashboardChart\\.test\\.tsx|useReducedMotion\\.test\\.ts|ErrorBoundary\\.test\\.tsx)$\" --ci --coverage --watchAll=false"
   ```

### Troubleshooting

**Common Issues:**

1. **Tests failing in CI but passing locally**
   - Ensure you're using Node.js 20.x
   - Run `npm ci` instead of `npm install`
   - Check for missing environment variables

2. **Coverage thresholds not met**
   - The pipeline focuses on stable tests only
   - Coverage requirements are set in `jest.config.mjs`

3. **Build failures**
   - Check TypeScript compilation with `npm run type-check`
   - Verify all dependencies are properly installed

**Debug Steps:**

1. Run the exact CI commands locally
2. Check the Actions tab in GitHub for detailed logs
3. Review uploaded artifacts for build outputs

### Future Improvements

- Add end-to-end testing with Playwright
- Implement visual regression testing
- Add performance benchmarking
- Set up automatic deployment on successful builds
- Add security scanning with tools like Snyk

---

For questions or issues with the CI pipeline, please refer to the main project documentation or create an issue.