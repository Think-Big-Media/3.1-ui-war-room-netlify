#!/bin/bash

# CSS Safety Check Script
# Prevents Tailwind CSS purging issues that caused purple gradient problem

set -e

echo "🛡️  CSS Safety Check - Preventing Tailwind Purging Issues"
echo "=============================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters for issues found
ERRORS=0
WARNINGS=0

echo -e "${BLUE}Checking for dangerous CSS patterns...${NC}\n"

# Check 1: Look for custom background gradient classes
echo "🔍 Checking for custom gradient classes..."
CUSTOM_GRADIENTS=$(grep -r "\.bg-.*gradient" src/ --include="*.css" --include="*.scss" 2>/dev/null || true)
if [ ! -z "$CUSTOM_GRADIENTS" ]; then
    echo -e "${RED}❌ DANGER: Custom gradient classes found (will be purged by Tailwind):${NC}"
    echo "$CUSTOM_GRADIENTS"
    echo -e "${YELLOW}💡 Fix: Replace with native Tailwind: bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800${NC}\n"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ No custom gradient classes found${NC}\n"
fi

# Check 2: Look for any custom .bg- classes
echo "🔍 Checking for custom background classes..."
CUSTOM_BG_CLASSES=$(grep -r "\.bg-[a-zA-Z]" src/ --include="*.css" --include="*.scss" | grep -v "bg-gradient-to\|bg-black\|bg-white\|bg-slate\|bg-gray\|bg-red\|bg-blue\|bg-green\|bg-yellow\|bg-purple\|bg-pink\|bg-indigo" 2>/dev/null || true)
if [ ! -z "$CUSTOM_BG_CLASSES" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Custom background classes found:${NC}"
    echo "$CUSTOM_BG_CLASSES"
    echo -e "${YELLOW}💡 Check if these are safe Tailwind classes or custom classes that could be purged${NC}\n"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ No suspicious background classes found${NC}\n"
fi

# Check 3: Look for .bg-slate-gradient specifically (the exact class that caused issues)
echo "🔍 Checking for the exact problematic class (.bg-slate-gradient)..."
SLATE_GRADIENT=$(grep -r "bg-slate-gradient" src/ --include="*.css" --include="*.scss" --include="*.tsx" --include="*.ts" 2>/dev/null || true)
if [ ! -z "$SLATE_GRADIENT" ]; then
    echo -e "${RED}❌ CRITICAL: Found .bg-slate-gradient class (this exact class caused the purple gradient issue):${NC}"
    echo "$SLATE_GRADIENT"
    echo -e "${RED}🚨 Must fix before deployment!${NC}\n"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ No .bg-slate-gradient classes found${NC}\n"
fi

# Check 4: Verify usage of safe gradient patterns
echo "🔍 Checking for safe Tailwind gradient usage..."
SAFE_GRADIENTS=$(grep -r "from-slate.*via-slate.*to-slate" src/ --include="*.tsx" --include="*.ts" 2>/dev/null || true)
if [ ! -z "$SAFE_GRADIENTS" ]; then
    echo -e "${GREEN}✅ Found safe Tailwind gradient patterns:${NC}"
    echo "$SAFE_GRADIENTS" | head -5  # Show first 5 examples
    if [ $(echo "$SAFE_GRADIENTS" | wc -l) -gt 5 ]; then
        echo -e "${BLUE}... and $(echo "$SAFE_GRADIENTS" | wc -l) total safe patterns${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  No safe gradient patterns found. Are you using gradients at all?${NC}\n"
fi

# Check 5: Look for runtime.txt file (causes Python-only builds)
echo "🔍 Checking for problematic runtime.txt file..."
if [ -f "runtime.txt" ]; then
    echo -e "${RED}❌ CRITICAL: runtime.txt file found!${NC}"
    echo -e "${RED}This forces Python-only builds and breaks frontend deployment${NC}"
    echo -e "${RED}Content: $(cat runtime.txt)${NC}"
    echo -e "${YELLOW}💡 Fix: Delete runtime.txt file immediately${NC}\n"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ No runtime.txt file found${NC}\n"
fi

# Check 6: Verify package.json exists (needed for Node.js detection)
echo "🔍 Checking for package.json..."
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json found (enables Node.js auto-detection)${NC}\n"
else
    echo -e "${RED}❌ CRITICAL: No package.json found${NC}"
    echo -e "${RED}Render won't detect this as a Node.js project${NC}\n"
    ((ERRORS++))
fi

# Check 7: Look for conflicting CSS definitions
echo "🔍 Checking for CSS conflicts..."
PURPLE_DEFINITIONS=$(grep -r "purple" src/ --include="*.css" --include="*.scss" | grep -v "text-purple\|border-purple" 2>/dev/null || true)
if [ ! -z "$PURPLE_DEFINITIONS" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Purple color definitions found:${NC}"
    echo "$PURPLE_DEFINITIONS"
    echo -e "${YELLOW}💡 Verify these aren't conflicting with slate theme${NC}\n"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ No conflicting purple definitions found${NC}\n"
fi

# Summary
echo "=============================================================="
echo -e "${BLUE}CSS Safety Check Summary${NC}"
echo "=============================================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! CSS is safe for deployment.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ] && [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found. Review recommended but deployment can proceed.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS critical error(s) found. Deployment BLOCKED until fixed.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Also $WARNINGS warning(s) to review.${NC}"
    fi
    echo ""
    echo -e "${BLUE}Quick fixes:${NC}"
    echo "1. Replace custom .bg-slate-gradient with: bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800"
    echo "2. Delete runtime.txt file if present"
    echo "3. Use only native Tailwind CSS classes"
    echo ""
    echo "📚 See CSS_SAFETY_RULES.md for detailed guidance"
    exit 1
fi