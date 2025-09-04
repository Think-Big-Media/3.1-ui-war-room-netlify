# Required Environment Variables for war-room-2025

## ✅ Deployment Fixed!
The site is now loading with the correct build. Next step is to add the required environment variables.

## Critical Environment Variables (Add These Now)

### Supabase (Required for Auth)
```
VITE_SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbnJhZndza3hheGhhY3p2d2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjc2MTQsImV4cCI6MjA2NzY0MzYxNH0.d7lM7Jp6CVxPesip1JVYPMUEkifQ39biLQNzEhNfd-w
```

### Backend Security (Generate Random Values)
```
SECRET_KEY=<generate-64-char-random-string>
JWT_SECRET=<generate-32-char-random-string>
```

To generate secure random strings:
```bash
# For SECRET_KEY (64 chars)
openssl rand -hex 32

# For JWT_SECRET (32 chars)
openssl rand -hex 16
```

### Database (Get from Render or Supabase)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### CORS Configuration
```
BACKEND_CORS_ORIGINS=https://war-room-2025.onrender.com
```

## Optional Environment Variables

### Analytics & Monitoring
```
POSTHOG_KEY=<your-posthog-key>
SENTRY_DSN=<your-sentry-dsn>
```

### Email Services
```
SENDGRID_API_KEY=<your-sendgrid-key>
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
```

### SMS Services
```
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>
```

### AI/ML Services
```
OPENAI_API_KEY=<your-openai-key>
PINECONE_API_KEY=<your-pinecone-key>
PINECONE_ENVIRONMENT=<your-pinecone-env>
```

### OAuth Providers
```
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
FACEBOOK_APP_ID=<your-facebook-app-id>
FACEBOOK_APP_SECRET=<your-facebook-app-secret>
```

## How to Add via Render Dashboard

1. Go to: https://dashboard.render.com/web/srv-d2dm57mmcj7s73c76dh0/env
2. Click "Add Environment Variable"
3. Enter each key-value pair
4. Click "Save Changes"
5. Deployment will automatically restart

## Verification

After adding environment variables, check:
1. Site loads without errors: https://war-room-2025.onrender.com
2. Can navigate to login page
3. Browser console shows no errors
4. API health check: https://war-room-2025.onrender.com/health

## Current Status
- ✅ Deployment fixed (using correct build)
- ✅ Python-only build process
- ✅ Frontend serving properly
- ⏳ Awaiting environment variables for full functionality