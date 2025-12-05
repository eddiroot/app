#!/bin/bash
# Database Restore Script
# Restores a PostgreSQL dump to the eddi database
# Usage: npm run db:restore -- ./snapshots/eddi_snapshot_YYYYMMDD_HHMMSS.sql.gz

set -e

SNAPSHOT_FILE="$1"

if [ -z "$SNAPSHOT_FILE" ]; then
  ls -la ./snapshots/*.sql.gz 2>/dev/null || echo "   No snapshots found in ./snapshots/"
  exit 1
fi

if [ ! -f "$SNAPSHOT_FILE" ]; then
  echo "Error: Snapshot file not found: $SNAPSHOT_FILE"
  exit 1
fi

# Check if file is gzipped
if [[ "$SNAPSHOT_FILE" == *.gz ]]; then
  gunzip -c "$SNAPSHOT_FILE" | docker exec -i eddi-db-1 psql -U postgres -d eddi
else
  docker exec -i eddi-db-1 psql -U postgres -d eddi < "$SNAPSHOT_FILE"
fi
