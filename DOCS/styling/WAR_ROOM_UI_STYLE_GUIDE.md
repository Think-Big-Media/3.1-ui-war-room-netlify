# War Room UI Style Guide

This document defines the comprehensive styling standards for the War Room application, established through iterative refinement of the monitoring components and extended site-wide.

## Typography Hierarchy (2025 Update)

### Refined Font Stack - War Room 2025

- **Major Section Headers**: Barlow Condensed 600, 50% opacity (Campaign Operations, Quick Actions, Profile Settings, Notifications)
- **Numbers & Metrics**: Barlow Condensed 400 (dollars, percentages, counts, statistics)
- **Content Titles**: Barlow Semi-Condensed Medium 500 (Email Notifications, Dark Mode, Two-Factor Authentication)
- **Content Subtitles**: Barlow Condensed (Receive campaign updates via email, Get instant alerts on your device)
- **Form Labels**: JetBrains Mono Uppercase (Display Name, Email Address, Company Name)
- **Status Indicators**: JetBrains Mono Uppercase (Live, Active, Ready, Today)
- **Footer Text**: JetBrains Mono Uppercase (Last updated, Quick access to key features)

### Configuration

```javascript
// tailwind.config.js
fontFamily: {
  'sans': ['Barlow', 'system-ui', 'sans-serif'], // Body content
  'condensed': ['Barlow Condensed', 'system-ui', 'sans-serif'], // Headers
  'semi-condensed': ['Barlow Semi Condensed', 'system-ui', 'sans-serif'], // Numbers
  'mono': ['JetBrains Mono', 'monospace'], // Technical labels
}
```

### Site-wide Typography Classes

```css
/* src/index.css */

/* Section Header - Major headings across the site */
.section-header {
  @apply text-white/50 uppercase;
  font:
    600 20px/29px 'Barlow Condensed',
    sans-serif;
}

/* Content Typography Classes */
.content-subtitle {
  @apply text-white/50;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  line-height: 17px;
  margin-top: -1px;
}

@media (min-width: 1024px) {
  .content-subtitle {
    font-size: 15px;
    line-height: 19px;
  }
}

.content-title {
  @apply text-white/95;
  font-family: 'Barlow Semi Condensed', sans-serif;
  font-weight: 500;
  font-size: 15px;
  line-height: 19px;
}

@media (min-width: 1024px) {
  .content-title {
    font-size: 17px;
    line-height: 21px;
  }
}

/* Form Label Class */
.form-label {
  @apply block text-sm font-mono text-white/75 mb-1 ml-1.5 uppercase tracking-wider;
}
  line-height: 16px;
}

.status-indicator {
  @apply text-xs font-mono uppercase;
  font-family: 'JetBrains Mono', monospace;
}

/* Footer text - always uppercase JetBrains Mono */
.footer-text {
  @apply text-xs font-mono uppercase;
  font-family: 'JetBrains Mono', monospace;
}

/* Color-coded status indicators */
.status-active {
  @apply text-green-400;
}

.status-running {
  @apply text-blue-400;
}

.status-planning {
  @apply text-yellow-400;
}
```

### Typography Usage Examples

```tsx
// Major section headers
<h3 className="section-header">
  Campaign Operations
</h3>

// Content subtitles (descriptions, metadata)
<p className="content-subtitle">
  Active crisis detections
</p>

// Content titles (project names, template names)
<h5 className="content-title">
  Crisis Response Protocol
</h5>

// Status indicators with semantic colors
<span className="status-indicator status-active">Live</span>
<span className="status-indicator status-running">Today</span>
<span className="status-indicator status-planning">Next Week</span>

// Footer text
<span className="footer-text text-white/75">Last updated</span>
<span className="footer-text text-white/90">30 seconds ago</span>
```

## Sub-header Styling Standards

### Primary Rules

