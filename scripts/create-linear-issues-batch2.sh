#!/bin/bash

# War Room - Linear Issues Batch 2
# Run this script after setting up your Linear API key

echo "Creating final batch of Linear issues for War Room..."
echo "Make sure you have run: linear auth"
echo ""

# Issue 16: WebSocket Real-time Communication
linear issue create \
  --title "WebSocket Real-time Communication" \
  --description "Implement WebSocket connections for real-time updates in campaign dashboard and volunteer coordination. This includes setting up WebSocket endpoints in FastAPI, implementing client-side connection management in React, and creating real-time update patterns for campaign events, volunteer status updates, and live dashboard metrics." \
  --label "feature" \
  --label "medium-priority" \
  --label "backend" \
  --label "frontend"

# Issue 17: Document Intelligence Integration
linear issue create \
  --title "Document Intelligence Integration" \
  --description "Complete the document analysis system with OpenAI and Pinecone for campaign document management. Implement document upload, processing pipeline with OCR support, vector embedding generation, semantic search capabilities, and AI-powered document summarization. Includes integration with existing document storage and retrieval systems." \
  --label "feature" \
  --label "medium-priority" \
  --label "backend" \
  --label "ai"

# Issue 18: Volunteer Management System
linear issue create \
  --title "Volunteer Management System" \
  --description "Build comprehensive volunteer tracking, scheduling, and communication features. Includes volunteer profiles, skill tracking, availability calendars, shift scheduling, task assignments, hour tracking, automated reminders, and bulk communication tools. Integration with SMS/email notifications for volunteer coordination." \
  --label "feature" \
  --label "high-priority" \
  --label "backend" \
  --label "frontend"

# Issue 19: Event Management Module
linear issue create \
  --title "Event Management Module" \
  --description "Create event creation, RSVP tracking, and attendance management system. Features include event creation wizard, customizable RSVP forms, QR code check-in system, capacity management, waitlist handling, automated confirmation emails, calendar integration, and post-event analytics. Support for both in-person and virtual events." \
  --label "feature" \
  --label "high-priority" \
  --label "backend" \
  --label "frontend"

# Issue 20: Data Analytics Dashboard
linear issue create \
  --title "Data Analytics Dashboard" \
  --description "Implement analytics dashboard with campaign metrics, volunteer performance, and donation tracking. Build real-time data visualization using Chart.js or D3.js, create custom KPI widgets, implement data export functionality, design responsive dashboard layouts, and add configurable date ranges and filters. Include predictive analytics for campaign performance." \
  --label "feature" \
  --label "medium-priority" \
  --label "frontend" \
  --label "backend"

# Issue 21: Mobile Responsive Design
linear issue create \
  --title "Mobile Responsive Design" \
  --description "Ensure all components are fully responsive and optimized for mobile devices. Audit all existing components for mobile compatibility, implement responsive navigation patterns, optimize touch interactions, ensure forms are mobile-friendly, test on various device sizes, and implement progressive web app (PWA) features for offline capability." \
  --label "frontend" \
  --label "high-priority" \
  --label "ui-ux"

# Issue 22: CI/CD Pipeline Setup
linear issue create \
  --title "CI/CD Pipeline Setup" \
  --description "Configure GitHub Actions for automated testing, building, and deployment. Set up workflows for running tests on PR, automated builds on merge to main, deployment to staging/production environments, database migration checks, code quality gates (coverage, linting), and automated security scanning. Include rollback procedures and deployment notifications." \
  --label "infrastructure" \
  --label "high-priority" \
  --label "devops"

echo ""
echo "✅ Issue creation commands generated!"
echo ""
echo "Next steps:"
echo "1. Run 'linear auth' to authenticate with Linear"
echo "2. Execute this script to create all issues"
echo "3. Visit Linear to assign issues to team members and projects"