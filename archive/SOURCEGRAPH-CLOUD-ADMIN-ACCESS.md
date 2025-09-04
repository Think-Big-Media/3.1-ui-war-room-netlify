# Sourcegraph Cloud Admin Access Guide

## Current Status
- **Instance**: badaboost.sourcegraph.app (Sourcegraph Cloud)
- **User**: rodericandrews (Roderic Andrews)
- **Email**: rodericandrews@gmail.com
- **Site Admin**: ❌ False
- **CLI Token**: ✅ Working

## Why You Can't Self-Promote
Your instance `badaboost.sourcegraph.app` is a **Sourcegraph Cloud** instance, not a self-hosted one. On Cloud instances:
- The `src users promote-site-admin` command is not available
- Direct database access is not possible
- The `/site-admin/init` endpoint doesn't work for Cloud instances

## How to Get Admin Access

### Option 1: Contact Support (Recommended)
Since you're the owner of the instance:

1. **Email**: support@sourcegraph.com
2. **Subject**: Need Site Admin access on my Cloud instance
3. **Include**:
   - Instance URL: https://badaboost.sourcegraph.app
   - Your email: rodericandrews@gmail.com
   - Request: "I'm the owner of this instance but don't have Site Admin access"

### Option 2: Support Portal
1. Go to: https://sourcegraph.com/contact
2. Select "Technical Support"
3. Explain you need Site Admin access on your Cloud instance

### Option 3: Check Billing/Account Page
Sometimes Cloud instances have admin controls in:
- https://sourcegraph.com/account
- Or the billing dashboard where you manage your subscription

## What You CAN Do Now with CLI

Even without Site Admin, you can:
```bash
# Search code
src search -query="your search"

# Manage your own settings
src users get -username=rodericandrews

# Work with repositories you have access to
src repos list
```

## CLI Configuration (Already Done)
✅ Installed: `brew install sourcegraph/src-cli/src-cli`
✅ Configured in ~/.zshrc:
```bash
export SRC_ENDPOINT=https://badaboost.sourcegraph.app
export SRC_ACCESS_TOKEN=sgp_ws019830ca9f607852933114c2ad580470_c9fb1cb46e4d343ae88f7030d5d9d376bc2b0fa1
```

## Next Steps
1. Contact support to get Site Admin access
2. Once you have admin access, you'll see:
   - Site Admin menu in the UI
   - Access to https://badaboost.sourcegraph.app/site-admin
   - Ability to manage users, repositories, and settings

---
*Note: Sourcegraph Cloud instances have different admin models than self-hosted instances. Support can quickly grant you the appropriate access.*