- **Case**: ALL UPPERCASE for secondary text and metadata
- **Opacity**: 40% (`text-white/40`)
- **Font**: Barlow Condensed (`font-condensed`)
- **Spacing**: Wide letter spacing (`tracking-wide`)
- **Size**: One point larger than default for category

### Text Rendering Optimization

```css
style={{
  textRendering: 'optimizeLegibility',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  fontKerning: 'normal',
  textSizeAdjust: '100%',
}}
```

### Indentation Rules

- **With boxes below**: `ml-2` (8px) or `ml-4` (16px) for sub-headers
- **Without boxes**: No left margin

### Examples

```tsx
// Standard sub-header
<h3 className="text-xl font-semibold text-white/40 mb-4 font-condensed tracking-wide ml-2">
  TRENDING TOPICS (Issue Spike Detector)
</h3>

// Secondary metadata
<span className="text-white/70 text-sm font-mono uppercase">
  LAST UPDATED: 30 seconds ago
</span>
```

## Button System (Primary & Secondary)

### Site-Wide Button Spacing Rule

**All buttons** use reduced spacing between letters AND words for optimal readability:

- **Letter Spacing**: `letter-spacing: -0.05em !important` (character spacing)
- **Word Spacing**: `word-spacing: -0.3em !important` (space between words)
- **Enforcement**: Proper CSS cascade using Tailwind's layer system
- **Applies to**: Primary buttons, Secondary buttons, Action buttons, inline buttons
- **Examples**: "RESPOND NOW", "Add to Alert", "Generate Response", "View Mentions"
- **Implementation**: Button classes wrapped in `@layer components` with `!important` declarations

### Critical Implementation Rules:

1. **Use CSS classes only**: Never mix CSS classes with redundant utility classes
2. **Avoid utility conflicts**: Don't use `btn-secondary-alert` + `font-mono text-sm uppercase` together
3. **Layer specificity**: All button components must be in `@layer components`
4. **Dual spacing control**: Both letter and word spacing are reduced for compact button text

### Secondary Button Variants

Three standardized secondary button types with specific use cases:

#### Alert Buttons (`.btn-secondary-alert`)

- **Use**: Urgent actions, critical responses
- **Color**: Red theme (`bg-red-500/20 hover:bg-red-500/30 text-red-400`)

#### Action Buttons (`.btn-secondary-action`)

- **Use**: Primary interactive actions
- **Color**: Blue theme (`bg-blue-500/20 hover:bg-blue-500/30 text-blue-400`)

#### Neutral Buttons (`.btn-secondary-neutral`)

- **Use**: Secondary actions, supplementary functions
- **Color**: Neutral theme (`bg-white/10 hover:bg-white/20 text-white/80`)

### Primary Button Specifications

```css
/* src/index.css */
.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white font-mono font-medium text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 tracking-[-0.05em];
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 tracking-[-0.05em];
}

/* Global fallback for all buttons */
button {
  letter-spacing: -0.05em !important;
}
```

### Secondary Button Specifications

```css
/* src/index.css */
.btn-secondary-alert {
  @apply bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-0.5 rounded-lg transition-colors font-mono text-sm uppercase whitespace-nowrap text-center tracking-[-0.05em];
}

.btn-secondary-action {
  @apply bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-0.5 rounded-lg transition-colors font-mono text-sm uppercase whitespace-nowrap text-center tracking-[-0.05em];
}

.btn-secondary-neutral {
  @apply bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-3 py-0.5 rounded-lg transition-colors font-mono text-sm uppercase whitespace-nowrap text-center tracking-[-0.05em];
}

.btn-primary-alert {
  @apply bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-xl transition-colors font-mono text-base uppercase text-center tracking-[-0.05em];
}

.btn-primary-action {
  @apply bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-6 py-3 rounded-xl transition-colors font-mono text-base uppercase text-center tracking-[-0.05em];
}

.btn-primary-neutral {
  @apply bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-6 py-3 rounded-xl transition-colors font-mono text-base uppercase text-center tracking-[-0.05em];
}
```

### Key Features (All Buttons)

