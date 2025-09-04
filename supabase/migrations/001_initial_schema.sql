-- War Room Platform - Supabase Migration Script
-- This script creates all necessary tables, indexes, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE organization_type AS ENUM ('political_campaign', 'nonprofit', 'advocacy_group', 'pac', 'union', 'other');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE contact_type AS ENUM ('voter', 'donor', 'volunteer', 'supporter', 'media', 'vip', 'other');
CREATE TYPE voter_status AS ENUM ('registered', 'unregistered', 'inactive', 'purged', 'unknown');
CREATE TYPE donation_type AS ENUM ('one_time', 'recurring', 'pledge');
CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'ach', 'check', 'cash', 'other');
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    org_type organization_type,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    description TEXT,
    mission_statement TEXT,
    tax_id TEXT,
    fec_id TEXT,
    subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
    subscription_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '{}'::jsonb,
    max_users INTEGER DEFAULT 5,
    max_contacts INTEGER DEFAULT 1000,
    max_monthly_emails INTEGER DEFAULT 5000,
    max_monthly_sms INTEGER DEFAULT 500,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    founded_date TIMESTAMPTZ,
    election_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    org_id UUID NOT NULL REFERENCES organizations(id),
    role TEXT NOT NULL DEFAULT 'member',
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip TEXT,
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    external_id TEXT,
    email TEXT,
    phone TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    middle_name TEXT,
    prefix TEXT,
    suffix TEXT,
    date_of_birth DATE,
    gender TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    county TEXT,
    country TEXT DEFAULT 'US',
    latitude FLOAT,
    longitude FLOAT,
    contact_type contact_type DEFAULT 'supporter',
    voter_status voter_status,
    voter_id TEXT,
    party_affiliation TEXT,
    precinct TEXT,
    congressional_district TEXT,
    state_legislative_district TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    preferred_contact_method TEXT,
    do_not_email BOOLEAN DEFAULT false,
    do_not_call BOOLEAN DEFAULT false,
    do_not_text BOOLEAN DEFAULT false,
    email_bounce_count INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0,
    last_contacted_at TIMESTAMPTZ,
    source TEXT,
    acquisition_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, email)
);

-- Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID UNIQUE REFERENCES contacts(id),
    email TEXT NOT NULL,
    phone TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    interests TEXT[] DEFAULT ARRAY[]::TEXT[],
    languages TEXT[] DEFAULT ARRAY[]::TEXT[],
    availability JSONB DEFAULT '{}'::jsonb,
    transportation BOOLEAN DEFAULT true,
    background_check_completed BOOLEAN DEFAULT false,
    background_check_date DATE,
    training_completed TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT DEFAULT 'active',
    total_hours FLOAT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, email)
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'America/New_York',
    is_virtual BOOLEAN DEFAULT false,
    virtual_link TEXT,
    venue_name TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    latitude FLOAT,
    longitude FLOAT,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    registration_required BOOLEAN DEFAULT true,
    registration_deadline TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'scheduled',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, slug)
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id),
    amount FLOAT NOT NULL,
    currency TEXT DEFAULT 'USD',
    donation_type donation_type DEFAULT 'one_time',
    payment_method payment_method,
    status donation_status DEFAULT 'pending',
    transaction_id TEXT,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    donor_first_name TEXT,
    donor_last_name TEXT,
    donor_email TEXT,
    donor_phone TEXT,
    donor_address_line1 TEXT,
    donor_address_line2 TEXT,
    donor_city TEXT,
    donor_state TEXT,
    donor_postal_code TEXT,
    donor_country TEXT,
    donor_occupation TEXT,
    donor_employer TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    campaign TEXT,
    source TEXT,
    dedication TEXT,
    notes TEXT,
    receipt_sent BOOLEAN DEFAULT false,
    receipt_sent_at TIMESTAMPTZ,
    thank_you_sent BOOLEAN DEFAULT false,
    thank_you_sent_at TIMESTAMPTZ,
    processing_fee FLOAT,
    net_amount FLOAT,
    donated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    volunteer_id UUID REFERENCES volunteers(id),
    contact_id UUID REFERENCES contacts(id),
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    registration_source TEXT,
    guest_name TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    number_of_guests INTEGER DEFAULT 1,
    status TEXT DEFAULT 'registered',
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES profiles(id),
    payment_required BOOLEAN DEFAULT false,
    payment_status TEXT,
    payment_amount FLOAT,
    payment_transaction_id TEXT,
    dietary_restrictions TEXT,
    accessibility_needs TEXT,
    special_requests TEXT,
    confirmation_sent BOOLEAN DEFAULT false,
    confirmation_sent_at TIMESTAMPTZ,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMPTZ,
    volunteer_role TEXT,
    volunteer_shift_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create volunteer_shifts table
