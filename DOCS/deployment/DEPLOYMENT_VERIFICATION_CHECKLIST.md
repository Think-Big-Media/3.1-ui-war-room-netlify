# Deployment Verification Checklist

## 🎯 **Goal**: Ensure visual changes actually deploy and work correctly

**Root Issue**: "Deploy live" status doesn't guarantee frontend changes are visible. This checklist prevents silent deployment failures.

---

## **📋 Pre-Deployment Checklist**

### ✅ Code Safety Checks
- [ ] **No custom CSS classes**: Run `grep -r "\.bg-" src/ --include="*.css"` 
- [ ] **Local testing completed**: Changes verified at `http://localhost:5173`
- [ ] **Production build tested**: Run `npm run build && npm run preview`
- [ ] **No runtime.txt file**: Verify file doesn't exist (forces Python-only mode)
- [ ] **Branch is clean**: `git status` shows no uncommitted changes

### ✅ Visual Verification Ready
- [ ] **Screenshots taken**: Local development screenshots for comparison
- [ ] **Expected colors documented**: Know what colors should appear
- [ ] **Test pages identified**: Which pages need visual verification
- [ ] **Staging URL ready**: Know staging URL for intermediate testing

---

## **🚀 Deployment Process**

### Step 1: Deploy to Staging First
```bash
# Never skip staging for visual changes
git checkout staging
git merge feature/your-branch-name
git push origin staging

# Wait for deployment and verify
```

### Step 2: Staging Verification
- [ ] **Visit staging URL**: https://one-0-war-room.onrender.com
- [ ] **Check key pages**: CommandCenter, AlertCenter, InformationCenter
- [ ] **Verify colors**: Slate gradients not purple
- [ ] **Check spacing**: UI density and removed headers
- [ ] **Test responsiveness**: Different screen sizes

### Step 3: Get User Approval
```bash
# Notify user for visual approval
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh approval "Staging ready for review" "Visual changes at https://one-0-war-room.onrender.com"
```

### Step 4: Production Deployment
```bash
# Only after staging approval
git checkout production  
git merge staging
git push origin production

# Monitor deployment status
RENDER_API_KEY="rnd_kM791PKT9Ms0ZqlNQPLd65hmUb5K" ./scripts/render-api.sh get-deployments srv-d2csi9juibrs738r02rg
```

---

## **🔍 Post-Deployment Verification**

### Immediate Checks (Within 5 minutes)
- [ ] **Production URL responds**: https://war-room-app-2025.onrender.com
- [ ] **Build status "live"**: Not just "deploy succeeded"
- [ ] **Visual spot check**: Quick verification colors are correct
- [ ] **No JavaScript errors**: Check browser console

### Detailed Verification (Within 15 minutes)
- [ ] **Screenshot comparison**: Compare with local development images
- [ ] **Color verification**: Gradients are slate not purple
- [ ] **Layout verification**: Spacing and components as expected
- [ ] **Cross-page testing**: All major pages working correctly

### Verification Script
```bash
# Use automated verification script
./scripts/verify-visual-deployment.sh https://war-room-app-2025.onrender.com
```

---

## **🚨 Failure Response**

### If Visual Changes Don't Appear
1. **Check build logs**: Look for frontend build steps
2. **Verify build command**: Should include `npm install && npm run build`
3. **Check for runtime.txt**: Remove if present (forces Python-only)
4. **Clear cache**: Hard refresh browser (Cmd+Shift+R)
5. **Wait 5-10 minutes**: Sometimes takes time to propagate

### If Colors Are Wrong
1. **Check CSS purging**: Look for custom classes being purged
2. **Verify Tailwind config**: Ensure no conflicting settings
3. **Test production build locally**: `npm run build && npm run preview`
4. **Check for CSS conflicts**: Old styles overriding new ones

### Emergency Rollback
```bash
# If deployment fails completely
git checkout production
git reset --hard HEAD~1  # Go back one commit
git push --force origin production

# Or use Render dashboard rollback
```

---

## **📊 Service Status Reference**

### Current Active Services
- **Production**: srv-d2csi9juibrs738r02rg → https://war-room-app-2025.onrender.com
- **Staging**: srv-d2eb2k0dl3ps73a2tc30 → https://one-0-war-room.onrender.com

### Quick Status Check
```bash
# Check deployment status
RENDER_API_KEY="rnd_kM791PKT9Ms0ZqlNQPLd65hmUb5K" ./scripts/render-api.sh get-deployments [service-id]

# Expected statuses:
# "live" = Successfully deployed and serving
# "build_in_progress" = Currently building
# "update_in_progress" = Deploying new version
# "build_failed" = Deployment failed
```

---

## **✅ Success Criteria**

### Visual Verification Complete When:
- [ ] **All expected colors visible**: Slate gradients throughout
- [ ] **Layout matches staging**: Spacing and components correct  
- [ ] **No purple backgrounds**: Specific check for this issue
- [ ] **User approval received**: Stakeholder confirms changes look right
- [ ] **Performance acceptable**: Site loads within 3 seconds

### Documentation Complete When:
- [ ] **Screenshots saved**: Before/after comparison images
- [ ] **Deployment notes updated**: What was changed and verified
- [ ] **Issues logged**: Any problems encountered and resolved

---

## **🔗 Related Resources**

- **CSS Safety Rules**: CSS_SAFETY_RULES.md
- **Branch Strategy**: BRANCH_RULES.md  
- **Service Mapping**: SERVICE_MAP.md
- **Notification Script**: scripts/claude-notify-unified.sh
- **Visual Verification**: scripts/verify-visual-deployment.sh

---

## **⚡ Quick Commands Reference**

```bash
# Pre-deployment safety check
./scripts/check-css-safety.sh

# Test production build locally
npm run build && npm run preview

# Check deployment status
./scripts/render-api.sh get-deployments [service-id]

# Visual verification
./scripts/verify-visual-deployment.sh [url]

# Emergency notification
./scripts/claude-notify-unified.sh error "Deployment failed" "Rolling back now"
```

**Remember**: "Deploy live" ≠ "Changes visible". Always verify visually!