- **Letter Spacing**: Halved (`tracking-[-0.05em]`) - **SITE-WIDE RULE**
- **Implementation**: Tailwind arbitrary value within @apply directive
- **Fallback**: Global CSS rule with `!important` for non-class buttons
- **Font**: Monospace (`font-mono`) for technical actions
- **Case**: UPPERCASE for action buttons
- **Wrap**: Prevent wrapping (`whitespace-nowrap`)

#### Secondary Button Specific Features

- **Height**: Reduced (`py-0.5` for compact appearance)
- **Themes**: Alert (red), Action (blue), Neutral (white/gray)

## Spacing Standards

### Site-wide Grid Standardization

**CRITICAL RULE**: All page-level grids must use **consistent 16px spacing** to match Live Monitoring:

- **Grid gaps**: `gap-4` (16px) - NO responsive variations
- **Component spacing**: `mb-4` (16px) between major sections
- **Interior grids**: `gap-4` (16px) consistent across all components

### Examples of Correct Implementation

```tsx
/* ✅ CORRECT - Dashboard grids */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

/* ✅ CORRECT - Live Monitoring reference */
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
<div className="space-y-4">

/* ❌ INCORRECT - Inconsistent spacing */
<div className="gap-3 lg:gap-4 mb-4 lg:mb-5">  /* Responsive variations */
<div className="gap-6 mb-8">                   /* Excessive spacing */
```

### Component Interior Spacing

- **Interior box padding**: Increased (`p-5`, `p-6`)
- **Gaps between interior boxes**: Reduced (`space-y-3`, `gap-3`)
- **Exterior container padding**: Standard (`p-4`, `p-5`)
- **Exterior container gaps**: **STANDARDIZED** (`gap-4`, `mb-4`)

### Sub-navigation Tab Standards

**CRITICAL RULE**: Sub-navigation tabs must be smaller than primary navigation to create proper hierarchy:

- **Primary Navigation**: `px-3 py-2 text-sm` (larger)
- **Sub-navigation Tabs**: `px-3 py-1.5 text-sm` (smaller - reduced vertical padding)

### Examples of Correct Implementation

```tsx
/* ✅ CORRECT - Sub-navigation tabs */
<button className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-lg">
  Strategic Projects
</button>

/* ❌ INCORRECT - Same size as primary navigation */
<button className="flex items-center space-x-2 px-4 py-2 rounded-lg">
  Strategic Projects
</button>
```

**Reference implementations:**

- ✅ Intelligence Hub tabs
- ✅ Alert Center tabs
- ✅ War Room tabs (fixed)

### Content to Button Spacing

- **Standard**: `mt-4` (16px) between content and secondary buttons
- **Applied consistently** across all components with secondary buttons

### Monitoring Controls Specific

- **Right padding**: 50% increase (`pr-6`) for metadata alignment
- **Metadata spacing**: Increased horizontal gaps (`space-x-6`)

### Stacked Components

- **Alert to monitoring bar**: Reduced margin (`mb-2` instead of `mb-4`)

## Scroll Effects

### CSS Mask-based Fade System

```css
/* src/index.css */
.scroll-fade {
  mask: linear-gradient(
    180deg,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  -webkit-mask: linear-gradient(
    180deg,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
}

.scroll-fade-glass {
  mask: linear-gradient(
    180deg,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
  -webkit-mask: linear-gradient(
    180deg,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
}

.scroll-fade-subtle {
  mask: linear-gradient(
    180deg,
    transparent 0%,
    black 5%,
    black 95%,
    transparent 100%
  );
  -webkit-mask: linear-gradient(
    180deg,
    transparent 0%,
    black 5%,
    black 95%,
    transparent 100%
  );
}
```

### Application

- Apply to scrollable containers to eliminate harsh cutoffs
- Use `.scroll-fade` for standard fade
- Use `.scroll-fade-glass` for glass-effect containers
- Use `.scroll-fade-subtle` for minimal fade effect

## Z-Index Management