CREATE TABLE IF NOT EXISTS volunteer_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    volunteer_id UUID REFERENCES volunteers(id),
    role TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    volunteers_needed INTEGER DEFAULT 1,
    volunteers_assigned INTEGER DEFAULT 0,
    skills_required TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT DEFAULT 'scheduled',
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    checked_out BOOLEAN DEFAULT false,
    checked_out_at TIMESTAMPTZ,
    scheduled_hours FLOAT,
    actual_hours FLOAT,
    notes TEXT,
    volunteer_feedback TEXT,
    coordinator_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for volunteer_shifts in event_registrations
ALTER TABLE event_registrations
ADD CONSTRAINT fk_event_registration_shift
FOREIGN KEY (volunteer_shift_id) REFERENCES volunteer_shifts(id);

-- Platform admin tables
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0,
    conditions JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    org_id UUID REFERENCES organizations(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profiles_org_id ON profiles(org_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_contacts_org_id ON contacts(org_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_full_name ON contacts(first_name, last_name);
CREATE INDEX idx_volunteers_org_id ON volunteers(org_id);
CREATE INDEX idx_volunteers_email ON volunteers(email);
CREATE INDEX idx_events_org_id ON events(org_id);
CREATE INDEX idx_events_date_range ON events(start_date, end_date);
CREATE INDEX idx_donations_org_id ON donations(org_id);
CREATE INDEX idx_donations_date ON donations(donated_at);
CREATE INDEX idx_donations_amount ON donations(amount);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_volunteer_shifts_event_id ON volunteer_shifts(event_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can update own organization" ON organizations
    FOR UPDATE USING (id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Profiles: Users can see profiles in their organization
CREATE POLICY "Users can view profiles in same org" ON profiles
    FOR SELECT USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can update org profiles" ON profiles
    FOR UPDATE USING (
        org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Contacts: Organization-scoped access
CREATE POLICY "Users can view org contacts" ON contacts
    FOR ALL USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Volunteers: Organization-scoped access
CREATE POLICY "Users can view org volunteers" ON volunteers
    FOR ALL USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Events: Public events visible to all, private to org members
CREATE POLICY "Anyone can view public events" ON events
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view org events" ON events
    FOR SELECT USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can manage org events" ON events
    FOR ALL USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Donations: Organization-scoped access
CREATE POLICY "Users can view org donations" ON donations
    FOR ALL USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Event registrations: Users can see registrations for their org's events
CREATE POLICY "Users can view org event registrations" ON event_registrations
    FOR ALL USING (event_id IN (
        SELECT id FROM events WHERE org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    ));

-- Volunteer shifts: Same as event registrations
CREATE POLICY "Users can view org volunteer shifts" ON volunteer_shifts
    FOR ALL USING (event_id IN (
        SELECT id FROM events WHERE org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    ));

-- Feature flags: Only platform admins
CREATE POLICY "Platform admins can manage feature flags" ON feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'platform_admin'
        )
    );

-- Audit logs: Read-only for org members
CREATE POLICY "Users can view org audit logs" ON audit_logs
    FOR SELECT USING (org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
    ));

-- Functions

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, org_id)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE(
            (new.raw_user_meta_data->>'org_id')::uuid,
            (SELECT id FROM organizations WHERE is_active = true LIMIT 1)
        )
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volunteer_shifts_updated_at BEFORE UPDATE ON volunteer_shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Analytics function
CREATE OR REPLACE FUNCTION get_analytics_dashboard(
    p_org_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    result = jsonb_build_object(
        'total_contacts', (
            SELECT COUNT(*) FROM contacts 
            WHERE org_id = p_org_id 
            AND created_at BETWEEN p_start_date AND p_end_date
        ),
        'total_volunteers', (
            SELECT COUNT(*) FROM volunteers 
            WHERE org_id = p_org_id 
            AND created_at BETWEEN p_start_date AND p_end_date
        ),
        'total_events', (
            SELECT COUNT(*) FROM events 
            WHERE org_id = p_org_id 
            AND start_date BETWEEN p_start_date AND p_end_date
        ),
        'total_donations', (
            SELECT COALESCE(SUM(amount), 0) FROM donations 
            WHERE org_id = p_org_id 
            AND donated_at BETWEEN p_start_date AND p_end_date
            AND status = 'completed'
        ),
        'donation_count', (
            SELECT COUNT(*) FROM donations 
            WHERE org_id = p_org_id 
            AND donated_at BETWEEN p_start_date AND p_end_date
            AND status = 'completed'
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;