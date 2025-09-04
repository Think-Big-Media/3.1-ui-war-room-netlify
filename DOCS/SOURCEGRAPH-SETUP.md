# Sourcegraph Setup for War Room

## What is Sourcegraph?
Sourcegraph adds code intelligence to GitHub - hover over code to see definitions, find all references, and search across your entire codebase.

## Quick Setup (2 minutes)

### 1. Install Browser Extension
**This is what makes it work "in the background" on GitHub!**

- **Chrome**: https://chrome.google.com/webstore/detail/sourcegraph/dgjhfomjieaadpoljlnidmbgkdffpack
- **Firefox**: https://addons.mozilla.org/en-US/firefox/addon/sourcegraph/
- **Safari**: https://apps.apple.com/app/sourcegraph/id1543262193

### 2. That's it!
Once installed, Sourcegraph automatically adds:
- **Hover tooltips** - Hover over any function/variable on GitHub to see its definition
- **Go to definition** - Click to jump to where something is defined
- **Find references** - See all places where something is used
- **Smart search** - Better code search on GitHub

## How It Works (Background Magic)

When you browse code on GitHub, Sourcegraph:
1. Automatically indexes the code
2. Adds invisible overlays for hover information
3. Enhances GitHub's UI with code intelligence
4. No configuration needed!

## Features You Get

### On GitHub (with extension):
- 🔍 **Hover for definitions** - See what any function/variable does
- 📍 **Go to definition** - Jump to where code is defined
- 📚 **Find references** - Find all usages
- 🎯 **Cross-file navigation** - Works across your entire repo

### VS Code Extension (Optional):
```bash
code --install-extension sourcegraph.cody-ai
```

## Testing Sourcegraph

1. Go to any file in your repo: https://github.com/Think-Big-Media/1.0-war-room
2. Hover over a function or variable name
3. You should see a tooltip with information
4. Click "Go to definition" to jump to the source

## Advanced Features (Optional)

### Search Operators
- `repo:^github\.com/Think-Big-Media/1.0-war-room$` - Search only your repo
- `lang:typescript componentDidMount` - Search TypeScript files
- `file:\.tsx$ useState` - Search only in TSX files

### Code Monitoring
Set up alerts for specific code patterns:
1. Go to https://sourcegraph.com
2. Create a code monitor
3. Get notified when patterns appear in code

## Privacy Note
- The browser extension only activates on GitHub/GitLab/Bitbucket
- Code stays on GitHub - Sourcegraph just adds UI enhancements
- For private repos, code intelligence is processed locally

---
*Last updated: 2025-07-22*