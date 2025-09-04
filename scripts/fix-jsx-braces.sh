#!/bin/bash

# Fix stray closing braces in JSX files
echo "Fixing stray JSX braces..."

find src -name "*.tsx" -o -name "*.jsx" | while read -r file; do
    echo "Checking: $file"
    
    # Fix pattern: key={something} followed by standalone }
    sed -i '' '/key=.*{.*}$/{
        N
        s/key=\([^}]*\)}[[:space:]]*\n[[:space:]]*}/key=\1}/
    }' "$file"
    
    # Fix pattern: any attribute followed by standalone }
    sed -i '' '/[[:space:]]\+[a-zA-Z][a-zA-Z0-9]*=.*$/{
        N
        s/\([[:space:]]\+[a-zA-Z][a-zA-Z0-9]*=[^}]*\)[[:space:]]*\n[[:space:]]*}[[:space:]]*$/\1/
    }' "$file"
    
done

echo "✅ Stray JSX braces fix complete!"