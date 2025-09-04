#!/bin/bash

# Final comprehensive cleanup of all stray JSX braces
echo "Final JSX cleanup - removing all problematic standalone braces..."

find src -name "*.tsx" -o -name "*.jsx" | while read -r file; do
    # Remove lines that are standalone braces following JSX tag openings
    awk '
    BEGIN { prev_line = ""; fixed = 0 }
    {
        current_line = $0
        # If current line is just whitespace + }
        if (current_line ~ /^[[:space:]]*}[[:space:]]*$/) {
            # And previous line is JSX tag opening, attribute, or key=
            if (prev_line ~ /^[[:space:]]*<[A-Za-z]/ || prev_line ~ /[A-Za-z]=[^>]*$/ || prev_line ~ /key=/) {
                # Skip this stray brace
                fixed++
                next
            }
        }
        
        if (NR > 1) print prev_line
        prev_line = current_line
    }
    END {
        if (prev_line != "") print prev_line
        if (fixed > 0) print "Fixed " fixed " stray braces in " FILENAME > "/dev/stderr"
    }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done

echo "✅ Final JSX cleanup complete!"