### Dropdown System

- **Implementation**: React Portals for all dropdowns
- **Container z-index**: `z-[99998]`
- **Dropdown menu z-index**: `z-[99999]`
- **Render target**: `document.body`

### Example Implementation

```tsx
{
  typeof document !== 'undefined' &&
    createPortal(
      <motion.div
        className="fixed z-[99999] bg-black/[0.97] backdrop-blur-md rounded"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          zIndex: 99999,
        }}
      >
        {/* Dropdown content */}
      </motion.div>,
      document.body
    );
}
```

## Secondary Text Rules

### Metadata vs Content Classification

- **Metadata** (make UPPERCASE):
  - Timestamps ("LAST UPDATED: 30 seconds ago")
  - Counts ("TOTAL MENTIONS: 12,847")
  - Stats ("INFLUENCE: 72", "ENG: 45%")
  - Technical labels ("FOLLOWERS", "REACH")
  - Time references ("LAST 24h")

- **Content** (keep lowercase):
  - Alert messages ("Negative mentions about crime policy...")
  - User-generated content
  - Descriptions and narrative text
  - Names and proper nouns

### Styling Application

```tsx
// Metadata - UPPERCASE
<span className="text-white/70 text-sm font-mono uppercase">
  TOTAL MENTIONS: {totalMentions.toLocaleString()}
</span>

// Content - lowercase
<span className="text-white/90 font-mono">
  {message}
</span>
```

## Component-Specific Applications

### Monitoring Components

- **MentionsStream**: Content in `<p>` tags, metadata in `<span>` with `font-mono uppercase`
- **TrendingTopics**: Keywords as content, stats as metadata
- **InfluencerTracker**: Usernames as content, follower counts and metrics as metadata
- **PlatformPerformance**: Platform insights as metadata
- **MonitoringControls**: All status indicators as metadata

### Alert Components

- **Alert titles**: UPPERCASE as they're categorical labels
- **Alert content**: lowercase as they're descriptive messages
- **Action buttons**: UPPERCASE as they're technical controls

## Implementation Checklist

When applying these standards to new components:

### Typography Hierarchy

- [ ] Section headers use `.section-header` (Barlow Condensed 600, 50% opacity, uppercase)
- [ ] Content titles use `.content-title` (Barlow Semi-Condensed 500, 15px/17px)
- [ ] Content subtitles use `.content-subtitle` (Barlow Condensed, 50% opacity, -1px margin)
- [ ] Form labels use `.form-label` or JetBrains Mono inline classes
- [ ] Status indicators use `.status-indicator` (JetBrains Mono uppercase)

### Settings Page Elements

- [ ] Section headers match dashboard typography (Profile Settings, Notifications, etc.)
- [ ] Toggle items follow standard layout pattern with proper icons
- [ ] Form labels use JetBrains Mono with proper spacing (`ml-1.5`)
- [ ] Icons align with title text (no vertical offset)

### Spacing & Layout

- [ ] Content to button spacing is `mt-4`
- [ ] Grid spacing uses `gap-4` consistently
- [ ] Toggle item descriptions have `-1px` top margin for tight spacing
- [ ] Icon containers use `ml-2.5`, text containers use `ml-1.5`

### Buttons & Interactive Elements

- [ ] Secondary buttons use appropriate variant class
- [ ] Button heights and letter spacing follow standards
- [ ] UPPERCASE and monospace font applied to action buttons

### Effects & Performance

- [ ] Icons use semantic choices (Mail, Shield, Moon, etc.)
- [ ] No `mt-0.5` on icons (proper alignment with text)
- [ ] Z-index management uses Portal system for dropdowns

## Settings Item Component Pattern

### Standard Layout for Toggle Settings

All settings page toggle items (notifications, security, appearance, privacy) use a consistent layout pattern:

