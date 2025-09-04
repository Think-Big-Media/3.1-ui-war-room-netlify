# General Design & UI Guidelines for AI Assistance (React/Tailwind/shadcn)

These rules guide AI implementation of UI elements to ensure visual consistency, adherence to design specifications, and best practices for modern web development using React, Tailwind CSS, and shadcn/ui.

## Core Principles

### Primacy of Visual Specifications
- Base all UI implementation primarily on the provided target design images, mockups, or detailed visual specification documents (e.g., CopyCoder outputs, Figma links)
- Pay close attention to layout, spacing, typography, color palettes, rounding, and overall visual hierarchy depicted in the specs

### Leverage Component Library
- **Use shadcn/ui First**: Whenever implementing standard UI elements (Buttons, Cards, Forms, Inputs, Dialogs, Menus, Tables, Alerts, etc.), always use the corresponding components from the shadcn/ui library (assuming it's installed in the project)
- Import them from `@/components/ui/...`
- **Custom Components**: Only create custom UI components from scratch if a suitable shadcn/ui component does not exist or cannot be easily adapted for the required functionality or unique visual style

### Styling with Tailwind CSS
- Implement all styling using Tailwind CSS utility classes
- Apply colors, spacing, typography, layout (Flexbox/Grid), rounding, shadows, etc., using Tailwind classes based on the visual specifications
- **No Custom CSS/Styled-Components**: Avoid writing custom CSS files (.css, .scss) or using CSS-in-JS libraries like styled-components unless absolutely necessary for complex animations, highly specific overrides, or if it's an established pattern in the project, and only with explicit instruction

### Iconography
- **Default Icon Library (Lucide React)**: For icons within the application (buttons, status indicators, list items, etc.), use icons from the lucide-react library by default, as it integrates well with shadcn/ui and Tailwind
- Import icons directly: `import { IconName } from 'lucide-react';`
- **Icon Specification & Usage**:
  - When specific icons are required for UI elements based on design specs, use the specified lucide-react icon name
  - If no specific icon is given, choose a lucide-react icon that semantically matches the element's purpose (e.g., Trash2 for delete, Edit for edit, Plus for add, Check for success, X for close/fail, AlertTriangle for warning, Download for download)
  - Apply size (e.g., h-4 w-4, h-5 w-5) and color (e.g., text-red-500, text-green-600) using Tailwind classes as needed to match the design
- **Verification**: Always double-check chosen icon names against the official Lucide library documentation (https://lucide.dev/) if unsure

### Layout & Responsiveness
- **Responsive Design**: Implement layouts that are responsive and adapt gracefully to different screen sizes (mobile, tablet, desktop)
- Use Tailwind's responsive prefixes (sm:, md:, lg:, xl:) extensively to adjust layout, spacing, typography, and visibility across breakpoints
- Utilize Flexbox (flex, items-center, justify-between, etc.) and CSS Grid (grid, grid-cols-*, gap-*, etc.) via Tailwind classes for layout structure
- **Consistency**: Maintain consistency in spacing (padding/margins using p-*, m-*, space-x-*), typography (font sizes/weights using text-*, font-*), border rounding (rounded-*), and color usage across the application, adhering to the project's design system or visual specs

## War Room Specific Design Guidelines

### Desktop-First Professional Interface
- This is a **desktop-first web application**, not mobile-first or chat-centric
- Design inspiration based on CleanMyMac's professional interface and information architecture
- Full-featured SaaS platform with comprehensive menus, dashboard views, and data visualization
- Not simply a chat interface - requires rich UI components and information surfacing

### Key Visual Elements
- Professional dashboard layouts with multiple data views
- Real-time data visualization components
- Alert and notification systems that are prominent but not intrusive
- Rich media display for visual intelligence (images, videos)
- Professional color scheme suitable for political/business context