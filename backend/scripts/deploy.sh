#!/bin/bash

set -e

echo "🚀 Quick Deploy Script - Pika Backend"

# Deploy to Fly.io
flyctl deploy --app pika-backend

# Show status
echo ""
echo "📊 Deployment Status:"
flyctl status --app pika-backend

echo ""
echo "📝 Recent logs:"
flyctl logs --app pika-backend --lines 20
