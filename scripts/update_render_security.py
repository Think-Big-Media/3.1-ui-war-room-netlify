#!/usr/bin/env python3
"""Update Render security configuration for War Room"""
import os
import sys
import requests
import json

# Get API key from environment variable only (no hardcoded fallback)
API_KEY = os.environ.get('RENDER_API_KEY')
if not API_KEY:
    print("Error: RENDER_API_KEY environment variable is not set")
    print("Usage: export RENDER_API_KEY=your_api_key")
    sys.exit(1)

# Service IDs can be overridden via environment variables
SERVICE_ID = os.environ.get('RENDER_SERVICE_ID', 'srv-d1ub5iumcj7s73ebrpo0')
FRONTEND_SERVICE_ID = os.environ.get('RENDER_FRONTEND_SERVICE_ID', 'srv-d1ubheer433s73eipllg')

def update_env_vars(service_id, env_vars, service_name):
    """Update environment variables for a service"""
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    print(f"\n🔧 Updating {service_name} environment variables...")
    
    for key, value in env_vars.items():
        # First try to update existing
        url = f'https://api.render.com/v1/services/{service_id}/env-vars/{key}'
        response = requests.patch(url, headers=headers, json={'value': str(value)})
        
        if response.status_code == 200:
            print(f"  ✅ Updated {key}")
        else:
            # Try to create if update failed
            url = f'https://api.render.com/v1/services/{service_id}/env-vars'
            response = requests.post(url, headers=headers, json={'key': key, 'value': str(value)})
            if response.status_code in [200, 201]:
                print(f"  ✅ Created {key}")
            else:
                print(f"  ❌ Failed to set {key}")

def main():
    print("🔒 War Room Security Hardening - Phase 1")
    print("=" * 50)
    
    # Backend security environment variables
    backend_vars = {
        # Rate Limiting
        'RATE_LIMIT_ENABLED': 'true',
        'RATE_LIMIT_REQUESTS': '100',
        'RATE_LIMIT_WINDOW': '60',
        
        # CORS - Production only
        'BACKEND_CORS_ORIGINS': 'https://war-room-frontend-tzuk.onrender.com',
        
        # Security headers
        'SECURE_HEADERS_ENABLED': 'true',
        'ALLOWED_HOSTS': 'war-room-oa9t.onrender.com',
        
        # Session security
        'SESSION_COOKIE_SECURE': 'true',
        'SESSION_COOKIE_HTTPONLY': 'true',
        'SESSION_COOKIE_SAMESITE': 'strict',
        
        # Monitoring
        'LOG_LEVEL': 'WARNING',  # Reduce verbosity in production
        'LOG_SENSITIVE_DATA': 'false',
        
        # Database security
        'DATABASE_SSL_MODE': 'require',
    }
    
    # Frontend security environment variables
    frontend_vars = {
        # API endpoint
        'VITE_API_URL': 'https://war-room-oa9t.onrender.com',
        'VITE_API_TIMEOUT': '30000',
        
        # Security features
        'VITE_ENABLE_SECURITY_HEADERS': 'true',
        'VITE_CONTENT_SECURITY_POLICY': 'default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\';',
    }
    
    # Update backend
    update_env_vars(SERVICE_ID, backend_vars, "Backend")
    
    # Update frontend
    update_env_vars(FRONTEND_SERVICE_ID, frontend_vars, "Frontend")
    
    print("\n📋 Next Manual Steps:")
    print("1. Go to Render Dashboard")
    print("2. Trigger manual deploy for both services")
    print("3. Verify rate limiting is working")
    print("4. Test CORS restrictions")
    
    print("\n🔐 Security Recommendations:")
    print("- Set up Sentry for error tracking")
    print("- Configure PostHog for analytics")
    print("- Enable GitHub security alerts")
    print("- Schedule weekly security reviews")

if __name__ == "__main__":
    main()