# V2 Dashboard Integration Plan

## Current Status
✅ V2 dashboard components extracted from Builder.io
✅ Copied to 3.0 UI repository
⏳ Need to apply War Room military styling

## Components to Integrate

### 1. Political Map
- Shows swing states with real-time data
- Color-coded by sentiment/polling
- Currently using static image - needs dynamic D3.js implementation

### 2. SWOT Tactical Radar
- Interactive blobs representing Strengths, Weaknesses, Opportunities, Threats
- Click blobs to see details in Live Intelligence feed
- Animated radar sweep effect

### 3. Phrase Cloud
- 3D rotating carousel of trending phrases
- Keywords and related terms
- Real-time updates from Mentionlytics

### 4. Live Intelligence Feed
- Scrolling feed of real-time events
- Color-coded by severity (info, warning, critical)
- Linked to SWOT radar blobs

## Styling Changes Needed

### From Builder.io (Current)
- Basic dark theme (#1a1f2e background)
- Simple cards (#2a3342)
- No military theming

### To War Room 3.0 (Target)
- Military camouflage background
- Command center aesthetic
- Status bars and tactical elements
- Consistent with existing Dashboard.tsx

## Implementation Steps

1. **Extract Components**
   - [ ] Political Map → separate component
   - [ ] SWOT Radar → separate component
   - [ ] Phrase Cloud → separate component
   - [ ] Live Intelligence → separate component

2. **Apply War Room Theme**
   - [ ] Add camo background from Dashboard.tsx
   - [ ] Apply military color palette
   - [ ] Add status bar styling
   - [ ] Ensure dark theme consistency

3. **Connect to Backend**
   - [ ] Wire up to Mentionlytics API
   - [ ] Connect to real-time WebSocket
   - [ ] Implement mock/live toggle

4. **Test Integration**
   - [ ] Verify all interactions work
   - [ ] Test responsive design
   - [ ] Ensure performance

## File Structure
```
src/pages/v2-dashboard/
├── DashboardV2.tsx          # Main v2 dashboard
├── dashboard-v2.css         # Styles
├── components/
│   ├── PoliticalMap.tsx    # To be created
│   ├── SwotRadar.tsx       # To be created
│   ├── PhraseCloud.tsx     # To be created
│   └── LiveIntelligence.tsx # To be created
└── INTEGRATION-PLAN.md      # This file
```

## Next Steps
1. Break out inline styles to CSS classes
2. Apply War Room theme colors
3. Create individual component files
4. Wire up to backend APIs
5. Replace current Dashboard.tsx with DashboardV2.tsx