```tsx
<div className="flex items-start justify-between">
  <div className="flex items-start space-x-3 ml-2.5">
    <Icon className="w-5 h-5 text-white/75" />
    <div className="ml-1.5">
      <p className="content-title">Setting Name</p>
      <p className="content-subtitle">Setting description</p>
    </div>
  </div>
  <div className="mt-1">
    <ToggleSwitch />
  </div>
</div>
```

### Implementation Rules

- **Section Header Typography**:
  - Use `.section-header` (Barlow Condensed 600, 50% opacity, uppercase)
  - Examples: Profile Settings, Notifications, Appearance, Security, Data & Privacy
- **Toggle Item Typography**:
  - Main text uses `.content-title` (Barlow Semi-Condensed Medium 500, 15px/17px desktop, 95% opacity)
  - Descriptions use `.content-subtitle` (Barlow Condensed, 13px/15px desktop, 50% opacity, -1px top margin for tight spacing)
- **Form Label Typography**:
  - Use `.form-label` or inline: `text-sm font-mono text-white/75 uppercase tracking-wider`
  - Examples: Display Name, Email Address, Theme, Language labels
- **Icon Spacing**: Container uses `ml-2.5` (10px), text container uses `ml-1.5` (6px)
- **Icon Styling**: `w-5 h-5` size, `text-white/75` color, aligned with title text (no mt-0.5)
- **Toggle Alignment**: `mt-1` for vertical alignment with text
- **Icon Selection**: Use semantic icons (Mail for email, Shield for security, Moon for dark mode, etc.)

### Applied To

**Toggle Items** (use content-title/content-subtitle):

- Email Notifications, Push Notifications, Auto-Publish Content
- Two-Factor Authentication, Dark Mode, Data Sharing
- Any future toggle-based settings items

**Form Labels** (use JetBrains Mono):

- Display Name, Email Address, Company Name
- Theme, Language, Timezone, Date Format
- Any input field labels

## Single-Column Card Content Indentation

### Standard for Right-Hand Side Components

Single-column cards (like Sentiment Breakdown, Platform Performance, Influencer Tracker) require consistent content indentation to align with the overall visual grid.

#### Implementation

```tsx
// Apply to headers and content containers within single-column cards
<h3 className="text-xl font-semibold text-white/40 mb-4 font-condensed tracking-wide ml-1.5">
  COMPONENT TITLE
</h3>
<div className="space-y-3 px-1.5">
  {/* Content items */}
</div>

// For insights boxes and sub-containers (less indented)
<div className="mt-4 mx-1 p-3 bg-black/20 rounded-lg">
  {/* Insights content */}
</div>
```

#### Measurements

- **Header Indentation**: `ml-1.5` (6px left margin)
- **Content Indentation**: `px-1.5` (6px horizontal padding)
- **Rounded Elements**: `mx-1` (4px horizontal margin)
- **Card Outer Padding**: `p-4` (16px) via Card component
- **Total Content Offset**: 22px from card edge

#### Visual Alignment

This creates proper visual hierarchy where:

- Multi-column components (left side) have natural content flow
- Single-column components (right side) have indented content that aligns with grid guidelines
- All percentages and data points align consistently

#### Examples

```tsx
// Sentiment Breakdown
<Card padding="md" variant="glass">
  <h3 className="text-xl font-semibold text-white/40 mb-4 font-condensed tracking-wide ml-1.5">
    SENTIMENT BREAKDOWN
  </h3>
  <div className="space-y-4 px-1.5">
    {/* Sentiment items with proper indentation */}
  </div>
</Card>

// Platform Performance
<Card padding="md" variant="glass">
  <h3 className="text-xl font-semibold text-white/40 mb-4 font-condensed tracking-wide ml-1.5">
    PLATFORM PERFORMANCE
  </h3>
  <div className="space-y-3 px-1.5">
    {/* Platform items with proper indentation */}
  </div>
  <div className="mt-4 mx-1 p-3 bg-black/20 rounded-lg">
    {/* Insights with subtle indentation */}
  </div>
</Card>
```

#### Application Rules

