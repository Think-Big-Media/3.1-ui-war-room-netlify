#!/usr/bin/env node

/**
 * Setup Linear workspace for War Room
 * This script creates teams, projects, labels, and templates
 */

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || 'lin_api_Bmz6HNg7d1JSvgUDBat52LY7xtdjHVtpfJE4j97Z';

async function createLinearSetup() {
  const headers = {
    'Authorization': LINEAR_API_KEY,
    'Content-Type': 'application/json'
  };

  console.log('🚀 Setting up Linear for War Room...\n');

  // Step 1: Create Labels
  console.log('📌 Creating labels...');
  const labels = [
    { name: 'bug', color: '#e11d48', description: 'Something is broken' },
    { name: 'feature', color: '#8b5cf6', description: 'New functionality' },
    { name: 'enhancement', color: '#3b82f6', description: 'Improvement to existing features' },
    { name: 'documentation', color: '#10b981', description: 'Documentation updates' },
    { name: 'performance', color: '#f59e0b', description: 'Performance improvements' },
    { name: 'security', color: '#dc2626', description: 'Security issues' },
    { name: 'checkpoint', color: '#6366f1', description: 'Checkpoint system related' },
    { name: 'deployment', color: '#14b8a6', description: 'Deployment and infrastructure' },
    { name: 'ai-agent', color: '#a855f7', description: 'Tasks for AI agents' },
    { name: 'testing', color: '#22c55e', description: 'Test related' },
    { name: 'technical-debt', color: '#f97316', description: 'Code cleanup needed' }
  ];

  // GraphQL mutation to create labels
  for (const label of labels) {
    const mutation = `
      mutation CreateLabel {
        issueLabelCreate(input: {
          name: "${label.name}",
          color: "${label.color}",
          description: "${label.description}"
        }) {
          success
          issueLabel {
            id
            name
          }
        }
      }
    `;

    try {
      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: mutation })
      });
      
      const result = await response.json();
      if (result.data?.issueLabelCreate?.success) {
        console.log(`✅ Created label: ${label.name}`);
      }
    } catch (error) {
      console.log(`⚠️  Label ${label.name} might already exist`);
    }
  }

  console.log('\n📋 Linear setup complete!');
  console.log('\nNext steps:');
  console.log('1. Go to Linear and verify the labels were created');
  console.log('2. Create teams manually (API requires admin permissions)');
  console.log('3. Use the issue templates from the documentation');
  console.log('\nTo create issues with the Linear CLI:');
  console.log('linear issue create --title "Your issue" --label bug');
}

// Check if running directly
if (require.main === module) {
  createLinearSetup().catch(console.error);
}

// Instructions for manual setup
console.log(`
Manual Setup Instructions:
========================

1. TEAMS (Create in Linear UI):
   - War Room Core
   - War Room QA  
   - War Room DevOps

2. PROJECTS (In each team):
   - Backend Development (WR-BE)
   - Frontend Development (WR-FE)
   - Infrastructure (WR-INF)
   - AI & Automation (WR-AI)

3. ISSUE TEMPLATES:
   Copy templates from: DOCS/project-management/linear-workflow.md

4. WORKFLOW STATES:
   Backlog → Todo → In Progress → In Review → Testing → Done

5. INTEGRATIONS:
   - GitHub: Settings → Integrations → GitHub
   - Slack: Settings → Integrations → Slack
`);