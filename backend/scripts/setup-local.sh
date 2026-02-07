#!/bin/bash

echo "🔧 Pika Backend - Local Development Setup"
echo "=========================================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js >= 18.0.0"
    exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Start PostgreSQL using Docker
echo ""
echo "📦 Starting PostgreSQL..."
docker run -d \
    --name pika-postgres \
    -e POSTGRES_USER=pika \
    -e POSTGRES_PASSWORD=pika123 \
    -e POSTGRES_DB=pika \
    -p 5432:5432 \
    postgres:15-alpine || echo "PostgreSQL might already be running"

# Start Redis using Docker
echo "📦 Starting Redis..."
docker run -d \
    --name pika-redis \
    -p 6379:6379 \
    redis:7-alpine || echo "Redis might already be running"

echo "⏳ Waiting for services to be ready..."
sleep 5

# Create .env file
echo ""
echo "📝 Creating .env file..."
cat > .env << EOF
NODE_ENV=development
PORT=8080
JWT_SECRET=dev-secret-change-in-production-$(openssl rand -base64 16)
DATABASE_URL=postgresql://pika:pika123@localhost:5432/pika
REDIS_URL=redis://localhost:6379
API_BASE_URL=http://localhost:8080
PAYMENT_LINK_EXPIRY_HOURS=24
SPEI_ENABLED=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
EOF

echo "✅ .env file created"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Run migrations
echo ""
echo "🔄 Running database migrations..."
npm run migrate

# Seed database
echo ""
echo "🌱 Seeding database..."
npm run seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "📚 Available commands:"
echo "   npm start      - Start production server"
echo "   npm run dev    - Start development server with hot reload"
echo "   npm run migrate - Run database migrations"
echo "   npm run seed   - Seed database with test data"
echo ""
echo "🧪 Test credentials:"
echo "   Email: test@pika.mx"
echo "   Password: Test123456!"
echo ""
echo "🛑 To stop services:"
echo "   docker stop pika-postgres pika-redis"
echo "   docker rm pika-postgres pika-redis"
