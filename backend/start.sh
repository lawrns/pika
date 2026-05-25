#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/backend
npx prisma migrate deploy --schema=prisma/schema.prisma 2>&1
echo "Migrations complete. Starting server..."
exec node src/server.js
