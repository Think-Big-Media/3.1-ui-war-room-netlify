"""
Test the minimal server locally to debug Render deployment issues.
"""
import os
import sys

print("=== Testing Local Environment ===")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"Python path: {sys.path}")

# Test imports
try:
    print("\nTesting FastAPI import...")
    from fastapi import FastAPI

    print("✓ FastAPI imported successfully")
except Exception as e:
    print(f"✗ FastAPI import failed: {e}")

try:
    print("\nTesting uvicorn import...")
    import uvicorn

    print("✓ Uvicorn imported successfully")
except Exception as e:
    print(f"✗ Uvicorn import failed: {e}")

try:
    print("\nTesting serve_minimal import...")
    from serve_minimal import app

    print("✓ serve_minimal.py imported successfully")
    print(f"  App title: {app.title}")
except Exception as e:
    print(f"✗ serve_minimal.py import failed: {e}")

print("\nEnvironment variables:")
print(f"  PORT: {os.environ.get('PORT', 'Not set')}")
print(f"  DATABASE_URL: {os.environ.get('DATABASE_URL', 'Not set')}")
print(f"  REDIS_URL: {os.environ.get('REDIS_URL', 'Not set')}")

print("\nTest complete!")
