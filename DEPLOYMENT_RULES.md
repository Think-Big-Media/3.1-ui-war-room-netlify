# 🚨 DEPLOYMENT RULES - CRITICAL

**LAST INCIDENT**: Site was down for 8+ hours due to "process is not defined" error in browser.  
**DATE**: August 12-13, 2025  
**ROOT CAUSE**: Build system injected Node.js-only `process.env` into browser code.

---

## ❌ NEVER DO THIS (Will Break Production)

### 1. **NEVER use `process.env` in frontend code**
   - ❌ `process.env.ANYTHING` 
   - ✅ `import.meta.env.VITE_SOMETHING`
   - **Why**: Browsers don't have `process` - it's Node.js only

### 2. **NEVER define `process.env` in vite.config.ts**
   ```javascript
   // ❌ WRONG - This breaks everything
   define: {
     'process.env.SOMETHING': JSON.stringify(value)
   }
   ```

### 3. **NEVER skip the safety checks**
   - Always run `npm run check:process` before building
   - Always test locally with `npm run preview` after building

### 4. **NEVER trust that "it worked before"**
   - Dependencies update and can introduce `process` references
   - Always verify after any package updates

---

## ✅ ALWAYS DO THIS (Safe Deployment)

### 1. **Before ANY Deployment**
   ```bash
   # Run these commands IN ORDER
   npm run check:process     # Check source for process references
   npm run build:safe        # Build with safety checks
   npm run preview           # Test locally
   # Check browser console for ANY errors
   ```

### 2. **Use Proper Environment Variables**
   - Frontend: `import.meta.env.VITE_*` (Vite handles these)
   - Backend: `process.env.*` (Node.js only)
   - Never mix them!

### 3. **Test in Browser Console**
   After deployment, ALWAYS:
   1. Open the site
   2. Open browser DevTools (F12)
   3. Check Console tab for errors
   4. If you see "process is not defined" - STOP and fix immediately

### 4. **Monitor After Deployment**
   ```bash
   # Run monitoring script
   ./scripts/monitor-deployment.sh
   ```

---

## 🛠️ HOW TO FIX IF IT BREAKS

### If you see "process is not defined" error:

1. **Find the culprit:**
   ```bash
   grep -r "process\." src/ --include="*.ts" --include="*.tsx"
   ```

2. **Check built files:**
   ```bash
   grep "process\." dist/assets/*.js
   ```

3. **Fix all occurrences:**
   - Replace `process.env.NODE_ENV` with `import.meta.env.DEV`
   - Replace `process.env.REACT_APP_*` with `import.meta.env.VITE_*`
   - Remove any `process` references from vite.config.ts

4. **Rebuild safely:**
   ```bash
   npm run build:safe
   ```

5. **Verify fix:**
   ```bash
   npm run preview
   # Open browser console and check for errors
   ```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

- [ ] Run `npm run check:process` - MUST pass
- [ ] Run `npm run build:safe` - MUST complete without errors  
- [ ] Run `npm run preview` - Site MUST load
- [ ] Check browser console - MUST have zero errors
- [ ] Test core features - Login, Dashboard, Navigation MUST work
- [ ] Have rollback plan ready - Know the last working commit

---

## 🔍 MONITORING COMMANDS

```bash
# Check if site is up
curl -s https://war-room-2025.onrender.com | grep -q "War Room" && echo "✅ Site is up" || echo "❌ Site is down"

# Check for process errors in deployed JS
curl -s https://war-room-2025.onrender.com/assets/index-*.js | grep -q "process\." && echo "❌ DANGER: process found in build!" || echo "✅ Build is clean"

# Full health check
./scripts/health-check.sh
```

---

## 📝 LESSONS LEARNED

1. **Vite config is executed in Node.js** - It CAN use `process`
2. **Built output runs in browser** - It CANNOT use `process`
3. **The `define` section in vite.config.ts** injects code into the browser build
4. **Always check browser console** - That's where the errors show up
5. **Small config changes can break everything** - Test every change

---

## 🚀 SAFE DEPLOYMENT COMMAND

Use this single command for safe deployments:
```bash
npm run check:process && npm run build:safe && npm run preview
```

If this passes, you can deploy with confidence.

---

**REMEMBER**: The site was down for 8+ hours because of a simple `process.env` reference.  
**PREVENTION IS KEY**: Use the safety checks EVERY TIME.