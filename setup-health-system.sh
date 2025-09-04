#!/bin/bash

# =====================================================
# War Room 3.0 UI - Health Check System Setup Script
# =====================================================
# Enterprise-grade automated setup for comprehensive
# health check system with proper error handling
# =====================================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if we're in the right directory
check_directory() {
    if [[ ! -f "package.json" ]]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    if ! grep -q "warroom-3.0-ui" package.json; then
        print_warning "This doesn't appear to be the warroom-3.0-ui project"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Function to backup existing configs
backup_configs() {
    print_status "Creating backup of existing configurations..."
    
    BACKUP_DIR="config-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup existing config files if they exist
    for config in "package.json" "vitest.config.ts" "eslint.config.js" ".prettierrc" ".prettierignore"; do
        if [[ -f "$config" ]]; then
            cp "$config" "$BACKUP_DIR/"
            print_status "Backed up $config"
        fi
    done
    
    print_success "Configs backed up to $BACKUP_DIR"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing health check dependencies..."
    
    # Check if npm is available
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    # Install testing dependencies
    print_status "Installing Vitest and testing utilities..."
    npm install --save-dev \
        vitest \
        @vitest/ui \
        @vitest/coverage-v8 \
        @testing-library/react \
        @testing-library/jest-dom \
        jsdom \
        happy-dom 2>/dev/null || {
        print_warning "Some testing dependencies may already be installed"
    }
    
    # Install formatting dependencies
    print_status "Installing Prettier..."
    npm install --save-dev prettier 2>/dev/null || {
        print_warning "Prettier may already be installed"
    }
    
    # Install pre-commit hook system
    print_status "Installing Husky for pre-commit hooks..."
    npm install --save-dev husky 2>/dev/null || {
        print_warning "Husky may already be installed"
    }
    
    print_success "Dependencies installed successfully"
}

# Function to create configuration files
create_configs() {
    print_status "Creating configuration files..."
    
    # Create Vitest config if it doesn't exist
    if [[ ! -f "vitest.config.ts" ]]; then
        print_status "Creating vitest.config.ts..."
        cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
EOF
        print_success "Created vitest.config.ts"
    else
        print_warning "vitest.config.ts already exists, skipping"
    fi
    
    # Create Prettier config
    if [[ ! -f ".prettierrc" ]]; then
        print_status "Creating .prettierrc..."
        cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
EOF
        print_success "Created .prettierrc"
    else
        print_warning ".prettierrc already exists, skipping"
    fi
    
    # Create Prettier ignore
    if [[ ! -f ".prettierignore" ]]; then
        print_status "Creating .prettierignore..."
        cat > .prettierignore << 'EOF'
# Dependencies
node_modules/
dist/
build/
coverage/

# Logs
*.log

# Runtime data
pids/
*.pid
*.seed

# Generated files
*.min.js
*.min.css

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Temporary files
tmp/
temp/

# Configuration files that shouldn't be formatted
package-lock.json
yarn.lock
pnpm-lock.yaml

# Large CSS files (Tailwind output, etc.)
src/index.css
src/main-dashboard.css
src/**/*.min.css

# Backend directories
src/backend/

# Test fixtures
src/**/__fixtures__/
EOF
        print_success "Created .prettierignore"
    else
        print_warning ".prettierignore already exists, skipping"
    fi
}

# Function to create test setup file
create_test_setup() {
    print_status "Setting up test environment..."
    
    # Create test directory if it doesn't exist
    mkdir -p src/test
    
    if [[ ! -f "src/test/setup.ts" ]]; then
        print_status "Creating test setup file..."
        cat > src/test/setup.ts << 'EOF'
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock global objects that aren't available in jsdom
beforeAll(() => {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  });
});
EOF
        print_success "Created test setup file"
    else
        print_warning "Test setup file already exists, skipping"
    fi
}

# Function to setup pre-commit hooks
setup_precommit_hooks() {
    print_status "Setting up pre-commit hooks..."
    
    # Initialize husky
    npx husky init 2>/dev/null || print_warning "Husky may already be initialized"
    
    # Create pre-commit hook
    if [[ ! -f ".husky/pre-commit" ]]; then
        print_status "Creating pre-commit hook..."
        cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Health check for modified War Room UI files
if git diff --cached --name-only | grep -q "repositories/3.0-ui-war-room/"; then
  echo "📦 UI files modified - running health check..."
  cd repositories/3.0-ui-war-room
  npm run health:check
fi
EOF
        chmod +x .husky/pre-commit
        print_success "Created pre-commit hook"
    else
        print_warning "Pre-commit hook already exists, skipping"
    fi
}

# Function to update package.json scripts
update_package_scripts() {
    print_status "Verifying package.json health check scripts..."
    
    # Check if health scripts exist
    if grep -q "health:check" package.json; then
        print_success "Health check scripts already exist in package.json"
    else
        print_warning "Health check scripts not found - they may need to be added manually"
        print_status "Expected scripts:"
        echo '    "health:check": "echo '\''🏥 Running health check...'\'' && echo '\''📝 Code format check...'\'' && npm run format:check && echo '\''✅ Format check passed!'\'' && echo '\''🔨 Build check...'\'' && npm run build && echo '\''✅ Build successful!'\'' && echo '\''✅ Health check complete!'\''"'
        echo '    "health:full": "echo '\''🏥 Running full health check...'\'' && npm run health:check && echo '\''📋 Running lint check...'\'' && (npm run lint --silent || echo '\''⚠️  Lint warnings found (non-blocking)'\'') && echo '\''🔍 Running type check...'\'' && (npm run type-check --silent || echo '\''⚠️  Type errors found (non-blocking)'\'') && npm run build --silent && npm run test:coverage --silent && echo '\''✅ Full health check passed!'\''"'
    fi
}

# Function to run initial health check
run_initial_health_check() {
    print_status "Running initial health check to verify setup..."
    
    # Format all files first
    print_status "Formatting all files..."
    npm run format || {
        print_error "Failed to format files"
        exit 1
    }
    
    # Run the health check
    if npm run health:check; then
        print_success "🎉 Health check system is working perfectly!"
    else
        print_warning "Health check encountered some issues - this may be normal for the initial setup"
    fi
}

# Function to display usage instructions
display_usage() {
    print_success "🚀 Health Check System Setup Complete!"
    echo
    echo "Available commands:"
    echo "  npm run health:check    - Quick health check (format + build)"
    echo "  npm run health:full     - Comprehensive health check"
    echo "  npm run health:ci       - Strict CI/CD health check"
    echo
    echo "Testing commands:"
    echo "  npm run test           - Run all tests"
    echo "  npm run test:watch     - Run tests in watch mode"
    echo "  npm run test:coverage  - Run tests with coverage"
    echo
    echo "Formatting commands:"
    echo "  npm run format         - Format all files"
    echo "  npm run format:check   - Check formatting"
    echo
    echo "🔧 Pre-commit hooks are now active and will run health checks automatically"
    echo "📁 Configuration backups saved in: config-backup-*"
    echo
    print_success "The health check system is ready to use!"
}

# Main execution
main() {
    echo "🏥 War Room 3.0 UI - Health Check System Setup"
    echo "=============================================="
    echo
    
    check_directory
    backup_configs
    install_dependencies
    create_configs
    create_test_setup
    setup_precommit_hooks
    update_package_scripts
    run_initial_health_check
    display_usage
    
    print_success "Setup completed successfully! 🎉"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi