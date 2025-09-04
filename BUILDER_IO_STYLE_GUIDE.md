# 🎨 Builder.io Style Guide & Implementation Manual

**Found in 3.0 UI War Room - Complete Design System**  
**For applying to dashboard components and maintaining visual consistency**

---

## 📍 **KEY FILES LOCATED**

### **Design System Core:**
```
📁 /src/styles/
├── design-system.ts        ← Complete TypeScript design tokens
├── animations.css          ← Performance-optimized animations  
├── transitions.css         ← Smooth transitions
└── ...

📁 /src/
├── builder-registry.tsx    ← Builder.io component registration
├── warroom.css            ← War Room specific styles
├── index.css              ← Main stylesheet
└── ...

📄 WAR_ROOM_DESIGN_SYSTEM.md ← Complete style guide (14KB)
```

---

## 🎯 **CORE DESIGN PHILOSOPHY**

### **Command Center Aesthetic**
- **Military-grade professionalism**: Clean, authoritative, mission-critical
- **High-stakes clarity**: Information hierarchy for rapid decisions
- **24/7 operational readiness**: Works under pressure, any lighting
- **Executive briefing room**: C-suite presentation ready

### **Visual Identity**
- **Primary Background**: Slate gradient (`slate-600 → slate-700 → slate-800`)
- **Glass Elements**: `bg-black/20 backdrop-blur-xl`
- **Text Hierarchy**: White with opacity levels (`text-white/95, /90, /75, /60, /50`)
- **All Headers**: **UPPERCASE** (mandatory)

---

## 🎨 **DESIGN TOKENS (from design-system.ts)**

### **Color Palette**
```typescript
colors: {
  gray: {
    50: '#F9FAFB',   100: '#F3F4F6',   200: '#E5E7EB',
    300: '#D1D5DB',  400: '#9CA3AF',   500: '#6B7280',
    600: '#4B5563',  700: '#374151',   800: '#1F2937',   900: '#111827'
  },
  blue: {
    500: '#3B82F6', 600: '#2563EB',   700: '#1D4ED8'
  },
  status: {
    success: { light: '#DCFCE7', medium: '#16A34A', dark: '#15803D' },
    warning: { light: '#FEF3C7', medium: '#D97706', dark: '#B45309' },
    error: { light: '#FEE2E2', medium: '#DC2626', dark: '#B91C1C' }
  }
}
```

### **Typography Scale**
```typescript
fontSize: {
  xs: '0.75rem',    sm: '0.875rem',   base: '1rem',
  lg: '1.125rem',   xl: '1.25rem',    '2xl': '1.5rem',
  '3xl': '1.875rem', '4xl': '2.25rem', '5xl': '3rem'
}

fontFamily: {
  sans: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif']
}
```

### **Spacing System (4px grid)**
```typescript
spacing: {
  xs: '0.25rem',   sm: '0.5rem',    md: '0.75rem',
  lg: '1rem',      xl: '1.25rem',   '2xl': '1.5rem',
  '3xl': '2rem',   '4xl': '3rem',   '5xl': '4rem'
}
```

---

## 🔧 **COMPONENT STANDARDS**

### **Buttons & Controls (NEVER DEVIATE)**
```css
.war-room-button {
  @apply px-3 py-1.5 text-sm rounded-lg uppercase;
}

/* Approved combinations: */
/* Primary: bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm */
/* Secondary: bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 text-sm */
/* Inputs: bg-black/20 border border-white/30 px-3 py-1.5 text-sm */
```

### **Cards & Glass Elements**
```css
.glass-card {
  @apply bg-black/15 backdrop-blur-lg border border-slate-500/30 rounded-2xl shadow-2xl;
}

.glass-card:hover {
  @apply bg-black/20 border-slate-400/40;
}

.glass-input {
  @apply bg-white/5 backdrop-blur-sm border border-white/20 rounded-md;
}
```

### **Typography Rules**
```css
/* ALL headings UPPERCASE - NO EXCEPTIONS */
h1, h2, h3, h4, h5, h6 { 
  text-transform: uppercase; 
}

/* Hierarchy */
/* Major headings: text-lg lg:text-xl + font-semibold + uppercase */
/* Card titles: text-base lg:text-lg + font-semibold + uppercase */  
/* Body text: text-xs lg:text-sm + uppercase */
/* Metadata: text-xs + uppercase */
```

---

## 📐 **CRITICAL MEASUREMENTS**

### **Layout Fundamentals**
```css
.main-content {
  padding-top: 67px;     /* 64px navbar + 3px gap - DO NOT CHANGE */
  padding-bottom: 201px; /* Chat input clearance - DO NOT CHANGE */
}

.text-content {
  padding: 7px 0;        /* Exactly 7px above/below - TESTED */
  gap: 0.25rem;          /* 4px between headline and subheadline */
}
```