- **Single-column card headers**: Apply `ml-1.5` for consistent header indentation
- **Single-column card content**: Apply `px-1.5` to main content container
- **Multi-column cards**: Use natural grid alignment without forced indentation
- **Rounded sub-containers**: Use `mx-1` for subtle horizontal margin (buttons, insights boxes)
- **Visual Balance**: Headers and content align consistently, rounded elements slightly less indented

## Site-wide Implementation Status

### ✅ **Components Updated with Style Guide:**

- **Settings Page**: COMPLETE - All typography hierarchy implemented correctly:
  - Section headers use `.section-header` (Barlow Condensed 50% opacity) matching dashboard
  - Toggle items use `.content-title`/`.content-subtitle` (Barlow Semi-Condensed/Condensed)
  - Form labels use JetBrains Mono with proper spacing and typography
  - All icons properly aligned and consistently styled
- **Alert Center**: Subheaders, spacing (gap-4), label positioning
- **Intelligence Hub**: Dropdown replaced with CustomDropdown, label positioning
- **Dashboard**: Grid spacing updated to gap-4
- **Monitoring Components**: Reference implementation (SentimentBreakdown, PlatformPerformance, InfluencerTracker)
- **Campaign Control**: ActivityFeed indentation and spacing

### 📋 **Standards Applied Consistently:**

- **Typography Hierarchy**: Complete implementation across all pages
  - Section headers: `.section-header` (Barlow Condensed 600, 50% opacity)
  - Content titles: `.content-title` (Barlow Semi-Condensed 500)
  - Content subtitles: `.content-subtitle` (Barlow Condensed, 50% opacity)
  - Form labels: JetBrains Mono (uppercase, tracking-wider)
- **Settings Page Elements**: All toggle items, form labels, and section headers properly typed
- **Grid Spacing**: All page-level grids use `gap-4` to match Live Monitoring
- **Icon Alignment**: All icons aligned with title text (no mt-0.5 offset)
- **Dropdown Components**: CustomDropdown used consistently across all pages
- **Content Indentation**: Single-column cards use `px-1.5` for content, `ml-1.5` for headers

### 🎯 **Design System Compliance:**

- **Typography Hierarchy**: Inter, Barlow Condensed, JetBrains Mono properly applied
- **Button System**: Secondary button variants used consistently
- **Spacing Standards**: 4px gap for grids, 4px spacing for component stacks
- **Label Standards**: No trailing colons, proper indentation, consistent spacing

## Settings Page Implementation Summary

### ✅ **COMPLETED - Typography Hierarchy Fully Implemented**

**Section Headers** (Profile Settings, Notifications, Appearance, Security, Data & Privacy):

- **Class**: `.section-header`
- **Typography**: Barlow Condensed 600, 50% opacity, uppercase
- **Matches**: Dashboard headers (Campaign Operations, Quick Actions, Intelligence Dashboard)

**Toggle Item Titles** (Email Notifications, Push Notifications, Dark Mode, Two-Factor Authentication, Data Sharing):

- **Class**: `.content-title`
- **Typography**: Barlow Semi-Condensed Medium 500, 15px/17px desktop, 95% opacity

**Toggle Item Descriptions** (Receive campaign updates via email, Get instant alerts on your device, etc.):

- **Class**: `.content-subtitle`
- **Typography**: Barlow Condensed, 13px/15px desktop, 50% opacity, -1px top margin for tight spacing

**Form Labels** (Display Name, Email Address, Company Name, Theme, Language, Timezone, Date Format):

- **Classes**: JetBrains Mono inline or `.form-label`
- **Typography**: `text-sm font-mono text-white/75 uppercase tracking-wider`

**All Elements Properly**:

- ✅ Icons semantically chosen and aligned with title text
- ✅ Spacing consistently applied (`ml-2.5` containers, `ml-1.5` text)
- ✅ Toggle switches properly aligned
- ✅ Form input styling consistent with design system

---

This style guide ensures consistent visual hierarchy and user experience across the entire War Room application.
