# Supabase OAuth Setup Guide

## Overview
The OAuth providers (GitHub and Google) need to be enabled in your Supabase project dashboard. Here's how to set them up.

## Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard:
   https://supabase.com/dashboard/project/ksnrafwskxaxhaczvwjs/auth/providers

2. You'll see a list of available authentication providers.

## Step 2: Enable GitHub OAuth

1. In the providers list, find **GitHub** and click to expand it
2. Toggle the **Enable Sign in with GitHub** switch to ON
3. You'll need to provide:
   - **Client ID** (from GitHub OAuth App)
   - **Client Secret** (from GitHub OAuth App)

### Creating a GitHub OAuth App:
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: War Room Platform
   - **Homepage URL**: http://localhost:3000 (for development)
   - **Authorization callback URL**: https://ksnrafwskxaxhaczvwjs.supabase.co/auth/v1/callback
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret
6. Paste these into Supabase dashboard

## Step 3: Enable Google OAuth

1. In the providers list, find **Google** and click to expand it
2. Toggle the **Enable Sign in with Google** switch to ON
3. You'll need to provide:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)

### Creating a Google OAuth App:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth client ID
5. Choose "Web application"
6. Add:
   - **Authorized JavaScript origins**: 
     - http://localhost:3000 (for development)
     - https://ksnrafwskxaxhaczvwjs.supabase.co
   - **Authorized redirect URIs**: 
     - https://ksnrafwskxaxhaczvwjs.supabase.co/auth/v1/callback
7. Copy the Client ID and Client Secret
8. Paste these into Supabase dashboard

## Step 4: Configure Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:

1. **Site URL**: http://localhost:3000
2. **Redirect URLs**: Add these (one per line):
   ```
   http://localhost:3000
   http://localhost:3000/dashboard
   http://localhost:3000/login
   ```

## Step 5: Save and Test

1. Click **Save** in the Supabase dashboard
2. The OAuth providers should now work!

## Temporary Workaround

While setting up OAuth, you can still use email/password authentication:
1. Register with email/password at `/register`
2. Check your email for verification link
3. Login with email/password

## Common Issues

### "Provider not enabled" error
- Make sure you've toggled the provider to ON in Supabase dashboard
- Save the changes

### Redirect URI mismatch
- Ensure the callback URL in your OAuth app matches exactly:
  `https://ksnrafwskxaxhaczvwjs.supabase.co/auth/v1/callback`

### Invalid client ID/secret
- Double-check you've copied the correct values
- Regenerate the secret if needed

## Production Setup

For production, you'll need to:
1. Update OAuth app URLs to your production domain
2. Add production URLs to Supabase redirect URLs
3. Update environment variables with production values