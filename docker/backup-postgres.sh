#!/usr/bin/env bash
# ContextOS Postgres backup script
# Usage: ./backup-postgres.sh [output_dir]
# Crontab example: 0 3 * * * /path/to/backup-postgres.sh /backups/contextos

set -euo pipefail

OUTPUT_DIR="${1:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
CONTAINER="${POSTGRES_CONTAINER:-contextos_postgres}"
DB_NAME="${POSTGRES_DB:-contextos}"
DB_USER="${POSTGRES_USER:-contextos}"

mkdir -p "$OUTPUT_DIR"

DATE=$(date -u +%Y%m%dT%H%M%SZ)
OUTPUT_FILE="$OUTPUT_DIR/contextos_${DATE}.sql.gz"

echo "[backup-postgres] starting → $OUTPUT_FILE"

docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --clean --if-exists \
  | gzip -9 > "$OUTPUT_FILE"

SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo "[backup-postgres] done · size $SIZE"

# Pruning
echo "[backup-postgres] pruning > $RETENTION_DAYS days"
find "$OUTPUT_DIR" -maxdepth 1 -name 'contextos_*.sql.gz' -type f -mtime "+$RETENTION_DAYS" -print -delete
