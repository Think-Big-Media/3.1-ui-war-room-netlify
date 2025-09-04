# Builder.io Setup Guide for War Room 3.0

## Quick Start

This guide will help you set up Builder.io for visual editing of the War Room UI.

## 1. Get Your Builder.io API Key

1. **Sign up / Login** to [Builder.io](https://builder.io)
2. **Create a new Space** (or use existing):
   - Name: "War Room Platform"
   - Type: "Website"
3. **Get your API key**:
   - Go to Settings → API Keys
   - Copy your Public API Key
   - It looks like: `abc123def456...`

## 2. Configure Your Local Environment

✅ **ALREADY CONFIGURED** - Your API key is set!

1. **API Key is configured in .env**:
```bash
# Already set in .env file
VITE_BUILDER_IO_KEY=8686f311497044c0932b7d2247296478
```

2. **Restart your dev server**:
```bash
npm run dev
```

## 3. Set Up Render Deployment

✅ **ALREADY DEPLOYED** - Your app is live!

**Your Production URL**: https://war-room-3-ui.onrender.com

### Deployment Details:
- **Service Name**: war-room-3-ui  
- **Repository**: Think-Big-Media/3.0-ui-war-room
- **Branch**: main
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Status**: ✅ Active and running

### Option B: Using render.yaml (Already configured)
The `render.yaml` file is already set up. Render will automatically detect it when you connect the repository.

## 4. Configure Builder.io Preview URL

✅ **ALREADY CONFIGURED** - Preview URL is set!

1. **Builder.io Space**: War Room Platform
2. **Preview URL**: https://war-room-3-ui.onrender.com ✅ Configured
3. **Status**: Ready for visual editing

**Next Step**: Create a test page at `/builder/test` to verify integration

## 5. Create Your First Page in Builder

1. **In Builder.io**:
   - Click "Content" → "New Entry"
   - Choose "Page" model
   - Set the URL path (e.g., `/builder/landing`)

2. **Start designing**:
   - Drag and drop components from the left panel
   - Use your registered War Room components:
     - Dashboard
     - CommandCenter
     - FeatureCard
     - RecentActivity
     - QuickActions

3. **Style with custom fonts**:
   - Barlow Condensed is available for headings
   - JetBrains Mono is available for code/interface elements

4. **Publish when ready**:
   - Click "Publish" in the top right
   - Your page is now live at `/builder/landing`

## 6. View Your Builder Pages

### In Development:
```
http://localhost:5173/builder/your-page-name
```

### In Production:
```
https://war-room-3-ui.onrender.com/builder/your-page-name
```

## Workflow Summary

1. **Visual Editing**: Use Builder.io to create/edit pages visually
2. **Code Changes**: Edit React components locally
3. **Deploy**: Push to GitHub → Auto-deploys to Render
4. **Preview**: Builder shows your Render URL for live preview

## Available Components in Builder

### Page Components
- `Dashboard` - Main dashboard view
- `AnalyticsDashboard` - Analytics and metrics
- `AutomationDashboard` - Workflow automation
- `DocumentIntelligence` - AI document analysis
- `SettingsPage` - User settings

### Layout Components
- `MainLayout` - App layout with sidebar
- `Sidebar` - Navigation sidebar
- `Navbar` - Top navigation

### Feature Components
- `CommandCenter` - Key metrics display
- `FeatureCard` - Feature showcase cards
- `RecentActivity` - Activity feed
- `QuickActions` - Quick action buttons

## Troubleshooting

### "No content found for this page"
- Make sure you've created content in Builder for that URL path
- Check that your API key is correct in `.env`

### Components not showing in Builder
- Ensure `npm run dev` is running locally
- Check browser console for errors
- Verify components are registered in `src/builder-registry.tsx`

### Deployment not updating
- Check GitHub Actions/Render logs
- Ensure `render.yaml` is configured correctly
- Verify auto-deploy is enabled in Render

## Next Steps

1. **Create landing pages** in Builder without code
2. **A/B test** different designs
3. **Use targeting** to show different content to different users
4. **Integrate forms** for lead capture
5. **Add animations** with Builder's built-in tools

## Support

- [Builder.io Docs](https://www.builder.io/c/docs)
- [Builder.io Discord](https://discord.gg/builder)
- [Render Docs](https://render.com/docs)

---

Happy building! 🚀