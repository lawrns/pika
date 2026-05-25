import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

function normalize(row) {
  if (!row) return row;
  return {
    ...row,
    full_name: row.name,
    is_verified: Boolean(row.emailVerified),
    created_at: row.createdAt,
    password_hash: row.passwordHash
  };
}

export class User {
  static async create({ email, phone, password, fullName }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (id, email, phone, "passwordHash", name, currency, language, timezone, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'MXN', 'es', 'America/Mexico_City', NOW(), NOW(), NOW())
       RETURNING *`,
      [uuidv4(), email, phone || null, passwordHash, fullName || email]
    );
    return normalize(result.rows[0]);
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return normalize(result.rows[0]);
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return normalize(result.rows[0]);
  }

  static async findByPhone(phone) {
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return normalize(result.rows[0]);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    if (!hashedPassword) return false;
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateProfile(userId, { fullName, phone }) {
    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           "updatedAt" = NOW()
       WHERE id = $3
       RETURNING *`,
      [fullName, phone, userId]
    );
    return normalize(result.rows[0]);
  }

  static async markVerified(userId) {
    const result = await pool.query(
      'UPDATE users SET "emailVerified" = NOW(), "updatedAt" = NOW() WHERE id = $1 RETURNING *',
      [userId]
    );
    return normalize(result.rows[0]);
  }
}

export default User;
