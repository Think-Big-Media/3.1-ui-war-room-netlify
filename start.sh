#!/bin/bash
# Render startup script - ensures correct directory
echo "Starting War Room server..."
echo "Current directory: $(pwd)"
echo "Contents of src/backend:"
ls -la src/backend/serve*.py || echo "No serve files found!"

# Navigate to backend and start server
cd src/backend && python serve_bulletproof.py
