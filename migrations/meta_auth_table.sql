-- Migration: Add Meta Business Suite authentication table
-- Created: 2025-01-01

-- Create meta_auth table
CREATE TABLE meta_auth (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL UNIQUE REFERENCES organizations(id),
    
    -- OAuth2 credentials (encrypted)
    access_token TEXT NOT NULL,
    refresh_token TEXT,  -- Meta may not provide refresh tokens
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Meta Business specific fields
    app_id VARCHAR(255) NOT NULL,  -- Meta App ID
    app_secret TEXT NOT NULL,      -- Encrypted App Secret
    ad_account_id VARCHAR(50),     -- Primary ad account ID
    business_id VARCHAR(50),       -- Business Manager ID
    
    -- Page access tokens (JSON field for storing page-specific tokens)
    page_access_tokens JSON DEFAULT '{}'::json,
    
    -- Token status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    
    -- Scopes and permissions granted
    scopes JSON DEFAULT '[]'::json,
    permissions JSON DEFAULT '[]'::json,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_meta_auth_org_id ON meta_auth(org_id);
CREATE INDEX idx_meta_auth_active ON meta_auth(is_active);
CREATE INDEX idx_meta_auth_expires ON meta_auth(token_expires_at);
CREATE INDEX idx_meta_auth_ad_account_id ON meta_auth(ad_account_id);
CREATE INDEX idx_meta_auth_business_id ON meta_auth(business_id);
CREATE INDEX idx_meta_auth_app_id ON meta_auth(app_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_meta_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meta_auth_updated_at
    BEFORE UPDATE ON meta_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_meta_auth_updated_at();