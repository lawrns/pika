#!/bin/sh
set -e

echo "Syncing database schema..."
cd /app/backend
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss 2>&1
echo "Schema sync complete. Starting server..."
exec node src/server.js
