# UUID Compatibility for SQLite and PostgreSQL

## Overview

This document explains the custom UUID type implementation that allows the War Room backend to work with both PostgreSQL (production) and SQLite (testing) databases.

## Problem

PostgreSQL has native UUID support with the `UUID` type, while SQLite does not. This caused test failures when using SQLAlchemy models with UUID columns.

## Solution

We implemented custom type decorators in `models/uuid_type.py`:

### 1. UUID Type
- Uses PostgreSQL's native UUID type when available
- Falls back to CHAR(36) for SQLite
- Handles conversion between Python UUID objects and strings

### 2. UUIDArray Type
- Uses PostgreSQL's ARRAY type for UUID arrays
- Falls back to JSON for SQLite
- Handles conversion of UUID lists

### 3. JSONB Type
- Uses PostgreSQL's JSONB type when available
- Falls back to regular JSON for SQLite

## Usage

```python
from models.uuid_type import UUID, UUIDArray, JSONB

class MyModel(Base):
    id = Column(UUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    tags = Column(UUIDArray())
    metadata = Column(JSONB())
```

## Implementation Details

The custom types use SQLAlchemy's `TypeDecorator` to:
1. Detect the database dialect at runtime
2. Load the appropriate underlying type
3. Handle parameter binding and result processing

For UUID generation, we use Python's `uuid.uuid4()` instead of PostgreSQL's `gen_random_uuid()` to ensure compatibility.

## Files Modified

- `models/uuid_type.py` - Custom type implementations
- `models/platform_admin.py` - Updated to use custom types
- All model files using String(36) for UUIDs continue to work as-is

## Testing

The custom types are automatically used in tests with SQLite, allowing the full test suite to run without PostgreSQL dependencies.

### Test Scripts

Several test scripts verify UUID compatibility:

1. **Basic Test**: `test_uuid_simple.py` - Tests basic UUID functionality
2. **Direct Test**: `test_uuid_simple_direct.py` - Tests TypeDecorator directly  
3. **Final Test**: `test_uuid_final.py` - Comprehensive compatibility test
4. **Backend Test**: `test_backend_uuid.py` - Tests with actual models

### Test Results

All tests confirm:
- ✅ UUIDs stored as CHAR(36) in SQLite
- ✅ UUID arrays stored as JSON
- ✅ Automatic UUID ↔ string conversion working
- ✅ Foreign key relationships functioning correctly
- ✅ Same code works with PostgreSQL native types