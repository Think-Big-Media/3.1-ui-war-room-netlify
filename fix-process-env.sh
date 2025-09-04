#!/bin/bash

echo "🔧 Fixing all process.env references to use import.meta.env..."

# Fix process.env.NODE_ENV references
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's/process\.env\.NODE_ENV/import.meta.env.MODE/g' {} +

# Fix process.env.REACT_APP_ references to VITE_ equivalents
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's/process\.env\.REACT_APP_/import.meta.env.VITE_/g' {} +

# Fix process.env.VITE_ references
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's/process\.env\.VITE_/import.meta.env.VITE_/g' {} +

# Fix remaining process.env references
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's/process\.env\./import.meta.env./g' {} +

# Fix typeof process checks
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' "s/typeof process !== 'undefined'/true/g" {} +

# Fix 'development' checks to use 'import.meta.env.DEV'
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' "s/import\.meta\.env\.MODE === 'development'/import.meta.env.DEV/g" {} +

# Fix 'production' checks to use 'import.meta.env.PROD'
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' "s/import\.meta\.env\.MODE === 'production'/import.meta.env.PROD/g" {} +

# Fix 'test' checks
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' "s/import\.meta\.env\.MODE === 'test'/import.meta.env.MODE === 'test'/g" {} +

echo "✅ Fixed all process.env references!"
echo ""
echo "📝 Summary of changes:"
echo "  - process.env.NODE_ENV → import.meta.env.MODE (or .DEV/.PROD)"
echo "  - process.env.REACT_APP_* → import.meta.env.VITE_*"
echo "  - process.env.* → import.meta.env.*"
echo ""
echo "Now rebuilding..."