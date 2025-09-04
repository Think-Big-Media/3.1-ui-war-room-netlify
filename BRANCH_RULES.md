# Branch Rules - Simple Strategy That Works

## 🎯 **Goal**: Prevent branch chaos that led to the purple gradient issue

**What went wrong**: UI improvements were on `staging`, color fixes on `production`, and they weren't coordinated. This creates the proven workflow to prevent it.

---

## **🌳 Branch Structure**

```
main (protected)
├── staging (testing & integration)
├── production (live deployments)  
└── feature/* (all development work)
```

### Branch Purposes
- **`main`**: Source of truth, protected, merge target only
- **`production`**: What's currently live, auto-deploys to production service
- **`staging`**: Testing ground, auto-deploys to staging service  
- **`feature/*`**: All development work, short-lived branches

---

## **📝 Feature Branch Naming**

### Required Format
```bash
feature/description-YYYY-MM-DD
```

### Examples
```bash
feature/fix-purple-gradients-2025-08-15
feature/remove-page-headers-2025-08-15  
feature/add-slate-colors-2025-08-15
feature/meta-api-integration-2025-08-20
```

### Why This Format?
- **Descriptive**: Clear what the branch does
- **Dated**: Know when work started
- **Searchable**: Easy to find related branches
- **Sortable**: Recent work appears last

---

## **🔄 Development Workflow**

### Step 1: Create Feature Branch
```bash
# Always branch from main
git checkout main
git pull origin main
git checkout -b feature/your-change-$(date +%Y-%m-%d)
```

### Step 2: Develop & Test Locally
```bash
# MANDATORY: Test locally first
./START_LOCAL.sh
# Make changes, test at http://localhost:5173
# Verify changes work as expected
```

### Step 3: Deploy to Staging
```bash
# Merge to staging for testing
git checkout staging
git pull origin staging
git merge feature/your-branch-name
git push origin staging

# Verify at https://one-0-war-room.onrender.com
```

### Step 4: Get Approval
```bash
# Notify user for review
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh approval "Staging ready for review" "Changes at https://one-0-war-room.onrender.com"
```

### Step 5: Deploy to Production
```bash
# Only after staging approval
git checkout production
git pull origin production
git merge staging  # Not feature branch - merge staging!
git push origin production

# Verify at https://war-room-app-2025.onrender.com
```

---

## **🚨 Critical Rules**

### NEVER Do These
- ❌ **Direct commits to main/production**: Always use feature branches
- ❌ **Skip staging**: Every visual change must go through staging
- ❌ **Merge feature directly to production**: Always merge staging to production
- ❌ **Deploy without local testing**: Must work locally first
- ❌ **Force push to main/production**: Breaks history for everyone

### ALWAYS Do These  
- ✅ **Create feature branches for everything**: Even small fixes
- ✅ **Test locally first**: Before any deployment
- ✅ **Use staging for integration**: Merge feature branches here
- ✅ **Get approval before production**: User must verify staging
- ✅ **Keep feature branches short-lived**: Merge and delete quickly

---

## **🔧 Conflict Resolution**

### When Staging and Production Diverge
This is exactly what happened with the purple gradient issue. Here's how to fix it:

```bash
# Create a coordination branch
git checkout -b feature/merge-staging-improvements-$(date +%Y-%m-%d)

# Merge staging into the feature branch
git merge staging

# Resolve conflicts (choose staging for UI, production for critical fixes)
# Edit conflicted files manually
git add .
git commit -m "Resolve conflicts: combine staging UI with production fixes"

# Test locally
./START_LOCAL.sh

# Deploy to staging for verification
git checkout staging  
git merge feature/merge-staging-improvements-YYYY-MM-DD
git push origin staging

# After approval, deploy to production
git checkout production
git merge staging
git push origin production
```

### Conflict Resolution Strategy
1. **UI/Visual changes**: Prefer staging branch (has latest improvements)
2. **Bug fixes**: Prefer production branch (has critical fixes)
3. **Configuration**: Prefer production branch (has working config)
4. **When unsure**: Test both options locally first

---

## **📊 Branch Health Monitoring**

### Daily Checks
```bash
# Check branch status
git branch -a | grep -E "(staging|production|main)"

# Check if branches are in sync
git log --oneline main..staging    # Staging ahead of main
git log --oneline main..production # Production ahead of main
```

### Weekly Cleanup
```bash
# List old feature branches
git branch | grep feature/ | grep -v $(date +%Y-%m)

# Delete merged feature branches
git branch -d feature/old-branch-name

# Clean up remote tracking branches
git remote prune origin
```

---

## **🎯 Success Scenarios**

### Single Developer Workflow
```bash
# Day 1: Start feature
git checkout -b feature/new-dashboard-2025-08-15
# Work locally, commit changes

# Day 2: Deploy to staging  
git checkout staging && git merge feature/new-dashboard-2025-08-15
# Test staging, get feedback

# Day 3: Deploy to production
git checkout production && git merge staging
# Verify production, celebrate
```

### Multiple Feature Coordination
```bash
# Developer A: Works on UI improvements in staging
# Developer B: Works on bug fixes in production
# Coordination needed:

git checkout -b feature/coordinate-changes-2025-08-15
git merge staging  # Get UI improvements
git merge production  # Get bug fixes  
# Resolve conflicts, test, deploy through staging
```

---

## **🚨 Emergency Procedures**

### If Production Breaks
```bash
# Immediate rollback
git checkout production
git reset --hard HEAD~1  # Go back one commit
git push --force origin production

# Or use Render dashboard rollback feature
```

### If Staging Gets Corrupted
```bash
# Reset staging to match main
git checkout staging
git reset --hard main
git push --force origin staging

# Re-apply current feature branches
git merge feature/current-work
```

---

## **📚 Branch Protection Rules**

### Main Branch Protection
- Require pull request reviews
- Require status checks to pass
- Require up-to-date branches
- Restrict force pushes
- Restrict deletions

### Production Branch Protection  
- Require status checks
- Restrict force pushes (except emergencies)
- Require linear history

---

## **⚡ Quick Commands**

```bash
# Start new feature
git checkout main && git pull && git checkout -b feature/$(read -p "Description: " desc; echo "$desc-$(date +%Y-%m-%d)")

# Deploy to staging
git checkout staging && git pull && git merge feature/your-branch && git push

# Deploy to production  
git checkout production && git pull && git merge staging && git push

# Emergency rollback
git checkout production && git reset --hard HEAD~1 && git push --force

# Clean old branches
git branch | grep feature/ | grep -v $(date +%Y-%m) | xargs git branch -d
```

**Remember**: This exact workflow successfully resolved the purple gradient issue. Stick to it!