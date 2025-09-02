#!/usr/bin/env python3
"""
Test script to verify UUID compatibility with SQLite
"""
import asyncio
import uuid
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from models.platform_admin import FeatureFlag, PlatformAuditLog

# Create a new base for testing to avoid loading all models
TestBase = declarative_base()


async def test_uuid_compatibility():
    """Test UUID fields work with SQLite"""
    print("Testing UUID compatibility with SQLite...")
    
    # Create SQLite engine
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=True)
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # Test creating a model with UUID
    async with async_session() as session:
        # Create a feature flag
        flag = FeatureFlag(
            flag_name="test_flag",
            description="Test feature flag",
            enabled=True,
            rollout_percentage=100
        )
        
        session.add(flag)
        await session.commit()
        
        print(f"Created feature flag with ID: {flag.id}")
        
        # Query it back
        result = await session.get(FeatureFlag, flag.id)
        assert result is not None
        assert result.flag_name == "test_flag"
        
        print(f"Successfully retrieved feature flag: {result.flag_name}")
    
    await engine.dispose()
    print("✅ UUID compatibility test passed!")


if __name__ == "__main__":
    asyncio.run(test_uuid_compatibility())