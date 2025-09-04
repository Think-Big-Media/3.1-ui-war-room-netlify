# 🚀 Local Development Guide - START HERE!

## One Command to Rule Them All

```bash
./START_LOCAL.sh
```

That's it! This starts everything you need.

---

## What This Gives You

### ✨ Instant Magic
- **Save a file** → See changes immediately
- **No waiting** for deployments (0 seconds vs 10 minutes)
- **Test everything** locally before anyone sees it
- **Full application** running on your machine

### 🌐 Your Local URLs
- **Frontend**: http://localhost:5173 (might be 5174 or 5175)
- **Backend API**: http://localhost:10000
- **API Documentation**: http://localhost:10000/docs

---

## When to Use What

### 🏠 Use LOCAL Development for:
- ✅ Building new features
- ✅ Fixing bugs
- ✅ Testing UI changes
- ✅ Adjusting styles/CSS
- ✅ Testing different browser scales (80%, 90%, etc.)
- ✅ API development
- ✅ Database changes
- ✅ Quick experiments

### ☁️ Use RENDER Deployment for:
- ✅ Showing the client/team
- ✅ Production releases
- ✅ Testing with real users
- ✅ Final integration testing

---

## 🎯 Which Frontend Are You Using?

### Quick Verification
```bash
# Run our verification script:
./scripts/verify-frontend.sh
```

### Visual Check
Look at http://localhost:5173:
- ✅ **Purple/blue gradients** = AppBrandBOS (CORRECT)
- ❌ **White interface** = Wrong app!
- ✅ **"War Room" in top nav** = AppBrandBOS (CORRECT)
- ❌ **Sidebar navigation** = Wrong app!

### Console Check
Open browser console (F12), you should see:
```
🔴🔴🔴 AppBrandBOS IS LOADING! 🔴🔴🔴
🟢🟢🟢 COMMANDCENTER IS RENDERING! 🟢🟢🟢
```

---

## Common Tasks

### Testing Browser Scaling
**Recommended: 95% zoom** (optimized for 16.5px root font)
1. Open http://localhost:5173
2. Press `Cmd -` (Mac) or `Ctrl -` (PC) to scale to 80%
3. Make CSS adjustments
4. Save file
5. Changes appear instantly!

### Making UI Changes
1. Open the component file in VS Code
2. Make your changes
3. Save (Cmd+S)
4. Browser auto-refreshes with changes
5. No deployment needed!

### Testing API Endpoints
1. Make backend changes
2. Save the Python file
3. Backend auto-restarts
4. Test at http://localhost:10000/docs

---

## Troubleshooting

### If START_LOCAL.sh doesn't work:

**Option 1: Run manually**
```bash
# Terminal 1
npm run dev

# Terminal 2  
cd src/backend
python3 serve_bulletproof.py
```

**Option 2: Port conflicts**
```bash
# Kill everything on the ports
lsof -ti:5173,5174,5175,10000 | xargs kill -9

# Try again
./START_LOCAL.sh
```

### Common Issues

| Problem | Solution |
|---------|----------|
| "Port already in use" | Kill the process: `lsof -ti:PORT | xargs kill -9` |
| "Module not found" | Run `npm install` |
| "Python error" | Make sure you're using `python3` not `python` |
| Backend won't start | Check if port 10000 is free |
| Frontend won't start | Try ports 5174 or 5175 |

---

## The Philosophy

> "You have to deploy every time we make changes? Jeez, that's annoying."  
> — Rod, August 14, 2025

This quote changed everything. Now we:
1. **Develop locally** FIRST
2. **Test thoroughly** with instant feedback
3. **Deploy once** when it's perfect

---

## Environment Variables

Local development uses `.env` files:

### Frontend (.env)
```
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=your_url_here
SUPABASE_KEY=your_key_here
```

---

## Quick Reference Card

```
🚀 Start Everything:     ./START_LOCAL.sh
🌐 Frontend:             http://localhost:5173
⚙️  Backend:              http://localhost:10000
📚 API Docs:             http://localhost:10000/docs
🔍 Scale Browser:        Cmd/Ctrl + Plus/Minus
💾 See Changes:          Just save the file!
🛑 Stop Everything:      Ctrl+C in terminal
```

---

## Remember

**Local First, Deploy Later!**

Every feature should be:
1. Built locally
2. Tested locally  
3. Perfected locally
4. THEN deployed

No more "deploy and pray" 🙏