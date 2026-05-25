#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/backend

# Resolve any previously failed migrations before deploying new ones
npx prisma migrate resolve --rolled-back "20240101000000_init" --schema=prisma/schema.prisma 2>/dev/null || true

npx prisma migrate deploy --schema=prisma/schema.prisma 2>&1
echo "Migrations complete. Starting server..."
exec node src/server.js
