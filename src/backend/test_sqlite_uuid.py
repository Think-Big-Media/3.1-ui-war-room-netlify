#!/usr/bin/env python3
"""
Test SQLite UUID compatibility
"""
import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Import models that use UUID
from models.base import BaseModel as Base
from models.platform_admin import FeatureFlag


async def test_sqlite_uuid():
    """Test UUID handling with SQLite"""
    print("Testing SQLite UUID compatibility...")
    
    # Create SQLite engine
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=True)
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Create a feature flag with UUID
        flag = FeatureFlag(
            flag_name="test_flag",
            description="Test feature flag",
            enabled=True,
            rollout_percentage=100
        )
        
        session.add(flag)
        await session.commit()
        
        print(f"\n✅ Created feature flag with ID: {flag.id}")
        print(f"   ID type: {type(flag.id)}")
        
        # Query it back
        result = await session.execute(
            select(FeatureFlag).where(FeatureFlag.id == flag.id)
        )
        retrieved_flag = result.scalar_one()
        
        print(f"\n✅ Retrieved feature flag: {retrieved_flag.flag_name}")
        print(f"   ID: {retrieved_flag.id}")
        print(f"   ID type: {type(retrieved_flag.id)}")
        
        assert retrieved_flag.id == flag.id
        assert isinstance(retrieved_flag.id, uuid.UUID)
        
    await engine.dispose()
    print("\n✅ SQLite UUID compatibility test PASSED!")


if __name__ == "__main__":
    asyncio.run(test_sqlite_uuid())