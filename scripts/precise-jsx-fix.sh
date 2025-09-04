#!/bin/bash

# Precisely target and fix known JSX syntax errors
echo "Fixing specific JSX syntax errors..."

# Function to fix a specific file and line pattern
fix_stray_brace_after_key() {
    local file="$1"
    if [[ -f "$file" ]]; then
        # Remove lines that are just whitespace followed by }
        # BUT only if they come after a line containing key= 
        sed -i '' '/key=/{
            N
            s/\(key=[^}]*\)\n[[:space:]]*}[[:space:]]*$/\1/
        }' "$file"
        echo "Fixed stray braces in $file"
    fi
}

# Fix specific files we know have issues
fix_stray_brace_after_key "src/pages/InformationCenter.tsx"
fix_stray_brace_after_key "src/components/ErrorBoundary.tsx"  
fix_stray_brace_after_key "src/components/monitoring/TrendingTopics.tsx"
fix_stray_brace_after_key "src/components/monitoring/MonitoringAlert.tsx"
fix_stray_brace_after_key "src/components/campaign-control/AssetGrid.tsx"
fix_stray_brace_after_key "src/components/campaign-control/KanbanBoard.tsx"

# Add missing closing brace to ErrorBoundary if needed
if ! grep -q "^}$" "src/components/ErrorBoundary.tsx" | tail -1; then
    echo "}" >> "src/components/ErrorBoundary.tsx"
fi

echo "✅ Precise JSX fixes complete!"