import express from 'express';
import bcrypt from 'bcrypt';
import { authenticateToken, requireVerified } from '../middleware/auth.js';
import { generalApiLimiter } from '../middleware/rateLimiter.js';
import pool from '../config/database.js';

const router = express.Router();

/**
 * Get user profile
 * GET /api/users/profile
 */
router.get('/profile',
  authenticateToken,
  generalApiLimiter,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT u.*, w.balance, w.currency as wallet_currency, w.is_active as wallet_active
         FROM users u
         LEFT JOIN wallets w ON w.user_id = u.id
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      // Get recent activity
      const activityResult = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_count,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_count,
          COUNT(*) as total_count
         FROM transactions
         WHERE user_id = $1`,
        [req.user.id]
      );

      res.json({
        profile: {
          id: user.id,
          email: user.email,
          emailVerified: user.email_verified,
          phone: user.phone,
          phoneVerified: user.phone_verified,
          name: user.name,
          businessName: user.business_name,
          avatar: user.avatar,
          role: user.role,
          rfc: user.rfc,
          taxId: user.tax_id,
          businessType: user.business_type,
          industry: user.industry,
          preferences: {
            currency: user.currency,
            language: user.language,
            timezone: user.timezone
          },
          notifications: {
            email: user.email_notifications,
            sms: user.sms_notifications
          },
          isActive: user.is_active,
          isOnboarded: user.is_onboarded,
          lastLoginAt: user.last_login_at,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        wallet: user.balance !== undefined ? {
          balance: user.balance,
          currency: user.wallet_currency,
          isActive: user.wallet_active
        } : null,
        activity: activityResult.rows[0]
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
);

/**
 * Update user profile
 * PUT /api/users/profile
 */
router.put('/profile',
  authenticateToken,
  generalApiLimiter,
  async (req, res) => {
    try {
      const {
        name,
        businessName,
        phone,
        avatar,
        rfc,
        taxId,
        businessType,
        industry,
        timezone,
        language
      } = req.body;

      // Validate RFC format if provided
      if (rfc) {
        const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
        if (!rfcRegex.test(rfc.toUpperCase())) {
          return res.status(400).json({ error: 'Invalid RFC format' });
        }
      }

      const result = await pool.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             business_name = COALESCE($2, business_name),
             phone = COALESCE($3, phone),
             avatar = COALESCE($4, avatar),
             rfc = COALESCE($5, rfc),
             tax_id = COALESCE($6, tax_id),
             business_type = COALESCE($7, business_type),
             industry = COALESCE($8, industry),
             timezone = COALESCE($9, timezone),
             language = COALESCE($10, language),
             updated_at = NOW()
         WHERE id = $11
         RETURNING id, email, name, business_name, phone, avatar, rfc, business_type, industry, timezone, language, updated_at`,
        [name, businessName, phone, avatar, rfc?.toUpperCase(), taxId, businessType, industry, timezone, language, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'Profile updated successfully',
        profile: result.rows[0]
      });
    } catch (error) {
      console.error('Update profile error:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'RFC or phone number already in use' });
      }
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/**
 * Update notification preferences
 * PUT /api/users/notifications
 */
router.put('/notifications',
  authenticateToken,
  generalApiLimiter,
  async (req, res) => {
    try {
      const { email, sms, fcmToken } = req.body;

      const result = await pool.query(
        `UPDATE users
         SET email_notifications = COALESCE($1, email_notifications),
             sms_notifications = COALESCE($2, sms_notifications),
             fcm_token = COALESCE($3, fcm_token),
             updated_at = NOW()
         WHERE id = $4
         RETURNING email_notifications, sms_notifications`,
        [email, sms, fcmToken, req.user.id]
      );

      res.json({
        message: 'Notification preferences updated',
        preferences: result.rows[0]
      });
    } catch (error) {
      console.error('Update notifications error:', error);
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  }
);

/**
 * Change password
 * PUT /api/users/password
 */
router.put('/password',
  authenticateToken,
  requireVerified,
  generalApiLimiter,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }

      // Get current password hash
      const userResult = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, req.user.id]
      );

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

