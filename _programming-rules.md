# Programming Rules - Code Quality Standards
**Referenced by**: CLAUDE.md  
**Source**: Universal Claude System

## 🎯 Core Principles

### **Clarity and Simplicity**
- Prefer simple, clear, and idiomatic solutions using the project's established tech stack
- Write readable code. Add comments primarily for complex logic, non-obvious decisions, or // TODO markers
- **Text Width**: Limit all text content containers to 60% maximum width with left alignment to ensure optimal readability

### **Iterate Before Replacing**
- When modifying existing code, attempt to iterate on current patterns first
- Only introduce significantly new patterns, libraries, or architectural changes if the existing approach is clearly insufficient and after explicit confirmation
- If a pattern is replaced, ensure the old implementation is cleanly removed

### **Focus and Precision**
- Only make changes directly related to the requested task
- Do not refactor or modify unrelated code without specific instruction
- Be precise about file paths, function names, and variable names when making changes

## 🏗️ Development Workflow & Code Quality

### **Modularity and Componentization**
- Break down features into small, reusable, and well-defined components or functions
- Place new files in logical directories according to project structure conventions (e.g., components/, lib/, utils/, features/)
- Define clear interfaces/types for function arguments, component props, and return values (especially in TypeScript projects)
- **Keep files concise**: Aim for under ~300 lines for components/modules. Refactor larger files into smaller, focused units

### **Code Duplication (DRY - Don't Repeat Yourself)**
- **CRITICAL**: Actively avoid duplicating code
- Before writing new logic, check if similar functionality exists elsewhere that can be reused or abstracted into a shared function or component
- **Search existing codebase** before implementing new patterns

### **Error Handling**
- Implement appropriate error handling for potential runtime issues:
  - try/catch for async operations
  - checking API responses
  - handling invalid inputs
  - using error boundaries in UI frameworks

## 🌐 API & Data Interaction

### **API Interaction**
- Use defined API client functions or data-fetching hooks where available
- Handle API loading and error states gracefully in the UI (e.g., showing loading indicators, user-friendly error messages)

### **Data Handling**
- **No Mock Data**: Do not add mock data, stubs, or fake data patterns directly into code used in development or production builds. Use actual data sources (APIs, props, state). Mock data should typically only be used within test files or Storybook-like environments
- **Null/Undefined Checks**: Always perform necessary checks for potentially null or undefined data (especially data fetched asynchronously or optional inputs) before attempting to access its properties or use it in logic

## 🏪 State Management

### **UI Projects State Management**
- Use standard framework mechanisms for local component state (e.g., React useState)
- For shared state, prefer established patterns like React Context API, or common state management libraries (e.g., Zustand, Redux, Pinia) if already integrated into the project

## ⚙️ Environment & Configuration

### **Environment Variables**
- **NEVER hardcode sensitive keys** or environment-specific configurations
- Use environment variables (process.env or framework-specific methods) accessed via configuration files or services
- **DO NOT modify .env files** without explicit instruction

### **Configuration Files**
- Do not modify core configuration files (e.g., next.config.js, vite.config.js, tailwind.config.js, tsconfig.json, package.json) unless specifically instructed as part of the task

## 🔒 Critical System Rules

### **Single Instance Check**
- Implement a single-instance check at application startup by creating a local server on a designated port
- If the port is already in use, exit the process with a clear message indicating that another instance is already running
- Add this check to all server initialization files to prevent multiple development servers from running simultaneously

## 🧪 Testing Guidelines

### **Test Generation**
- When requested, generate test file structures using common frameworks like Jest, Vitest, Cypress, Playwright, and libraries like React Testing Library
- Focus on setting up the test structure, mocking imports/dependencies, and writing basic test cases for the core functionality being implemented
- Do not write overly complex or exhaustive test suites unless specifically asked

---

**Remember**: Quality code is readable, maintainable, and follows established patterns. Always check existing implementations before creating new ones.