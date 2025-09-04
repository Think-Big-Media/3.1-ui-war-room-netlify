# General Design & UI Guidelines for AI Assistance (React/Tailwind/shadcn)

These rules guide AI implementation of UI elements to ensure visual consistency, adherence to design specifications, and best practices for modern web development using React, Tailwind CSS, and shadcn/ui.

## Core Principles

### 1. Primacy of Visual Specifications

- Base all UI implementation primarily on the provided target design images, mockups, or detailed visual specification documents (e.g., CopyCoder outputs, Figma links).
- Pay close attention to layout, spacing, typography, color palettes, rounding, and overall visual hierarchy depicted in the specs.

### 2. Leverage Component Library

#### Use shadcn/ui First
- Whenever implementing standard UI elements (Buttons, Cards, Forms, Inputs, Dialogs, Menus, Tables, Alerts, etc.), always use the corresponding components from the shadcn/ui library (assuming it's installed in the project).
- Import them from `@/components/ui/...`

#### Custom Components
- Only create custom UI components from scratch if a suitable shadcn/ui component does not exist or cannot be easily adapted for the required functionality or unique visual style.

### 3. Styling with Tailwind CSS

- Implement all styling using Tailwind CSS utility classes.
- Apply colors, spacing, typography, layout (Flexbox/Grid), rounding, shadows, etc., using Tailwind classes based on the visual specifications.

#### No Custom CSS/Styled-Components
- Avoid writing custom CSS files (.css, .scss) or using CSS-in-JS libraries like styled-components unless absolutely necessary for complex animations, highly specific overrides, or if it's an established pattern in the project, and only with explicit instruction.

## Iconography

### Default Icon Library (Lucide React)

#### For icons within the application (buttons, status indicators, list items, etc.), use icons from the lucide-react library by default, as it integrates well with shadcn/ui and Tailwind.

Import icons directly:
```tsx
import { IconName } from 'lucide-react';
```

### Icon Specification & Usage

- When specific icons are required for UI elements based on design specs, use the specified lucide-react icon name.
- If no specific icon is given, choose a lucide-react icon that semantically matches the element's purpose:
  - `Trash2` for delete
  - `Edit` for edit
  - `Plus` for add
  - `Check` for success
  - `X` for close/fail
  - `AlertTriangle` for warning
  - `Download` for download

- Apply size (e.g., `h-4 w-4`, `h-5 w-5`) and color (e.g., `text-red-500`, `text-green-600`) using Tailwind classes as needed to match the design.

#### Verification
- Always double-check chosen icon names against the official Lucide library documentation (https://lucide.dev/) if unsure.

## Layout & Responsiveness

### Responsive Design

- Implement layouts that are responsive and adapt gracefully to different screen sizes (mobile, tablet, desktop).
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) extensively to adjust layout, spacing, typography, and visibility across breakpoints.
- Utilize Flexbox (`flex`, `items-center`, `justify-between`, etc.) and CSS Grid (`grid`, `grid-cols-*`, `gap-*`, etc.) via Tailwind classes for layout structure.

### Consistency

- Maintain consistency in spacing (padding/margins using `p-*`, `m-*`, `space-x-*`), typography (font sizes/weights using `text-*`, `font-*`), border rounding (`rounded-*`), and color usage across the application, adhering to the project's design system or visual specs.

## Implementation Examples

### Button Component Example
```tsx
// Using shadcn/ui button with Tailwind styling
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

<Button 
  variant="default" 
  size="sm" 
  className="bg-blue-600 hover:bg-blue-700"
>
  <Plus className="h-4 w-4 mr-2" />
  Add Item
</Button>
```

### Card Layout Example
```tsx
// Using shadcn/ui card with responsive design
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card className="w-full max-w-md mx-auto">
  <CardHeader>
    <CardTitle className="text-lg font-semibold">Dashboard</CardTitle>
  </CardHeader>
  <CardContent className="grid gap-4">
    {/* Content here */}
  </CardContent>
</Card>
```

### Responsive Grid Example
```tsx
// Responsive grid layout using Tailwind
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
  {items.map((item) => (
    <div key={item.id} className="bg-white rounded-lg shadow p-4">
      {/* Item content */}
    </div>
  ))}
</div>
```

## Best Practices

1. **Component Reusability**: Create reusable components for repeated UI patterns
2. **Accessibility**: Ensure all interactive elements are keyboard accessible and have proper ARIA labels
3. **Performance**: Use React.memo for expensive components and lazy loading for routes
4. **Type Safety**: Always use TypeScript interfaces for component props
5. **Testing**: Write tests for interactive components using React Testing Library
6. **Documentation**: Document complex components with JSDoc comments

## Design System Integration

When working with an established design system:
1. Follow the defined color palette (e.g., `primary`, `secondary`, `accent`)
2. Use consistent spacing scales (e.g., `4px` increments)
3. Maintain typography hierarchy (e.g., `h1` through `h6` sizes)
4. Apply consistent border radius values
5. Use defined shadow depths for elevation

These guidelines ensure that AI-generated UI code maintains visual consistency, follows best practices, and leverages the power of modern React tooling with shadcn/ui and Tailwind CSS.