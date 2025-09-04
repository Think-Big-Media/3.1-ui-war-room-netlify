# War Room Platform - Credential Handover Documentation

## Overview
This document outlines all credentials, API keys, and access information required for the War Room Analytics Platform migration and ongoing operations.

**⚠️ SECURITY NOTICE**: This document contains sensitive information. Handle with extreme care and follow security protocols.

---

## Table of Contents
1. [Credentials We Provide](#credentials-we-provide)
2. [Credentials Client Must Provide](#credentials-client-must-provide)
3. [Temporary Credentials](#temporary-credentials)
4. [Post-Migration Security Tasks](#post-migration-security-tasks)
5. [Credential Storage Guidelines](#credential-storage-guidelines)
6. [Access Management](#access-management)
7. [Emergency Procedures](#emergency-procedures)

---

## Credentials We Provide

### 1. Platform-Specific Credentials

#### Current Deployment Access
```
Service: Current War Room Deployment
URL: https://war-room-oa9t.onrender.com
Admin Email: [PROVIDED_SEPARATELY]
Admin Password: [PROVIDED_SEPARATELY]
Status: Active until migration complete
```

#### Development Access
```
Repository: GitHub repository access
URL: https://github.com/[repository-url]
Access Level: Admin (during migration period)
SSH Keys: [PROVIDED_IF_NEEDED]
```

#### Database Access (Current)
```
Service: PostgreSQL (Current Deployment)
Connection String: [PROVIDED_SEPARATELY]
Admin User: [PROVIDED_SEPARATELY]
Password: [PROVIDED_SEPARATELY]
Purpose: Data export/migration only
```

### 2. Service Account Credentials

#### Render.com Current Account
```
Account: Current deployment account
Login: [PROVIDED_SEPARATELY]
Password: [PROVIDED_SEPARATELY]
Two-Factor: [BACKUP_CODES_PROVIDED]
Purpose: Migration coordination only
Access Duration: Until client takes full control
```

#### GitHub Integration
```
Service: GitHub Personal Access Token
Token: [PROVIDED_SEPARATELY]
Permissions: Repository admin, workflows
Purpose: CI/CD setup and repository management
Expiration: 90 days from migration
```

### 3. External Service Integration Keys

#### PostHog Analytics (Demo/Setup)
```
Service: PostHog Analytics
API Key: [PROVIDED_SEPARATELY]
Project ID: [PROVIDED_SEPARATELY]
Purpose: Initial setup and configuration
Status: Temporary - client must create own account
```

#### Sentry Error Tracking (Demo/Setup)
```
Service: Sentry Error Tracking
DSN: [PROVIDED_SEPARATELY]
Auth Token: [PROVIDED_SEPARATELY]
Purpose: Initial setup and configuration
Status: Temporary - client must create own project
```

---

## Credentials Client Must Provide

### 1. Required for Migration

#### New Render.com Account
```
Required: Render.com account credentials
Purpose: Deploy to client's account
Access Level: Owner/Admin
Billing: Active subscription required
Setup Deadline: Before migration start
```

#### Custom Domain Access
```
Required: Domain registrar admin access
Purpose: DNS configuration
Details Needed:
- Domain registrar login credentials
- DNS management access
- Ability to create CNAME records
```

### 2. External Services (Client Owns)

#### Supabase Authentication
```
Required: Supabase project credentials
Project URL: https://[client-project].supabase.co
Anon Key: [CLIENT_MUST_PROVIDE]
Service Role Key: [CLIENT_MUST_PROVIDE]
Purpose: User authentication and real-time features
Setup Guide: Provided in integration documentation
```

#### PostHog Analytics (Production)
```
Required: PostHog account and project
API Key: [CLIENT_MUST_PROVIDE]
Project API Key: [CLIENT_MUST_PROVIDE]
Host: https://app.posthog.com (or custom)
Purpose: Production analytics and feature flags
Plan: Recommended minimum: Growth plan
```

#### Sentry Error Tracking (Production)
```
Required: Sentry project
DSN: [CLIENT_MUST_PROVIDE]
Auth Token: [CLIENT_MUST_PROVIDE] (optional)
Purpose: Production error monitoring
Plan: Recommended minimum: Team plan
```

### 3. Optional Integrations (When Ready)

#### Meta Business API
```
Service: Meta for Developers
Required When: Facebook/Instagram ads management needed
Credentials Needed:
- Meta App ID: [CLIENT_PROVIDES]
- Meta App Secret: [CLIENT_PROVIDES]
- Access Token: [CLIENT_PROVIDES]
- Business Manager Admin Access
Setup Process: Guided during integration setup
```

#### Google Ads API
```
Service: Google Ads API
Required When: Google Ads management needed
Credentials Needed:
- Developer Token: [CLIENT_PROVIDES]
- OAuth Client ID: [CLIENT_PROVIDES]
- OAuth Client Secret: [CLIENT_PROVIDES]
- Manager Account Access
Setup Process: Guided during integration setup
```

#### AI Services (Optional)
```
Service: OpenAI API
API Key: [CLIENT_PROVIDES_IF_NEEDED]
Purpose: AI-powered document intelligence

Service: Pinecone Vector Database
API Key: [CLIENT_PROVIDES_IF_NEEDED]
Environment: [CLIENT_PROVIDES_IF_NEEDED]
Purpose: Document search and AI features
```

---

## Temporary Credentials

### 1. Migration Period Access

#### Migration Coordinator Access
```
Service: New deployment (temporary admin)
Purpose: Migration coordination and validation
Access Level: Full admin (temporary)
Duration: Until client team is fully trained
Removal Process: Manual removal post-migration
```

#### Emergency Access
```
Service: Backup admin account
Purpose: Emergency support if needed
Access Level: Limited admin
Duration: 30 days post-migration
Authentication: Separate credentials + 2FA
```

### 2. Service Setup Assistance

#### Temporary API Keys
```
Services: Demo/testing API keys for:
- PostHog (demo project)
- Sentry (demo project)
Purpose: Initial setup and testing
Status: Replace with client's own before go-live
Duration: Until client services are configured
```

---

## Post-Migration Security Tasks

### 1. Immediate Actions (Day 1)

#### Credential Rotation
- [ ] **Generate new JWT secrets** in production environment
- [ ] **Rotate database passwords** (if using shared credentials)
- [ ] **Update all API keys** to client-owned accounts
- [ ] **Remove temporary access** for migration coordinators
- [ ] **Verify SSL certificates** are active and valid

#### Access Review
- [ ] **Remove development access** from previous environments
- [ ] **Audit user accounts** in new environment
- [ ] **Verify team member access** is properly configured
- [ ] **Disable any demo/temporary accounts**

### 2. Week 1 Actions

#### Security Hardening
- [ ] **Enable two-factor authentication** for all admin accounts
- [ ] **Configure IP whitelisting** (if required)
- [ ] **Set up monitoring alerts** for security events
- [ ] **Review and update CORS settings**
- [ ] **Verify backup encryption** is active

#### Integration Security
- [ ] **Rotate OAuth tokens** for external services
- [ ] **Review API rate limiting** configurations
- [ ] **Verify webhook signatures** are properly validated
- [ ] **Update notification endpoints** to client-controlled addresses

### 3. Month 1 Actions

#### Long-term Security
- [ ] **Schedule regular credential rotation** (quarterly)
- [ ] **Set up security monitoring** (intrusion detection)
- [ ] **Configure automated security updates**
- [ ] **Plan security audit schedule**
- [ ] **Document incident response procedures**

---

## Credential Storage Guidelines

### 1. Secure Storage Requirements

#### Password Management
```
Recommended Tools:
- 1Password (Business plan)
- LastPass (Business plan)  
- Bitwarden (Business plan)
- HashiCorp Vault (Enterprise)

Requirements:
- End-to-end encryption
- Team sharing capabilities
- Audit logging
- Two-factor authentication
- Regular security updates
```

#### Environment Variables
```
Production Environment:
- Store in Render.com environment variables
- Never commit to version control
- Use Render's secret generation for keys
- Encrypt sensitive values

Development Environment:
- Use .env files (never committed)
- Local password managers
- Separate from production credentials
```

### 2. Access Control

#### Credential Access Matrix
```
Role: Platform Administrator
Access: Full credential access
Responsibilities: Credential management, security oversight

Role: Technical Lead
Access: Infrastructure credentials, API keys
Responsibilities: System maintenance, integrations

Role: Developer
Access: Development credentials only
Responsibilities: Feature development, testing

Role: Marketing Manager
Access: Marketing platform credentials only
Responsibilities: Campaign management, analytics
```

#### Sharing Protocol
```
Method: Secure password manager sharing
Approval: Must be approved by platform administrator
Documentation: All credential access must be documented
Audit: Monthly access reviews required
Rotation: Credentials must be rotated when team members leave
```

---

## Access Management

### 1. User Account Management

#### Admin Account Setup
```
Primary Admin:
- Client-designated primary administrator
- Full platform access
- Responsible for user management
- Must have two-factor authentication

Secondary Admin:
- Backup administrator account  
- Same access as primary
- Different person than primary admin
- For emergency access
```

#### Role-Based Access
```
Platform Roles:
1. Administrator: Full system access
2. Manager: User and campaign management
3. Analyst: Read access to data and reports
4. Viewer: Dashboard viewing only

Integration Roles:
1. Integration Admin: API key management
2. Campaign Manager: Ad platform access
3. Analyst: Read-only API access
```

### 2. Service Account Management

#### API Authentication
```
Service Accounts:
- Separate service accounts for each integration
- Limited scope permissions
- Regular rotation schedule
- Monitoring and alerting

Authentication Methods:
- OAuth 2.0 (preferred for external APIs)
- API keys with proper scoping
- Service account keys (where required)
- JWT tokens for internal services
```

---

## Emergency Procedures

### 1. Security Incident Response

#### Suspected Credential Compromise
```
Immediate Actions:
1. Rotate compromised credentials immediately
2. Review access logs for suspicious activity
3. Notify all team members of security incident
4. Document incident details and timeline
5. Implement additional security measures

Contact Information:
- Primary: [CLIENT_PRIMARY_CONTACT]
- Secondary: [CLIENT_SECURITY_CONTACT]
- Emergency Support: [SUPPORT_EMERGENCY_CONTACT]
```

#### Service Outage
```
Priority Actions:
1. Check service status pages for external services
2. Verify database and Redis connectivity
3. Review application logs for errors
4. Check SSL certificate status
5. Validate DNS configuration

Escalation Process:
1. Internal team notification
2. Service provider support tickets
3. Emergency support contacts
4. Client communication
```

### 2. Account Recovery

#### Lost Access Procedures
```
Admin Account Recovery:
1. Use backup admin account
2. Contact Render.com support if needed
3. Use password recovery processes
4. Verify identity through pre-established methods
5. Update access documentation

External Service Recovery:
1. Use service-specific recovery processes
2. Contact support with account verification
3. Update credentials in platform
4. Test connectivity after recovery
```

---

## Credential Checklist

### Pre-Migration Setup
- [ ] Client Render.com account active with billing
- [ ] Custom domain DNS access verified
- [ ] Supabase project created with credentials ready
- [ ] PostHog account and project configured
- [ ] Sentry project created with DSN available
- [ ] Password manager configured for team access

### Migration Process
- [ ] Current deployment credentials documented
- [ ] Export scripts executed successfully
- [ ] New deployment credentials configured
- [ ] Database import completed and verified
- [ ] All environment variables configured
- [ ] SSL certificates active and verified

### Post-Migration Security
- [ ] Temporary credentials removed
- [ ] All API keys rotated to client accounts
- [ ] Two-factor authentication enabled
- [ ] Access audit completed
- [ ] Security monitoring active
- [ ] Incident response procedures documented

---

## Security Best Practices

### 1. Credential Management
- **Never share credentials via email or chat**
- **Use secure password managers for all credentials**
- **Implement regular credential rotation schedules**
- **Document all credential changes and access**
- **Monitor for credential usage in logs**

### 2. Access Control
- **Implement principle of least privilege**
- **Regular access reviews and audits**
- **Separate development and production credentials**
- **Use service accounts for automated processes**
- **Enable audit logging for all administrative actions**

### 3. Monitoring and Alerting
- **Set up alerts for unusual login activity**
- **Monitor API usage for anomalies**
- **Track failed authentication attempts**
- **Alert on credential exposure in code repositories**
- **Regular security posture assessments**

---

**Important Notes:**
1. This document should be stored securely and access should be limited to authorized personnel only
2. All credentials marked as "[PROVIDED_SEPARATELY]" will be shared through secure channels
3. Client must acknowledge receipt of all credentials and confirm secure storage
4. Any credential compromise must be reported immediately to security teams
5. Regular reviews of this document should be conducted to ensure accuracy

**Document Version**: 1.0  
**Last Updated**: [MIGRATION_DATE]  
**Next Review**: 30 days post-migration