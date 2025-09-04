# API Credentials & External Service Setup Guide

## 🚨 **URGENT - Start Immediately** (Long Lead Times)

### 1. Meta/Facebook API (4+ weeks lead time)
**Priority: CRITICAL - Start TODAY**

**Required for:** Social media integration, Facebook ads management, Meta pixel tracking

**Setup Steps:**
1. Create Facebook Developer Account
   - Go to https://developers.facebook.com/
   - Use business email (team@badaboostadgrants.org)
   - Complete business verification (requires legal business documents)

2. Create Facebook App
   - App Type: "Business"
   - Use case: "Integrate Facebook Login" + "Access Facebook APIs"

3. Business Verification
   - Upload business documents (articles of incorporation, tax documents)
   - Verify business phone number and address
   - **Timeline: 2-4 weeks**

4. Required Permissions (will need app review):
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `ads_read`
   - `business_management`

**Credentials Needed:**
```
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_ACCESS_TOKEN=
```

---

### 2. ~~Apple Developer Program~~ ❌ NOT NEEDED
**Status: SKIPPED - Desktop-first platform, no mobile apps planned**

### 3. ~~Google Play Console~~ ❌ NOT NEEDED  
**Status: SKIPPED - Desktop-first platform, no mobile apps planned**

---

## 📋 **Phase 1 Dependencies** (Start within 2 weeks)

### 4. Stripe Payment Processing
**Priority: HIGH - Phase 1 requirement**

**Required for:** Donation processing, subscription billing

**Setup Steps:**
1. Create Stripe account at https://stripe.com/
2. Complete business verification
3. Connect bank account (2-7 days for verification)
4. Enable recurring billing
5. Set up webhooks

**Credentials Needed:**
```
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

**Test Credentials:**
```
STRIPE_PUBLISHABLE_KEY_TEST=
STRIPE_SECRET_KEY_TEST=
```

---

### 5. Twilio SMS Service
**Priority: HIGH - Phase 1 requirement**

**Required for:** SMS messaging, 2FA, volunteer notifications

**Setup Steps:**
1. Create Twilio account at https://twilio.com/
2. Verify business phone number
3. Purchase phone number for SMS
4. Set up messaging service

**Credentials Needed:**
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

### 6. Email Service Provider
**Options:** SendGrid (recommended), AWS SES, Mailgun

**Required for:** Bulk email, transactional emails, newsletters

**SendGrid Setup:**
1. Create account at https://sendgrid.com/
2. Verify domain (DNS records required)
3. Set up sender authentication
4. Configure webhook for bounces/complaints

**Credentials Needed:**
```
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=
```

---

### 7. Google Workspace APIs
**Required for:** Calendar integration, Gmail sync, Google Drive

**Setup Steps:**
1. Create Google Cloud Project
2. Enable Google Calendar API, Gmail API
3. Configure OAuth consent screen
4. Create service account credentials

**Credentials Needed:**
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=
```

---

## 🔧 **Infrastructure & Hosting**

### 8. Domain & SSL Setup
**Priority: HIGH - Phase 1 requirement**

**Required for:** Production deployment, email authentication

**Setup Steps:**
1. Register domain (GoDaddy, Namecheap, Cloudflare)
2. Set up DNS with Cloudflare (recommended)
3. Configure SSL certificate (automatic with Cloudflare)

**Subdomains needed:**
- `app.warroom.com` (main application)
- `api.warroom.com` (API server)
- `admin.warroom.com` (platform admin)

---

### 9. Database & Redis Hosting
**Options:** Railway (current), AWS RDS + ElastiCache, Digital Ocean

**Railway Configuration:**
```
DATABASE_URL=postgresql://user:pass@host:port/dbname
REDIS_URL=redis://user:pass@host:port
```

---

## 🤖 **AI & Advanced Features** (Phase 3)

### 10. OpenAI API
**Required for:** AI features, content generation, smart segmentation

**Credentials Needed:**
```
OPENAI_API_KEY=
```

### 11. Pinecone Vector Database
**Required for:** Vector search, AI-powered recommendations

**Credentials Needed:**
```
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX_NAME=
```

