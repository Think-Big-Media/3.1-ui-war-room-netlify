# War Room API Credentials Documentation

**CONFIDENTIAL - RESTRICTED ACCESS ONLY**
*Updated: 2025-08-09*

## 🔐 Security Notice
This document contains sensitive API credentials and configuration details. Access is restricted to core engineering team members only.

## 📋 Credentials Summary

### Production Environment (.env.production)

#### Meta/Facebook Business API
- **App ID**: `917316510623086`
- **Environment**: Production
- **Permissions**: `ads_management,ads_read,business_management,pages_read_engagement`
- **Status**: ✅ Active
- **Rate Limits**: Standard Facebook Graph API limits
- **Documentation**: [Meta Business API v19.0](https://developers.facebook.com/docs/marketing-api/)

#### Google Ads API
- **Client ID**: `808203781238-dgqv5sga2q1r1ls6n77fc40g3idu8h1o.apps.googleusercontent.com`
- **Developer Token**: `h3cQ3ss7lesG9dP0tC56ig`
- **Environment**: Production
- **API Version**: v20
- **Status**: ✅ Active
- **Rate Limits**: Standard Google Ads API limits
- **Documentation**: [Google Ads API v20](https://developers.google.com/google-ads/api/docs)

#### SendGrid Email Service
- **Account Email**: `Info@wethinkbig.io`
- **Environment**: Production
- **Status**: ✅ Active
- **Rate Limits**: Based on SendGrid plan
- **Documentation**: [SendGrid API](https://docs.sendgrid.com/)

#### Core Infrastructure
- **Supabase URL**: `https://ksnrafwskxaxhaczvwjs.supabase.co`
- **PostHog Analytics**: `phc_31XyMU18DIn1wz5ji5H9Y33jXz6VfTfZxaR6DR8mH4o`
- **PostHog Host**: `https://us.i.posthog.com`
- **OpenAI API**: Configured for document intelligence features

### Test Environment (.env.test)

#### Meta/Facebook Business API (Sandbox)
- **App ID**: `917316510623086` (same as production)
- **Sandbox Token**: Available for development testing
- **Environment**: Sandbox/Test mode
- **Status**: ✅ Active for testing

#### Google Ads API (Development)
- **Same credentials as production** (Google Ads uses test manager accounts)
- **Environment**: Development with test customers only
- **Status**: ✅ Active for testing

## 🏗️ Configuration Architecture

### Frontend Configuration
- **File**: `src/config/apiConfig.ts`
- **Environment Variables**: Prefixed with `VITE_`
- **Validation**: Comprehensive credential validation with startup checks
- **Features**: Mock mode, debug logging, feature flags

### Backend Configuration  
- **File**: `src/backend/core/config.py`
- **Environment Variables**: Standard environment variable names
- **Validation**: Pydantic settings with field validation
- **Security**: Credential validation and startup checks

### Environment Files Structure
```
.env.production    # Production credentials
.env.test         # Test/sandbox credentials  
.env              # Local development (placeholders)
src/backend/.env  # Backend-specific config
```

## 🔒 Security Measures Applied

### 1. Credential Validation
- ✅ Frontend validation in `apiConfig.ts`
- ✅ Backend validation in `config.py`
- ✅ Startup validation checks
- ✅ Placeholder detection and warnings

### 2. Environment Separation
- ✅ Production vs. test credential separation
- ✅ Feature flags for API call management
- ✅ Mock mode for development
- ✅ Debug logging controls

### 3. Access Controls
- ✅ Credentials not hardcoded in source files
- ✅ Environment-specific loading
- ✅ Safe logging (credentials masked)
- ✅ Validation error reporting

### 4. Rate Limiting & Circuit Breaking
- ✅ API rate limiting configured
- ✅ Circuit breaker patterns implemented
- ✅ Timeout management
- ✅ Error handling and retry logic

## 🚀 Usage Instructions

### Frontend Usage
```typescript
import { ENV_CONFIG, validateConfiguration } from '@/config/apiConfig';

// Check configuration status
const config = validateConfiguration();
if (!config.isValid) {
  console.error('Configuration issues:', config.issues);
}

// Use environment config
const metaCredentials = ENV_CONFIG().meta;
```

### Backend Usage
```python
from core.config import settings, validate_api_credentials

# Validate credentials at startup
validation = validate_api_credentials()
if not validation["is_valid"]:
    logger.error(f"Credential validation failed: {validation['issues']}")

# Use settings
meta_app_id = settings.META_APP_ID
```

## 🔧 Maintenance Procedures

### Credential Rotation
1. Update credentials in respective platforms (Meta, Google, SendGrid)
2. Update environment files (.env.production, .env.test)
3. Deploy to production environment
4. Verify functionality with monitoring

### Adding New Credentials
1. Add to backend `config.py` with proper validation
2. Add to frontend `apiConfig.ts` with validation
3. Update environment files
4. Add to this documentation
5. Test in development before production

### Security Auditing
- **Monthly**: Review credential usage and permissions
- **Quarterly**: Rotate sensitive credentials
- **As needed**: Update when platform APIs change
- **Continuous**: Monitor for credential leaks in logs

## 📊 Monitoring & Alerting

### Health Checks
- ✅ API credential validation on startup
- ✅ Connection testing during health checks  
- ✅ Rate limit monitoring
- ✅ Error rate tracking

### Alert Conditions
- Invalid or expired credentials
- Rate limit exceeded
- API connection failures
- Credential validation failures

## 🆘 Emergency Procedures

### If Credentials are Compromised
1. **Immediate**: Revoke credentials in respective platforms
2. **Generate**: New credentials with minimal permissions
3. **Update**: Environment configurations 
4. **Deploy**: Emergency deployment with new credentials
5. **Monitor**: For unauthorized usage of old credentials
6. **Document**: Incident for security review

### Support Contacts
- **Meta Business API**: Facebook Business Support
- **Google Ads API**: Google Ads API Support  
- **SendGrid**: SendGrid Technical Support
- **Infrastructure**: Render.com Support

## 📝 Change Log

### 2025-08-09 - Initial Configuration
- ✅ Added Meta/Facebook Business API credentials
- ✅ Added Google Ads API credentials  
- ✅ Added SendGrid email service credentials
- ✅ Implemented comprehensive validation
- ✅ Created environment separation
- ✅ Added security measures and monitoring

### Next Steps
- [ ] Implement credential rotation automation
- [ ] Add API usage analytics dashboard
- [ ] Set up automated security scanning
- [ ] Create credential expiration alerts

---

**⚠️ IMPORTANT**: This document must be kept secure and access-controlled. Only authorized engineering team members should have access to these credentials.