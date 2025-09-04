# Supabase Setup Guide for War Room Analytics

## Overview

Supabase is the primary authentication and real-time database system for War Room Analytics. This guide provides step-by-step instructions for setting up Supabase integration.

## Prerequisites

- War Room deployment ready for external service configuration
- Access to Supabase.com account (create free account if needed)
- Access to your Render.com dashboard for environment variable configuration

## Step 1: Create Supabase Project

1. **Sign up/Login to Supabase**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up for a free account or login to existing account

2. **Create New Project**
   - Click "New Project" in your dashboard
   - Choose your organization or create a new one
   - Fill in project details:
     - **Name**: `war-room-analytics`
     - **Database Password**: Generate secure password (save it!)
     - **Region**: Choose closest to your Render deployment (e.g., US East)
   - Click "Create new project"

3. **Wait for Project Setup**
   - Project creation takes 2-3 minutes
   - You'll see a progress indicator

## Step 2: Get Your Supabase Configuration

Once your project is ready:

1. **Access Project Settings**
   - Go to Settings → API in your Supabase dashboard
   - You'll see your project configuration

2. **Copy Required Values**
   ```
   Project URL: https://your-project-id.supabase.co
   Anon (public) key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service Role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
   ```

## Step 3: Configure Authentication

1. **Enable Authentication Providers**
   - Go to Authentication → Settings
   - Configure your authentication preferences:
     - **Email/Password**: Enable (default)
     - **Email Confirmations**: Enable for production
     - **Social Providers**: Configure Google, GitHub as needed

2. **Set Site URL and Redirect URLs**
   - **Site URL**: `https://war-room-oa9t.onrender.com` (your production URL)
   - **Redirect URLs**: Add your production and development URLs:
     ```
     https://war-room-oa9t.onrender.com/auth/callback
     http://localhost:5173/auth/callback (for development)
     ```

## Step 4: Configure Environment Variables

### For Render.com Production Deployment

1. **Go to Render Dashboard**
   - Navigate to your War Room service
   - Click "Environment" tab

2. **Add Required Variables**
   ```bash
   # Required Supabase Variables
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Save and Redeploy**
   - Click "Save" to update environment variables
   - Your service will automatically redeploy

### For Local Development

1. **Update Your .env File**
   ```bash
   # Copy .env.template to .env if you haven't already
   cp .env.template .env
   
   # Edit .env with your Supabase values
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Step 5: Set Up Database Schema

1. **Go to SQL Editor**
   - In Supabase dashboard, go to SQL Editor
   - Create tables for War Room data

2. **Run Initial Schema** (Example)
   ```sql
   -- Create organizations table
   CREATE TABLE organizations (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name VARCHAR NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Create users table extension
   CREATE TABLE user_profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     organization_id UUID REFERENCES organizations(id),
     display_name VARCHAR,
     role VARCHAR DEFAULT 'member',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Enable Row Level Security
   ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
   ```

3. **Set Up Row Level Security Policies**
   ```sql
   -- Users can only see their organization's data
   CREATE POLICY "Users can view own organization" ON organizations
   FOR SELECT USING (id IN (
     SELECT organization_id FROM user_profiles WHERE id = auth.uid()
   ));
   
   -- Users can view their own profile
   CREATE POLICY "Users can view own profile" ON user_profiles
   FOR SELECT USING (auth.uid() = id);
   ```

## Step 6: Configure Real-time Features

1. **Enable Real-time**
   - Go to Settings → API
   - Enable real-time for your tables:
     ```sql
     -- Enable real-time for specific tables
     ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
     ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
     ```

## Step 7: Test Integration

1. **Test Authentication Flow**
   - Visit your deployed War Room application
   - Try to sign up/login
   - Check Supabase Authentication dashboard for new users

2. **Verify Database Connection**
   - Check that user data appears in Supabase dashboard
   - Test real-time updates if configured

## Step 8: Production Hardening

1. **Review Security Settings**
   - Go to Settings → API
   - Enable JWT verification
   - Set appropriate JWT expiry times

2. **Configure Email Templates**
   - Go to Authentication → Email Templates
   - Customize email templates with your branding
   - Use your custom domain for email links

3. **Set Up Domain Authentication** (Optional)
   - Configure custom domain for Supabase
   - Update CORS settings in Supabase for your domain

## Troubleshooting

### Common Issues

1. **CORS Errors**
   ```bash
   # Ensure your domain is added to allowed origins
   # In Supabase: Settings → API → CORS
   ```

2. **Authentication Not Working**
   - Check Site URL and Redirect URLs are correct
   - Verify environment variables are properly set
   - Check browser console for specific errors

3. **Database Connection Issues**
   - Verify SUPABASE_URL format is correct
   - Check that anon key is properly configured
   - Ensure Row Level Security policies don't block access

### Getting Help

- Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
- War Room Issues: Create issue in project repository
- Supabase Community: [https://supabase.com/community](https://supabase.com/community)

## Security Checklist

- [ ] Strong database password generated and stored securely
- [ ] Service role key kept secret and only used server-side
- [ ] Row Level Security enabled on all tables
- [ ] Appropriate security policies configured
- [ ] Email confirmation enabled for production
- [ ] Custom domain configured (optional but recommended)
- [ ] Regular backups configured
- [ ] Access logs monitored

## Next Steps

After Supabase is configured:

1. Configure PostHog for analytics tracking
2. Set up Sentry for error monitoring
3. Configure Meta Business API (if needed)
4. Test complete authentication flow
5. Monitor Supabase dashboard for usage and errors

---

**Note**: Keep your Supabase credentials secure and never commit them to version control. Always use environment variables for configuration.