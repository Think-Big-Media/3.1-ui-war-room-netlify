# UX/UI Enhancement Rules - 7-Step Process
**Referenced by**: CLAUDE.md  
**Source**: Universal Claude System

## 🎯 UI Enhancement Workflow
**Goal**: Any time you deal with UX/UI, you MUST complete the following steps:

## 📋 The 7-Step Process

### **Step 1: Reference Style Guide**
- Reference the app style guide and grade your adherence to it
- Check existing design patterns and component libraries
- Ensure consistency with established visual language

### **Step 2: Consider All States**
- Consider the various states a screen could exist in
- Create designs for:
  - **Loading states** (skeleton loaders, spinners)
  - **Error states** (user-friendly error messages)
  - **Empty states** (no data, first-time user experience)
  - **Success states** (confirmation, completion)
  - **Interactive states** (hover, focus, active, disabled)

### **Step 3: UX Best Practices**
- Reference and conform to UX best practices
- Ensure accessibility standards (WCAG guidelines)
- Mobile-first responsive design
- Intuitive navigation and user flows
- Clear information hierarchy

### **Step 4: Lint Components**
- Lint newly built components
- Run TypeScript checks
- Ensure code quality standards
- Validate component props and interfaces

### **Step 5: Test with Playwright**
- Use the Playwright MCP Server to test outputs
- Ensure components render correctly
- Test interactive functionality
- Validate responsive behavior across screen sizes
- Check accessibility features

### **Step 6: Grade Against Standards**
- Grade the new output against the UX considerations and style guide
- **Minimum passing score**: 7 out of 10
- **If score < 7**: Re-develop plan, implement improvements, test again with Playwright
- **Continue until**: Score is above 7

### **Step 7: Commit Changes**
- Commit the final changes only after passing all quality gates
- Include descriptive commit message explaining UX improvements
- Document any new patterns or components created

## 🎨 Design Principles

### **Visual Hierarchy**
- Clear information hierarchy with proper typography scaling
- Strategic use of whitespace and visual separation
- Consistent color usage for different UI states and actions

### **Accessibility First**
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast ratios
- Alternative text for images
- Focus management and visible focus indicators

### **Responsive Design**
- Mobile-first approach
- Flexible layouts that work across device sizes
- Touch-friendly interactive elements (minimum 44px tap targets)
- Performance considerations for different connection speeds

### **User Experience Standards**
- Intuitive user flows with clear next steps
- Consistent interaction patterns throughout the app
- Helpful feedback for user actions
- Error prevention and graceful error recovery
- Progressive disclosure for complex interfaces

## ⚡ Performance Considerations

### **Loading & Performance**
- Optimize image loading and sizing
- Implement proper lazy loading for non-critical content
- Minimize layout shifts during content loading
- Use skeleton loaders for better perceived performance

### **Interaction Feedback**
- Immediate visual feedback for user interactions
- Loading states for operations that take time
- Clear progress indicators for multi-step processes
- Animations that enhance (don't distract from) the user experience

## 🔧 Component Standards

### **Reusability**
- Create components that can be reused across the application
- Use props effectively to make components flexible
- Abstract common patterns into shared components
- Document component usage and available props

### **Maintainability**
- Keep component files focused and under 300 lines
- Use clear, descriptive names for components and props
- Separate business logic from presentation logic
- Follow established naming conventions

---

**Remember**: Great UX/UI is invisible to users - it just works intuitively. Always test with real users when possible and iterate based on feedback.