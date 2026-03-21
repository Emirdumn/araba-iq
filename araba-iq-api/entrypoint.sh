#!/bin/sh
set -e

echo "Running Alembic migrations..."
alembic upgrade head

if [ "${SEED_DEMO:-false}" = "true" ]; then
  echo "Seeding demo data..."
  PYTHONPATH=. python scripts/seed_demo.py
fi

echo "Starting uvicorn on port 8100..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8100 "$@"
