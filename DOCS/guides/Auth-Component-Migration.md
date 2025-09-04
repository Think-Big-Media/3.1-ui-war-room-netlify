# Auth Component Migration Guide

This guide helps you migrate from the custom FastAPI authentication to Supabase Auth components.

## Overview

We've created new Supabase-compatible authentication components that replace the existing FastAPI-based auth components. These new components use Supabase Auth directly instead of custom JWT implementation.

## Prerequisites

1. **Database Migration**: First run the Supabase database migration to create required tables:
   ```bash
   # Use Supabase Dashboard SQL Editor:
   # https://supabase.com/dashboard/project/ksnrafwskxaxhaczvwjs/editor
   # Copy and paste from: /supabase/migrations/001_initial_schema.sql
   ```

2. **Environment Variables**: Ensure `.env.local` has:
   ```env
   REACT_APP_SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

## Component Mapping

| Old Component | New Component | Location |
|--------------|---------------|-----------|
| `LoginForm` | `SupabaseLoginForm` | `/components/auth/SupabaseLoginForm.tsx` |
| `RegisterForm` | `SupabaseRegisterForm` | `/components/auth/SupabaseRegisterForm.tsx` |
| `ForgotPasswordForm` | `SupabaseForgotPasswordForm` | `/components/auth/SupabaseForgotPasswordForm.tsx` |
| `ResetPasswordForm` | `SupabaseResetPasswordForm` | `/components/auth/SupabaseResetPasswordForm.tsx` |
| `EmailVerificationPage` | `SupabaseEmailVerificationPage` | `/components/auth/SupabaseEmailVerificationPage.tsx` |

## Migration Steps

### 1. Update App Provider

First, wrap your entire app with the Supabase Auth Provider:

```typescript
// Before (in App.tsx or index.tsx)
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>...</Routes>
    </AuthProvider>
  );
}

// After
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';

function App() {
  return (
    <SupabaseAuthProvider>
      <Routes>...</Routes>
    </SupabaseAuthProvider>
  );
}
```

### 2. Update Route Imports

In your main App or routing configuration:

```typescript
// Before
import { 
  LoginForm, 
  RegisterForm, 
  ForgotPasswordForm,
  ResetPasswordForm,
  EmailVerificationPage 
} from './components/auth';

// After
import { 
  SupabaseLoginForm, 
  SupabaseRegisterForm, 
  SupabaseForgotPasswordForm,
  SupabaseResetPasswordForm,
  SupabaseEmailVerificationPage 
} from './components/auth/supabase-index';
```

### 3. Update Route Components

```typescript
// Before
<Route path="/login" element={<LoginForm />} />
<Route path="/register" element={<RegisterForm />} />
<Route path="/forgot-password" element={<ForgotPasswordForm />} />
<Route path="/reset-password" element={<ResetPasswordForm />} />
<Route path="/verify-email" element={<EmailVerificationPage />} />

// After
<Route path="/login" element={<SupabaseLoginForm />} />
<Route path="/register" element={<SupabaseRegisterForm />} />
<Route path="/forgot-password" element={<SupabaseForgotPasswordForm />} />
<Route path="/reset-password" element={<SupabaseResetPasswordForm />} />
<Route path="/verify-email" element={<SupabaseEmailVerificationPage />} />
```

### 4. Update Auth Context Usage

Replace the old auth context with the new Supabase auth context:

```typescript
// Before
import { useAuth } from '../../contexts/AuthContext';

// After
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
```

### 5. Update Protected Routes

Update your protected route components to use the Supabase auth context:

```typescript
// Before
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// After
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSupabaseAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};
```

## Key Differences

### 1. OAuth Support
The new components include built-in OAuth support for Google and GitHub login.

### 2. Email Verification
Supabase handles email verification automatically. Users receive a verification email upon registration.

### 3. Password Reset
Password reset now uses Supabase's built-in flow with secure email links.

### 4. Session Management
Sessions are managed by Supabase with automatic refresh token handling.

### 5. Error Messages
Error messages are now mapped from Supabase's error responses to user-friendly messages.

## Testing the Migration

1. **Test Registration Flow**:
   - Register a new user
   - Verify email is sent
   - Confirm email verification works
   - Check user can log in after verification

2. **Test Login Flow**:
   - Login with email/password
   - Try OAuth login (Google/GitHub)
   - Verify remember me functionality
   - Check session persistence

3. **Test Password Reset**:
   - Request password reset
   - Check email is received
   - Verify reset link works
   - Confirm new password works

4. **Test Protected Routes**:
   - Verify unauthenticated users are redirected
   - Check authenticated users can access protected content
   - Test logout functionality

## Cleanup

After successful migration:

1. Remove old auth components from `/components/auth/`
2. Remove old auth API endpoints from the backend
3. Remove JWT configuration and dependencies
4. Update any remaining references to the old auth system

## Troubleshooting

### Common Issues

1. **"Invalid login credentials"**: Ensure the user exists and password is correct
2. **"Email not confirmed"**: User needs to verify their email before logging in
3. **OAuth redirect issues**: Check Supabase dashboard for correct redirect URLs
4. **Session not persisting**: Ensure cookies are enabled and Supabase client is configured correctly

### Debug Mode

To enable debug logging for auth issues:

```typescript
// In your Supabase client configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: true, // Enable auth debug logs
  }
});
```

## Feature Comparison

| Feature | Custom Auth | Supabase Auth |
|---------|-------------|---------------|
| Email/Password | ✅ | ✅ |
| OAuth (Google/GitHub) | ❌ | ✅ |
| Email Verification | ✅ | ✅ |
| Password Reset | ✅ | ✅ |
| Session Management | Manual | Automatic |
| Token Refresh | Manual | Automatic |
| Real-time Auth State | ❌ | ✅ |
| MFA Support | ❌ | ✅ (Available) |
| Row Level Security | ❌ | ✅ |

## Next Steps

After migrating the auth components:

1. Configure Supabase Auth settings in the dashboard:
   - Enable Email/Password provider
   - Set up OAuth providers (Google, GitHub)
   - Configure email templates
   - Set redirect URLs
2. Migrate existing user data to Supabase auth.users table
3. Update API endpoints to use Supabase RLS instead of JWT validation
4. Remove old auth components and API endpoints
5. Set up monitoring and analytics for auth events