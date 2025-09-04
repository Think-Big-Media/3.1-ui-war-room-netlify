#!/bin/bash

# Find and fix ALL stray closing braces in JSX files
echo "Finding and fixing ALL stray JSX braces..."

# Find all lines that are just whitespace + }
find src -name "*.tsx" -o -name "*.jsx" | while read -r file; do
    echo "Checking: $file"
    
    # Look for lines that are ONLY whitespace and a closing brace
    if grep -q "^[[:space:]]*}[[:space:]]*$" "$file"; then
        # Use awk to find and remove lines that are standalone braces following JSX tags
        awk '
        BEGIN { prev_line = "" }
        {
            # Check if current line is just whitespace + }
            if (/^[[:space:]]*}[[:space:]]*$/) {
                # Check if previous line looks like JSX attribute or tag opening
                if (prev_line ~ /^[[:space:]]*<[a-zA-Z]/ || prev_line ~ /[a-zA-Z]=/ || prev_line ~ /^[[:space:]]*key=/) {
                    # Skip this stray brace
                    prev_line = $0
                    next
                }
            }
            # Print the previous line if we stored one
            if (NR > 1) print prev_line
            prev_line = $0
        }
        END {
            if (prev_line != "") print prev_line
        }
        ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi
done

echo "✅ All stray JSX braces fix complete!"