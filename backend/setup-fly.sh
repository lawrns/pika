#!/bin/bash

# Fly.io Setup Script for Pika Backend
# Run this once to set up the infrastructure

set -e

echo "🚀 Setting up Pika Backend on Fly.io..."
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Installing..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

# Login to Fly.io
echo "🔐 Please login to Fly.io:"
fly auth login

APP_NAME="pika-backend"
DB_NAME="pika-db"
REDIS_NAME="pika-redis"

echo ""
echo "📦 Creating application: $APP_NAME"
fly apps create "$APP_NAME" --machines || echo "App already exists"

echo ""
echo "🗄️  Creating PostgreSQL database: $DB_NAME"
if ! fly postgres list | grep -q "$DB_NAME"; then
    fly postgres create \
        --name "$DB_NAME" \
        --region qro \
        --vm-size shared-cpu-1x \
        --volume-size 10 \
        --initial-cluster-size 1
else
    echo "Database already exists"
fi

echo ""
echo "🔗 Attaching database to app..."
fly postgres attach "$DB_NAME" --app "$APP_NAME" || echo "Already attached"

echo ""
echo "⚡ Creating Redis instance: $REDIS_NAME"
if ! fly redis list | grep -q "$REDIS_NAME"; then
    fly redis create \
        --name "$REDIS_NAME" \
        --region qro \
        --vm-size shared-cpu-1x
else
    echo "Redis already exists"
fi

echo ""
echo "🔗 Attaching Redis to app..."
fly redis attach "$REDIS_NAME" --app "$APP_NAME" || echo "Already attached"

echo ""
echo "🔐 Setting up secrets..."
echo "You'll need to provide the following secrets:"
echo ""

# Generate random secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 24 | cut -c1-32)

# Set required secrets
fly secrets set --app "$APP_NAME" \
    JWT_SECRET="$JWT_SECRET" \
    SESSION_SECRET="$SESSION_SECRET" \
    ENCRYPTION_KEY="$ENCRYPTION_KEY" \
    API_BASE_URL="https://$APP_NAME.fly.dev"

echo ""
echo "⚠️  IMPORTANT: Set your payment provider secrets:"
echo ""
echo "  fly secrets set --app $APP_NAME STRIPE_SECRET_KEY=sk_..."
echo "  fly secrets set --app $APP_NAME STRIPE_WEBHOOK_SECRET=whsec_..."
echo "  fly secrets set --app $APP_NAME MERCADOPAGO_ACCESS_TOKEN=APP_USR-..."
echo "  fly secrets set --app $APP_NAME STIPAGO_API_KEY=..."
echo "  fly secrets set --app $APP_NAME STIPAGO_SECRET_KEY=..."
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Set your payment provider secrets (see above)"
echo "  2. Deploy the application: ./deploy.sh"
echo "  3. Run migrations: fly ssh console --app $APP_NAME -C 'npm run db:migrate'"
echo "  4. (Optional) Seed database: fly ssh console --app $APP_NAME -C 'npm run prisma:seed'"
echo ""
echo "📚 Documentation:"
echo "  - API Health: https://$APP_NAME.fly.dev/health"
echo "  - Fly Dashboard: https://fly.io/apps/$APP_NAME"
