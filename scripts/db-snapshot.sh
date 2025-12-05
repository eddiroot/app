#!/bin/bash
# Database Snapshot Script
# Creates a PostgreSQL dump of the eddi database including embeddings
# Usage: npm run db:snapshot

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_DIR="./snapshots"
SNAPSHOT_FILE="${SNAPSHOT_DIR}/eddi_snapshot_${TIMESTAMP}.sql"

# Create snapshots directory if it doesn't exist
mkdir -p "$SNAPSHOT_DIR"

# Use pg_dump via docker exec to create a full dump
docker exec eddi-db-1 pg_dump \
  -U postgres \
  -d eddi \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > "$SNAPSHOT_FILE"

# Compress the snapshot
gzip -f "$SNAPSHOT_FILE"
COMPRESSED_FILE="${SNAPSHOT_FILE}.gz"

# Get file size
FILE_SIZE=$(ls -lh "$COMPRESSED_FILE" | awk '{print $5}')

