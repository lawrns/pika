# PIKA - Production Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files from backend
COPY backend/package*.json ./
RUN npm ci --include=prod

# Copy prisma schema for client generation
COPY backend/prisma ./prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 pika

# Copy backend source and generated prisma client
COPY --chown=pika:nodejs ./backend ./backend
COPY --from=deps --chown=pika:nodejs /app/node_modules ./backend/node_modules
COPY --from=deps --chown=pika:nodejs /app/prisma ./backend/prisma

USER pika

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["sh", "/app/backend/start.sh"]
