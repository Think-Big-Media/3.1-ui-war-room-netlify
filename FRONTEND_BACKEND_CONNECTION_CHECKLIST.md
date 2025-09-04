# Frontend-Backend Connection Checklist
## War Room 3.0 - API Endpoint Requirements

Generated: 2025-09-01
Frontend URL: https://30-ui-war-room-kn4fmyp8j-growthpigs-projects.vercel.app
Backend URL: https://war-room-3-backend-d2msjrk82vjjq794glog.lp.dev

---

## 1. CAMPAIGNS SERVICE

### Meta Campaigns
| Endpoint | Method | Expected Response | Mock Status | Priority | Notes |
|----------|--------|------------------|-------------|----------|-------|
| `/api/v1/meta/campaigns` | GET | Campaign list with metrics | ✅ Mock Working | **CRITICAL** | Returns campaigns with spend, impressions, clicks |
| `/api/v1/meta/adsets` | GET | Ad sets by campaign | ✅ Mock Working | HIGH | Grouped by campaign ID |
| `/api/v1/meta/insights` | GET | Performance insights | ✅ Mock Working | HIGH | Time-series data for charts |
| `/api/v1/auth/meta/connect` | GET | OAuth URL redirect | ❌ Needs Backend | **CRITICAL** | OAuth flow initiation |
| `/api/v1/auth/meta/callback` | POST | Token storage | ❌ Needs Backend | **CRITICAL** | OAuth callback handler |
| `/api/v1/auth/meta/status` | GET | Connection status | ✅ Mock Working | HIGH | Shows connection state |

### Google Ads Campaigns  
| Endpoint | Method | Expected Response | Mock Status | Priority | Notes |
|----------|--------|------------------|-------------|----------|-------|
| `/api/v1/google-ads/campaigns` | GET | Campaign list | ✅ Mock Working | **CRITICAL** | Returns campaigns with metrics |
| `/api/v1/google-ads/performance` | GET | Performance metrics | ✅ Mock Working | HIGH | CTR, CPC, conversions |
| `/api/v1/google-ads/insights` | GET | Analytics data | ✅ Mock Working | HIGH | Detailed insights |
| `/api/v1/auth/google-ads/connect` | GET | OAuth URL | ❌ Needs Backend | **CRITICAL** | OAuth initiation |
| `/api/v1/auth/google-ads/callback` | POST | Token storage | ❌ Needs Backend | **CRITICAL** | OAuth callback |
| `/api/v1/auth/google-ads/status` | GET | Connection status | ✅ Mock Working | HIGH | Connection state |

---

## 2. MENTIONLYTICS SERVICE

| Endpoint | Method | Expected Response | Mock Status | Priority | Notes |
|----------|--------|------------------|-------------|----------|-------|
| `/api/v1/mentionlytics/mentions` | GET | Mentions feed array | ✅ Mock Working | **CRITICAL** | Main feed data |
| `/api/v1/mentionlytics/sentiment` | GET | Sentiment scores | ✅ Mock Working | **CRITICAL** | Positive/negative/neutral |
| `/api/v1/mentionlytics/geo` | GET | Geographic data | ✅ Mock Working | HIGH | State-level mentions |
| `/api/v1/mentionlytics/influencers` | GET | Top influencers list | ✅ Mock Working | MEDIUM | Sorted by reach |
| `/api/v1/mentionlytics/trending` | GET | Trending topics | ✅ Mock Working | HIGH | Real-time trends |
| `/api/v1/mentionlytics/share-of-voice` | GET | Competitor comparison | ✅ Mock Working | HIGH | Market share data |
| `/api/v1/mentionlytics/feed` | GET | Live feed | ✅ Mock Working | **CRITICAL** | Real-time updates |
| `/api/v1/mentionlytics/mentions/keywords` | GET | Available keywords | ✅ Mock Working | MEDIUM | For filtering |
| `/api/v1/mentionlytics/mentions/crisis` | GET | Crisis alerts | ✅ Mock Working | **CRITICAL** | High-priority alerts |
| `/api/v1/mentionlytics/status` | GET | Service health | ✅ Mock Working | LOW | Health check |

---

## 3. INTELLIGENCE SERVICE

| Endpoint | Method | Expected Response | Mock Status | Priority | Notes |
|----------|--------|------------------|-------------|----------|-------|
| `/api/v1/intelligence/documents/analyze` | POST | Analysis results | ❌ Needs Backend | MEDIUM | Document AI analysis |
| `/api/v1/intelligence/reports` | GET | Report list | ❌ Needs Backend | MEDIUM | Generated reports |
| `/api/v1/intelligence/threat-assessment` | POST | Threat analysis | ❌ Needs Backend | HIGH | Risk assessment |
| `/api/v1/intelligence/knowledge-base/search` | GET | Search results | ❌ Needs Backend | LOW | Knowledge search |
| `/api/v1/intelligence/competitors/{id}` | GET | Competitor data | ✅ Mock Working | HIGH | Competitor intel |

---

## 4. MONITORING SERVICE

| Endpoint | Method | Expected Response | Mock Status | Priority | Notes |
|----------|--------|------------------|-------------|----------|-------|
| `/api/v1/monitoring/sentiment` | GET | Current sentiment | ✅ Mock Working | **CRITICAL** | Real-time sentiment |
| `/api/v1/monitoring/sentiment?start={date}&end={date}` | GET | Historical data | ✅ Mock Working | HIGH | Time-series data |
| `/api/v1/monitoring/mentions` | GET | Metrics dashboard | ✅ Mock Working | **CRITICAL** | Main dashboard data |
| `/api/v1/monitoring/trends` | GET | Platform trends | ✅ Mock Working | HIGH | Performance trends |
| `/api/v1/monitoring/trending?limit={n}` | GET | Top trends | ✅ Mock Working | HIGH | Trending topics |
| `/api/v1/monitoring/mentions?keyword={kw}` | GET | Keyword mentions | ✅ Mock Working | MEDIUM | Filtered mentions |

