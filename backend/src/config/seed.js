#!/usr/bin/env node

import pool from './database.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create test user
    const passwordHash = await bcrypt.hash('Test123456!', 10);
    const userId = uuidv4();

    await pool.query(
      `INSERT INTO users (id, email, phone, password_hash, full_name, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      [userId, 'test@pika.mx', '+525512345678', passwordHash, 'Test User', true]
    );

    // Create wallet for test user
    await pool.query(
      `INSERT INTO wallets (user_id, balance, currency)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, 1000.00, 'MXN']
    );

    console.log('✅ Seed data created successfully');
    console.log('   Test user: test@pika.mx');
    console.log('   Test password: Test123456!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
