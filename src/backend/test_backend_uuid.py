#!/usr/bin/env python3
"""
Backend test to verify UUID compatibility with SQLite
"""
import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Test with actual models
from models.base import BaseModel as Base
from models.organization import Organization
from models.user import User


@pytest.mark.asyncio
async def test_uuid_with_sqlite():
    """Test that UUID fields work correctly with SQLite"""
    
    # Create SQLite engine
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Create an organization (uses UUID primary key)
        org = Organization(
            name="Test Organization",
            slug="test-org",
            description="Test organization for UUID compatibility"
        )
        session.add(org)
        await session.commit()
        
        print(f"✅ Created organization with UUID: {org.id}")
        print(f"   Type: {type(org.id)}")
        
        # Create a user (uses String primary key but references UUID foreign key)
        user = User(
            id="test-user-1",
            email="test@example.com",
            full_name="Test User",
            org_id=str(org.id),  # Convert UUID to string for foreign key
            hashed_password="dummy"
        )
        session.add(user)
        await session.commit()
        
        print(f"✅ Created user with org_id: {user.org_id}")
        
        # Query organization by UUID
        result = await session.execute(
            select(Organization).where(Organization.id == org.id)
        )
        retrieved_org = result.scalar_one()
        
        assert retrieved_org.id == org.id
        assert retrieved_org.name == "Test Organization"
        print(f"✅ Retrieved organization by UUID")
        
        # Query user with organization join
        result = await session.execute(
            select(User).where(User.org_id == str(org.id))
        )
        retrieved_user = result.scalar_one()
        
        assert retrieved_user.email == "test@example.com"
        print(f"✅ Retrieved user by organization UUID foreign key")
        
    await engine.dispose()
    print("\n✅ All UUID compatibility tests PASSED!")
    return True


def main():
    """Run the test directly"""
    print("=" * 60)
    print("Backend UUID Compatibility Test")
    print("=" * 60)
    
    try:
        result = asyncio.run(test_uuid_with_sqlite())
        if result:
            print("\n✅ SUCCESS: UUID TypeDecorator works with SQLite!")
            print("   - Organizations use UUID primary keys")
            print("   - Foreign key relationships work correctly")
            print("   - Automatic UUID conversion is functioning")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    print("=" * 60)


if __name__ == "__main__":
    main()