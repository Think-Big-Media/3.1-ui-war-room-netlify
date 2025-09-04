#!/bin/bash

# Fix all backend imports in the backend directory
cd /Users/rodericandrews/WarRoom_Development/1.0-war-room/src/backend

echo "Fixing imports in backend files..."

# Find all Python files and replace backend. imports
find . -name "*.py" -type f -exec sed -i '' 's/from backend\./from /g' {} \;
find . -name "*.py" -type f -exec sed -i '' 's/import backend\./import /g' {} \;

echo "Import fixes complete!"

# Show files that were modified
echo ""
echo "Modified files:"
git diff --name-only