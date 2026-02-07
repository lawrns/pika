/**
 * Notification Service
 * Handles email, SMS, and push notifications
 */

import nodemailer from 'nodemailer';
import pool from '../config/database.js';

// Email transporter configuration
let emailTransporter = null;

if (process.env.SMTP_HOST) {
  emailTransporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Send email notification
 */
export async function sendEmail(to, subject, html, text) {
  if (!emailTransporter) {
    console.warn('Email service not configured');
    return { sent: false, error: 'Email service not configured' };
  }

  try {
    const result = await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@pika.mx',
      to,
      subject,
      text,
      html
    });

    console.log('Email sent:', result.messageId);
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send SMS notification (placeholder - requires SMS provider integration)
 */
export async function sendSMS(phone, message) {
  if (!process.env.SMS_PROVIDER_API_KEY) {
    console.warn('SMS service not configured');
    return { sent: false, error: 'SMS service not configured' };
  }

  try {
    // Integration with SMS provider (e.g., Twilio, MessageBird, etc.)
    // This is a placeholder implementation
    console.log(`SMS would be sent to ${phone}: ${message}`);
    return { sent: true, messageId: 'sms-placeholder' };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send push notification via FCM (Firebase Cloud Messaging)
 */
export async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!process.env.FCM_SERVER_KEY) {
    console.warn('FCM not configured');
    return { sent: false, error: 'FCM not configured' };
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: { title, body },
        data
      })
    });

    const result = await response.json();
    return { sent: result.success === 1, result };
  } catch (error) {
    console.error('Push notification error:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Create in-app notification
 */
export async function createNotification(userId, type, title, message, data = {}) {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, JSON.stringify(data)]
    );

    return { created: true, notification: result.rows[0] };
  } catch (error) {
    console.error('Create notification error:', error);
    return { created: false, error: error.message };
  }
}

/**
 * Send payment received notification
 */
export async function notifyPaymentReceived(userId, amount, currency, fromEmail) {
  try {
    // Get user preferences
    const userResult = await pool.query(
      'SELECT email, fcm_token, email_notifications FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const user = userResult.rows[0];
    const formattedAmount = (amount / 100).toFixed(2);

    // Create in-app notification
    await createNotification(
      userId,
      'PAYMENT_RECEIVED',
      'Payment Received',
      `You received ${currency} ${formattedAmount} from ${fromEmail}`,
      { amount, currency, fromEmail }
    );

    // Send email if enabled
    if (user.email_notifications) {
      await sendEmail(
        user.email,
        'Payment Received - Pika',
        `<h1>Payment Received</h1>
         <p>You received <strong>${currency} ${formattedAmount}</strong> from ${fromEmail}</p>
         <p>View your wallet at <a href="${process.env.FRONTEND_URL}/wallet">Pika</a></p>`,
        `Payment Received: ${currency} ${formattedAmount} from ${fromEmail}`
      );
    }

    // Send push notification if token exists
    if (user.fcm_token) {
      await sendPushNotification(
        user.fcm_token,
        'Payment Received',
        `You received ${currency} ${formattedAmount}`,
        { type: 'payment_received', amount, currency }
      );
    }
  } catch (error) {
    console.error('Payment received notification error:', error);
  }
}

/**
 * Send transfer sent notification
 */
export async function notifyTransferSent(userId, amount, currency, toEmail) {
  try {
    const userResult = await pool.query(
      'SELECT email, fcm_token, email_notifications FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const user = userResult.rows[0];
    const formattedAmount = (amount / 100).toFixed(2);

    await createNotification(
      userId,
      'TRANSFER_SENT',
      'Transfer Sent',
      `You sent ${currency} ${formattedAmount} to ${toEmail}`,
      { amount, currency, toEmail }
    );

    if (user.email_notifications) {
      await sendEmail(
        user.email,
        'Transfer Sent - Pika',
        `<h1>Transfer Sent</h1>
         <p>You sent <strong>${currency} ${formattedAmount}</strong> to ${toEmail}</p>
         <p>View your transactions at <a href="${process.env.FRONTEND_URL}/transactions">Pika</a></p>`,
        `Transfer Sent: ${currency} ${formattedAmount} to ${toEmail}`
      );
    }

    if (user.fcm_token) {
      await sendPushNotification(
        user.fcm_token,
        'Transfer Sent',
        `You sent ${currency} ${formattedAmount} to ${toEmail}`,
        { type: 'transfer_sent', amount, currency }
      );
    }
  } catch (error) {
    console.error('Transfer sent notification error:', error);
  }
}

/**
 * Notify low balance
 */
export async function notifyLowBalance(userId, balance, threshold = 10000) {
  if (balance > threshold) return;

  try {
    const userResult = await pool.query(
      'SELECT email, fcm_token, email_notifications FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const user = userResult.rows[0];
    const formattedBalance = (balance / 100).toFixed(2);

    await createNotification(
      userId,
      'LOW_BALANCE',
      'Low Balance Alert',
      `Your balance is low: ${formattedBalance}`,
      { balance, threshold }
    );

    if (user.email_notifications) {
      await sendEmail(
        user.email,
        'Low Balance Alert - Pika',
        `<h1>Low Balance Alert</h1>
         <p>Your wallet balance is <strong>MXN ${formattedBalance}</strong></p>
         <p>Top up your wallet at <a href="${process.env.FRONTEND_URL}/wallet">Pika</a></p>`,
        `Low Balance Alert: MXN ${formattedBalance}`
      );
    }

    if (user.fcm_token) {
      await sendPushNotification(
        user.fcm_token,
        'Low Balance',
        `Your balance is MXN ${formattedBalance}`,
        { type: 'low_balance', balance }
      );
    }
  } catch (error) {
    console.error('Low balance notification error:', error);
  }
}

/**
 * Get user notifications
 */
export async function getNotifications(userId, { limit = 20, offset = 0, unreadOnly = false } = {}) {
  try {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (unreadOnly) {
      query += ` AND read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get unread count
    const unreadResult = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );

    return {
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count)
    };
  } catch (error) {
    console.error('Get notifications error:', error);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId, userId) {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    return { updated: result.rows.length > 0, notification: result.rows[0] };
  } catch (error) {
    console.error('Mark notification read error:', error);
    return { updated: false };
  }
}

export default {
  sendEmail,
  sendSMS,
  sendPushNotification,
  createNotification,
  notifyPaymentReceived,
  notifyTransferSent,
  notifyLowBalance,
  getNotifications,
  markNotificationRead
};
