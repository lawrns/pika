import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis.js';
import pool from './config/database.js';
import securityConfig from './config/security.js';
import {
  pciComplianceHeaders,
  paymentSecurityHeaders,
  webhookSecurityHeaders,
  requestId,
  maskErrorData,
  auditLog
} from './middleware/securityHeaders.js';

import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import paymentRoutes from './routes/payments.js';
import qrRoutes from './routes/qr.js';
import webhookRoutes from './routes/webhooks.js';
import transactionRoutes from './routes/transactions.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

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
    const dbCheck = await pool.query('SELECT NOW()');

    let redisStatus = 'disconnected';
    try {
      await connectRedis();
      redisStatus = 'connected';
    } catch (error) {
      redisStatus = 'error';
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbCheck ? 'connected' : 'error',
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
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/webhooks', webhookRoutes); // Webhook handlers

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
    console.log('🚀 Starting Pika Backend...');

    await connectRedis();

    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

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

startServer();

export default app;