---

## 5. AUTHENTICATION SERVICE

| Endpoint | Method | Expected Response | Mock Status | Priority | Notes |
|----------|--------|------------------|-------------|----------|-------|
| `/api/v1/auth/login` | POST | JWT + user data | ❌ Needs Backend | **CRITICAL** | Core auth |
| `/api/v1/auth/register` | POST | User created | ❌ Needs Backend | **CRITICAL** | User signup |
| `/api/v1/auth/me` | GET | User profile | ❌ Needs Backend | **CRITICAL** | Current user |
| `/api/v1/auth/logout` | POST | Success status | ❌ Needs Backend | HIGH | Logout |
| `/api/v1/auth/refresh` | POST | New JWT | ❌ Needs Backend | **CRITICAL** | Token refresh |
| `/api/v1/auth/status` | GET | Auth status | ❌ Needs Backend | HIGH | Check auth |

---

## 6. WEBSOCKET CONNECTIONS

| Connection | Path | Purpose | Mock Status | Priority | Notes |
|-----------|------|---------|-------------|----------|-------|
| Dashboard Updates | `/ws/dashboard` | Real-time metrics | ❌ Needs Backend | HIGH | Live dashboard |
| Ad Monitor | `/ws/ad-monitor` | Campaign updates | ❌ Needs Backend | MEDIUM | Live ad data |
| Mentions Stream | `/ws/mentions` | Live mentions | ❌ Needs Backend | HIGH | Real-time feed |

---

## 7. ALERT SERVICE

| Endpoint | Method | Expected Response | Mock Status | Priority | Notes |
|----------|--------|------------------|-------------|----------|-------|
| `/api/v1/alerts/crisis` | GET | Crisis alert list | ✅ Mock Working | **CRITICAL** | Active threats |
| `/api/v1/ad-insights/alerts` | GET | Ad alerts | ✅ Mock Working | HIGH | Ad performance alerts |

---

## 8. REPORTING SERVICE

| Endpoint | Method | Expected Response | Mock Status | Priority | Notes |
|----------|--------|------------------|-------------|----------|-------|
| `/api/v1/reporting/analytics` | POST | Report generated | ❌ Needs Backend | MEDIUM | Custom reports |
| `/api/v1/reporting/campaign-metrics` | GET | Metrics data | ✅ Mock Working | HIGH | Campaign KPIs |
| `/api/v1/reporting/performance-data` | GET | Performance stats | ✅ Mock Working | HIGH | Overall performance |

---

## PRIORITY DEFINITIONS

- **CRITICAL**: Core functionality won't work without these
- **HIGH**: Major features degraded without these
- **MEDIUM**: Nice-to-have features affected
- **LOW**: Minor enhancements

---

## IMPLEMENTATION STATUS SUMMARY

### ✅ Working with Mock Data (23 endpoints)
- All Mentionlytics endpoints
- Campaign data endpoints (Meta & Google)
- Monitoring endpoints
- Alert endpoints
- Basic reporting

### ❌ Needs Backend Implementation (19 endpoints)
- **Authentication system** (6 endpoints) - CRITICAL
- **OAuth flows** (4 endpoints) - CRITICAL  
- **WebSocket connections** (3 endpoints) - HIGH
- **Intelligence services** (5 endpoints) - MEDIUM
- **Custom reporting** (1 endpoint) - MEDIUM

---

## RECOMMENDED BACKEND DEPLOYMENT SEQUENCE

### Phase 1: Authentication (Week 1)
1. Implement JWT authentication endpoints
2. Set up user registration/login
3. Configure token refresh mechanism
4. Test with frontend auth flow

### Phase 2: OAuth Integration (Week 1-2)
1. Implement Google Ads OAuth
2. Implement Meta OAuth
3. Store and manage tokens
4. Test connection status endpoints

### Phase 3: Core Services (Week 2-3)
1. Connect Mentionlytics API
2. Implement monitoring endpoints
3. Set up WebSocket connections
4. Enable real-time updates

### Phase 4: Intelligence & Reporting (Week 3-4)
1. Document analysis service
2. Custom reporting engine
3. Threat assessment
4. Knowledge base search

---

## NOTES FOR BACKEND TEAM

1. **CORS Configuration**: Frontend is on Vercel, ensure CORS allows:
   - Origin: `https://30-ui-war-room-kn4fmyp8j-growthpigs-projects.vercel.app`
   - Methods: GET, POST, PUT, DELETE, OPTIONS
   - Headers: Authorization, Content-Type

2. **Response Format**: All endpoints should return:
   ```json
   {
     "success": boolean,
     "data": {} | [],
     "error": string | null,
     "timestamp": ISO-8601
   }
   ```

3. **Authentication Headers**: 
   - Use `Authorization: Bearer {token}` for authenticated requests
   - Support token refresh when expired

4. **Rate Limiting**: 
   - Google Ads API: 15,000 requests/day
   - Meta API: 200 calls/hour per user
   - Implement circuit breakers for external APIs

5. **Mock Mode Support**:
   - Keep mock mode functional for development
   - Use header `X-Use-Mock-Data: true` to force mock responses

---

Generated for War Room 3.0 Frontend-Backend Integration
Contact: CTO Twin for clarifications