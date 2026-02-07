import pool from '../config/database.js';
import bcrypt from 'bcrypt';

export class User {
  static async create({ email, phone, password, fullName }) {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, phone, password_hash, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, phone, full_name, is_verified, created_at`,
      [email, phone || null, passwordHash, fullName || null]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, phone, full_name, is_verified, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findByPhone(phone) {
    const result = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateProfile(userId, { fullName, phone }) {
    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone)
       WHERE id = $3
       RETURNING id, email, phone, full_name, is_verified`,
      [fullName, phone, userId]
    );
    return result.rows[0];
  }

  static async markVerified(userId) {
    const result = await pool.query(
      'UPDATE users SET is_verified = true WHERE id = $1 RETURNING id, email, is_verified',
      [userId]
    );
    return result.rows[0];
  }
}

export default User;
