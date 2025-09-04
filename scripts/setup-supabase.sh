#!/bin/bash

# War Room Platform - Supabase Setup Script
# This script helps set up and configure the Supabase project

set -e

echo "🚀 War Room Platform - Supabase Setup"
echo "===================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "📦 Installing Supabase CLI..."
    
    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install supabase/tap/supabase
    else
        # Linux/WSL
        curl -sSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
        sudo mv supabase /usr/local/bin/
    fi
fi

echo "✅ Supabase CLI installed"

# Login to Supabase (if not already logged in)
echo ""
echo "📝 Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "🔐 Please login to Supabase:"
    supabase login
fi

# Link to remote project
echo ""
echo "🔗 Linking to remote Supabase project..."
echo "Project URL: https://ksnrafwskxaxhaczvwjs.supabase.co"

cd "$(dirname "$0")/.."
supabase link --project-ref ksnrafwskxaxhaczvwjs

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
supabase db push

# Create default organization
echo ""
echo "🏢 Creating default organization..."
cat > /tmp/create_default_org.sql << 'EOF'
-- Create default organization
INSERT INTO organizations (
    id,
    name,
    slug,
    org_type,
    email,
    subscription_tier,
    is_active,
    is_verified
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'War Room Demo Organization',
    'war-room-demo',
    'political_campaign',
    'demo@warroom.app',
    'professional',
    true,
    true
) ON CONFLICT (slug) DO NOTHING;

-- Return the organization ID
SELECT id FROM organizations WHERE slug = 'war-room-demo';
EOF

ORG_ID=$(supabase db query -f /tmp/create_default_org.sql | grep -E '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1 | xargs)

if [ ! -z "$ORG_ID" ]; then
    echo "✅ Default organization created with ID: $ORG_ID"
    echo ""
    echo "📝 Update your .env.local file with:"
    echo "REACT_APP_DEFAULT_ORG_ID=$ORG_ID"
else
    echo "⚠️  Default organization already exists or creation failed"
fi

# Create storage buckets
echo ""
echo "📦 Creating storage buckets..."
cat > /tmp/create_buckets.sql << 'EOF'
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
    ('org-assets', 'org-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Organization assets policies
CREATE POLICY "Organization assets are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'org-assets');

CREATE POLICY "Organization members can manage assets" ON storage.objects
    FOR ALL USING (
        bucket_id = 'org-assets' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id::text = (storage.foldername(name))[1]
        )
    );

-- Documents policies (private)
CREATE POLICY "Organization members can view documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Organization members can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Organization members can update documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Organization admins can delete documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.org_id::text = (storage.foldername(name))[1]
            AND profiles.role IN ('admin', 'manager')
        )
    );
EOF

supabase db query -f /tmp/create_buckets.sql

echo "✅ Storage buckets created"

# Generate types
echo ""
echo "🎯 Generating TypeScript types..."
npx supabase gen types typescript --project-id ksnrafwskxaxhaczvwjs > src/frontend/src/lib/database.types.ts

# Clean up
rm -f /tmp/create_default_org.sql /tmp/create_buckets.sql

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update REACT_APP_DEFAULT_ORG_ID in your .env.local file"
echo "2. Run 'npm install' in the frontend directory"
echo "3. Start the development server with 'npm run dev'"
echo "4. Visit http://localhost:3000 to see the app"
echo ""
echo "🔑 Your Supabase project details:"
echo "   URL: https://ksnrafwskxaxhaczvwjs.supabase.co"
echo "   Anon Key: Already configured in .env.local"
echo ""