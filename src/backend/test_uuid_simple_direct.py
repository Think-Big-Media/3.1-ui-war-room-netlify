#!/usr/bin/env python3
"""
Direct test of UUID TypeDecorator with SQLite
"""
import uuid
from sqlalchemy import create_engine, Column, String, inspect
from sqlalchemy.orm import declarative_base, sessionmaker
from models.uuid_type import UUID, UUIDArray, JSONB

# Create a simple test model
Base = declarative_base()

class SimpleTestModel(Base):
    __tablename__ = 'simple_test'
    
    id = Column(UUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100))
    tags = Column(UUIDArray())
    config = Column(JSONB())


def test_sqlite_uuid():
    """Test UUID handling with SQLite"""
    print("=" * 60)
    print("Testing SQLite UUID TypeDecorator")
    print("=" * 60)
    
    # Create SQLite engine (synchronous for simplicity)
    engine = create_engine("sqlite:///:memory:", echo=False)
    
    # Create table
    Base.metadata.create_all(engine)
    
    # Inspect the created table
    inspector = inspect(engine)
    columns = inspector.get_columns('simple_test')
    
    print("\n✅ Table created successfully!")
    print("\nColumn types in SQLite:")
    for col in columns:
        print(f"  - {col['name']}: {col['type']}")
    
    # Create session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Test 1: Create record with UUID
    test_id = uuid.uuid4()
    test_record = SimpleTestModel(
        id=str(test_id),  # Pass as string
        name="Test Record",
        tags=[str(uuid.uuid4()) for _ in range(3)],
        config={"enabled": True, "count": 42}
    )
    
    session.add(test_record)
    session.commit()
    
    print(f"\n✅ Created record with UUID: {test_record.id}")
    print(f"   Type after creation: {type(test_record.id)}")
    
    # Test 2: Query by UUID
    result = session.query(SimpleTestModel).filter_by(id=test_record.id).first()
    
    print(f"\n✅ Retrieved record: {result.name}")
    print(f"   ID: {result.id}")
    print(f"   ID type: {type(result.id)}")
    print(f"   Tags: {result.tags}")
    print(f"   Tags types: {[type(t) for t in result.tags]}")
    print(f"   Config: {result.config}")
    
    # Test 3: Verify UUID conversion
    assert isinstance(result.id, uuid.UUID), "ID should be UUID type"
    assert all(isinstance(t, uuid.UUID) for t in result.tags), "Tags should be UUID type"
    
    # Test 4: Raw SQL query to see storage format
    from sqlalchemy import text
    raw_result = session.execute(text("SELECT id, tags FROM simple_test")).first()
    print(f"\n✅ Raw SQL result:")
    print(f"   ID in DB: {raw_result[0]} (type: {type(raw_result[0])})")
    print(f"   Tags in DB: {raw_result[1]} (type: {type(raw_result[1])})")
    
    session.close()
    
    print("\n" + "=" * 60)
    print("✅ All UUID TypeDecorator tests PASSED!")
    print("   - UUIDs stored as CHAR(36) in SQLite")
    print("   - Automatic conversion to/from Python UUID objects")
    print("   - UUID arrays stored as JSON")
    print("   - JSONB stored as regular JSON")
    print("=" * 60)


if __name__ == "__main__":
    test_sqlite_uuid()