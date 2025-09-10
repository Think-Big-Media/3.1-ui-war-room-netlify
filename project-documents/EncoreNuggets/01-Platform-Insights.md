# 🏗️ PLATFORM INSIGHTS - Leap.new & Encore Patterns
**Core platform behaviors and development patterns**  
**Last Updated**: September 5, 2025

---

## 🚨 ENVIRONMENT MANAGEMENT

### The 30-Second Environment Fix
**Golden Rule:** When Encore environments get corrupted, DELETE and RECREATE from working environment. Never abandon the whole project.

**The Process:**
1. Delete the corrupted staging environment (5 seconds)
2. Clone production to create fresh staging (30 seconds)
3. Resume normal deployment workflow (immediate)

### Environment Behavior
- **Timeout**: Approximately 30 seconds for app to become healthy
- **Requirement**: All services must pass health checks for app to start
- **Failure Mode**: "timeout waiting for app to become healthy" if any service fails

---

## 🔧 LEAP.NEW DEVELOPMENT PATTERNS

### Service Creation Workflow
- **DISCOVERY**: Leap.new works best with clear objectives and minimal implementation details
- **PATTERN**: "What not How" approach with non-negotiable specifics only
- **OPTIMAL LENGTH**: 150-300 words maximum
- **RESULT**: More reliable service generation with fewer revisions

### Perfect Prompt Strategy
- **Too Long (300+ words)**: Overwhelms AI, provides too much HOW
- **Too Short (25 words)**: Missing critical context and tokens
- **Sweet Spot (150 words)**: Clear WHAT, includes actual tokens, lets Leap figure out HOW

### Winning Prompt Formula
```markdown
# Clear Context (what exists)
# 3 Specific Tasks (what to change)
# Actual tokens/credentials (what to use)
# Success criteria (how to know it worked)
```

### Prompt Engineering Success
- **Structure**: Objective + Blueprint Compliance + Endpoints + Security + Expected Score
- **Format**: Use consistent template with dark line separators
- **Expectation**: 9.0+/10 production readiness achievable consistently

---

## 🛢️ DATABASE & MIGRATION PATTERNS

### Migration Management
- **Pattern**: Test complex migrations on fresh database first
- **Issue**: BIGSERIAL to UUID conversion requires manual intervention
- **Solution**: Create new column → migrate data → drop old → rename approach

### Database Reset Capabilities
- **Discovery**: Preview environments can be reset to clean state
- **Process**: Drop all tables → re-apply migrations from scratch
- **Use Case**: Recovery from corrupted database state
- **Benefit**: Faster than rebuilding entire project

### Smart Migration Strategy
```sql
-- Encore auto-runs these migrations
CREATE TABLE crisis_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity INTEGER CHECK (severity >= 1 AND severity <= 10),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);
```

### Key Insights
- Encore handles migrations automatically
- JSONB for flexible metadata storage
- UUID primary keys with `gen_random_uuid()`
- Proper foreign key relationships
- Check constraints for data validation

---

## 🔌 SERVICE ARCHITECTURE

### Service Structure Patterns
- **Discovery**: Encore services follow consistent structure and conventions
- **Pattern**: Service directory with encore.service.ts and supporting files
- **Conventions**: Proper TypeScript types, middleware chains, error handling
- **Integration**: Automatic service registration and discovery

### Health Check Requirements
- **Implementation**: Simple database ping + service status check only
- **Avoid**: External API calls or complex operations in health checks
- **Critical**: GET /health must return 200 OK quickly
- **Pattern**: Database → Health Service → Auth → Additional Services

### Authentication Integration
- **Discovery**: Encore handles JWT middleware cleanly across services
- **Pattern**: Centralized auth service with JWT validation middleware
- **Benefit**: Consistent authentication across all services
- **Requirement**: Proper CORS configuration for token passing

### CORS Configuration
- **Discovery**: CORS must be configured at API Gateway level for consistency
- **Pattern**: Centralize CORS in gateway, not individual services
- **Origins**: Include all development and production domains
- **Benefit**: Prevents frontend-backend communication issues

---

## 📊 PERFORMANCE & OPTIMIZATION

### Database Query Patterns
```sql
-- Indexed queries for dashboard performance
SELECT * FROM mentions 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY sentiment_score DESC;

-- JSONB aggregations for intelligence
SELECT metadata->'keywords' as top_keywords 
FROM intelligence_snapshots 
WHERE snapshot_date = CURRENT_DATE;
```

### Optimization Insights
- Encore handles connection pooling
- Index on frequently queried columns
- JSONB for flexible analytics storage
- Time-based partitioning for large datasets

---

## 🔄 BACKGROUND JOBS & AUTOMATION

### Cron Job Patterns
```typescript
// Every 15 minutes - mention sync
cron("*/15 * * * *", async () => {
  await syncMentions();
});

// Daily intelligence snapshots  
cron("0 0 * * *", async () => {
  await createDailySnapshot();
});
```

**Critical Learning:**
- Encore has built-in cron support
- Jobs run automatically in all environments
- No external job queues needed
- Perfect for API data synchronization

---

**This document focuses on core platform behaviors and patterns. Add new discoveries here as we learn more about Leap.new and Encore platform-specific behaviors.**