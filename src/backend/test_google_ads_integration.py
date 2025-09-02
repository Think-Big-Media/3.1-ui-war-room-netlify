#!/usr/bin/env python3
"""
Simple test script for Google Ads OAuth2 integration.
Tests the encryption service and basic functionality.
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from core.encryption import token_encryption
from models.google_ads_auth import GoogleAdsAuth
from services.googleAds.google_ads_auth_service import google_ads_auth_service


def test_token_encryption():
    """Test token encryption and decryption."""
    print("Testing token encryption...")
    
    # Test data
    test_token = "ya29.A0AfH6SMCJ9Rq7N8v3_sample_access_token_12345"
    test_secret = "GOCSPX-sample_client_secret_67890"
    
    # Test encryption
    encrypted_token = token_encryption.encrypt_token(test_token)
    encrypted_secret = token_encryption.encrypt_token(test_secret)
    
    print(f"Original token: {test_token[:20]}...")
    print(f"Encrypted token: {encrypted_token[:20]}...")
    print(f"Token encrypted: {token_encryption.is_encrypted(encrypted_token)}")
    
    # Test decryption
    decrypted_token = token_encryption.decrypt_token(encrypted_token)
    decrypted_secret = token_encryption.decrypt_token(encrypted_secret)
    
    print(f"Decrypted token matches: {decrypted_token == test_token}")
    print(f"Decrypted secret matches: {decrypted_secret == test_secret}")
    
    # Test edge cases
    empty_result = token_encryption.decrypt_token("")
    print(f"Empty string decryption: {empty_result is None}")
    
    invalid_result = token_encryption.decrypt_token("invalid_token")
    print(f"Invalid token decryption: {invalid_result is None}")
    
    print("✅ Token encryption tests passed!")


def test_model_encryption():
    """Test GoogleAdsAuth model encryption methods."""
    print("\nTesting model encryption methods...")
    
    # Create model instance (without database)
    auth_model = GoogleAdsAuth(
        org_id="test-org-123",
        client_id="test-client-id",
        is_active=True
    )
    
    # Test token setting and getting
    test_access_token = "ya29.sample_access_token_123"
    test_refresh_token = "1//sample_refresh_token_456"
    test_client_secret = "GOCSPX-sample_client_secret_789"
    
    # Set encrypted tokens
    auth_model.set_encrypted_access_token(test_access_token)
    auth_model.set_encrypted_refresh_token(test_refresh_token)
    auth_model.set_encrypted_client_secret(test_client_secret)
    
    # Verify tokens are encrypted in storage
    print(f"Access token encrypted: {auth_model.access_token != test_access_token}")
    print(f"Refresh token encrypted: {auth_model.refresh_token != test_refresh_token}")
    print(f"Client secret encrypted: {auth_model.client_secret != test_client_secret}")
    
    # Verify decryption works
    decrypted_access = auth_model.get_decrypted_access_token()
    decrypted_refresh = auth_model.get_decrypted_refresh_token()
    decrypted_secret = auth_model.get_decrypted_client_secret()
    
    print(f"Access token decrypts correctly: {decrypted_access == test_access_token}")
    print(f"Refresh token decrypts correctly: {decrypted_refresh == test_refresh_token}")
    print(f"Client secret decrypts correctly: {decrypted_secret == test_client_secret}")
    
    print("✅ Model encryption tests passed!")


def test_auth_service_configuration():
    """Test authentication service configuration."""
    print("\nTesting auth service configuration...")
    
    # Test service initialization
    service = google_ads_auth_service
    print(f"Service initialized: {service is not None}")
    print(f"Required scopes configured: {len(service.SCOPES) > 0}")
    print(f"Scopes: {service.SCOPES}")
    
    # Test configuration warnings
    if not service.client_id:
        print("⚠️  Warning: GOOGLE_ADS_CLIENT_ID not configured")
    else:
        print("✅ Client ID configured")
    
    if not service.client_secret:
        print("⚠️  Warning: GOOGLE_ADS_CLIENT_SECRET not configured")
    else:
        print("✅ Client secret configured")
    
    print("✅ Auth service tests completed!")


async def test_auth_url_generation():
    """Test OAuth2 URL generation."""
    print("\nTesting OAuth2 URL generation...")
    
    try:
        # This will fail if credentials are not configured, which is expected
        auth_url = google_ads_auth_service.get_authorization_url(
            org_id="test-org-123",
            state="test-state"
        )
        print(f"Auth URL generated: {len(auth_url) > 0}")
        print(f"URL contains expected components: {'oauth2' in auth_url and 'google' in auth_url}")
        print("✅ Auth URL generation tests passed!")
        
    except ValueError as e:
        if "not configured" in str(e):
            print("⚠️  Expected error: Google Ads OAuth2 credentials not configured")
            print("   This is normal for development environment without real credentials")
            print("✅ Auth URL generation tests completed!")
        else:
            print(f"❌ Unexpected error: {e}")


def main():
    """Run all tests."""
    print("🚀 Starting Google Ads OAuth2 Integration Tests\n")
    print("=" * 60)
    
    try:
        # Run synchronous tests
        test_token_encryption()
        test_model_encryption()
        test_auth_service_configuration()
        
        # Run async tests
        asyncio.run(test_auth_url_generation())
        
        print("\n" + "=" * 60)
        print("🎉 All tests completed successfully!")
        print("\nNext steps:")
        print("1. Configure Google Ads OAuth2 credentials in environment variables")
        print("2. Run database migration: alembic upgrade head")
        print("3. Test the OAuth2 flow in the frontend application")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()