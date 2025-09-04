# ⚙️ War Room Development Standards
*Technical implementation guide for maintaining design system consistency*

## **🎯 Developer Mission Statement**

> **"Every line of code must serve the mission-critical nature of political campaign operations. No shortcuts. No inconsistencies. Executive-grade quality, always."**

---

## **📁 Project Architecture**

### **Frontend Structure**
```
src/
├── pages/                    # Route components
│   ├── CommandCenter.tsx     # Main dashboard (PRODUCTION ENTRY)
│   ├── AlertCenter.tsx       # Crisis management
│   ├── IntelligenceHub.tsx   # Document processing
│   └── ...
├── components/
│   ├── shared/               # Reusable UI components
│   │   ├── PageLayout.tsx    # Global layout wrapper
│   │   ├── Card.tsx          # Standard card component
│   │   └── CustomDropdown.tsx
│   ├── generated/            # AI-generated components
│   └── campaign-control/     # Feature-specific components
├── AppBrandBOS.tsx          # PRODUCTION APP (Active)
├── App.tsx                  # Development app (Inactive)
└── index.tsx                # App selector
```

### **Critical Files**
- **`AppBrandBOS.tsx`**: PRODUCTION frontend - Never modify without approval
- **`PageLayout.tsx`**: Global spacing and layout - Changes affect entire app
- **`CLAUDE.md`**: AI development guidelines - Keep updated
- **`WAR_ROOM_DESIGN_SYSTEM.md`**: UI standards - Source of truth

---

## **🎨 CSS/Styling Standards**

### **Tailwind CSS Patterns**

#### **Approved Button Pattern**
```tsx
// STANDARD BUTTON - Use everywhere
<button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg transition-colors">
  Action Text
</button>

// SECONDARY BUTTON
<button className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 text-sm rounded-lg transition-colors">
  Secondary Action
</button>

// INPUT FIELD
<input className="bg-black/20 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/50" />
```

#### **Typography Rules**
```tsx
// HEADINGS - Always uppercase
<h1 className="text-lg lg:text-xl font-semibold text-white/95 uppercase">
  Section Title
</h1>

// BODY TEXT - Uppercase for UI elements
<p className="text-xs lg:text-sm text-white/75 uppercase">
  Supporting Text
</p>

// METADATA - Small, uppercase
<span className="text-xs text-white/60 uppercase">
  Timestamp or category
</span>
```

#### **Layout Patterns**
```tsx
// PAGE WRAPPER
<PageLayout pageTitle="Page Name" placeholder="Chat placeholder...">
  <div className="fixed inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 -z-10" />
  {/* Page content */}
</PageLayout>

// CARD GRID
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-8 lg:mb-10">
  {/* Cards */}
</div>

// TAB NAVIGATION - Consistent spacing
<div className="flex space-x-4 mb-3">
  {/* Tabs */}
</div>
```

### **Forbidden Patterns**
❌ **Never use these patterns:**
```tsx
// WRONG - Inconsistent sizing
<button className="px-4 py-2">Button</button>
<button className="px-6 py-3">Button</button>

// WRONG - Mixed case text in UI
<h1 className="text-white">Mixed Case Title</h1>

// WRONG - Colored dividers
<div className="border-t border-purple-400/20" />

// WRONG - Custom spacing
<div className="pt-5 pb-7 ml-3" />
```

---

## **⚛️ React Component Standards**

### **Component Structure**
```tsx
import type React from 'react';
// Import order: React, external libs, internal components, types, utils

interface ComponentProps {
  // Always define TypeScript interfaces
  title: string;
  isActive?: boolean;
  onClick?: () => void;
}

const ComponentName: React.FC<ComponentProps> = ({
  title,
  isActive = false,
  onClick,
}) => {
  // Component logic here

  return (
    <div className="component-classes">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

### **State Management**
```tsx
// Use useState for component state
const [activeTab, setActiveTab] = useState<string>('default');

// Use useEffect for side effects
useEffect(() => {
  // Side effect logic
  return () => {
    // Cleanup if needed
  };
}, [dependencies]);
```

### **Event Handling**
```tsx
// Consistent event handler naming
const handleButtonClick = () => {
  // Handler logic
};

const handleInputChange = (value: string) => {
  // Handler logic with typed parameters
};
```

---

## **📐 Layout Implementation**

### **Spacing System Implementation**
```tsx
// Global layout spacing - DO NOT MODIFY
const PageLayout: React.FC = ({ children }) => (
  <main 
    className="flex-1 overflow-y-auto"
    style={{
      paddingTop: '67px',    // 64px navbar + 3px gap
      paddingBottom: '201px', // Chat input clearance
    }}
  >
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
      {children}
    </div>
  </main>
);

// Text content padding
<div className="py-[7px] space-y-1">
  <h2 className="headline">Headline</h2>
  <p className="subheadline">Subheadline</p>
