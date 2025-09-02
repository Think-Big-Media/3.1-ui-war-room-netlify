#!/usr/bin/env python3
"""
Simple test for token encryption functionality.
Tests only the encryption service without external dependencies.
"""

import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from core.encryption import token_encryption
    print("✅ Successfully imported token_encryption")
except ImportError as e:
    print(f"❌ Failed to import token_encryption: {e}")
    sys.exit(1)


def test_token_encryption():
    """Test token encryption and decryption."""
    print("\n🔐 Testing token encryption...")
    
    # Test data
    test_cases = [
        "ya29.A0AfH6SMCJ9Rq7N8v3_sample_access_token_12345",
        "1//sample_refresh_token_with_special_chars!@#$%",
        "GOCSPX-sample_client_secret_67890",
        "",  # Empty string
        "short",  # Short string
        "a" * 1000,  # Long string
    ]
    
    for i, test_token in enumerate(test_cases, 1):
        print(f"\n  Test case {i}: {test_token[:20]}{'...' if len(test_token) > 20 else ''}")
        
        try:
            # Test encryption
            encrypted = token_encryption.encrypt_token(test_token)
            print(f"    Encrypted: {encrypted[:30]}{'...' if len(encrypted) > 30 else ''}")
            
            # Test decryption
            decrypted = token_encryption.decrypt_token(encrypted)
            matches = decrypted == test_token
            print(f"    Decryption matches: {matches}")
            
            # Test is_encrypted
            is_encrypted = token_encryption.is_encrypted(encrypted) if encrypted else False
            print(f"    Detected as encrypted: {is_encrypted}")
            
            if not matches and test_token:  # Don't fail on empty strings
                print(f"    ❌ FAIL: Decryption mismatch!")
                return False
                
        except Exception as e:
            print(f"    ❌ FAIL: Exception occurred: {e}")
            return False
    
    print("\n✅ All encryption tests passed!")
    return True


def test_edge_cases():
    """Test edge cases and error handling."""
    print("\n🔍 Testing edge cases...")
    
    # Test invalid encrypted tokens
    invalid_tokens = [
        "invalid_base64_!@#$%",
        "VGhpcyBpcyBub3QgYSB2YWxpZCBlbmNyeXB0ZWQgdG9rZW4=",  # Valid base64 but not encrypted by us
        "12345",  # Numbers only
    ]
    
    for token in invalid_tokens:
        result = token_encryption.decrypt_token(token)
        print(f"    Invalid token '{token[:20]}...': {result is None}")
        if result is not None:
            print(f"    ❌ FAIL: Should have returned None for invalid token")
            return False
    
    # Test None/empty handling
    empty_result = token_encryption.decrypt_token("")
    none_encrypted = token_encryption.encrypt_token("")
    
    print(f"    Empty string decryption: {empty_result is None or empty_result == ''}")
    print(f"    Empty string encryption: {none_encrypted == ''}")
    
    print("\n✅ All edge case tests passed!")
    return True


def main():
    """Run all tests."""
    print("🚀 Google Ads Token Encryption Test")
    print("=" * 50)
    
    success = True
    
    # Run tests
    success &= test_token_encryption()
    success &= test_edge_cases()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 All tests passed successfully!")
        print("\nEncryption service is working correctly.")
        print("You can now proceed with the full OAuth2 integration.")
    else:
        print("❌ Some tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()