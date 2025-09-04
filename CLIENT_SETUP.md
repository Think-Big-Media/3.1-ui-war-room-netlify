# War Room Platform - Client Setup Guide

## Welcome to War Room Analytics Platform! 🎯

This guide will help you get started with your newly deployed War Room Analytics Platform. Follow these steps to configure your system and begin managing your advertising campaigns effectively.

---

## Table of Contents
1. [First-Time Access](#first-time-access)
2. [Admin Panel Setup](#admin-panel-setup)
3. [Initial Configuration](#initial-configuration)
4. [Team Member Management](#team-member-management)
5. [Integration Setup](#integration-setup)
6. [Basic Usage Guide](#basic-usage-guide)
7. [Troubleshooting](#troubleshooting)
8. [Support and Resources](#support-and-resources)

---

## First-Time Access

### 1. Access Your Platform

Your War Room Analytics Platform is available at:
- **Production URL**: `https://your-domain.com`
- **Health Check**: `https://your-domain.com/health` (should return "OK")

### 2. Initial Login

#### For Supabase Authentication:
1. Navigate to your platform URL
2. Click **"Sign Up"** if you don't have an account
3. Use your email address to create an account
4. Check your email for verification link
5. Complete email verification
6. Return to platform and log in

#### Default Admin Access:
- **Email**: `admin@your-domain.com` (if configured)
- **Password**: Check your secure credentials document
- **Note**: Change default credentials immediately after first login

### 3. First Login Checklist
- [ ] Successfully logged into the platform
- [ ] Dashboard loads without errors
- [ ] All main navigation items are accessible
- [ ] No JavaScript errors in browser console

---

## Admin Panel Setup

### 1. Platform Administrator Settings

#### Access Platform Admin
1. Log in with administrator credentials
2. Navigate to **Settings** → **Platform Administration**
3. Verify your admin email is listed in platform administrators

#### Configure Basic Settings
```bash
Platform Name: War Room Analytics
Organization: [Your Organization Name]
Time Zone: [Your Time Zone]
Date Format: MM/DD/YYYY or DD/MM/YYYY
Currency: USD (or your preferred currency)
```

### 2. System Health Verification

#### Check System Status
1. Go to **Settings** → **System Health**
2. Verify all services are green:
   - ✅ Database Connection
   - ✅ Redis Cache
   - ✅ Authentication Service
   - ✅ Real-time Updates
   - ✅ Analytics Engine

#### Performance Monitoring
- Response times should be < 2 seconds
- Dashboard load time < 5 seconds
- Real-time updates within 5 seconds

---

## Initial Configuration

### 1. Organization Profile

#### Company Information
1. Go to **Settings** → **Organization**
2. Fill in company details:
   ```
   Organization Name: [Your Company]
   Industry: [Your Industry]
   Website: [Your Website]
   Phone: [Contact Number]
   Address: [Business Address]
   ```

#### Branding (Optional)
- Upload company logo
- Set brand colors
- Configure email templates

### 2. User Preferences

#### Account Settings
1. Go to **Settings** → **Account**
2. Configure your preferences:
   ```
   Display Name: [Your Name]
   Email: [Your Email]
   Phone: [Your Phone]
   Notifications: Enable/Disable
   Theme: Light/Dark/Auto
   ```

#### Notification Settings
- Email notifications for alerts
- Real-time dashboard updates
- Weekly performance reports
- Critical system alerts

### 3. Dashboard Customization

#### Default Dashboard Layout
1. Go to main **Dashboard**
2. Customize widgets:
   - Key Performance Indicators
   - Campaign Performance Charts
   - Recent Activities Feed
   - Alert Center Summary

#### Create Custom Views
- Set up different views for different team roles
- Configure data refresh intervals
- Set up automated reports

---

## Team Member Management

### 1. Adding Team Members

#### Invite Users
1. Go to **Settings** → **Team Management**
2. Click **"Invite Team Member"**
3. Fill in user details:
   ```
   Email: [User Email]
   Role: Admin/Manager/Analyst/Viewer
   Departments: [Select Relevant Departments]
   ```
4. Send invitation email

#### User Roles and Permissions
```
Administrator:
- Full system access
- User management
- System configuration
- Billing and subscription

Manager:
- Campaign management
- Team member oversight
- Report generation
- Limited system settings

Analyst:
- Data analysis
- Report viewing
- Campaign monitoring
- No user management

Viewer:
- Read-only access
- Dashboard viewing
- Report viewing
- No editing capabilities
```

### 2. Team Organization

#### Departments/Groups
Create departments for better organization:
- Marketing Team
- Campaign Managers
- Data Analysts
- Executives

#### Access Control
- Set up role-based access to specific campaigns
- Configure data visibility by department
- Set up approval workflows for campaign changes

---

## Integration Setup

### 1. Meta Business API (Facebook/Instagram)

#### Prerequisites
- Meta Business Manager account
- Admin access to ad accounts
- Meta for Developers app (if not already set up)

#### Setup Process
1. Go to **Settings** → **Integrations** → **Meta Business**
2. Click **"Connect Meta Account"**
3. Follow OAuth authentication flow
4. Select ad accounts to monitor
5. Configure data sync settings:
   ```
   Sync Frequency: Every 15 minutes
   Historical Data: Last 90 days
   Metrics: All available metrics
   ```

#### Verification
- Test connection shows "Connected"
- Ad accounts appear in dropdown menus
- Sample data loads in dashboards

### 2. Google Ads API

#### Prerequisites
- Google Ads account with API access
- Google Cloud Console project
- Developer token approved by Google

#### Setup Process
1. Go to **Settings** → **Integrations** → **Google Ads**
2. Click **"Connect Google Ads"**
3. Complete OAuth authentication
4. Select accounts to monitor
5. Configure sync settings:
   ```
   Sync Frequency: Every 15 minutes
   Historical Data: Last 90 days
   Conversion Tracking: Enabled
   ```

#### Verification
- Connection status shows "Active"
- Campaigns appear in platform
- Performance data is updating

### 3. Additional Integrations (Optional)

#### Analytics Platforms
- Google Analytics 4 integration
- Custom conversion tracking
- Third-party attribution tools

#### Communication Tools
- Slack notifications for alerts
- Email reporting setup
- SMS alerts for critical issues

---

## Basic Usage Guide

### 1. Dashboard Navigation

#### Main Dashboard Features
```
Top Navigation:
- Dashboard (Home)
- Campaign Control
- Real-time Monitoring
- Intelligence Hub
- Alert Center
- Settings

Left Sidebar:
- Quick Actions
- Recent Campaigns
- Active Alerts
- Performance Summary
```

#### Key Metrics Overview
- Total Ad Spend
- Return on Ad Spend (ROAS)
- Cost Per Acquisition (CPA)
- Click-through Rate (CTR)
- Conversion Rate
- Active Campaigns

### 2. Campaign Management

#### Creating Campaign Monitoring
1. Go to **Campaign Control**
2. Click **"Add New Campaign"**
3. Select platform (Meta, Google Ads, or both)
4. Choose campaign from dropdown
5. Set monitoring parameters:
   ```
   Budget Alerts: 80% of daily budget
   Performance Alerts: 20% drop in CTR
   Spend Alerts: Unusual spending patterns
   ```

#### Campaign Dashboard
- Real-time performance metrics
- Spend tracking and projections
- Performance trends
- Alert history
- Optimization recommendations

### 3. Real-time Monitoring

#### Live Dashboard Features
- Real-time spend updates
- Performance anomaly detection
- Instant alert notifications
- Campaign status monitoring

#### Alert Configuration
```
Budget Alerts:
- 50% budget reached
- 80% budget reached
- Budget exceeded

Performance Alerts:
- CTR drop > 20%
- CPA increase > 30%
- ROAS drop > 25%
```

### 4. Reporting and Analytics

#### Standard Reports
- Daily performance summary
- Weekly campaign analysis
- Monthly ROI reports
- Quarter-over-quarter comparisons

#### Custom Reports
1. Go to **Intelligence Hub**
2. Click **"Create Custom Report"**
3. Select data sources and metrics
4. Set up automated delivery
5. Configure recipients and frequency

---

## Troubleshooting

### Common Issues and Solutions

#### Login Problems
```
Issue: Can't log in to platform
Solutions:
1. Verify email and password
2. Check email for reset link
3. Clear browser cache and cookies
4. Try incognito/private browsing mode
5. Contact support if issue persists
```

#### Dashboard Not Loading
```
Issue: Dashboard shows loading indefinitely
Solutions:
1. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Check internet connection
3. Disable browser extensions
4. Try different browser
5. Check system status page
```

#### Integration Connection Issues
```
Issue: Meta/Google Ads not connecting
Solutions:
1. Verify you have admin access to ad accounts
2. Check if API credentials are valid
3. Ensure ad accounts are active
4. Try disconnecting and reconnecting
5. Check integration status page
```

#### Data Not Updating
```
Issue: Campaign data appears stale
Solutions:
1. Check last sync timestamp
2. Verify integration connections are active
3. Look for any error messages in logs
4. Manual sync if available
5. Contact support with campaign details
```

### Performance Issues
```
Issue: Platform running slowly
Solutions:
1. Check your internet connection
2. Close unnecessary browser tabs
3. Clear browser cache
4. Disable heavy browser extensions
5. Check system resource usage
```

### Getting Help

#### Self-Service Resources
- **Help Center**: Available in platform under "Help"
- **Video Tutorials**: Step-by-step guidance
- **Knowledge Base**: Common questions and solutions
- **System Status**: Real-time system health

#### Contacting Support
- **Email**: support@your-domain.com
- **Response Time**: 24 hours for standard issues
- **Priority Support**: Available for critical issues
- **Screen Sharing**: Available for complex troubleshooting

---

## Advanced Features

### 1. Automation Rules

#### Campaign Optimization
- Auto-pause underperforming ads
- Budget reallocation based on performance
- Bid adjustments for peak hours
- Automated A/B test setup

#### Alert Automation
- Custom alert conditions
- Multi-channel notifications
- Escalation procedures
- Automated responses

### 2. Custom Analytics

#### Advanced Metrics
- Customer lifetime value tracking
- Attribution modeling
- Cohort analysis
- Predictive analytics

#### Data Export
- Scheduled data exports
- Custom data formats
- API access for data integration
- Bulk reporting capabilities

### 3. White-label Options

#### Branding Customization
- Custom logos and colors
- Branded login pages
- Custom domain setup
- Client-specific reporting

---

## Security Best Practices

### 1. Account Security

#### Password Requirements
- Minimum 12 characters
- Mix of letters, numbers, symbols
- Change every 90 days
- No password reuse

#### Two-Factor Authentication
- Enable 2FA for all admin accounts
- Use authenticator apps over SMS
- Keep backup codes secure
- Regular security audits

### 2. Data Protection

#### Access Controls
- Principle of least privilege
- Regular access reviews
- Session timeout settings
- IP whitelisting (if needed)

#### Data Handling
- No sharing of login credentials
- Secure data export procedures
- Regular backup verification
- Compliance with data regulations

---

## Support and Resources

### 1. Documentation

#### Available Resources
- **User Manual**: Comprehensive platform guide
- **API Documentation**: For custom integrations
- **Video Library**: Tutorial and training videos
- **FAQ**: Frequently asked questions
- **Best Practices**: Optimization guides

### 2. Training and Onboarding

#### Training Options
- **Live Training Sessions**: Scheduled group training
- **One-on-One Training**: Personalized sessions
- **Self-Paced Learning**: Online modules
- **Certification Programs**: Advanced user certification

### 3. Support Channels

#### Getting Help
```
Emergency Support (Critical Issues):
- Email: emergency@your-domain.com
- Phone: [Emergency Phone Number]
- Expected Response: Within 2 hours

Standard Support:
- Email: support@your-domain.com
- Help Desk: Available in platform
- Expected Response: Within 24 hours

Community Support:
- User Forums: [Forum URL]
- Knowledge Base: [KB URL]
- Video Tutorials: [Video Library URL]
```

### 4. Regular Check-ins

#### Ongoing Support Schedule
- **Week 1**: Initial setup verification
- **Week 2**: Integration testing and optimization
- **Month 1**: Performance review and adjustments
- **Month 3**: Advanced feature training
- **Quarterly**: Platform updates and new features

---

## Success Metrics

### 1. Platform Adoption
- Daily active users
- Feature utilization rates
- Time to value realization
- User satisfaction scores

### 2. Business Impact
- Campaign performance improvements
- Time saved on manual tasks
- ROI from platform investment
- Alert response times

### 3. Optimization Opportunities
- Regular performance reviews
- Feature usage analytics
- User feedback incorporation
- Continuous improvement plans

---

**Congratulations! You're now ready to maximize your advertising performance with War Room Analytics Platform.** 

For immediate assistance during setup, contact our support team. We're here to ensure your success! 🚀