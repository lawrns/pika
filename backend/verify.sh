#!/bin/bash

# Pika Backend Verification Script
# Run this before deployment to ensure everything is configured

echo "🔍 Verifying Pika Backend Configuration..."
echo ""

ERRORS=0
WARNINGS=0

# Check Node.js version
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo "  ✅ Node.js $(node --version)"
    else
        echo "  ❌ Node.js 18+ required (found $(node --version))"
        ((ERRORS++))
    fi
else
    echo "  ❌ Node.js not found"
    ((ERRORS++))
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    echo "  ✅ npm $(npm --version)"
else
    echo "  ❌ npm not found"
    ((ERRORS++))
fi

# Check package.json
echo "Checking package.json..."
if [ -f "package.json" ]; then
    echo "  ✅ package.json exists"
else
    echo "  ❌ package.json not found"
    ((ERRORS++))
fi

# Check critical files
echo "Checking source files..."
FILES=(
    "src/server.js"
    "src/routes/auth.js"
    "src/routes/wallet.js"
    "src/routes/payments.js"
    "src/routes/qr.js"
    "src/routes/webhooks.js"
    "src/config/database.js"
    "src/config/redis.js"
    "src/config/security.js"
    "src/middleware/auth.js"
    "src/middleware/validation.js"
    "src/middleware/rateLimiter.js"
    "src/middleware/securityHeaders.js"
    "src/models/User.js"
    "src/models/Wallet.js"
    "src/models/Transaction.js"
    "src/models/PaymentLink.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file not found"
        ((ERRORS++))
    fi
done

# Check Prisma schema
echo "Checking Prisma configuration..."
if [ -f "prisma/schema.prisma" ]; then
    echo "  ✅ prisma/schema.prisma exists"
else
    echo "  ❌ prisma/schema.prisma not found"
    ((ERRORS++))
fi

# Check Dockerfile
echo "Checking Docker configuration..."
if [ -f "Dockerfile" ]; then
    echo "  ✅ Dockerfile exists"
else
    echo "  ❌ Dockerfile not found"
    ((ERRORS++))
fi

if [ -f ".dockerignore" ]; then
    echo "  ✅ .dockerignore exists"
else
    echo "  ⚠️  .dockerignore not found"
    ((WARNINGS++))
fi

# Check Fly.io config
echo "Checking Fly.io configuration..."
if [ -f "fly.toml" ]; then
    echo "  ✅ fly.toml exists"
else
    echo "  ❌ fly.toml not found"
    ((ERRORS++))
fi

# Check environment template
echo "Checking environment configuration..."
if [ -f ".env.example" ]; then
    echo "  ✅ .env.example exists"
else
    echo "  ⚠️  .env.example not found"
    ((WARNINGS++))
fi

if [ -f ".env" ]; then
    echo "  ✅ .env exists (local development)"
    # Check for required variables
    REQUIRED_VARS=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "ENCRYPTION_KEY"
    )
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$VAR=" .env 2>/dev/null || grep -q "^$VAR =" .env 2>/dev/null; then
            echo "    ✅ $VAR is set"
        else
            echo "    ⚠️  $VAR may not be set"
            ((WARNINGS++))
        fi
    done
else
    echo "  ⚠️  .env not found (create from .env.example for local development)"
    ((WARNINGS++))
fi

# Check deployment scripts
echo "Checking deployment scripts..."
if [ -f "deploy.sh" ]; then
    echo "  ✅ deploy.sh exists"
else
    echo "  ⚠️  deploy.sh not found"
    ((WARNINGS++))
fi

if [ -f "setup-fly.sh" ]; then
    echo "  ✅ setup-fly.sh exists"
else
    echo "  ⚠️  setup-fly.sh not found"
    ((WARNINGS++))
fi

echo ""
echo "📊 Summary:"
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo ""
    echo "✅ All checks passed! Ready for deployment."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo ""
    echo "⚠️  Checks passed with warnings. Review before deployment."
    exit 0
else
    echo ""
    echo "❌ Checks failed. Please fix errors before deployment."
    exit 1
fi
