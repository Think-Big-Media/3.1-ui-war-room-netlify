# War Room 3.1 Frontend - Admin System & Analytics Dashboard

**Status**: 🟢 Production Deployed  
**URL**: https://leafy-haupia-bf303b.netlify.app  
**Source Repository**: https://github.com/Think-Big-Media/3.1-ui-war-room-netlify  
**Deployment**: Netlify Auto-Deploy from GitHub  

## 🎯 Overview

War Room 3.1 is a sophisticated analytics dashboard with a hidden admin system for comprehensive backend management and testing. Built with React 18, Vite, and modern TypeScript.

## 🔧 Hidden Admin System (CRITICAL FEATURE)

### Activation Methods:
1. **Triple-click the logo** → Logo disappears, "Admin Dashboard" appears in navigation
2. **Keyboard shortcut**: `Cmd+Alt+D` (⌘⌥D)
3. **URL parameter**: `?debug=true`

### Admin Capabilities:
- **DebugSidecar**: Complete backend API testing interface
- **Bottom Panel Mode**: Persistent admin panel while browsing site
- **Health Monitoring**: Real-time backend connection status
- **API Endpoint Testing**: Direct backend communication tools
- **Environment Toggle**: MOCK/LIVE data switching
- **Performance Metrics**: System health monitoring

## 🏗️ Architecture

### Frontend Stack:
- **React 18.3.1** with TypeScript
- **Vite 4.5.0** for development and building
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **React Query** for data fetching
- **Zustand** for state management

### Backend Connection:
```javascript
// Current Configuration (netlify.toml)
VITE_ENCORE_API_URL = "https://war-room-backend-d2qou4c82vjupa5k36ug.lp.dev"

// Working: Leap.new backend (full functionality)
// Broken: war-room-backend-foundation-z9n2.encr.app (500 errors)
```

## 🚀 Development Workflow

### Local Development:
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run health check
npm run health:check

# Run tests
npm run test

# Build for production
npm run build
```

### Deployment Process:
1. **Make changes locally** in this codebase
2. **Push to GitHub**: https://github.com/Think-Big-Media/3.1-ui-war-room-netlify
3. **Netlify auto-deploys** from GitHub main branch
4. **Test on production**: https://leafy-haupia-bf303b.netlify.app

**⚠️ CRITICAL**: This local codebase ≠ Deployed version until pushed to GitHub!

## 📁 Key Components

```
src/
├── components/
│   ├── generated/
│   │   └── TopNavigation.tsx    # Triple-click logo handler
│   └── DebugSidecar.tsx         # Admin interface
├── App.tsx                      # Main app with DebugSidecar integration
├── services/
│   └── api.ts                   # Backend communication
└── hooks/                       # Custom React hooks
```

### Admin System Integration:
```typescript
// Triple-click detection in TopNavigation.tsx
const handleLogoClick = (e: React.MouseEvent) => {
  e.preventDefault();
  setLogoClickCount(prev => prev + 1);
  // ... triple-click logic
};

// Custom event dispatch for admin activation
const event = new CustomEvent('debug-sidecar-toggle', { detail: { isOpen: true } });
window.dispatchEvent(event);
```

## 🔐 Environment Configuration

### Required Variables:
```bash
# Backend API
VITE_ENCORE_API_URL=https://war-room-backend-d2qou4c82vjupa5k36ug.lp.dev

# Data Mode Toggle
VITE_DATA_MODE=MOCK  # or LIVE

# Analytics
VITE_POSTHOG_KEY=[posthog-key]

# Error Monitoring
VITE_SENTRY_DSN=[sentry-dsn]
```

## 🧪 Testing

### Test Commands:
```bash
# Unit tests
npm run test

# Component tests
npm run test:stable

# Coverage report
npm run test:coverage

# End-to-end tests (Playwright)
npm run test:health
npm run test:comprehensive
```

### Admin System Testing:
1. **Triple-click logo** → Verify admin activation
2. **Test DebugSidecar** → API endpoint functionality
3. **Bottom panel mode** → Navigation persistence
4. **Keyboard shortcut** → Cmd+Alt+D activation

## 📊 Health Monitoring

```bash
# System health check
npm run health:check

# Full health with lint/type check
npm run health:full

# Live site monitoring
npm run monitor
```

## 🔄 Backend Connections

### Working Backend (Current):
- **URL**: https://war-room-backend-d2qou4c82vjupa5k36ug.lp.dev
- **Platform**: Leap.new
- **Status**: ✅ Fully functional
- **Features**: Napoleon P0 + Cleopatra OAuth

### Broken Backend (Previous):
- **URL**: https://war-room-backend-foundation-z9n2.encr.app
- **Platform**: Encore
- **Status**: ❌ 500 errors
- **Issue**: Deployment configuration problems

## 🎨 UI/UX Features

### Design System:
- **Modern gradient backgrounds**
- **Responsive layout** (mobile-first)
- **Accessibility compliant**
- **Dark/light mode support**
- **Smooth animations** with Framer Motion

### Admin UX Patterns:
- **Logo transformation** (disappears on admin activation)
- **Contextual navigation** (Admin Dashboard replaces logo)
- **Persistent bottom panel** during site browsing
- **Floating debug interface** above all content

## 🚨 Troubleshooting

### Common Issues:

**Triple-click not working:**
- Check if changes are deployed to GitHub repository
- Verify production site has latest code
- Test keyboard shortcut (Cmd+Alt+D) as alternative

**Backend connection errors:**
- Verify VITE_ENCORE_API_URL points to working Leap.new backend
- Check network tab in DevTools for API calls
- Use DebugSidecar health check to test connection

**Local vs Production confusion:**
- This codebase is LOCAL development copy
- Production site: https://leafy-haupia-bf303b.netlify.app
- Must push to GitHub for changes to appear in production

## 📚 Related Documentation

- **Backend Codebase**: `../3_Backend_Codebase/README.md`
- **Deployment Guide**: `../../_DEPLOYMENT-REALITY-CHECK.md`
- **Admin System Discovery**: `../../4_DAY-TO-DAY-DEV/Cleopatra/ADMIN-SYSTEM-DISCOVERY.md`
- **Implementation Status**: `../../4_DAY-TO-DAY-DEV/Cleopatra/CLEOPATRA-IMPLEMENTATION-COMPLETE.md`

---

**War Room 3.1 Frontend - The most sophisticated hidden admin system you'll ever triple-click.**