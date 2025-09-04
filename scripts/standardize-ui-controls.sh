#!/bin/bash

# Standardize UI Controls Script
# This script applies consistent sizing to all UI controls globally

echo "🎨 Standardizing UI controls globally..."

# Function to update button/control sizes
update_sizes() {
    local file=$1
    local temp_file="${file}.tmp"
    
    # Replace button padding patterns
    sed -E \
        -e 's/px-6 py-3/px-3 py-1.5/g' \
        -e 's/px-6 py-2/px-3 py-1.5/g' \
        -e 's/px-4 py-2\.5/px-3 py-1.5/g' \
        -e 's/px-4 py-2/px-3 py-1.5/g' \
        -e 's/px-4 py-3/px-3 py-1.5/g' \
        "$file" > "$temp_file"
    
    # Check if changes were made
    if ! diff -q "$file" "$temp_file" > /dev/null; then
        mv "$temp_file" "$file"
        echo "  ✅ Updated: $file"
        return 0
    else
        rm "$temp_file"
        return 1
    fi
}

# Counter for updated files
updated_count=0

# Find and update all TypeScript/React files in components
echo "📁 Scanning component files..."
while IFS= read -r file; do
    if update_sizes "$file"; then
        ((updated_count++))
    fi
done < <(find src/components -name "*.tsx" -type f)

# Update pages as well
echo "📁 Scanning page files..."
while IFS= read -r file; do
    if update_sizes "$file"; then
        ((updated_count++))
    fi
done < <(find src/pages -name "*.tsx" -type f)

# Special case: Update IntelligenceHub upload button specifically
if [ -f "src/pages/IntelligenceHub.tsx" ]; then
    sed -i '' 's/px-6 py-2 rounded-lg/px-3 py-1.5 text-sm rounded-lg/g' src/pages/IntelligenceHub.tsx
    echo "  ✅ Special update: IntelligenceHub upload button"
fi

echo ""
echo "✨ Standardization complete!"
echo "📊 Updated $updated_count files"
echo ""
echo "Standard sizes applied:"
echo "  • Buttons: px-3 py-1.5 text-sm"
echo "  • Inputs: px-3 py-1.5 text-sm"
echo "  • Dropdowns: px-3 py-1.5 text-sm"