---

## 📊 **Analytics & Monitoring**

### 12. PostHog (Already configured)
**Status:** ✅ Implemented
**Required for:** Product analytics, feature flags, user behavior tracking

### 13. Sentry Error Monitoring
**Required for:** Error tracking, performance monitoring

**Credentials Needed:**
```
SENTRY_DSN=
```

---

## 🏛️ **Compliance & Government APIs**

### 14. FEC API (1-2 weeks approval)
**Priority: MEDIUM - Required for political features**

**Required for:** Campaign finance compliance, FEC reporting

**Setup Steps:**
1. Register at https://api.fec.gov/developers/
2. Request bulk data access
3. Wait for approval (1-2 weeks)

**Credentials Needed:**
```
FEC_API_KEY=
```

---

## 🔐 **Security Credentials**

### 15. JWT Secret Keys
**Auto-generated during deployment**

```
JWT_SECRET_KEY=<256-bit-random-string>
JWT_REFRESH_SECRET=<256-bit-random-string>
```

### 16. Encryption Keys
**Auto-generated during deployment**

```
ENCRYPTION_KEY=<256-bit-random-string>
PASSWORD_SALT=<random-string>
```

---

## 📝 **Environment Variables Template**

### Production `.env` File:
```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/warroom_prod
REDIS_URL=redis://user:pass@host:port

# Security
JWT_SECRET_KEY=<generate-random-256-bit>
JWT_REFRESH_SECRET=<generate-random-256-bit>
ENCRYPTION_KEY=<generate-random-256-bit>

# Email
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@warroom.com
SENDGRID_FROM_NAME="War Room Platform"

# SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Payments
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Social Media
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_ACCESS_TOKEN=

# Google APIs
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=

# Analytics
POSTHOG_API_KEY=<already-configured>
POSTHOG_HOST=https://app.posthog.com

# Error Monitoring
SENTRY_DSN=

# AI Features (Phase 3)
OPENAI_API_KEY=
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX_NAME=

# Government APIs
FEC_API_KEY=

# Environment
ENVIRONMENT=production
DEBUG=false
ALLOWED_HOSTS=warroom.com,app.warroom.com,api.warroom.com
```

---

## 📋 **Action Items for Think Big Team**

### Week 1 (This Week):
- [ ] **Facebook Developer Account** - Start business verification TODAY
- [ ] **Domain Registration** - Register primary domain and set up DNS
- [ ] **Stripe Account** - Create and begin verification
- [ ] ~~**Apple Developer**~~ - SKIPPED (no mobile apps)
- [ ] ~~**Google Play Console**~~ - SKIPPED (no mobile apps)

### Week 2:
- [ ] **Twilio Account** - Set up SMS service
- [ ] **SendGrid Account** - Configure email service
- [ ] **Google Cloud Project** - Set up OAuth for calendar integration
- [ ] **FEC API** - Begin registration process

### Week 3:
- [ ] **SSL Certificates** - Configure HTTPS for all domains
- [ ] **Production Database** - Set up PostgreSQL and Redis hosting
- [ ] **Error Monitoring** - Configure Sentry

### Week 4:
- [ ] **Security Audit** - Review all credentials and access
- [ ] **Backup Strategy** - Implement automated backups
- [ ] **Monitoring Setup** - Configure uptime monitoring

---

## 🚨 **Security Requirements**

1. **Credential Storage:**
   - Use environment variables (never commit to git)
   - Use secure password manager for team sharing
   - Rotate keys every 90 days

2. **Access Control:**
   - Limit API key permissions to minimum required
   - Use separate keys for development/staging/production
   - Monitor API usage for anomalies

3. **Compliance:**
   - Store all business verification documents
   - Maintain audit trail of credential changes
   - Regular security reviews

---

## 📞 **Support Contacts**

- **Facebook Business Support:** business.facebook.com/support
- **Stripe Support:** support.stripe.com
- **Twilio Support:** support.twilio.com
- **Google Cloud Support:** cloud.google.com/support

---

**Last Updated:** January 8, 2025
**Review Date:** January 15, 2025
**Owner:** Think Big Media Development Team