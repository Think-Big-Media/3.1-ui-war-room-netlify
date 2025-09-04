# Render.com Team Ownership Transfer Guide

## Overview
Render supports team management with role-based access control. You can create the account initially and transfer ownership to your client's team.

## Initial Setup (You Do This Now)

### Option 1: Create with Your Account First (Recommended)
1. Create Render account with your email
2. Deploy and test the application
3. Transfer to team later (see below)

### Option 2: Create Team Account from Start
1. Create Render account
2. Immediately create a "Team" (e.g., "Think Big Media")
3. Deploy under the team context
4. Add team members later

## Team Structure in Render

### Roles Available:
- **Owner** - Full control, billing, can delete team
- **Admin** - Can manage all resources, add/remove members
- **Member** - Can deploy and manage services

## Transfer Process (After Deployment)

### Step 1: Create Team
1. Go to Dashboard → Teams
2. Click "Create Team"
3. Name it (e.g., "Think Big Media" or "War Room Team")
4. This makes you the initial Owner

### Step 2: Move Services to Team
1. Go to your service settings
2. Under "Team", change from "Personal" to your new team
3. All services, databases, and env vars move with it

### Step 3: Add Client as Team Member
1. In Team Settings → Members
2. Click "Invite Member"
3. Enter client's email
4. Select role: "Admin" initially

### Step 4: Transfer Ownership
1. Once client accepts invite and sets up 2FA
2. Go to Team Settings → Members
3. Click on client's name
4. Change role from "Admin" to "Owner"
5. Your role automatically becomes "Admin"

## Important Considerations

### Billing Transfer
- Team billing is separate from personal billing
- Client needs to add payment method to team
- Free tier services transfer without interruption
- Paid services continue running during transfer

### What Transfers:
✅ All services and databases
✅ Environment variables
✅ Custom domains
✅ Deploy history
✅ Logs and metrics

### What Doesn't Transfer:
❌ Personal account settings
❌ Other personal projects
❌ API tokens (need to regenerate)

## Best Practice Workflow

1. **Week 1**: You create account and deploy
2. **Week 1-2**: Test and verify everything works
3. **Week 2**: Create team, invite client as Admin
4. **Week 3**: After client comfortable, transfer ownership
5. **Ongoing**: You remain as Admin for support

## Alternative: Start with Client's Email

If client prefers to own from beginning:
1. Have client create Render account
2. Client creates team and invites you as Admin
3. You handle all deployment
4. Cleaner for billing/legal purposes

## Team Management Commands

While Render is primarily GUI-based, you can use their API:

```bash
# List teams (requires API key)
curl https://api.render.com/v1/teams \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Transfer service to team
curl -X PATCH https://api.render.com/v1/services/{service-id} \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -d '{"teamId": "team-xxxxx"}'
```

## Security During Transfer

1. **Enable 2FA**: Both you and client should have 2FA
2. **Audit Log**: Render keeps logs of all team actions
3. **No Downtime**: Services continue running during transfer
4. **Rollback**: Can transfer back if needed

## Communication Template

```
Subject: War Room Render.com Deployment - Team Transfer Process

Hi [Client],

I've successfully deployed War Room to Render.com. Here's the ownership transfer plan:

Current Status:
- ✅ Application deployed and running
- ✅ Free tier services active
- ✅ Security configured (SOC-2 compliant platform)

Next Steps:
1. I'll create a team account for [Company Name]
2. Send you an invitation to join as Admin
3. Once you're comfortable with the platform, we'll transfer full ownership
4. I'll remain as Admin for ongoing support

What you'll need:
- Render.com account (free)
- Enable 2FA for security
- Payment method (only if upgrading from free tier)

The application will continue running throughout this process with zero downtime.

Let me know when you're ready to receive the invitation!

Best,
[Your name]
```

## FAQ

**Q: Can we have multiple owners?**
A: No, Render teams have one Owner, but unlimited Admins with nearly identical permissions.

**Q: What if client doesn't want to manage it?**
A: You can remain Owner and add client as Admin for visibility. They can take ownership later.

**Q: Is there a cost for teams?**
A: No, team functionality is free. You only pay for resources used.

**Q: Can we transfer to a different email later?**
A: Yes, ownership can be transferred multiple times.

## Summary

✅ **Recommended approach**: Deploy now with your account, transfer to team later
✅ **No interruption**: Services keep running during transfer
✅ **Flexible roles**: Client can be Owner while you remain Admin
✅ **Professional setup**: Proper separation of concerns for client ownership