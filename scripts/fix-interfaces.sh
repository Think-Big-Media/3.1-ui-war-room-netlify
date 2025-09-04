#!/bin/bash

echo "Fixing all interface closing braces..."

# Find all TypeScript files
FILES=$(find src -name "*.tsx" -o -name "*.ts")

for file in $FILES; do
    # Create temporary file
    tmp_file="${file}.tmp"
    
    # Process file to add missing closing braces for interfaces
    awk '
    BEGIN { 
        in_interface = 0
        interface_name = ""
    }
    {
        # Check if we are starting an interface
        if ($0 ~ /^interface [A-Z]/ || $0 ~ /^  interface [A-Z]/ || $0 ~ /^    interface [A-Z]/) {
            # We found a new interface before closing the previous one
            if (in_interface == 1) {
                print "}"
                print ""
            }
            in_interface = 1
            print $0
            next
        }
        
        # Check if we are starting a const, function, or export after interface
        if (in_interface == 1 && ($0 ~ /^const / || $0 ~ /^export / || $0 ~ /^function / || $0 ~ /^class / || $0 ~ /^enum /)) {
            print "}"
            print ""
            in_interface = 0
        }
        
        print $0
    }
    END {
        if (in_interface == 1) {
            print "}"
        }
    }
    ' "$file" > "$tmp_file"
    
    # Check if changes were made
    if ! cmp -s "$file" "$tmp_file"; then
        mv "$tmp_file" "$file"
        echo "  ✓ Fixed: $file"
    else
        rm "$tmp_file"
    fi
done

echo "✅ Interface fixes complete!"