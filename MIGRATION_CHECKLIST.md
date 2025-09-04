# War Room Platform - Migration Checklist

## Overview
This checklist guides the migration of the War Room Analytics Platform to the client's Render.com account.

**Estimated Total Time:** 4-6 hours  
**Risk Level:** Medium  
**Rollback Available:** Yes

## Phase 1: Pre-Migration (1 hour)

### Requirements Verification
- [ ] Client has Render.com account created
- [ ] Client has provided Render account access
- [ ] Domain name ready for configuration
- [ ] SSL certificate requirements confirmed
- [ ] All API keys documented
- [ ] Database backup completed
- [ ] Current environment variables exported

### Technical Prerequisites
- [ ] PostgreSQL database accessible
- [ ] Redis instance available
- [ ] GitHub repository access granted
- [ ] Admin credentials prepared
- [ ] Monitoring tools ready

## Phase 2: Backup Current System (30 minutes)

### Data Export
```bash
# Run backup script
./backup_scripts/export_data.sh

# Verify backup files
ls -la backups/
```

- [ ] Database exported successfully
- [ ] Environment variables saved (sanitized)
- [ ] Application files backed up
- [ ] Media/uploads archived
- [ ] Backup verified and tested

## Phase 3: Render.com Setup (1 hour)

### Service Creation
- [ ] Create Web Service for application
- [ ] Create PostgreSQL database
- [ ] Create Redis instance (if needed)
- [ ] Configure build settings
- [ ] Set start command
- [ ] Configure health check

### Environment Configuration
- [ ] Add all required environment variables
- [ ] Configure secrets properly
- [ ] Set production flags
- [ ] Configure domain settings
- [ ] Enable auto-deploy from GitHub

## Phase 4: Database Migration (1 hour)

### Database Setup
```bash
# Import database
./backup_scripts/import_data.sh

# Run migrations
alembic upgrade head

# Verify data
psql -c "SELECT COUNT(*) FROM users;"
```

- [ ] Database imported successfully
- [ ] Migrations completed
- [ ] Data integrity verified
- [ ] Indexes rebuilt
- [ ] Performance tested

## Phase 5: Application Deployment (30 minutes)

### Deploy Application
- [ ] Push code to GitHub
- [ ] Verify auto-deploy triggered
- [ ] Monitor build logs
- [ ] Check deployment status
- [ ] Verify application started

### Initial Testing
- [ ] Application loads correctly
- [ ] Admin login works
- [ ] Database connection verified
- [ ] API endpoints responsive
- [ ] Frontend assets loading

## Phase 6: DNS Configuration (30 minutes)

### Domain Setup
- [ ] Add custom domain in Render
- [ ] Update DNS records
- [ ] Configure SSL certificate
- [ ] Test HTTPS access
- [ ] Verify certificate validity

### DNS Records
```
Type: A
Name: @
Value: [Render IP]

Type: CNAME
Name: www
Value: [Render URL]
```

## Phase 7: Integration Testing (1 hour)

### Functionality Tests
- [ ] User authentication working
- [ ] Admin panel accessible
- [ ] Meta integration functional
- [ ] Google Ads integration working
- [ ] Email sending verified
- [ ] Analytics tracking active

### Performance Tests
- [ ] Page load times acceptable
- [ ] API response times normal
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Error logging working

## Phase 8: Go-Live (30 minutes)

### Final Checks
- [ ] All tests passing
- [ ] Monitoring active
- [ ] Backups scheduled
- [ ] Documentation updated
- [ ] Team notified

### DNS Cutover
- [ ] Update production DNS
- [ ] Monitor traffic switch
- [ ] Verify SSL working
- [ ] Check all redirects
- [ ] Monitor error logs

## Post-Migration Tasks

### Immediate (First 24 hours)
- [ ] Monitor application logs
- [ ] Check performance metrics
- [ ] Verify all integrations
- [ ] Review error reports
- [ ] User feedback collection

### Week 1
- [ ] Performance optimization
- [ ] Security audit
- [ ] Backup verification
- [ ] Documentation updates
- [ ] Team training completed

### Ongoing
- [ ] Regular backups
- [ ] Security updates
- [ ] Performance monitoring
- [ ] Cost optimization
- [ ] Feature deployment

## Rollback Procedure

If critical issues occur:

1. **Immediate Actions**
   ```bash
   # Switch DNS back to old server
   # Restore from backup
   ./backup_scripts/restore_emergency.sh
   ```

2. **Communication**
   - Notify all stakeholders
   - Document issues encountered
   - Plan remediation

3. **Recovery**
   - Fix identified issues
   - Test thoroughly
   - Reschedule migration

## Emergency Contacts

- **Technical Lead:** [Contact Info]
- **Render Support:** support@render.com
- **Database Admin:** [Contact Info]
- **DNS Provider:** [Contact Info]

## Sign-off

- [ ] Technical Lead Approval
- [ ] Client Approval
- [ ] Go-Live Authorized

---

**Migration Completed:** _______________  
**Completed By:** _______________  
**Client Sign-off:** _______________