</div>
```

### **Responsive Breakpoints**
```tsx
// Standard responsive classes
"grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
"text-xs lg:text-sm"
"gap-4 lg:gap-6"
"mb-4 lg:mb-6"
"px-3 py-1.5" // Same on all breakpoints for consistency
```

---

## **🔧 File Organization**

### **Naming Conventions**
- **Components**: PascalCase (`CommandCenter.tsx`)
- **Files**: kebab-case for non-components (`design-system.md`)
- **Variables**: camelCase (`activeTab`, `handleButtonClick`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ITEMS_PER_PAGE`)

### **Import Organization**
```tsx
// 1. React and hooks
import React, { useState, useEffect } from 'react';

// 2. External libraries
import { motion } from 'framer-motion';
import { Bell, Search } from 'lucide-react';

// 3. Internal components (shared first, then specific)
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';
import AlertCard from '../components/alert-center/AlertCard';

// 4. Types and interfaces
import { type Alert } from '../types/alert';

// 5. Utilities and services
import { createLogger } from '../utils/logger';
```

---

## **🎯 Quality Standards**

### **Code Quality Checklist**
- [ ] **TypeScript**: All props and state typed
- [ ] **Consistent styling**: Uses approved Tailwind patterns
- [ ] **Responsive**: Works on mobile/tablet/desktop
- [ ] **Accessibility**: Proper ARIA labels and semantic HTML
- [ ] **Performance**: No unnecessary re-renders
- [ ] **Error handling**: Graceful error states
- [ ] **Loading states**: Skeleton loaders where appropriate

### **UI Consistency Checklist**
- [ ] **Button sizing**: `px-3 py-1.5 text-sm`
- [ ] **Text case**: Uppercase for UI elements
- [ ] **Icons**: Correct size (`w-6 h-6 lg:w-8 lg:h-8`)
- [ ] **Spacing**: Follows design system measurements
- [ ] **Colors**: Uses approved palette
- [ ] **Dividers**: White (`border-white/30`)

---

## **⚡ Performance Guidelines**

### **Component Optimization**
```tsx
// Use React.memo for expensive components
const ExpensiveComponent = React.memo<Props>(({ data }) => {
  // Component implementation
});

// Memoize expensive calculations
const processedData = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Debounce user inputs
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);
```

### **Asset Guidelines**
- **Images**: Use PNG for logos, WebP for photos
- **Icons**: Import only needed Lucide icons
- **Fonts**: System fonts only (no web font loading)
- **Bundle size**: Monitor and optimize imports

---

## **🐛 Debugging Guidelines**

### **Development Tools**
```tsx
// Use consistent logging
import { createLogger } from '../utils/logger';
const logger = createLogger('ComponentName');

// Log important actions
logger.debug('User clicked button:', { buttonId, timestamp });
logger.error('API request failed:', { endpoint, error });
```

### **Error Boundaries**
```tsx
// Wrap major sections in error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <FeatureComponent />
</ErrorBoundary>
```

### **Testing Strategy**
- **Unit tests**: Component behavior and logic
- **Integration tests**: API interactions
- **Visual tests**: Screenshot comparisons for UI consistency
- **Accessibility tests**: WAVE, axe-core integration

---

## **🚀 Deployment Preparation**

### **Pre-deployment Checklist**
```bash
# 1. Run linting
npm run lint

# 2. Type checking
npm run type-check

# 3. Build verification
npm run build

# 4. Test critical paths
npm run test

# 5. Visual regression testing (if available)
npm run test:visual
```

### **Code Review Standards**
- **Design system compliance**: Follows WAR_ROOM_DESIGN_SYSTEM.md
- **Performance impact**: No significant bundle size increase
- **Mobile compatibility**: Tested on actual devices
- **Accessibility**: Screen reader compatible
- **Documentation**: Complex logic documented
- **Error handling**: Graceful failure modes

---

## **📚 Learning Resources**

### **Internal Documentation**
1. `WAR_ROOM_DESIGN_SYSTEM.md` - UI standards and patterns
2. `CLAUDE.md` - AI development guidelines
3. `APP_ARCHITECTURE.md` - System architecture overview
4. `INCIDENT_LOG.md` - Historical issues and solutions

### **External Standards**
- **React**: [React TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app/)
- **Tailwind**: [Official Tailwind Documentation](https://tailwindcss.com/docs)
- **Accessibility**: [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## **🔄 Continuous Improvement**

### **Documentation Updates**
- Update design system when patterns evolve
- Document new patterns in development standards
- Log decisions in DESIGN_DECISIONS_LOG.md
- Keep CLAUDE.md current with project needs

### **Code Evolution**
- Refactor components to match updated standards
- Consolidate duplicate patterns
- Optimize performance based on real usage data
- Enhance accessibility based on user feedback

---

*Remember: Every developer who touches War Room code is responsible for maintaining these standards. The mission-critical nature of political campaigns demands nothing less than excellence.*

**Last Updated**: August 2025  
**Version**: 1.0  
**Status**: Production Standard