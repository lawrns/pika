#!/bin/bash

set -e

echo "🚀 Pika Backend - Fly.io Deployment Script"
echo "============================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ flyctl not found${NC}"
    echo "Please install flyctl: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Login check
echo -e "${YELLOW}📋 Checking Fly.io authentication...${NC}"
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Fly.io:${NC}"
    flyctl auth login
fi

# Create PostgreSQL database
echo -e "${GREEN}📦 Creating PostgreSQL database...${NC}"
flyctl postgres create --cluster pika-db --region qro --vm-size shared-cpu-1x --volume-size 1 --initial-cluster-size 1 || echo "Database might already exist"

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 10

# Get database connection URL
DB_URL=$(flyctl postgres connect -a pika-db --command "SELECT 'connected'" 2>/dev/null && flyctl status --json -a pika-db | jq -r '.Hostname' || echo "")

if [ -n "$DB_URL" ]; then
    echo -e "${GREEN}✅ PostgreSQL database created${NC}"
    echo -e "${YELLOW}📝 Database URL: ${DB_URL}${NC}"
else
    echo -e "${YELLOW}⚠️  Please manually attach the database:${NC}"
    echo "flyctl postgres attach -a pika-backend pika-db"
fi

# Create Redis instance
echo -e "${GREEN}📦 Creating Redis instance...${NC}"
flyctl redis create --cluster pika-redis --region qro || echo "Redis might already exist"

# Wait for Redis
echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
sleep 5

# Get Redis URL
REDIS_URL=$(flyctl status --json -a pika-redis 2>/dev/null | jq -r '.Hostname' || echo "")

if [ -n "$REDIS_URL" ]; then
    echo -e "${GREEN}✅ Redis instance created${NC}"
    echo -e "${YELLOW}📝 Redis URL: redis://${REDIS_URL}:6379${NC}"
else
    echo -e "${YELLOW}⚠️  Please manually get Redis URL:${NC}"
    echo "flyctl status -a pika-redis"
fi

# Create secrets
echo -e "${GREEN}🔐 Setting up secrets...${NC}"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set secrets
flyctl secrets set JWT_SECRET="$JWT_SECRET" --app pika-backend
flyctl secrets set DATABASE_URL="postgresql://user:password@${DB_URL}:5432/pika?sslmode=require" --app pika-backend 2>/dev/null || echo "Please set DATABASE_URL manually"
flyctl secrets set REDIS_URL="redis://${REDIS_URL}:6379" --app pika-backend 2>/dev/null || echo "Please set REDIS_URL manually"
flyctl secrets set NODE_ENV="production" --app pika-backend
flyctl secrets set SPEI_ENABLED="false" --app pika-backend

echo -e "${GREEN}✅ Secrets configured${NC}"

# Deploy
echo -e "${GREEN}🚀 Deploying to Fly.io...${NC}"
flyctl deploy --app pika-backend

# Run migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
flyctl ssh console --app pika-backend -C "node src/config/migrate.js" || echo "Please run migrations manually after deployment"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Get your app URL: flyctl status -a pika-backend"
echo "2. Run migrations: flyctl ssh console -a pika-backend -C 'node src/config/migrate.js'"
echo "3. Set up DNS: flyctl ips allocate -a pika-backend"
echo "4. Monitor logs: flyctl logs -a pika-backend"
