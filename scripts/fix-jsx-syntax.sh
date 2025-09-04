#!/bin/bash

echo "Fixing broken JSX syntax patterns..."

# Find all files with potential broken JSX
FILES=$(find src -name "*.tsx" -o -name "*.jsx" 2>/dev/null)

for file in $FILES; do
    # Check if file has broken patterns
    if grep -q "^\s*}\s*$" "$file" 2>/dev/null; then
        echo "Checking: $file"
        
        # Create a temporary file
        tmp_file="${file}.tmp"
        
        # Process the file line by line
        awk '
        BEGIN { in_jsx_prop = 0 }
        {
            # Detect if we are in a JSX prop area
            if ($0 ~ /<[A-Z][a-zA-Z]*/ || $0 ~ /<motion\./) {
                in_jsx_prop = 1
            }
            
            # If we see a closing >, we are out of JSX props
            if ($0 ~ />/) {
                in_jsx_prop = 0
            }
            
            # Skip lines that are just } when in JSX prop area
            if (in_jsx_prop && $0 ~ /^\s*}\s*$/) {
                next
            }
            
            print $0
        }
        ' "$file" > "$tmp_file"
        
        # Replace original file if changes were made
        if ! cmp -s "$file" "$tmp_file"; then
            mv "$tmp_file" "$file"
            echo "  ✓ Fixed: $file"
        else
            rm "$tmp_file"
        fi
    fi
done

echo "✅ JSX syntax fix complete!"