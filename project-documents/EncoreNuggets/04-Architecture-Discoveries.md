# 🏗️ ARCHITECTURE DISCOVERIES - War Room Specific
**Architectural breakthroughs and patterns discovered during War Room development**  
**Last Updated**: September 5, 2025

---

## 🎯 HYBRID ROUTING ARCHITECTURE

### The Core Principle
- All routes beginning with `/api/v1/` **MUST** serve pure `application/json` responses
- All routes beginning with `/admin/` **MUST** serve `text/html`
- **No** default HTML catch-all for API routes

### Backend-Controlled Data Mode
- Backend maintains global state for data mode (`LIVE` or `MOCK`)
- `/api/v1/health` endpoint **MUST** return this state: `{"status": "ok", "data_mode": "MOCK"}`
- `/admin` interface contains the toggle to change this state

### Critical File Locations for API-Only Mode
- **Key File**: backend/admin/api.ts must contain catch-all handler
- **Order Matters**: Catch-all MUST be last handler registered
- **Persistence**: Changes may not survive deployment without proper structure
- **Solution**: Complete file replacement rather than additions

---

## 🚨 BREAKTHROUGH DISCOVERY - UI Shell Hosting

### UI Shell as Frontend Host (September 3, 2025)
**Discovery**: Leap.new/Encore can potentially host React frontends, not just APIs  
**Accident**: Applied JSON fix to UI Shell instead of backend - revealed capability  
**Implication**: Could eliminate Netlify entirely, run everything on Encore  
**Strategy**: Deploy to both staging and production for resilience  
**Benefit**: Single platform for entire application stack

### JSON Fix Persistence Issues
**Discovery**: Catch-all handlers may not persist across deployments  
**Symptom**: Backend reverts to HTML serving after appearing fixed  
**Root Cause**: Leap.new preview UI deeply integrated, overrides catch-all handlers  
**Attempts**: Multiple approaches to disable preview.js serving  
**Learning**: Preview UI is more persistent than expected, may require nuclear approach

---

## 🗄️ DATABASE ARCHITECTURE PATTERNS

### War Room Schema Evolution
```sql
-- Crisis event tracking
CREATE TABLE crisis_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity INTEGER CHECK (severity >= 1 AND severity <= 10),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Enhanced mentions with crisis linking
ALTER TABLE mentions ADD COLUMN sentiment_score DECIMAL(3,2);
ALTER TABLE mentions ADD COLUMN crisis_event_id UUID REFERENCES crisis_events(id);

-- Intelligence snapshots
CREATE TABLE intelligence_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Architecture Insights
- JSONB for flexible metadata storage (crisis context, mention analysis)
- UUID primary keys for distributed system compatibility
- Proper foreign key relationships for data integrity
- Check constraints for business rule enforcement
- Time-based indexing for dashboard performance

---

## 🔌 API INTEGRATION ARCHITECTURE

### External Service Integration Pattern
**Mentionlytics Integration:**
- Real-time mention monitoring
- Sentiment analysis pipeline
- Geographic data aggregation
- Influencer identification
- Crisis detection algorithms

**Meta Business Integration:**
- Campaign performance tracking
- Audience insights
- Ad spend optimization
- Cross-platform analytics

**Google Ads Integration:**
- Campaign management
- Performance metrics
- Keyword optimization
- Conversion tracking

### Service Communication Pattern
```typescript
// Inter-service communication
export class IntelligenceService {
  constructor(
    private mentionsService: MentionsService,
    private metaService: MetaService,
    private googleAdsService: GoogleAdsService
  ) {}
  
  async generateIntelligenceSnapshot(): Promise<IntelligenceSnapshot> {
    const [mentions, metaData, googleData] = await Promise.all([
      this.mentionsService.fetchRecentMentions(),
      this.metaService.getInsights(),
      this.googleAdsService.getPerformance()
    ]);
    
    // Correlate data across services
    return this.correlateIntelligence(mentions, metaData, googleData);
  }
}
```

---

## 📊 REAL-TIME ARCHITECTURE

### WebSocket Integration Pattern
- 30-second heartbeat for connection health
- Real-time crisis event notifications
- Live dashboard updates
- Mention stream processing
- Campaign performance updates

### Background Job Architecture
```typescript
// Crisis detection workflow
cron("*/5 * * * *", async () => {
  const recentMentions = await syncMentions();
  const crisisEvents = await detectCrisis(recentMentions);
  
  if (crisisEvents.length > 0) {
    await Promise.all([
      notifyStakeholders(crisisEvents),
      updateDashboard(crisisEvents),
      triggerResponseWorkflow(crisisEvents)
    ]);
  }
});

// Daily intelligence snapshots
cron("0 6 * * *", async () => {
  const snapshot = await generateDailyIntelligence();
  await storeIntelligenceSnapshot(snapshot);
  await distributeIntelligenceReport(snapshot);
});
```

---

## 🛡️ SECURITY ARCHITECTURE

### Authentication Flow
1. JWT access tokens (15-minute expiry)
2. Refresh tokens (7-day expiry, hashed storage)
3. Role-based permissions in JWT payload
4. Automatic token refresh on API calls
5. Secure logout with token blacklisting

### API Security Patterns
- Rate limiting on all endpoints (100/minute default)
- CORS configured for specific origins only
- Input validation using Joi schemas
- SQL injection prevention through parameterized queries
- Secrets accessed via Encore `secret()` function only

---

## 🎭 MOCK/LIVE DATA ARCHITECTURE

### Backend State Management
```typescript
// Global data mode state
interface SystemState {
  dataMode: 'MOCK' | 'LIVE';
  lastUpdated: Date;
  updatedBy: string;
}

// Health endpoint returns current state
export const health = api({
  method: "GET", path: "/api/v1/health"
}, async (): Promise<HealthResponse> => {
  return {
    status: "ok",
    data_mode: await getDataMode(),
    timestamp: new Date().toISOString()
  };
});
```

### Service-Level Toggle Implementation
```typescript
export class MentionsService {
  async fetchMentions(): Promise<Mention[]> {
    const dataMode = await getDataMode();
    
    if (dataMode === 'MOCK') {
      return generateMockMentions();
    }
    
    return this.fetchLiveMentions();
  }
}
```

---

## 📈 PERFORMANCE ARCHITECTURE

### Query Optimization Patterns
```sql
-- Time-series queries for dashboard
CREATE INDEX idx_mentions_created_at ON mentions (created_at DESC);
CREATE INDEX idx_mentions_sentiment ON mentions (sentiment_score DESC);

-- Geographic queries
CREATE INDEX idx_mentions_location ON mentions USING GIN (metadata) WHERE metadata ? 'location';

-- Full-text search
CREATE INDEX idx_mentions_content_search ON mentions USING GIN (to_tsvector('english', content));
```

### Caching Strategy
- **Redis Cache**: 5-minute TTL for API responses
- **Database Query Cache**: Encore built-in connection pooling
- **Frontend Cache**: React Query for component state
- **CDN Cache**: Cloudflare for static assets

---

**This document focuses on architectural discoveries specific to War Room. Add new architectural patterns and breakthroughs here as we discover them during development.**