# Premium Services Setup Guide

## 1. Sourcegraph Pro Account

### Connect Your Account:
1. **Sign in** to https://sourcegraph.com with your paid account
2. Go to **Settings** → **Access Tokens**
3. Create new token with name: "War Room GitHub"
4. Copy the token

### Add to Repository:
1. Go to: https://github.com/Think-Big-Media/1.0-war-room/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SOURCEGRAPH_TOKEN`
4. Value: [paste your token]
5. Click "Add secret"

### Enable Premium Features:
After installing the browser extension:
1. Click the Sourcegraph icon in your browser
2. Sign in with your account
3. Premium features auto-activate:
   - Batch changes
   - Code monitoring
   - Advanced search
   - Private code intelligence

## 2. CodeRabbit Pro Configuration

### Access Pro Dashboard:
1. Go to: https://app.coderabbit.ai/settings
2. Sign in with your account
3. Navigate to "Organizations" → "Think-Big-Media"

### Enable Pro Features:
Update `.github/.coderabbit.yaml`:
```yaml
# Add under reviews section:
reviews:
  # Existing config...
  
  # Pro features
  advanced_security_scanning: true
  performance_profiling: true
  dependency_vulnerability_check: true
  ai_model: "claude-3-opus"  # Premium model
  
  # Auto-fix suggestions
  auto_fix:
    enabled: true
    types:
      - formatting
      - imports
      - simple_bugs
```

### Set Notification Preferences:
1. Go to: https://app.coderabbit.ai/settings/notifications
2. Enable:
   - Critical security issues → Immediate
   - Performance regressions → Daily digest
   - Code quality metrics → Weekly report

## 3. TestSprite Configuration

### Initial Setup:
1. Go to: https://testsprite.com/dashboard
2. Create new project: "War Room"
3. Get your API key from Settings

### Add to GitHub Secrets:
1. Go to: https://github.com/Think-Big-Media/1.0-war-room/settings/secrets/actions
2. Add secret: `TESTSPRITE_API_KEY`
3. Add secret: `TESTSPRITE_PROJECT_ID`

### Create TestSprite Config:
`.testsprite.yml`:
```yaml
version: 1
project_id: ${TESTSPRITE_PROJECT_ID}

# Automated test generation
auto_tests:
  enabled: true
  coverage_target: 80%
  
# Visual regression testing  
visual:
  enabled: true
  threshold: 0.01
  
# Performance monitoring
performance:
  enabled: true
  budgets:
    - metric: FCP
      max: 1500
    - metric: LCP
      max: 2500
      
# Security scanning
security:
  enabled: true
  owasp_scan: true
  
# Monitoring
monitor:
  production_url: https://war-room-oa9t.onrender.com
  check_interval: 5m
  alerts:
    - type: downtime
      threshold: 1m
    - type: performance
      threshold: 3000ms
```

### GitHub Action for TestSprite:
`.github/workflows/testsprite.yml`:
```yaml
name: TestSprite Automated Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: TestSprite Security Scan
        uses: testsprite/security-action@v1
        with:
          api_key: ${{ secrets.TESTSPRITE_API_KEY }}
          project_id: ${{ secrets.TESTSPRITE_PROJECT_ID }}
          
      - name: TestSprite Visual Tests
        uses: testsprite/visual-action@v1
        with:
          api_key: ${{ secrets.TESTSPRITE_API_KEY }}
          url: ${{ github.event.pull_request.html_url || 'https://war-room-oa9t.onrender.com' }}
          
      - name: TestSprite Performance Test
        uses: testsprite/performance-action@v1
        with:
          api_key: ${{ secrets.TESTSPRITE_API_KEY }}
          target_url: https://war-room-oa9t.onrender.com
```

## 4. Verify Everything is Working

### Sourcegraph Pro:
- Browse to any file on GitHub
- Should see enhanced tooltips with "Pro" features
- Code monitoring alerts in your email

### CodeRabbit Pro:
- Next PR should show enhanced analysis
- Security scanning results
- Performance suggestions
- Auto-fix proposals

### TestSprite:
- Check dashboard: https://testsprite.com/dashboard
- Should see automated test runs
- Visual regression reports
- Performance metrics
- Uptime monitoring

## 5. Background Protection Active

Once configured, these services provide:

### 🛡️ Security Protection:
- CodeRabbit: Scans for vulnerabilities in PRs
- TestSprite: OWASP security testing
- Sourcegraph: Monitors for security patterns

### 🚀 Performance Protection:
- TestSprite: Performance budgets and monitoring
- CodeRabbit: Performance regression detection
- Automated alerts for slowdowns

### 📊 Code Quality:
- CodeRabbit: AI code review on every PR
- Sourcegraph: Code intelligence and refactoring
- TestSprite: Automated test generation

### 🔍 Monitoring:
- TestSprite: 24/7 uptime monitoring
- Visual regression detection
- Automated alerts to your email/Slack

---
*All services run automatically in the background once configured*