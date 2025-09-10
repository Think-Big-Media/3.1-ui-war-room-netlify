# 🚨 CRITICAL GOTCHAS - Never Again
**Mistakes we've made and how to avoid them**  
**Last Updated**: September 5, 2025

---

## 1. The Staging Deletion Mistake
**Problem:** Corrupted environment, grayed out buttons  
**Wrong Solution:** Abandon entire project  
**Right Solution:** Delete environment, clone from production (30 seconds)

**What Happened:**
- Staging environment got corrupted with deployment log issues
- Buttons grayed out, couldn't deploy anything
- We ABANDONED the entire approach instead of fixing it
- Started over from scratch when we had a working production environment

**Why We Missed It:**
- Didn't research Encore docs systematically
- Focused on workarounds instead of root cause
- Assumed deployment infrastructure was permanently broken
- Gave up too quickly instead of troubleshooting

---

## 2. The Mock Data Trap  
**Problem:** API structure exists but returns fake data  
**Wrong Solution:** Rebuild everything  
**Right Solution:** Tell Leap to replace mocks with real API calls

**What We Found:**
- All API endpoints built but using mock data generators
- Real tokens configured but not used in code
- `fetchRecentMentions()` returned fake data instead of calling Mentionlytics API

**The Fix:**
Tell Leap to "Replace mock API calls with real integrations using existing tokens" - it knows how to do the rest.

---

## 3. The Secrets Hardcoding Horror
**Problem:** Credentials not flowing to backend  
**Wrong Solution:** Hardcode in source files  
**Right Solution:** GitHub Secrets → Encore automatic deployment

**Never Do:**
- Hardcode API keys in source files
- Use placeholder values in production
- Store secrets in .env files committed to git

---

## 4. The Over-Engineering Prompts
**Problem:** 300+ word technical specifications  
**Wrong Solution:** More detailed instructions  
**Right Solution:** Clear WHAT, let Leap figure out HOW (150 words max)

---

## 5. The Environment Variable Confusion
**Problem:** Frontend can't connect to backend  
**Wrong Solution:** Complex proxy setup  
**Right Solution:** Direct connection via VITE_ENCORE_API_URL

---

## 6. Frontend P0 Blockers (September 2 Learning)
**Problem:** Claims of "mission complete" without testing P0 functionality  
**Wrong Solution:** Assume everything works because architecture is sound  
**Right Solution:** Systematic audit of critical paths before declaring victory

**The Four P0 Blockers We Missed:**
1. Missing Redux store (app won't load)
2. Insecure API clients (no token refresh)
3. Missing error boundaries (unhandled crashes)
4. Sentry not wrapping app (no observability)

---

## 7. React Redux Version Hell
**Problem:** React Redux 9.2.0 breaks useSyncExternalStore in React 18  
**Symptoms:** "Cannot read properties of undefined (reading 'useSyncExternalStore')"  
**Wrong Solution:** Try environment fixes, shims, webpack configs  
**Right Solution:** Downgrade to React Redux 8.1.3 (proven compatibility)

---

## 8. Leap.new HTML Serving
**Problem:** Backend serves HTML with preview UI instead of JSON  
**Symptoms:** All API calls return `<!DOCTYPE html>` with preview.js  
**Wrong Solution:** Try to fix routing or add headers  
**Right Solution:** Disable static file serving in admin service via Leap.new

### Preview UI Behavior
- **Discovery**: Leap.new preview.js loads by default on all projects
- **Behavior**: Intercepts all routes before API handlers
- **Override Difficulty**: Standard catch-all patterns may not work
- **Cloudflare Cache**: CDN caching can mask whether fix is applied
- **Verification**: Need multiple test endpoints to confirm JSON responses

---

## 🚦 COMMON DEPLOYMENT FAILURES

### Grayed Out Buttons
- Usually indicates log corruption
- Environment recreation fixes 90% of cases
- Check secrets are properly configured

### Build Failures
- Check TypeScript errors first
- Verify all imports are correct
- Ensure migrations don't conflict

### API Connection Issues
- Verify secrets are actually set (they show as masked)
- Test individual endpoints via Encore preview
- Check external API rate limits

### Health Check Failures
**Symptoms:** "timeout waiting for app to become healthy"  
**Causes:** Database connectivity, complex health checks, circular dependencies  
**Solutions:** Simplify health checks, fix database connections, remove dependencies

---

**Add new gotchas here as we encounter them. Each mistake should be documented with the wrong approach we tried and the right solution we discovered.**