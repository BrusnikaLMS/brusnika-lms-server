#!/bin/bash
# Course Studio API — quick start script
set -e

echo "=== Course Studio API ==="

# Run migrations
echo "Running migrations..."
alembic upgrade head

# Start server
echo "Starting server on :8000..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
