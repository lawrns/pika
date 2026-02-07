#!/bin/bash

# Run database migrations on Fly.io

echo "🔄 Running database migrations on Fly.io..."

flyctl ssh console --app pika-backend -C "node src/config/migrate.js"

echo "✅ Migrations completed"
