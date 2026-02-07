#!/bin/bash

# Seed database on Fly.io

echo "🌱 Seeding database on Fly.io..."

flyctl ssh console --app pika-backend -C "node src/config/seed.js"

echo "✅ Seeding completed"
echo "📝 Test user: test@pika.mx / Test123456!"
