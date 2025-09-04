#!/bin/bash

# Git cleanup script to remove large files from history

echo "Starting git cleanup process..."

# Remove large files from git history
echo "Removing large files from git history..."
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch "*.zip" "*.tar.gz" "*.rar" \
   -r warroom-backups/ 2>/dev/null || true' \
  --prune-empty --tag-name-filter cat -- --all

# Clean up refs
echo "Cleaning up refs..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Check repository size
echo "Repository size after cleanup:"
du -sh .git

echo "Git cleanup complete!"