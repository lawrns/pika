import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

function normalize(row) {
  if (!row) return row;
  const reference = row.shortCode || row.slug;
  return {
    ...row,
    user_id: row.userId,
    reference_code: reference,
    expires_at: row.expiresAt,
    created_at: row.createdAt,
    status: row.isActive ? 'active' : 'cancelled'
  };
}

export class PaymentLink {
  static async generateReferenceCode() {
    const code = `PIKA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const exists = await pool.query('SELECT id FROM payment_links WHERE "shortCode" = $1 OR slug = $1', [code]);
    if (exists.rows.length > 0) return this.generateReferenceCode();
    return code;
  }

  static async create(userId, { amount, currency, description, expiresAt, metadata }) {
    const referenceCode = await this.generateReferenceCode();
    const result = await pool.query(
      `INSERT INTO payment_links (id, "userId", title, description, amount, currency, type, "shortCode", slug, "expiresAt", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'ONE_TIME', $7, $7, $8, true, NOW(), NOW())
       RETURNING *`,
      [uuidv4(), userId, description || 'Pika payment link', description || null, Math.round(Number(amount)), currency || 'MXN', referenceCode, expiresAt || null]
    );
    return normalize(result.rows[0]);
  }

  static async findByReferenceCode(code) {
    const result = await pool.query('SELECT * FROM payment_links WHERE "shortCode" = $1 OR slug = $1', [code]);
    return normalize(result.rows[0]);
  }

  static async findByUserId(userId, { limit = 10, offset = 0, status } = {}) {
    const activeClause = status ? ' AND "isActive" = $2' : '';
    const params = status ? [userId, status === 'active', limit, offset] : [userId, limit, offset];
    const lidx = status ? 3 : 2;
    const result = await pool.query(
      `SELECT * FROM payment_links WHERE "userId" = $1${activeClause} ORDER BY "createdAt" DESC LIMIT $${lidx} OFFSET $${lidx + 1}`,
      params
    );
    return result.rows.map(normalize);
  }

  static async markPaid(linkId) {
    const result = await pool.query('UPDATE payment_links SET "isActive" = false, "usedCount" = "usedCount" + 1, "updatedAt" = NOW() WHERE id = $1 RETURNING *', [linkId]);
    return normalize(result.rows[0]);
  }

  static async markExpired(linkId) {
    const result = await pool.query('UPDATE payment_links SET "isActive" = false, "updatedAt" = NOW() WHERE id = $1 RETURNING *', [linkId]);
    return normalize(result.rows[0]);
  }

  static async cancel(linkId) {
    const result = await pool.query('UPDATE payment_links SET "isActive" = false, "updatedAt" = NOW() WHERE id = $1 RETURNING *', [linkId]);
    return normalize(result.rows[0]);
  }

  static async isValid(link) {
    if (!link || !link.isActive) return false;
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      await this.markExpired(link.id);
      return false;
    }
    return true;
  }
}

export default PaymentLink;
