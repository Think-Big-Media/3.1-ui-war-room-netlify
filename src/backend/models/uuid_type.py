"""
Custom UUID type that works with both PostgreSQL and SQLite.
"""
import uuid
import json
from sqlalchemy import String, TypeDecorator, CHAR, JSON, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID, ARRAY, JSONB as PGJSONB


def gen_random_uuid():
    """Generate a random UUID.
    
    Uses PostgreSQL's gen_random_uuid() when available,
    otherwise generates a Python UUID.
    """
    return text("gen_random_uuid()")


class UUID(TypeDecorator):
    """Platform-agnostic UUID type.
    
    Uses PostgreSQL's native UUID type when available,
    otherwise stores as a CHAR(36) string.
    """
    
    impl = CHAR(36)
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        """Load the appropriate type based on the database dialect."""
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PGUUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))
    
    def process_bind_param(self, value, dialect):
        """Process value before saving to database."""
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            # For SQLite and other databases, convert UUID to string
            if isinstance(value, uuid.UUID):
                return str(value)
            else:
                return value
    
    def process_result_value(self, value, dialect):
        """Process value after loading from database."""
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            # For SQLite and other databases, convert string to UUID
            if isinstance(value, str):
                return uuid.UUID(value)
            else:
                return value


class UUIDArray(TypeDecorator):
    """Platform-agnostic UUID array type.
    
    Uses PostgreSQL's native ARRAY type when available,
    otherwise stores as JSON.
    """
    
    impl = JSON
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        """Load the appropriate type based on the database dialect."""
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(ARRAY(PGUUID(as_uuid=True)))
        else:
            return dialect.type_descriptor(JSON)
    
    def process_bind_param(self, value, dialect):
        """Process value before saving to database."""
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            # For SQLite and other databases, convert UUIDs to strings
            if isinstance(value, list):
                return [str(v) if isinstance(v, uuid.UUID) else v for v in value]
            else:
                return value
    
    def process_result_value(self, value, dialect):
        """Process value after loading from database."""
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            # For SQLite and other databases, convert strings to UUIDs
            if isinstance(value, list):
                return [uuid.UUID(v) if isinstance(v, str) else v for v in value]
            else:
                return value


class JSONB(TypeDecorator):
    """Platform-agnostic JSONB type.
    
    Uses PostgreSQL's native JSONB type when available,
    otherwise stores as regular JSON.
    """
    
    impl = JSON
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        """Load the appropriate type based on the database dialect."""
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PGJSONB)
        else:
            return dialect.type_descriptor(JSON)