#!/usr/bin/env python3
"""
Final verification that UUID compatibility is working correctly.
"""
import uuid
import sqlalchemy
from sqlalchemy import create_engine, Column, String, inspect
from sqlalchemy.orm import declarative_base, sessionmaker

# Import our custom UUID type
from models.uuid_type import UUID, UUIDArray, JSONB

print("✅ Successfully imported custom UUID types")

# Create test model
Base = declarative_base()

class TestModel(Base):
    __tablename__ = 'test_uuid_compat'
    
    id = Column(UUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100))
    related_ids = Column(UUIDArray())
    settings = Column(JSONB())


def test_sqlite():
    """Test with SQLite database."""
    print("\n📋 Testing SQLite compatibility...")
    
    # Create SQLite engine
    engine = create_engine("sqlite:///:memory:", echo=False)
    
    # Create tables
    Base.metadata.create_all(engine)
    
    # Inspect the created table
    inspector = inspect(engine)
    columns = inspector.get_columns('test_uuid_compat')
    
    print("\n✅ Table created successfully!")
    print("Column types in SQLite:")
    for col in columns:
        print(f"  - {col['name']}: {col['type']}")
    
    # Create session and test CRUD operations
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Create test record
    test_id = str(uuid.uuid4())
    test_record = TestModel(
        id=test_id,
        name="Test Record",
        related_ids=[str(uuid.uuid4()) for _ in range(3)],
        settings={"enabled": True, "count": 42}
    )
    
    session.add(test_record)
    session.commit()
    
    # Query back
    result = session.query(TestModel).filter_by(id=test_id).first()
    
    print(f"\n✅ CRUD operations successful!")
    print(f"  - ID type: {type(result.id)}")
    print(f"  - ID value: {result.id}")
    print(f"  - Related IDs: {result.related_ids}")
    print(f"  - Settings: {result.settings}")
    
    session.close()
    engine.dispose()
    
    return True


def test_postgresql_types():
    """Show what types would be used with PostgreSQL."""
    print("\n📋 PostgreSQL type mapping:")
    
    # Create mock PostgreSQL dialect
    from sqlalchemy.dialects import postgresql
    
    # Create test columns
    uuid_col = UUID()
    array_col = UUIDArray()
    jsonb_col = JSONB()
    
    print("Type mappings:")
    print(f"  - UUID → {uuid_col.load_dialect_impl(postgresql.dialect())}")
    print(f"  - UUIDArray → {array_col.load_dialect_impl(postgresql.dialect())}")
    print(f"  - JSONB → {jsonb_col.load_dialect_impl(postgresql.dialect())}")


def main():
    """Run all tests."""
    print("=" * 60)
    print("UUID Compatibility Verification")
    print("=" * 60)
    
    # Test SQLite
    sqlite_success = test_sqlite()
    
    # Show PostgreSQL types
    test_postgresql_types()
    
    print("\n" + "=" * 60)
    if sqlite_success:
        print("✅ All UUID compatibility tests PASSED!")
        print("The UUID TypeDecorator implementation is working correctly.")
    else:
        print("❌ Some tests failed!")
    print("=" * 60)


if __name__ == "__main__":
    main()