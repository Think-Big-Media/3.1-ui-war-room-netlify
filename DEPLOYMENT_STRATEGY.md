# War Room Deployment Strategy

## Branch Strategy

### Core Branches
- **main**: Development branch - receives feature merges and bug fixes
- **staging**: Staging/QA branch - for testing before production
- **production**: Production branch - stable releases only

### Deployment Flow
```
feature-branch → main → staging → production
```

## Service Mapping

| Service Name | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| staging | staging | https://one-0-war-room.onrender.com | Staging/QA testing |
| war-room-production | production | https://war-room-app-2025.onrender.com | Production |
| war-room-2025 | _(suspend)_ | https://war-room-2025.onrender.com | Duplicate - should be suspended |

## Best Practices

### 1. Feature Development
- Create feature branches from `main`
- Name format: `feature/description` or `fix/description`
- Example: `feature/add-oauth`, `fix/login-bug`

### 2. Deployment Process

#### To Staging
```bash
# From your feature branch
git checkout main
git merge feature/your-feature
git push origin main

# Deploy to staging
git checkout staging
git merge main
git push origin staging  # Triggers auto-deploy to staging
```

#### To Production
```bash
# After staging is tested
git checkout production
git merge staging
git push origin production  # Triggers auto-deploy to production
```

### 3. Environment Variables

Each environment needs these in Render dashboard:

#### Required Variables
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-key>
DATABASE_URL=<postgresql-connection-string>
JWT_SECRET=<your-jwt-secret>
```

#### Environment-Specific
- Staging: `VITE_ENV=staging`
- Production: `VITE_ENV=production`

### 4. Rollback Strategy

If production breaks:
```bash
# Find last good commit
git log production --oneline -10

# Revert to last good state
git checkout production
git reset --hard <good-commit-hash>
git push origin production --force
```

### 5. Service Configuration

Update each Render service to use the correct branch:

1. Go to Render Dashboard
2. Select the service
3. Settings → Build & Deploy
4. Change "Branch" to match the table above
5. Save changes

## Common Issues & Solutions

### Multiple Services Deploying from Same Branch
**Problem**: Race conditions, conflicting deployments
**Solution**: Each service must use its own branch as documented above

### Environment Variables Not Working
**Problem**: App shows blank page or errors
**Solution**: Ensure VITE_ prefixed variables are set in Render dashboard

### Build Failing
**Problem**: npm or pip dependencies fail
**Solution**: Check Node/Python versions match local environment

## Monitoring

### Health Checks
- Staging: https://one-0-war-room.onrender.com/health
- Production: https://war-room-app-2025.onrender.com/health

### Deployment Status
```bash
# Check recent deployments
./scripts/render-api.sh get-deployments <service-id>
```

## Emergency Contacts

Document your team's emergency contacts here:
- DevOps Lead: [Name] [Contact]
- Backend Lead: [Name] [Contact]
- Frontend Lead: [Name] [Contact]

---

Last Updated: 2025-08-15
Version: 1.0