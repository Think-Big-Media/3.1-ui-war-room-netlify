# War Room Deployment Guide

## Current Infrastructure: Render.com

### Production URLs
- Backend API: `https://war-room.onrender.com`
- Frontend: (To be deployed)

### Deployment Configuration

The application uses `render.yaml` for deployment configuration:
- Backend: Python 3.11 with FastAPI
- Database: PostgreSQL (managed by Render)
- Redis: Redis instance (for caching)

### Environment Variables

Required environment variables for production:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/warroom

# Redis
REDIS_URL=redis://red-xxxxx:6379

# Security
SECRET_KEY=<generate-secure-key>
JWT_SECRET=<same-as-secret-key>
JWT_ALGORITHM=HS256

# Sentry (optional but recommended)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_ENVIRONMENT=production

# External Services
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
POSTHOG_KEY=your-posthog-key
OPENAI_API_KEY=your-openai-key
PINECONE_API_KEY=your-pinecone-key
```

### Deployment Steps

1. **Backend Deployment**
   ```bash
   # Render automatically deploys from GitHub
   # Manual deploy: Push to main branch
   git push origin main
   ```

2. **Database Migrations**
   ```bash
   # Run in Render shell
   cd src/backend
   alembic upgrade head
   ```

3. **Frontend Deployment**
   ```bash
   cd src/frontend
   npm run build
   # Deploy dist folder to static hosting
   ```

### Health Checks

- Backend health: `GET /health`
- Detailed metrics: `GET /api/v1/monitoring/health`
- Active alerts: `GET /api/v1/alerts/active`

### Security Checklist

- [x] Rate limiting enabled
- [x] CORS properly configured
- [x] Sentry error tracking
- [x] Monitoring & alerts active
- [ ] CSP headers (pending)
- [x] Secure headers middleware
- [x] Input validation
- [x] SQL injection prevention (ORM)

### Troubleshooting

1. **Application won't start**
   - Check logs in Render dashboard
   - Verify all environment variables are set
   - Ensure database is accessible

2. **Database connection issues**
   - Verify DATABASE_URL is correct
   - Check connection pool settings
   - Look for connection limit errors

3. **Performance issues**
   - Check metrics at `/api/v1/monitoring/metrics`
   - Review active alerts
   - Monitor Redis hit rates

### Monitoring

The application includes comprehensive monitoring:
- System metrics (CPU, memory, disk)
- Database performance
- API response times
- Cache hit rates
- WebSocket connections
- Automatic alerts for issues

Access monitoring endpoints with platform admin credentials.