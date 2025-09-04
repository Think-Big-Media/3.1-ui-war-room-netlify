# War Room UI Style Guide - Comprehensive

## Typography Hierarchy

### Fonts

- **Content Text**: Inter (font-sans)
- **Sub-headers**: Barlow Condensed (font-condensed)
- **Technical Labels/Buttons**: JetBrains Mono (font-mono)

### Text Styles

- **Main Headings**: `text-white/90 font-medium`
- **Sub-descriptions**: `text-white/60 font-condensed tracking-wide -mt-1` (moved up 3px, 60% opacity - STANDARDIZED)
- **Section Headers**: `font-condensed tracking-wide text-white/40` (uppercase)

## Form Elements

### Input Fields

- **Base Style**: `w-full bg-white/70 rounded-xl px-4 py-2.5 border border-slate-200 text-gray-600 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-0 transition-all duration-300`
- **Background**: 70% opacity to show layer underneath
- **Text Color**: Mid-dark gray (`text-gray-600`) instead of black
- **Height**: Reduced by 15% (py-2.5 instead of py-3)
- **Corner Radius**: `rounded-xl` (matches floating chat input)

### Select Dropdowns

- **Base Style**: Same as inputs + `appearance-none cursor-pointer`
- **Consistency**: Match input styling exactly

### Button Hierarchy

- **Primary Buttons**: Large important actions (`btn-primary-alert`, `btn-primary-action`, `btn-primary-neutral`)
  - Use for: Settings actions, main CTA buttons, destructive actions
  - Size: `px-6 py-3` with `text-base`
  - Text: Always centered (`text-center`)
- **Secondary Buttons**: Smaller inline actions (`btn-secondary-alert`, `btn-secondary-action`, `btn-secondary-neutral`)
  - Use for: Quick actions, toolbar buttons, supporting actions
  - Size: `px-3 py-0.5` with `text-sm`
  - Text: Always centered (`text-center`)

### Button Icon Standards

- **Icons**: Always use semantic icons (Link for connecting, not ExternalLink)
- **Alignment**: Icons automatically positioned 2px up for proper text alignment
- **Connection Icons**: Use `Link` icon for connect actions, not `ExternalLink`

## Layout & Spacing

### Container Spacing

- **Bottom Spacing**: `pb-5` (21px) - 47.5% reduction from original double padding
- **Icon Indentation**: `ml-2.5` (10px from box edge)
- **Content Indentation**: `ml-4` for text-only items

### Icon Alignment

- **Vertical Position**: `mt-0.5` (2px down to align with headline baselines)
- **Layout**: `items-start` (align with headings, not centered with sub-text)

### Toggle Switches

- **Alignment**: `mt-1` wrapper for proper positioning with headlines

## Component Structure

### Notification/Security Items

```tsx
<div className="flex items-start justify-between">
  <div className="flex items-start space-x-3 ml-2.5">
    <Icon className="w-5 h-5 text-white/75 mt-0.5" />
    <div className="ml-1.5">
      <p className="text-white/90 font-medium">Main Heading</p>
      <p className="text-white/60 font-condensed tracking-wide -mt-1">
        Sub-description (60% opacity, up 3px)
      </p>
    </div>
  </div>
  <div className="mt-1">
    <ToggleSwitch />
  </div>
</div>
```

### CSS Utilities

```css
.war-room-input {
  @apply w-full bg-white/70 rounded-xl px-4 py-2.5 border border-slate-200 text-gray-600 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-0 transition-all duration-300;
}

.war-room-select {
  @apply w-full bg-white/70 rounded-xl px-4 py-2.5 border border-slate-200 text-gray-600 focus:border-slate-500 focus:outline-none focus:ring-0 transition-all duration-300 appearance-none cursor-pointer;
}

.war-room-subheading {
  @apply text-white/60 font-condensed tracking-wide -mt-1;
}

.space-with-bottom {
  @apply pb-5;
}

/* Primary Button Styles - Bigger versions of secondary buttons */
.btn-primary-alert {
  @apply bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-xl transition-colors font-mono text-base uppercase text-center;
}

.btn-primary-action {
  @apply bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-6 py-3 rounded-xl transition-colors font-mono text-base uppercase text-center;
}

.btn-primary-neutral {
  @apply bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-6 py-3 rounded-xl transition-colors font-mono text-base uppercase text-center;
}

/* Secondary Button Styles - Text centered, icons aligned */
.btn-secondary-alert {
  @apply bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-0.5 rounded-lg transition-colors font-mono text-sm uppercase whitespace-nowrap text-center;
}

.btn-secondary-action {
  @apply bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-0.5 rounded-lg transition-colors font-mono text-sm uppercase whitespace-nowrap text-center;
}

.btn-secondary-neutral {
  @apply bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-3 py-0.5 rounded-lg transition-colors font-mono text-sm uppercase whitespace-nowrap text-center;
}

/* All button icons automatically aligned 2px up for proper text alignment */
```

## Implementation Standards (SITE-WIDE STANDARDIZATION)

1. **Icon Alignment**: Always use `mt-0.5` on icons in notification/security layouts
2. **Content Indentation**: 10px (`ml-2.5`) from box edges for icon containers
3. **Sub-description Standard**: ALWAYS use `text-white/60 font-condensed tracking-wide -mt-1` (60% opacity, moved up 3px)
4. **Input Visibility**: No opacity reduction on form fields (100% opacity)
5. **Consistent Spacing**: Use `pb-5` for container bottom spacing site-wide
6. **Typography**: Apply Barlow Condensed to all sub-descriptions with proper kerning

### CRITICAL: ALL sub-descriptions must follow the standardized pattern:

- 60% opacity (`text-white/60`)
- Barlow Condensed font (`font-condensed`)
- Proper kerning (`tracking-wide`)
- Moved up 3px (`-mt-1`)

This applies to ALL descriptive text under main headings across the entire platform.

## Color Specifications

- **Main Text**: `text-white/90` (90% opacity)
- **Sub-text**: `text-white/60` (60% opacity, moved up 3px)
- **Section Headers**: `text-white/40` (40% opacity, uppercase)
- **Icons**: `text-white/75` (75% opacity)
- **Form Fields**: 70% transparent background (`bg-white/70`) with gray text (`text-gray-600`)

This style guide ensures consistent, accessible, and visually appealing interfaces across the entire War Room platform.
