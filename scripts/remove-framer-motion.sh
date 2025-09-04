#!/bin/bash

# Script to remove all Framer Motion imports and replace with CSS animations

echo "Removing Framer Motion from all files..."

# Find all TypeScript/React files with framer-motion imports
FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "from 'framer-motion'" 2>/dev/null)

for file in $FILES; do
    echo "Processing: $file"
    
    # Remove framer-motion import lines
    sed -i '' "/import.*from 'framer-motion'/d" "$file"
    
    # Replace motion.div with div
    sed -i '' 's/<motion\.div/<div/g' "$file"
    sed -i '' 's/<\/motion\.div>/<\/div>/g' "$file"
    
    # Replace motion.button with button
    sed -i '' 's/<motion\.button/<button/g' "$file"
    sed -i '' 's/<\/motion\.button>/<\/button>/g' "$file"
    
    # Replace motion.span with span
    sed -i '' 's/<motion\.span/<span/g' "$file"
    sed -i '' 's/<\/motion\.span>/<\/span>/g' "$file"
    
    # Replace motion.section with section
    sed -i '' 's/<motion\.section/<section/g' "$file"
    sed -i '' 's/<\/motion\.section>/<\/section>/g' "$file"
    
    # Remove motion props (initial, animate, exit, transition, whileHover, whileTap, variants)
    sed -i '' 's/initial={[^}]*}//g' "$file"
    sed -i '' 's/animate={[^}]*}//g' "$file"
    sed -i '' 's/exit={[^}]*}//g' "$file"
    sed -i '' 's/transition={[^}]*}//g' "$file"
    sed -i '' 's/whileHover={[^}]*}//g' "$file"
    sed -i '' 's/whileTap={[^}]*}//g' "$file"
    sed -i '' 's/variants={[^}]*}//g' "$file"
    
    # Remove AnimatePresence tags
    sed -i '' 's/<AnimatePresence[^>]*>//g' "$file"
    sed -i '' 's/<\/AnimatePresence>//g' "$file"
    
    # Clean up extra spaces
    sed -i '' 's/  */ /g' "$file"
done

echo "✅ Framer Motion removal complete!"