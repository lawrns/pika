import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class PaymentLink {
  static async generateReferenceCode() {
    const code = `PIKA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const exists = await pool.query(
      'SELECT id FROM payment_links WHERE reference_code = $1',
      [code]
    );

    if (exists.rows.length > 0) {
      return this.generateReferenceCode();
    }

    return code;
  }

  static async create(userId, { amount, currency, description, expiresAt, metadata }) {
    const referenceCode = await this.generateReferenceCode();

    const result = await pool.query(
      `INSERT INTO payment_links (user_id, reference_code, amount, currency, description, expires_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, referenceCode, amount, currency || 'MXN', description, expiresAt, metadata]
    );

    return result.rows[0];
  }

  static async findByReferenceCode(code) {
    const result = await pool.query(
      'SELECT * FROM payment_links WHERE reference_code = $1',
      [code]
    );
    return result.rows[0];
  }

  static async findByUserId(userId, { limit = 10, offset = 0, status } = {}) {
    let query = 'SELECT * FROM payment_links WHERE user_id = $1';
    const params = [userId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async markPaid(linkId) {
    const result = await pool.query(
      'UPDATE payment_links SET status = $1 WHERE id = $2 RETURNING *',
      ['paid', linkId]
    );
    return result.rows[0];
  }

  static async markExpired(linkId) {
    const result = await pool.query(
      'UPDATE payment_links SET status = $1 WHERE id = $2 RETURNING *',
      ['expired', linkId]
    );
    return result.rows[0];
  }

  static async cancel(linkId) {
    const result = await pool.query(
      'UPDATE payment_links SET status = $1 WHERE id = $2 RETURNING *',
      ['cancelled', linkId]
    );
    return result.rows[0];
  }

  static async isValid(link) {
    if (!link || link.status !== 'active') {
      return false;
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      await this.markExpired(link.id);
      return false;
    }

    return true;
  }
}

export default PaymentLink;
