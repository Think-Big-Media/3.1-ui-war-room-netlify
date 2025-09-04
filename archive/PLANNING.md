# War Room AI Platform - Project Planning & Context

*Context Engineering Source of Truth for AI Agents*
*Updated: July 10, 2025*

## 🎯 Project Vision

War Room is an AI-powered political marketing command center that unifies campaign intelligence, voice memos, document search, and live ad-performance data in a single secure portal. This is a **desktop-first SaaS application** with CleanMyMac-inspired professional interface, not mobile-first or chat-centric.

## 📋 Project Status

**Current Phase**: Foundation & Architecture (Week 1 of 6-8 week timeline)
**Contract**: $22,500 USD, 6-8 week delivery
**Start Date**: July 7, 2025 (adjusted from July 1 due to payment timing)
**Target Completion**: August 18 - September 1, 2025

## 🏗️ System Architecture Overview

### Core Technology Stack
- **Frontend**: React + TypeScript + Tailwind CSS (desktop-first)
- **Backend**: Supabase (Postgres 15 + Edge Functions) 
- **Deployment**: Railway Phase 1 → AWS Phase 2 (migration documentation)
- **AI/ML**: OpenAI GPT-4o + Whisper, Pinecone vector DB
- **Orchestration**: n8n Cloud (workflow automation)
- **Real-time Data**: Mentionlytics (primary), NewsWhip
- **Ads Integration**: Meta Ads API + Google Ads API
- **Video Processing**: lindy.ai for scene detection
- **Compliance**: Vanta-ready SOC 2, GDPR/FEC compliant

### Data Architecture
- **Multi-tenant**: Organization-based with Row-Level Security (RLS)
- **Vector Search**: Pinecone 1536-dim embeddings for RAG
- **Real-time**: WebSocket connections for live alerts
- **Audit Trail**: Immutable logs for political compliance

## 🎭 Target Users

### Primary Personas
1. **Paige (Campaign Manager/Admin)**: Needs quick spend analysis, team coordination, security control
2. **Alex (Data Analyst/Member)**: Deep-dive CSV analysis, complex queries, data export
3. **Riley (Field Director/Member)**: Mobile voice memos, email summaries, minimal screen time

### User Retention Strategy
- Proactive notifications (email, browser, SMS)
- Real-time crisis detection and alerts
- Daily digest automation
- Information surfacing without user prompting

## 📊 Core Product Features

### Must-Have Features (Contract Specified)
1. **Conversational Insights**: RAG-powered chat with citations
2. **Document Intelligence**: PDF/CSV upload → searchable vectors
3. **Live Ad Metrics**: Meta + Google Ads real-time reporting
4. **Crisis Detection**: Real-time sentiment monitoring + alerts
5. **Voice/Video Processing**: Whisper transcription + lindy.ai analysis
6. **Multi-channel Delivery**: Email, SMS, WhatsApp, browser notifications
7. **Visual Intelligence**: Political imagery analysis and recommendations
8. **CRM Integration**: Salesforce, HubSpot, Pipedrive sync
9. **Security Framework**: SOC 2-ready with encryption, RLS, audit logs

### Advanced Features
- Real-time sentiment monitoring (Twitter/Facebook)
- AI reporting dashboard with narrative summaries
- Scheduled digest automation
- Team collaboration workflows
- Political compliance tracking

## 🔄 Development Approach

### AI-Augmented Development
- Multiple Claude Code terminals for parallel development
- Cursor AI agents for background task automation
- 3-4x traditional development velocity expected
- Component-driven architecture for rapid iteration

### Critical Path Dependencies
1. **Week 1**: Meta & Google OAuth applications (2-4 week approval)
2. **Week 2**: Visual intelligence foundation + architecture sign-off
3. **Week 3**: Real-time API integrations (Mentionlytics primary, NewsWhip)
4. **Week 4**: Crisis detection workflows + voice/video processing

## 📅 Current Sprint Goals

### Week 1-2: Foundation & Architecture
- [x] Complete context engineering setup (PLANNING.md, TASK.md, .env)
- [ ] Visual intelligence foundation implementation
- [ ] React frontend scaffolding (login, chat UI, file/video upload)
- [ ] Supabase setup with RLS policies
- [ ] Pinecone vector store configuration
- [ ] Meta & Google API applications submitted
- [ ] Client architecture sign-off

### Immediate Blockers
- API credential collection from client team
- Brand assets and compliance requirements
- Architecture review and approval

## 🎨 Design System Requirements

### Desktop-First Interface (CleanMyMac Inspiration)
- Professional information architecture
- Comprehensive menus and dashboard views
- Rich data visualization components
- Multi-panel layouts with sidebar navigation
- Contextual information surfacing

### Key UI Components Needed
- Real-time metrics dashboard
- Chat interface with citation display
- Document upload/management interface
- Alert management system
- Admin analytics dashboard
- Team collaboration panels

## 🔐 Security & Compliance Context

### Political Data Protection
- All data stored in US regions only
- GDPR compliance with consent management
- FEC readiness with audit trails
- Immutable spend/audit logs
- Encryption at rest and in transit

### SOC 2 Framework
- Access control matrix implementation
- Vulnerability scanning integration
- DDoS protection configuration
- Weekly security monitoring
- Audit logging for all sensitive operations

## 🚀 Success Metrics

### Performance Targets
- Chat response time: < 3s median, < 7s P95
- File ingestion: < 60s for 25MB PDF
- Real-time alert latency: < 60s
- Dashboard load time: < 2s

### Business KPIs
- Daily Active Users: ≥ 10 within 30 days
- Digest open rate: ≥ 60%
- LLM cost efficiency: < $0.30 per user per day
- Post-launch bugs: < 5 high-severity in first 30 days

## 🎯 Key Context for AI Agents

### What This Platform IS
- Desktop-first SaaS application for political campaign teams
- Professional interface with comprehensive data visualization
- Real-time monitoring and crisis detection system
- AI-powered document intelligence with citation accuracy
- Multi-channel communication and alert system

### What This Platform IS NOT
- Mobile-first application or simple chat interface
- Generic business intelligence tool
- Consumer-focused social media platform
- Basic document storage system

### AI Development Instructions
- Always prioritize desktop interface design
- Implement comprehensive error handling for external APIs
- Maintain political data compliance in all features
- Focus on user retention and engagement mechanisms
- Build for rapid scaling (10 → 1000 MAU)

## 📚 Critical Documentation References

All agents must reference these source documents:
- `/DOCS/guides/01-Project Requirements Document (PRD).md`
- `/DOCS/architecture/02-Technical Architecture Document - Railway → AWS.md`
- `/DOCS/api/03-Database Schema & API Specifications - Postgres.md`
- `/DOCS/guides/04-User Stories & Acceptance Criteria - Detailed.md`
- `/DOCS/technical/05-Development Timeline & Milestones.md`

## 🔄 Agent Session Protocol

Every AI agent session must:
1. Read PLANNING.md (this file) first
2. Check TASK.md for current priorities
3. Update TASK.md with progress before ending session
4. Reference user stories for implementation details
5. Validate against security and compliance requirements

---

*This document serves as the primary context source for all AI agents working on the War Room platform. Update version date when making significant changes.*