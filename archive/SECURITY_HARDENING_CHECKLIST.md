# Security Hardening Checklist for War Room

## 🔐 Immediate Actions Required

### 1. **Update SECRET_KEY** (CRITICAL)
Current temporary key needs replacement with production key.

**Action Required**:
1. Go to Render Dashboard → war-room service → Environment
2. Update `SECRET_KEY` with: `ij_FpPFRrJHIeStsmK1Bj4KjQTuqvlpLNo2K0HKIjpM`
3. Redeploy service to apply changes

⚠️ **WARNING**: Never commit this key to Git. Store securely.

### 2. **Enable HTTPS Enforcement**
- ✅ Already enabled by Render (automatic)
- Verify all endpoints redirect HTTP → HTTPS
- Update CORS origins to use HTTPS only

### 3. **API Rate Limiting**
Currently disabled. Enable in production:

```python
# Add to environment variables
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
```

### 4. **Database Security**
- [ ] Enable SSL connections (add `?sslmode=require` to DATABASE_URL)
- [ ] Rotate database passwords quarterly
- [ ] Enable query logging for audit trail
- [ ] Set up read replicas for analytics queries

## 🛡️ Authentication & Authorization

### 5. **JWT Token Security**
- [ ] Reduce token expiration to 15 minutes (currently 30)
- [ ] Implement refresh token rotation
- [ ] Add token blacklist for logout
- [ ] Enable JWT encryption (JWE)

### 6. **Password Requirements**
Enforce strong passwords:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Prevent common passwords
- Implement password history

### 7. **OAuth Security**
When enabling Google/GitHub auth:
- [ ] Verify redirect URIs
- [ ] Use state parameter for CSRF protection
- [ ] Validate OAuth tokens server-side
- [ ] Limit OAuth scopes to minimum needed

## 🔍 Input Validation & Sanitization

### 8. **SQL Injection Prevention**
- ✅ Using SQLAlchemy ORM (parameterized queries)
- [ ] Add query validation middleware
- [ ] Log suspicious query patterns
- [ ] Regular security scans

### 9. **XSS Prevention**
- ✅ React auto-escapes by default
- [ ] Add Content Security Policy headers
- [ ] Sanitize user-generated content
- [ ] Validate file uploads

### 10. **CORS Configuration**
Update for production:
```python
BACKEND_CORS_ORIGINS=[
    "https://war-room-frontend-tzuk.onrender.com",
    # Remove localhost before production
]
```

## 📊 Monitoring & Logging

### 11. **Security Monitoring**
- [ ] Enable audit logging for all admin actions
- [ ] Set up intrusion detection alerts
- [ ] Monitor failed login attempts
- [ ] Track API usage patterns

### 12. **Error Handling**
- [ ] Never expose stack traces in production
- [ ] Implement custom error pages
- [ ] Log errors to secure location
- [ ] Set up Sentry for error tracking

### 13. **Dependency Security**
- [ ] Run `pip audit` for Python vulnerabilities
- [ ] Run `npm audit` for JavaScript vulnerabilities
- [ ] Enable Dependabot on GitHub
- [ ] Update dependencies monthly

## 🔒 Infrastructure Security

### 14. **Environment Variables**
- [ ] Audit all environment variables
- [ ] Remove any test/development values
- [ ] Use secrets management service
- [ ] Rotate API keys regularly

### 15. **File Upload Security**
- [ ] Restrict file types (whitelist approach)
- [ ] Scan uploads for malware
- [ ] Store files outside web root
- [ ] Generate unique filenames

### 16. **WebSocket Security**
- [ ] Implement connection rate limiting
- [ ] Add message size limits
- [ ] Validate all WebSocket messages
- [ ] Use wss:// (secure WebSocket)

## 🚨 Incident Response

### 17. **Security Incident Plan**
Create procedures for:
- Data breach response
- DDoS mitigation
- Account compromise
- Service disruption

### 18. **Backup & Recovery**
- [ ] Enable automated daily backups
- [ ] Test restore procedures monthly
- [ ] Store backups encrypted off-site
- [ ] Document recovery process

## 📋 Compliance & Privacy

### 19. **Data Privacy**
- [ ] Implement data retention policies
- [ ] Add user data export feature
- [ ] Enable account deletion
- [ ] Create privacy policy

### 20. **Compliance Requirements**
- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if CA users)
- [ ] PCI compliance (if processing payments)
- [ ] SOC 2 audit preparation

## 🔄 Regular Security Tasks

### Weekly
- Review security logs
- Check for unusual activity
- Update security patches

### Monthly
- Run vulnerability scans
- Review user permissions
- Update dependencies
- Test backup restoration

### Quarterly
- Rotate secrets and API keys
- Security training for team
- Penetration testing
- Update security documentation

## 🚀 Implementation Priority

### Phase 1 (Immediate - Week 1)
1. Update SECRET_KEY ⚨
2. Enable rate limiting
3. Configure CORS properly
4. Set up basic monitoring

### Phase 2 (Short-term - Week 2-3)
5. Implement CSP headers
6. Set up Sentry
7. Enable audit logging
8. Configure backup automation

### Phase 3 (Medium-term - Month 1)
9. Full security audit
10. Penetration testing
11. Compliance review
12. Security training

## 📞 Security Contacts

- **Security Lead**: [Your Name]
- **Incident Response**: security@your-domain.com
- **24/7 Support**: [Phone Number]

## 🔗 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)

---

**Last Updated**: 2025-07-20
**Next Review**: 2025-08-20