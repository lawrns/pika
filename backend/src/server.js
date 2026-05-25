import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import securityConfig from './config/security.js';
import { assertEnvironment } from './config/env.js';
import { connectRedis } from './config/redis.js';
import { getDatabase } from './lib/appwrite.js';
import {
  pciComplianceHeaders,
  paymentSecurityHeaders,
  webhookSecurityHeaders,
  requestId,
  maskErrorData,
  auditLog
} from './middleware/securityHeaders.js';

import v1Routes from './routes/v1.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Coolify/Traefik terminates proxy traffic; required for accurate rate-limit IPs.
app.set('trust proxy', 1);

// Security middleware - PCI DSS compliant
app.use(requestId);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: securityConfig.cors.origin,
  credentials: securityConfig.cors.credentials,
  methods: securityConfig.cors.methods,
  allowedHeaders: securityConfig.cors.allowedHeaders
}));

// Request body size limits for security
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security headers for all routes
app.use(pciComplianceHeaders);

// Rate limiting with security configuration
const limiter = rateLimit({
  windowMs: securityConfig.rateLimits.general.windowMs,
  max: securityConfig.rateLimits.general.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(securityConfig.rateLimits.general.windowMs / 1000) + ' seconds'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Audit logging for security events
if (securityConfig.audit.logPaymentOperations) {
  app.use('/api/payments', auditLog('payment_operation'));
  app.use('/api/wallet', auditLog('wallet_operation'));
  app.use('/api/transactions', auditLog('transaction_operation'));
}

// Health check
app.get('/health', async (req, res) => {
  try {
    const db = getDatabase();
    const dbCheck = await db.listDocuments('users');

    let redisStatus = 'disconnected';
    try {
      redisStatus = await connectRedis() ? 'connected' : 'error';
    } catch (error) {
      redisStatus = 'error';
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbCheck ? (db.isMock ? 'mock-inmemory' : (db.backend || 'connected')) : 'error',
      redis: redisStatus,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API routes with security middleware
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1', v1Routes);
app.use('/', v1Routes); // Support /webhooks directly

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestId: req.id
  });
});

// Secure error handler (masks sensitive data in production)
app.use(maskErrorData);

// Start server
async function startServer() {
  try {
    assertEnvironment();
    console.log('🚀 Starting Pika Backend...');

    await connectRedis();

    const db = getDatabase();
    await db.listDocuments('users');
    console.log(`✅ Database connected (${db.isMock ? 'mock-inmemory' : 'appwrite'})`);

    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Server running');
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   API Base: ${process.env.API_BASE_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { startServer };
export default app;
