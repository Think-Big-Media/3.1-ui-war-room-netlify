# Supabase Migration Guide for War Room Platform

## Overview

This guide documents the critical architecture migration from the custom FastAPI/PostgreSQL backend to Supabase as specified in the technical architecture document.

## Current Architecture Issues

1. **Backend Mismatch**: We built a custom FastAPI backend with SQLAlchemy models, but the architecture requires Supabase
2. **Authentication**: Custom JWT implementation should use Supabase Auth
3. **Database**: Direct PostgreSQL should use Supabase's managed PostgreSQL
4. **Realtime**: WebSocket implementation should use Supabase Realtime
5. **Storage**: File handling should use Supabase Storage

## Migration Status

### ✅ Completed
- Created Supabase client configuration (`/src/frontend/src/lib/supabase.ts`)
- Created database type definitions (`/src/frontend/src/lib/database.types.ts`)
- Created Supabase auth API service (`/src/frontend/src/services/supabaseAuthApi.ts`)
- Created Supabase auth context (`/src/frontend/src/contexts/SupabaseAuthContext.tsx`)

### 🔄 In Progress
- Database schema migration scripts
- Edge Functions to replace FastAPI endpoints
- Update frontend components to use Supabase

### ❌ Todo
- Remove FastAPI backend code
- Migrate existing data
- Set up Supabase project
- Configure environment variables
- Deploy Edge Functions

## Migration Steps

### 1. Supabase Project Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase project
supabase init

# Link to remote project
supabase link --project-ref <project-ref>
```

### 2. Environment Variables

Create `.env.local`:
```env
REACT_APP_SUPABASE_URL=https://[PROJECT_REF].supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_DEFAULT_ORG_ID=default-org-uuid
```

### 3. Database Migration

Run the migration SQL script:
```bash
supabase db push < supabase/migrations/001_initial_schema.sql
```

### 4. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

### 5. Create Database Triggers

```sql
-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, org_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'org_id', (SELECT id FROM organizations LIMIT 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 6. Frontend Updates

Update imports in components:
```typescript
// Old
import { useAuth } from '../../contexts/AuthContext';
import { useLoginMutation } from '../../services/authApi';

// New
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useLoginMutation } from '../../services/supabaseAuthApi';
```

### 7. Edge Functions

Create Edge Functions to replace FastAPI endpoints:

```typescript
// supabase/functions/get-analytics-dashboard/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { org_id, start_date, end_date } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Analytics logic here
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### 8. Deploy Functions

```bash
supabase functions deploy get-analytics-dashboard
supabase functions deploy process-document
supabase functions deploy send-notification
```

## Component Migration Checklist

- [ ] Update LoginForm to use Supabase auth
- [ ] Update RegisterForm to use Supabase auth
- [ ] Update ProtectedRoute to check Supabase session
- [ ] Update AuthContext usage throughout app
- [ ] Replace API calls with Supabase client calls
- [ ] Update WebSocket to Supabase Realtime
- [ ] Migrate file uploads to Supabase Storage

## Data Models Comparison

| FastAPI Model | Supabase Table | Key Differences |
|--------------|----------------|-----------------|
| User | auth.users + profiles | Supabase handles auth, profile extends |
| Organization | organizations | Same structure |
| Contact | contacts | Same structure |
| Volunteer | volunteers | Same structure |
| Event | events | Same structure |
| Donation | donations | Same structure |

## API Endpoints Migration

| FastAPI Endpoint | Supabase Replacement |
|-----------------|---------------------|
| POST /auth/login | supabase.auth.signIn() |
| POST /auth/register | supabase.auth.signUp() |
| GET /users/me | supabase.auth.getUser() |
| GET /analytics/* | Edge Function: get-analytics-dashboard |
| WebSocket /ws | supabase.realtime |

## Benefits of Migration

1. **Managed Infrastructure**: No need to maintain servers
2. **Built-in Auth**: Enterprise-grade authentication
3. **Realtime**: Built-in WebSocket support
4. **Storage**: S3-compatible file storage
5. **Auto-scaling**: Handles traffic automatically
6. **Cost-effective**: Pay-as-you-go pricing

## Rollback Plan

If migration fails:
1. Keep FastAPI code in separate branch
2. Database backup before migration
3. Environment variable switch for API endpoints
4. Gradual rollout with feature flags

## Timeline

- **Day 1-2**: Supabase setup and database migration
- **Day 3-4**: Auth system migration
- **Day 5-6**: API endpoints to Edge Functions
- **Day 7**: Testing and deployment

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Migration Guide](https://supabase.com/docs/guides/migrations)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Auth Docs](https://supabase.com/docs/guides/auth)