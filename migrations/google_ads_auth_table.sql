-- Migration: Add Google Ads authentication table
-- Created: 2024-08-07

-- Create google_ads_auth table
CREATE TABLE google_ads_auth (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL UNIQUE REFERENCES organizations(id),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    customer_id VARCHAR(50),
    developer_token VARCHAR(255),
    client_id VARCHAR(255) NOT NULL,
    client_secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    scopes JSON DEFAULT '[]'::json,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_google_ads_auth_org_id ON google_ads_auth(org_id);
CREATE INDEX idx_google_ads_auth_customer_id ON google_ads_auth(customer_id);
CREATE INDEX idx_google_ads_auth_active ON google_ads_auth(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_google_ads_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_google_ads_auth_updated_at
    BEFORE UPDATE ON google_ads_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_google_ads_auth_updated_at();