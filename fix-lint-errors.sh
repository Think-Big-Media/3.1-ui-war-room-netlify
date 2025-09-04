#!/bin/bash

# Fix Lint Errors Script
# This script helps fix common lint errors in the War Room frontend

echo "🔧 Starting lint error fixes..."

cd src/frontend

# 1. Replace magic numbers with constants
echo "📊 Replacing magic numbers with constants..."

# HTTP Status codes
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s/status === 200/status === HTTP_STATUS.OK/g" \
  -e "s/status: 200/status: HTTP_STATUS.OK/g" \
  -e "s/statusCode === 200/statusCode === HTTP_STATUS.OK/g" \
  -e "s/status === 401/status === HTTP_STATUS.UNAUTHORIZED/g" \
  -e "s/status === 403/status === HTTP_STATUS.FORBIDDEN/g" \
  -e "s/status === 404/status === HTTP_STATUS.NOT_FOUND/g" \
  -e "s/status === 429/status === HTTP_STATUS.TOO_MANY_REQUESTS/g" \
  -e "s/status === 500/status === HTTP_STATUS.INTERNAL_SERVER_ERROR/g" \
  -e "s/status === 503/status === HTTP_STATUS.SERVICE_UNAVAILABLE/g"

# Common timing values
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s/timeout: 3000/timeout: TIMING.RETRY_DELAY_NORMAL/g" \
  -e "s/timeout: 5000/timeout: TIMING.API_TIMEOUT_SHORT/g" \
  -e "s/timeout: 10000/timeout: TIMING.API_TIMEOUT_NORMAL/g" \
  -e "s/timeout: 30000/timeout: TIMING.API_TIMEOUT_LONG/g" \
  -e "s/delay: 1000/delay: TIMING.RETRY_DELAY_SHORT/g" \
  -e "s/delay: 3000/delay: TIMING.RETRY_DELAY_NORMAL/g" \
  -e "s/delay: 5000/delay: TIMING.RETRY_DELAY_LONG/g"

# 2. Add imports for constants where needed
echo "📦 Adding missing imports..."

# Add HTTP_STATUS import to files that use status codes
for file in $(grep -l "HTTP_STATUS\." src/**/*.{ts,tsx} 2>/dev/null | grep -v "httpStatusCodes.ts"); do
  if ! grep -q "import.*HTTP_STATUS" "$file"; then
    # Check if file already has imports from constants
    if grep -q "from '.*constants/" "$file"; then
      # Add to existing constants import
      sed -i '' "/from '.*constants\//s/}/& HTTP_STATUS }/" "$file"
    else
      # Add new import at the top after other imports
      sed -i '' "1,/^import/s/^import/import { HTTP_STATUS } from '..\/constants\/httpStatusCodes';\nimport/" "$file"
    fi
  fi
done

# Add TIMING import to files that use timing constants
for file in $(grep -l "TIMING\." src/**/*.{ts,tsx} 2>/dev/null | grep -v "timing.ts"); do
  if ! grep -q "import.*TIMING" "$file"; then
    if grep -q "from '.*constants/" "$file"; then
      sed -i '' "/from '.*constants\//s/}/& TIMING }/" "$file"
    else
      sed -i '' "1,/^import/s/^import/import { TIMING } from '..\/constants\/timing';\nimport/" "$file"
    fi
  fi
done

# 3. Fix console statements in production code (not test files)
echo "🚫 Fixing console statements..."
find src -name "*.tsx" -o -name "*.ts" | grep -v "__tests__" | grep -v ".test." | xargs sed -i '' \
  -e "s/console\.log(/logger.info(/g" \
  -e "s/console\.error(/logger.error(/g" \
  -e "s/console\.warn(/logger.warn(/g" \
  -e "s/console\.debug(/logger.debug(/g"

# 4. Fix any type issues
echo "🔍 Fixing 'any' type issues..."
# Replace common any patterns with proper types
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e "s/: any\[\]/: unknown[]/g" \
  -e "s/: any)/: unknown)/g" \
  -e "s/<any>/<unknown>/g"

# 5. Run auto-fix
echo "🎯 Running ESLint auto-fix..."
npm run lint:fix

echo "✅ Lint fixes completed!"
echo "📊 Remaining errors:"
npm run lint 2>&1 | tail -5