### **Spacing Standards**
- **Between major sections**: `mb-8 lg:mb-10`
- **Between cards**: `gap-6 lg:gap-8`
- **Tab navigation margin**: `mb-3` (12px - optimized)
- **Internal card padding**: `p-4 lg:p-5`

---

## 🎯 **DASHBOARD-SPECIFIC APPLICATION**

### **Metrics Cards (The "Green Square")**
```typescript
// Apply War Room styling to metrics components
const MetricsCard = () => (
  <div className="glass-card p-4 lg:p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-white/60 uppercase">
        {label}
      </span>
      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-white/95 uppercase">
      {value}
    </div>
  </div>
);
```

### **Command Status Bar**
```typescript
// Apply glass morphism and proper spacing
const StatusBar = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
    {items.map(item => (
      <div className="glass-card hover:bg-white/15 hover:scale-[1.02] transition-all duration-200">
        {/* Content with proper text hierarchy */}
      </div>
    ))}
  </div>
);
```

### **SWOT Radar Styling**
```css
/* Apply War Room colors to SWOT radar */
.swot-radar {
  background: linear-gradient(135deg, rgb(15 23 42), rgb(30 41 59), rgb(51 65 85));
}

.swot-quadrant {
  @apply text-white/60 text-sm uppercase font-medium;
}

.swot-data-point {
  @apply cursor-pointer transition-all hover:opacity-80;
}
```

---

## 🎬 **ANIMATIONS & INTERACTIONS**

### **Performance-Optimized Animations**
```css
/* From animations.css */
.fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}

.scale-hover {
  transition: transform 0.15s ease-out;
  will-change: transform;
}

.scale-hover:hover {
  transform: scale(1.02) translate3d(0, 0, 0);
}

/* Stagger animations for dashboard cards */
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
```

---

## 🚀 **BUILDER.IO COMPONENT REGISTRATION**

### **How Components Are Registered**
```typescript
// From builder-registry.tsx
Builder.init(import.meta.env.VITE_BUILDER_IO_KEY);

Builder.registerComponent(Dashboard, {
  name: 'Dashboard',
  description: 'Main War Room dashboard with overview metrics',
  inputs: [],
  defaultStyles: {
    minHeight: '100vh',
  },
});

// Register with editable inputs
Builder.registerComponent(MetricsGrid, {
  name: 'MetricsGrid', 
  inputs: [
    { name: 'showMetrics', type: 'boolean', defaultValue: true },
    { name: 'title', type: 'string', defaultValue: 'Metrics' }
  ]
});
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **For Dashboard Components:**
- [ ] Uses `glass-card` styling with proper backdrop blur
- [ ] All text is **UPPERCASE** where appropriate  
- [ ] Button sizing: `px-3 py-1.5 text-sm` (MANDATORY)
- [ ] Text padding: `7px` above/below (TESTED)
- [ ] White dividers: `border-white/30` (never colored)
- [ ] Icon sizing: `w-6 h-6` standard, `lg:w-8 lg:h-8` desktop
- [ ] Responsive: `text-xs lg:text-sm` pattern
- [ ] Hover states: `hover:bg-white/15 hover:scale-[1.02]`
- [ ] Proper spacing: `gap-6 lg:gap-8` between cards

### **Quality Gates:**
- [ ] Visual consistency with 3.0 UI interface
- [ ] Executive presentation-ready appearance  
- [ ] Mobile responsive across all breakpoints
- [ ] Performance optimized (CSS animations, no Framer Motion)
- [ ] Accessibility: WCAG AA color contrast

---

## ⚠️ **NEVER CHANGE THESE:**

1. **Button sizing**: `px-3 py-1.5 text-sm`
2. **Navigation spacing**: `67px` top padding  
3. **Text uppercase**: All headers and UI text
4. **White dividers**: `border-white/30` only
5. **Logo sizing**: `h-8 w-auto` (32px height)

---

## 🎯 **QUICK APPLICATION GUIDE**

### **To Apply War Room Style to Any Component:**
1. **Wrap in**: `glass-card` class
2. **Text hierarchy**: `text-white/95` → `text-white/90` → `text-white/75`
3. **Make uppercase**: All headers and labels  
4. **Use spacing**: `p-4 lg:p-5` for internal padding
5. **Add hover**: `hover:bg-white/15 hover:scale-[1.02] transition-all duration-200`
6. **Icons**: `text-white/95` with theme colors for categories

This comprehensive style guide ensures any dashboard component will perfectly match the established War Room 3.0 UI aesthetic and maintain Builder.io compatibility!