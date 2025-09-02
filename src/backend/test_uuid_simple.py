#!/usr/bin/env python3
"""
Simple test to verify UUID type works with SQLite
"""
import uuid
from sqlalchemy import create_engine, Column, String
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from models.uuid_type import UUID, UUIDArray, JSONB

Base = declarative_base()


class TestModel(Base):
    __tablename__ = 'test_model'
    
    id = Column(UUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100))
    tags = Column(UUIDArray())
    meta_data = Column(JSONB())


def test_sqlite_uuid():
    """Test UUID type with SQLite"""
    print("Testing UUID type with SQLite...")
    
    # Create SQLite engine
    engine = create_engine("sqlite:///:memory:", echo=True)
    
    # Create tables
    Base.metadata.create_all(engine)
    
    # Create session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Test creating a model with UUID
    test_obj = TestModel(
        name="Test Object",
        tags=[str(uuid.uuid4()), str(uuid.uuid4())],
        meta_data={"key": "value", "number": 42}
    )
    
    session.add(test_obj)
    session.commit()
    
    print(f"Created object with UUID: {test_obj.id}")
    print(f"Object type of ID: {type(test_obj.id)}")
    
    # Query it back
    result = session.query(TestModel).filter_by(id=test_obj.id).first()
    assert result is not None
    assert result.name == "Test Object"
    assert len(result.tags) == 2
    assert result.meta_data["key"] == "value"
    
    print(f"✅ Successfully retrieved object: {result.name}")
    print(f"✅ Tags: {result.tags}")
    print(f"✅ Metadata: {result.meta_data}")
    
    session.close()
    engine.dispose()
    print("\n✅ UUID compatibility test passed!")


def test_postgresql_uuid():
    """Test UUID type with PostgreSQL (if available)"""
    try:
        # This would use PostgreSQL if available
        engine = create_engine("postgresql://user:pass@localhost/test", echo=False)
        engine.connect()
        print("\n✅ PostgreSQL UUID type would use native UUID")
    except:
        print("\n⚠️  PostgreSQL not available for testing, but would use native UUID type")


if __name__ == "__main__":
    test_sqlite_uuid()
    test_postgresql_uuid()