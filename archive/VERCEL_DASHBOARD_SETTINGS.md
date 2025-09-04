# CRITICAL: Vercel Dashboard Settings for War Room

## 🚨 THESE SETTINGS MUST BE CONFIGURED IN VERCEL DASHBOARD 🚨

If you're getting a 404 error, it's likely because these settings are not configured correctly in the Vercel Dashboard.

### Required Settings in Vercel Dashboard:

1. **Go to your project in Vercel Dashboard**
   - URL: https://vercel.com/think-big-media/1-0-war-room/settings

2. **Navigate to Settings → General**

3. **Configure Build & Development Settings:**
   - **Root Directory**: `src/frontend` ← CRITICAL!
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (or leave default)

4. **Node.js Version**: `22.x` (already set in vercel.json)

### Why This is Important:

- Our frontend is in a subdirectory: `/src/frontend/`
- Vercel needs to know where to find the frontend code
- Without setting Root Directory, Vercel builds from repository root and finds nothing

### Verification Steps:

1. After updating settings, trigger a new deployment
2. Check build logs to ensure it's building from `src/frontend`
3. Look for "Building in src/frontend" in the logs
4. Verify the build creates files in `dist` directory

### Alternative: Use vercel.json Only

If you prefer not to use Dashboard settings, ensure vercel.json at repository root has:
```json
{
  "buildCommand": "cd src/frontend && npm install && npm run build",
  "outputDirectory": "src/frontend/dist",
  "installCommand": "cd src/frontend && npm install",
  "framework": "vite"
}
```

### Common Issues:

1. **404 Error**: Usually means Root Directory is not set
2. **Build succeeds but no output**: Output Directory mismatch
3. **Cannot find package.json**: Root Directory not pointing to frontend

### The Correct Structure:
```
1.0-war-room/ (repository root)
├── vercel.json (configuration file)
├── src/
│   ├── frontend/ (← Root Directory should point here)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── index.tsx (using AppBrandBOS)
│   │   │   └── ... (all your components)
│   │   └── dist/ (← Output Directory, created after build)
│   └── backend/
└── ... other files
```

### Critical Note:
Dashboard settings can override vercel.json settings. If the 404 persists after updating vercel.json, you MUST update the Dashboard settings!