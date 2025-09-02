"""
Token encryption utilities for secure storage of OAuth2 tokens.
Uses Fernet symmetric encryption for secure token storage.
"""

import os
import base64
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from .config import settings


class TokenEncryption:
    """Service for encrypting and decrypting OAuth2 tokens."""
    
    def __init__(self):
        """Initialize encryption service with key derivation."""
        self._fernet = None
        self._initialize_encryption()
    
    def _initialize_encryption(self) -> None:
        """Initialize Fernet encryption with derived key."""
        # Use SECRET_KEY as base for key derivation
        password = settings.SECRET_KEY.encode()
        
        # Use a fixed salt for consistency (in production, consider storing salt separately)
        salt = b'warroom_oauth2_salt_' + settings.SECRET_KEY[:16].encode()
        
        # Derive key using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(password))
        self._fernet = Fernet(key)
    
    def encrypt_token(self, token: str) -> str:
        """
        Encrypt a token string.
        
        Args:
            token: Plain text token to encrypt
            
        Returns:
            Base64 encoded encrypted token
        """
        if not token:
            return ""
        
        encrypted_bytes = self._fernet.encrypt(token.encode())
        return base64.urlsafe_b64encode(encrypted_bytes).decode()
    
    def decrypt_token(self, encrypted_token: str) -> Optional[str]:
        """
        Decrypt a token string.
        
        Args:
            encrypted_token: Base64 encoded encrypted token
            
        Returns:
            Decrypted token string or None if decryption fails
        """
        if not encrypted_token:
            return None
        
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_token.encode())
            decrypted_bytes = self._fernet.decrypt(encrypted_bytes)
            return decrypted_bytes.decode()
        except (InvalidToken, ValueError, Exception):
            # Token is invalid or corrupt
            return None
    
    def is_encrypted(self, token_value: str) -> bool:
        """
        Check if a token appears to be encrypted.
        
        Args:
            token_value: Token string to check
            
        Returns:
            True if token appears encrypted, False otherwise
        """
        if not token_value:
            return False
        
        # Encrypted tokens should be base64 and longer than typical tokens
        try:
            decoded = base64.urlsafe_b64decode(token_value.encode())
            return len(decoded) > 50  # Encrypted tokens are longer
        except (ValueError, Exception):
            return False


# Global encryption instance
token_encryption = TokenEncryption()