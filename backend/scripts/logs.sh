#!/bin/bash

# View live logs from Fly.io

echo "📊 Live logs from Pika Backend..."
echo "Press Ctrl+C to stop"
echo ""

flyctl logs --app pika-backend --tail
