# 🚀 War Room V1 MVP - Netlify Deployment Guide

## 📋 **Pre-Deployment Checklist**

### ✅ **Backend Requirements (VIA LEAP.NEW)**
- [ ] Backend frontend service removed/disabled (prevents API blocking)
- [ ] Comet verification: API endpoints return JSON (not HTML)
- [ ] Backend URL confirmed: `https://production-war-room-3-backend-ha6i.frontend.encr.app`

### ✅ **Frontend Requirements**
- [x] `.env.production` updated with correct backend URL
- [x] `netlify.toml` configuration created
- [x] `_redirects` file exists for SPA routing
- [ ] Production build tested locally
- [ ] Sensitive secrets moved to environment variables

---

## 🔐 **CRITICAL: Netlify Environment Variables Setup**

### **In Netlify Dashboard → Site Settings → Environment Variables:**

Add these **SENSITIVE** variables (from the original .env.production):

```bash
# Meta/Facebook Business API
VITE_META_APP_ID=917316510623086
VITE_META_APP_SECRET=a5c0f9c8c939797bbfc1b623c1e8e8e5
VITE_META_ACCESS_TOKEN=EAAK4NWxHofgBPB898ZAXnQEdYQ4fwp9PebhQFZBJxvD7QeykdG11pQYzePbovGrazbWVAAUth0GmqS9QWRdbsfvjTRyGVgqegPlZAyNmnByU13Uh04CfBg44VbIwr7ZAwbiQufJa5YGV1jt9kDIfvTudnGdBIzP2T2DRqnPRWom9vGDrP8rgzAnmsNquUKBtQlgavVvm

# Google Ads API
VITE_GOOGLE_ADS_CLIENT_ID=808203781238-dgqv5sga2q1r1ls6n77fc40g3idu8h1o.apps.googleusercontent.com
VITE_GOOGLE_ADS_CLIENT_SECRET=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
VITE_GOOGLE_ADS_DEVELOPER_TOKEN=h3cQ3ss7lesG9dP0tC56ig

# SendGrid Email Service
VITE_SENDGRID_EMAIL=Info@wethinkbig.io
VITE_SENDGRID_PASSWORD=AdzData24%

# OpenAI Configuration
VITE_OPENAI_API_KEY=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
```

---

## 🌐 **Netlify Deployment Process**

### **Step 1: Connect Repository**
1. Go to Netlify Dashboard
2. Click "New site from Git"
3. Connect GitHub repository: `3.0-ui-war-room`
4. Set branch to `main` (or current working branch)

### **Step 2: Build Settings**
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18 (set in netlify.toml)

### **Step 3: Environment Variables**
- Add all sensitive variables from the list above
- These are accessed in the build process and bundled securely

### **Step 4: Deploy**
- Click "Deploy site"
- Monitor build logs for errors
- Get deployment URL

---

## 🧪 **Testing Checklist**

### **Pre-Deployment Local Testing**
```bash
# Test production build
npm run build

# Preview production build
npm run preview

# Verify debug panel works
# Press Option+Command+D and test backend connectivity
```

### **Post-Deployment Testing**
- [ ] Site loads correctly
- [ ] Debug panel connects to backend (Option+Command+D)
- [ ] API calls work (test in debug panel)
- [ ] Authentication flow functional
- [ ] Analytics tracking working (PostHog)
- [ ] Mobile responsive design
- [ ] SSL certificate active

---

## 🚨 **Backend Deployment Status**

### **CRITICAL: Backend Must Be Fixed First**

**Current Issue**: Backend frontend service blocks API endpoints

**Solution**: Use this Leap.new prompt:
```
BACKEND FIX: Remove Frontend Service Blocking API Endpoints

ISSUE: The frontend service in backend/frontend/encore.service.ts has a catch-all static file route that serves index.html for ALL requests, including API endpoints. This prevents the 30 API endpoints from being accessible.

SOLUTION: Since the frontend will be deployed to Netlify separately, disable/remove this frontend service entirely.

SPECIFIC CHANGES:
1. Comment out or remove the frontend service in backend/frontend/encore.service.ts
2. The catch-all route path: "/frontend/*path" with notFound: "./dist/index.html" is serving HTML instead of allowing API 404s
3. This should allow API endpoints like /api/v1/auth/login to work properly

VERIFICATION: After changes, test that:
- /api/v1/auth/login returns JSON (not HTML)
- API endpoints respond with proper JSON error messages
- Backend serves API only (no static files)
```

**Verification Process**:
1. Apply changes in Leap.new
2. Ask Comet to verify API endpoints work
3. Test specific endpoints return JSON
4. Deploy only after Comet confirmation

---

## 🎯 **Success Metrics**

### **Technical Metrics**
- [ ] Backend API endpoints accessible (JSON responses)
- [ ] Frontend build successful (no errors)
- [ ] Debug panel connects to backend
- [ ] All 30 API endpoints testable via debug panel
- [ ] No console errors in production
- [ ] Lighthouse score >90

### **Security Metrics**
- [ ] No API keys visible in browser developer tools
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No sensitive data in frontend bundle

### **User Experience Metrics**
- [ ] Page load time <3 seconds
- [ ] Mobile responsive (all breakpoints)
- [ ] Debug panel works (Option+Command+D)
- [ ] Navigation flows smoothly
- [ ] Mock data displays correctly (before live API)

---

## 🆘 **Troubleshooting**

### **Common Issues**

**Build Fails**:
- Check Node version (should be 18)
- Verify all dependencies installed
- Check for TypeScript errors

**API Not Connecting**:
- Verify backend fixed in Leap.new first
- Check CORS settings in netlify.toml
- Test backend URL directly in browser

**Environment Variables Not Working**:
- Ensure VITE_ prefix for client-side variables
- Redeploy after adding environment variables
- Check build logs for missing variables

**Debug Panel Not Working**:
- Check console for errors
- Verify Option+Command+D shortcut
- Test backend connectivity in browser first

---

## 📞 **Deployment Sequence**

1. **Backend Fix (Leap.new)** → Comet Verification → Deploy
2. **Frontend Build Test** → Local verification
3. **Netlify Setup** → Environment variables → Deploy
4. **End-to-End Testing** → Debug panel + full flow
5. **Go Live** → Monitor and verify

**Result**: Fully functional War Room V1 MVP with secure deployment!