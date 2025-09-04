# Supabase Migration Plan

## 📅 Migration Date: January 31, 2025
## 🎯 Objective: FastAPI → Supabase Architecture Compliance

---

## ❌ **CRITICAL ISSUE IDENTIFIED**
**FastAPI backend was built when technical specification requires Supabase**

### Current Incorrect Architecture:
- ❌ FastAPI backend with SQLAlchemy
- ❌ Custom authentication endpoints
- ❌ Manual database management
- ❌ Custom file upload handling

### Correct Architecture (Per Specification):
- ✅ Supabase Edge Functions (Deno)
- ✅ Supabase Auth (OAuth2, email verification)
- ✅ Supabase Database (Postgres 15 with RLS)
- ✅ Supabase Storage (secure file handling)
- ✅ Supabase Realtime (WebSocket)

---

## 🔄 **MIGRATION CHECKLIST**

### Phase 1: Infrastructure Setup ⏱️ 30 minutes
- [x] Install Supabase dependencies (`@supabase/supabase-js`)
- [x] Create Supabase client configuration
- [x] Define database types from specification
- [ ] Set up Supabase project connection
- [ ] Configure environment variables

### Phase 2: Authentication Migration ⏱️ 45 minutes
- [ ] **Auth endpoints → Supabase Auth**
  - [ ] Replace `/auth/login` with `supabase.auth.signInWithPassword`
  - [ ] Replace `/auth/register` with `supabase.auth.signUp`
  - [ ] Replace `/auth/logout` with `supabase.auth.signOut`
  - [ ] Replace `/auth/verify` with Supabase email verification
  - [ ] Update password reset flow

### Phase 3: API Routes Migration ⏱️ 60 minutes
- [ ] **API routes → Edge Functions**
  - [ ] Convert `/api/volunteers` endpoints
  - [ ] Convert `/api/events` endpoints
  - [ ] Convert `/api/contacts` endpoints
  - [ ] Convert `/api/documents` endpoints
  - [ ] Convert `/api/donations` endpoints

### Phase 4: Database Migration ⏱️ 45 minutes
- [ ] **Database queries → Supabase client**
  - [ ] Replace SQLAlchemy queries with Supabase queries
  - [ ] Implement Row Level Security (RLS) policies
  - [ ] Set up organization-based data isolation
  - [ ] Configure role-based permissions

### Phase 5: File Handling Migration ⏱️ 30 minutes
- [ ] **File uploads → Supabase Storage**
  - [ ] Replace custom file upload with Supabase Storage
  - [ ] Configure secure bucket policies
  - [ ] Update document handling workflows

### Phase 6: Frontend Updates ⏱️ 60 minutes
- [ ] **Update React components**
  - [ ] Replace auth API calls with Supabase auth
  - [ ] Update data fetching to use Supabase client
  - [ ] Implement realtime subscriptions
  - [ ] Update error handling patterns

---

## 🗂️ **FILES TO MODIFY**

### Authentication Components:
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/contexts/AuthContext.tsx`
- `src/services/authApi.ts` → **REMOVE**

### API Services:
- `src/services/volunteerApi.ts`
- `src/services/eventApi.ts`
- `src/services/contactApi.ts`
- `src/services/documentApi.ts`
- `src/services/donationApi.ts`

### Configuration:
- `.env` → Add Supabase environment variables
- `src/config/api.ts` → Update to use Supabase client

---

## 🚫 **FastAPI DEPENDENCIES TO REMOVE**

### Backend Directory:
- `src/backend/` → **ENTIRE DIRECTORY REMOVAL**
- All Python FastAPI code will be replaced with Supabase Edge Functions

### Frontend FastAPI References:
```bash
# These will be identified and removed:
- fastapi imports
- pydantic references
- sqlalchemy connections
- custom auth endpoints
- manual database queries
```

---

## 🔒 **SECURITY CONSIDERATIONS**

### Row Level Security (RLS):
```sql
-- Organizations can only access their own data
CREATE POLICY org_isolation ON volunteers 
FOR ALL USING (organization_id = auth.jwt() ->> 'organization_id');

-- Users can only access data from their organization
CREATE POLICY user_org_access ON users 
FOR ALL USING (organization_id = auth.jwt() ->> 'organization_id');
```

### Authentication Security:
- ✅ Email verification required
- ✅ JWT tokens managed by Supabase
- ✅ Password reset with secure tokens
- ✅ Role-based access control

---

## 📋 **ENVIRONMENT VARIABLES REQUIRED**

### Remove FastAPI Variables:
```env
# DELETE THESE:
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_ALGORITHM=...
ACCESS_TOKEN_EXPIRE_MINUTES=...
```

### Add Supabase Variables:
```env
# ADD THESE:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## ⚡ **EXPECTED BENEFITS**

### Development Speed:
- ⚡ **50% faster development** - Less custom backend code
- ⚡ **Built-in security** - RLS, JWT, compliance features
- ⚡ **Real-time ready** - WebSocket support included
- ⚡ **Easier deployment** - No separate backend deployment

### Architecture Compliance:
- ✅ **Matches specification** - No more deviation
- ✅ **Industry standard** - Proven Supabase architecture
- ✅ **Scalable** - Handles growth automatically
- ✅ **Maintainable** - Less code to maintain

---

## 🧪 **TESTING STRATEGY**

### Migration Validation:
1. **Authentication Flow**: Register → Verify → Login → Logout
2. **Data Operations**: Create → Read → Update → Delete
3. **File Upload**: Upload → Storage → Retrieval
4. **Real-time**: Live data updates via subscriptions
5. **Security**: RLS policy enforcement

### Success Criteria:
- [ ] All authentication flows working
- [ ] All CRUD operations functional
- [ ] File upload/download operational
- [ ] Real-time updates functioning
- [ ] RLS policies enforced
- [ ] No FastAPI dependencies remaining

---

## 🚨 **ROLLBACK PLAN**

### Safety Measures:
- ✅ FastAPI code preserved in git commit `bb9f2923`
- ✅ Database backup before migration
- ✅ Environment variable backup
- ✅ Step-by-step checkpoint creation

### Rollback Process:
```bash
# If migration fails, rollback to FastAPI:
git checkout bb9f2923
npm install  # Restore previous dependencies
# Restore .env variables
```

---

## 📊 **MIGRATION TIMELINE**

### Total Estimated Time: **4.5 hours**
- Phase 1 (Infrastructure): 30 min
- Phase 2 (Authentication): 45 min  
- Phase 3 (API Routes): 60 min
- Phase 4 (Database): 45 min
- Phase 5 (File Handling): 30 min
- Phase 6 (Frontend): 60 min
- Testing & Validation: 60 min

### Next Session Focus:
1. **HIGH PRIORITY**: Complete authentication migration
2. **MEDIUM PRIORITY**: Database schema setup
3. **LOW PRIORITY**: Performance optimization

---

*This migration corrects architectural deviation and aligns with technical specification requirements.*