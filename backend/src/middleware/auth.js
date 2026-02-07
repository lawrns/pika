import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import redisClient from '../config/redis.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Check if token is blacklisted (in Redis)
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export async function requireVerified(req, res, next) {
  if (!req.user.is_verified) {
    return res.status(403).json({ error: 'Email verification required' });
  }
  next();
}

export async function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  // Store session in Redis
  await redisClient.setEx(
    `session:${user.id}:${token.slice(-20)}`,
    7 * 24 * 60 * 60,
    JSON.stringify({ userId: user.id, createdAt: new Date().toISOString() })
  );

  return token;
}

export async function revokeToken(token) {
  const decoded = jwt.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);

  if (ttl > 0) {
    await redisClient.setEx(`blacklist:${token}`, ttl, 'revoked');
  }
}
