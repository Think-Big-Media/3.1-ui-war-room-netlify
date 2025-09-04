#!/usr/bin/env node

/**
 * Create testing and quality assurance issues in Linear
 */

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || 'lin_api_Bmz6HNg7d1JSvgUDBat52LY7xtdjHVtpfJE4j97Z';

async function createIssues() {
  const headers = {
    'Authorization': LINEAR_API_KEY,
    'Content-Type': 'application/json'
  };

  console.log('🚀 Creating testing and quality assurance issues in Linear...\n');

  // Define the issues to create
  const issues = [
    {
      title: "Unit Test Coverage for Backend Services",
      description: `## Problem
The backend services currently lack comprehensive unit test coverage, making it difficult to ensure reliability and catch regressions early.

## Solution
Achieve 80%+ test coverage for all backend services including:
- Authentication service
- Automation engine
- API endpoints
- Database operations
- WebSocket handlers

## Technical Details
- Use pytest with pytest-cov for coverage reporting
- Mock external dependencies (Redis, database, APIs)
- Test both success and error paths
- Include edge cases and boundary conditions

## Acceptance Criteria
- [ ] Authentication service has 80%+ coverage
- [ ] Automation engine has 80%+ coverage
- [ ] All API endpoints have comprehensive tests
- [ ] Database operations are properly tested with rollback
- [ ] WebSocket handlers have unit tests
- [ ] Coverage report is integrated into CI/CD pipeline
- [ ] Tests run in under 5 minutes`,
      labels: ["testing", "backend"],
      priority: 1 // High priority
    },
    {
      title: "Frontend Component Testing Suite",
      description: `## Problem
Frontend components lack comprehensive testing, leading to potential UI bugs and regressions that could impact user experience.

## Solution
Implement comprehensive React component testing with React Testing Library and achieve 80%+ coverage for all components.

## Technical Details
- Use Jest with React Testing Library
- Test user interactions and component behavior
- Mock API calls with MSW (Mock Service Worker)
- Test accessibility with jest-axe
- Include snapshot testing for UI consistency

## Acceptance Criteria
- [ ] All components have unit tests
- [ ] User interactions are tested (clicks, form submissions)
- [ ] Redux store integration is tested
- [ ] Error states and loading states are tested
- [ ] Accessibility tests pass
- [ ] 80%+ coverage achieved
- [ ] Tests integrated into CI/CD pipeline`,
      labels: ["testing", "frontend"],
      priority: 1 // High priority
    },
    {
      title: "End-to-End Testing with Playwright",
      description: `## Problem
Critical user flows are not tested end-to-end, which could lead to integration issues being discovered only in production.

## Solution
Set up E2E testing framework with Playwright for critical user flows including authentication, campaign creation, and volunteer management.

## Technical Details
- Install and configure Playwright
- Write tests for critical user journeys
- Test across multiple browsers (Chrome, Firefox, Safari)
- Include mobile viewport testing
- Set up test data management
- Configure parallel test execution

## Acceptance Criteria
- [ ] Playwright framework is set up and configured
- [ ] Authentication flow is tested E2E
- [ ] Campaign creation and management flow is tested
- [ ] Volunteer management flow is tested
- [ ] Event creation and registration is tested
- [ ] Tests run on multiple browsers
- [ ] Tests are integrated into CI/CD pipeline
- [ ] Test reports are generated automatically`,
      labels: ["testing", "e2e"],
      priority: 2 // Medium priority
    },
    {
      title: "Performance Testing and Optimization",
      description: `## Problem
API endpoint performance and frontend load times are not monitored or optimized, potentially leading to poor user experience under load.

## Solution
Implement performance testing for API endpoints and frontend load times, establish baselines, and optimize bottlenecks.

## Technical Details
- Use Locust or k6 for API load testing
- Implement Lighthouse CI for frontend performance
- Monitor database query performance
- Track Redis cache hit rates
- Profile React components for render performance
- Set up performance budgets

## Acceptance Criteria
- [ ] Load testing framework is implemented
- [ ] API endpoints handle 100+ concurrent users
- [ ] Response times are under 200ms for 95th percentile
- [ ] Frontend Lighthouse score is 90+ for performance
- [ ] Database queries are optimized (no N+1 queries)
- [ ] Performance metrics are tracked in monitoring
- [ ] Performance regression tests in CI/CD`,
      labels: ["testing", "performance"],
      priority: 2 // Medium priority
    },
    {
      title: "Security Audit and Penetration Testing",
      description: `## Problem
The application has not undergone a comprehensive security audit, potentially leaving vulnerabilities that could be exploited.

## Solution
Conduct a thorough security audit of authentication, API endpoints, and data handling, followed by penetration testing.

## Technical Details
- OWASP Top 10 vulnerability assessment
- Authentication and authorization testing
- Input validation and sanitization review
- SQL injection and XSS prevention verification
- API rate limiting and DDoS protection
- Secrets management audit
- Third-party dependency vulnerability scanning

## Acceptance Criteria
- [ ] OWASP ZAP scan completed and issues resolved
- [ ] Authentication flows are secure (JWT, session management)
- [ ] All inputs are properly validated and sanitized
- [ ] API endpoints have proper authorization checks
- [ ] Rate limiting is implemented on sensitive endpoints
- [ ] Secrets are properly managed (not in code)
- [ ] Dependencies are up-to-date with no critical vulnerabilities
- [ ] Penetration test report with no critical findings`,
      labels: ["security", "testing"],
      priority: 1 // High priority
    }
  ];

  // First, we need to get the team ID
  const teamQuery = `
    query GetTeam {
      teams {
        nodes {
          id
          name
        }
      }
    }
  `;

  try {
    const teamResponse = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: teamQuery })
    });
    
    const teamResult = await teamResponse.json();
    const team = teamResult.data?.teams?.nodes?.[0];
    
    if (!team) {
      console.error('❌ No team found. Please create a team first.');
      return;
    }

    console.log(`📋 Using team: ${team.name}\n`);

    // Create each issue
    for (const issue of issues) {
      // First, get label IDs for the issue
      const labelIds = [];
      for (const labelName of issue.labels) {
        const labelQuery = `
          query GetLabel {
            issueLabels(filter: { name: { eq: "${labelName}" } }) {
              nodes {
                id
                name
              }
            }
          }
        `;
        
        const labelResponse = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query: labelQuery })
        });
        
        const labelResult = await labelResponse.json();
        const label = labelResult.data?.issueLabels?.nodes?.[0];
        if (label) {
          labelIds.push(label.id);
        }
      }

      // Create the issue
      const mutation = `
        mutation CreateIssue {
          issueCreate(input: {
            title: "${issue.title}",
            description: ${JSON.stringify(issue.description)},
            teamId: "${team.id}",
            priority: ${issue.priority},
            labelIds: ${JSON.stringify(labelIds)}
          }) {
            success
            issue {
              id
              identifier
              title
              url
            }
          }
        }
      `;

      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: mutation })
      });
      
      const result = await response.json();
      
      if (result.data?.issueCreate?.success) {
        const createdIssue = result.data.issueCreate.issue;
        console.log(`✅ Created issue: ${createdIssue.identifier} - ${createdIssue.title}`);
        console.log(`   URL: ${createdIssue.url}\n`);
      } else {
        console.error(`❌ Failed to create issue: ${issue.title}`);
        console.error(result.errors);
      }
    }

    console.log('\n✨ Testing and quality assurance issues created successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the created issues in Linear');
    console.log('2. Assign team members or AI agents');
    console.log('3. Add to appropriate sprint');
    console.log('4. Set up test automation in CI/CD pipeline');

  } catch (error) {
    console.error('❌ Error creating issues:', error);
  }
}

// Run the script
if (require.main === module) {
  createIssues().catch(console.error);
}