/**
 * Get user settings
 * GET /api/users/settings
 */
router.get('/settings',
  authenticateToken,
  generalApiLimiter,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT 
           currency,
           language,
           timezone,
           email_notifications,
           sms_notifications
         FROM users
         WHERE id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const settings = result.rows[0];

      res.json({
        settings: {
          preferences: {
            currency: settings.currency,
            language: settings.language,
            timezone: settings.timezone
          },
          notifications: {
            email: settings.email_notifications,
            sms: settings.sms_notifications
          }
        }
      });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }
);

/**
 * Update user settings
 * PUT /api/users/settings
 */
router.put('/settings',
  authenticateToken,
  generalApiLimiter,
  async (req, res) => {
    try {
      const { currency, language, timezone } = req.body;

      // Validate currency
      const validCurrencies = ['MXN', 'USD'];
      if (currency && !validCurrencies.includes(currency)) {
        return res.status(400).json({ error: 'Invalid currency' });
      }

      // Validate language
      const validLanguages = ['es', 'en'];
      if (language && !validLanguages.includes(language)) {
        return res.status(400).json({ error: 'Invalid language' });
      }

      const result = await pool.query(
        `UPDATE users
         SET currency = COALESCE($1, currency),
             language = COALESCE($2, language),
             timezone = COALESCE($3, timezone),
             updated_at = NOW()
         WHERE id = $4
         RETURNING currency, language, timezone`,
        [currency, language, timezone, req.user.id]
      );

      res.json({
        message: 'Settings updated successfully',
        settings: result.rows[0]
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

/**
 * Update wallet limits
 * PUT /api/users/wallet-limits
 */
router.put('/wallet-limits',
  authenticateToken,
  requireVerified,
  generalApiLimiter,
  async (req, res) => {
    try {
      const { dailyLimit, monthlyLimit } = req.body;

      // Validate limits
      if (dailyLimit !== undefined && (dailyLimit < 0 || dailyLimit > 100000000)) {
        return res.status(400).json({ error: 'Invalid daily limit' });
      }

      if (monthlyLimit !== undefined && (monthlyLimit < 0 || monthlyLimit > 1000000000)) {
        return res.status(400).json({ error: 'Invalid monthly limit' });
      }

      const result = await pool.query(
        `UPDATE wallets
         SET daily_limit = COALESCE($1, daily_limit),
             monthly_limit = COALESCE($2, monthly_limit),
             updated_at = NOW()
         WHERE user_id = $3
         RETURNING daily_limit, monthly_limit, daily_used, monthly_used`,
        [dailyLimit, monthlyLimit, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      res.json({
        message: 'Wallet limits updated',
        limits: {
          daily: result.rows[0].daily_limit,
          monthly: result.rows[0].monthly_limit,
          dailyUsed: result.rows[0].daily_used,
          monthlyUsed: result.rows[0].monthly_used
        }
      });
    } catch (error) {
      console.error('Update wallet limits error:', error);
      res.status(500).json({ error: 'Failed to update wallet limits' });
    }
  }
);

/**
 * Delete account (soft delete)
 * DELETE /api/users/account
 */
router.delete('/account',
  authenticateToken,
  requireVerified,
  async (req, res) => {
    try {
      const { password, reason } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Password is required to delete account' });
      }

      // Verify password
      const userResult = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
      );

      const validPassword = await bcrypt.compare(password, userResult.rows[0].password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      // Check for pending transactions or balance
      const walletResult = await pool.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [req.user.id]
      );

      if (walletResult.rows.length > 0 && parseFloat(walletResult.rows[0].balance) > 0) {
        return res.status(400).json({
          error: 'Cannot delete account with remaining balance. Please withdraw or transfer funds first.'
        });
      }

      // Soft delete - deactivate account
      await pool.query(
        `UPDATE users
         SET is_active = false,
             email = CONCAT(email, '.inactive.', EXTRACT(EPOCH FROM NOW())),
             updated_at = NOW()
         WHERE id = $1`,
        [req.user.id]
      );

      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  }
);

export default router;
