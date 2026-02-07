#!/bin/bash

# Pika Backend Deployment Script for Fly.io
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT="${1:-production}"
APP_NAME="pika-backend"

echo "🚀 Deploying Pika Backend to Fly.io..."
echo "Environment: $ENVIRONMENT"
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Please install it:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Please login:"
    echo "   fly auth login"
    exit 1
fi

# Check if app exists
if ! fly apps list | grep -q "$APP_NAME"; then
    echo "📝 Creating new Fly.io app: $APP_NAME"
    fly apps create "$APP_NAME"
fi

echo "📦 Installing dependencies..."
npm ci

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🧪 Running health checks..."
npm run lint || echo "⚠️  Lint warnings found"

echo ""
echo "🔐 Checking required secrets..."

# Define required secrets
REQUIRED_SECRETS=(
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET"
    "ENCRYPTION_KEY"
    "SESSION_SECRET"
)

# Check if secrets are set
MISSING_SECRETS=()
for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! fly secrets list | grep -q "$secret"; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -ne 0 ]; then
    echo "⚠️  Missing required secrets:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "   - $secret"
    done
    echo ""
    echo "Set them with:"
    echo "   fly secrets set SECRET_NAME=value"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Deploying to Fly.io..."
fly deploy --app "$APP_NAME" --remote-only

echo ""
echo "⏳ Waiting for deployment to be healthy..."
sleep 10

# Check health
if fly status | grep -q "healthy"; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📊 App Status:"
    fly status
    echo ""
    echo "🌐 Application URL: https://$APP_NAME.fly.dev"
    echo "🔍 Health Check: https://$APP_NAME.fly.dev/health"
else
    echo "⚠️  Deployment may have issues. Check status:"
    fly status
    echo ""
    echo "📋 Recent logs:"
    fly logs --app "$APP_NAME" --tail 20
fi

echo ""
echo "✨ Deployment complete!"
