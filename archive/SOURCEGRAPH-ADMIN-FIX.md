# Sourcegraph Site Admin Fix Guide

## 🚨 Becoming a Site Admin on badaboost.sourcegraph.app

### Option 1: Initial Admin Setup (Try First)
1. **Go to**: https://badaboost.sourcegraph.app/site-admin/init
2. If you see a form to promote yourself to admin, fill it out
3. If you get a 404 or "already initialized" error, continue to Option 2

### Option 2: Using Sourcegraph CLI (If You Have SSH Access)
If you have SSH access to the server:
```bash
# SSH into your Sourcegraph instance
ssh your-server

# Run the src CLI command
src users promote-site-admin roderica@warroom.ai
```

### Option 3: Direct Database Access (Advanced)
If you have database access:
```sql
-- Connect to PostgreSQL
UPDATE users SET site_admin = true WHERE email = 'roderica@warroom.ai';
```

### Option 4: Contact Support
Since you're on a paid plan:
1. Go to: https://sourcegraph.com/contact
2. Or email: support@sourcegraph.com
3. Reference:
   - Instance: badaboost.sourcegraph.app
   - Email: roderica@warroom.ai
   - Issue: Need Site Admin access as the instance owner

### Quick Verification
After becoming admin, you should see:
- **Site Admin** menu in the top navigation
- Access to: https://badaboost.sourcegraph.app/site-admin
- Ability to manage users, repositories, and settings

### If Using Sourcegraph Cloud
If badaboost.sourcegraph.app is a Sourcegraph Cloud instance:
1. You might need to contact support directly
2. Cloud instances have different admin models
3. Check your billing/account page for admin options

## Need Help?
- Sourcegraph Docs: https://docs.sourcegraph.com/admin/auth/site_admin
- Discord: https://discord.gg/sourcegraph
- Support: support@sourcegraph.com