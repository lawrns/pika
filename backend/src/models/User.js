import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../lib/appwrite.js';

const COLLECTION = 'users';

// Maps a stored document (appwrite/postgres-doc-store/in-memory) to the shape the
// rest of the codebase expects. Keeps the legacy snake_case accessors working.
function normalize(doc) {
  if (!doc) return null;
  return {
    id: doc.$id || doc.id,
    email: doc.email,
    phone: doc.phone || null,
    name: doc.name,
    full_name: doc.name,
    is_verified: Boolean(doc.emailVerified),
    password_hash: doc.passwordHash,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt
  };
}

async function listUsers() {
  const db = getDatabase();
  const { documents } = await db.listDocuments(COLLECTION);
  return documents || [];
}

export class User {
  static async create({ email, phone, password, fullName }) {
    const db = getDatabase();
    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const now = new Date().toISOString();
    const doc = await db.createDocument(COLLECTION, id, {
      email,
      phone: phone || null,
      passwordHash,
      name: fullName || email,
      currency: 'MXN',
      language: 'es',
      timezone: 'America/Mexico_City',
      emailVerified: null,
      createdAt: now,
      updatedAt: now
    });
    return normalize(doc);
  }

  static async findById(id) {
    if (!id) return null;
    const db = getDatabase();
    try {
      return normalize(await db.getDocument(COLLECTION, id));
    } catch {
      // Fall back to a scan in case the backing store keys documents differently.
      const match = (await listUsers()).find((u) => (u.$id || u.id) === id);
      return normalize(match);
    }
  }

  static async findByEmail(email) {
    if (!email) return null;
    const match = (await listUsers()).find((u) => u.email && u.email.toLowerCase() === String(email).toLowerCase());
    return normalize(match);
  }

  static async findByPhone(phone) {
    if (!phone) return null;
    const match = (await listUsers()).find((u) => u.phone === phone);
    return normalize(match);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    if (!hashedPassword) return false;
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateProfile(userId, { fullName, phone }) {
    const db = getDatabase();
    const updates = { updatedAt: new Date().toISOString() };
    if (fullName !== undefined && fullName !== null) updates.name = fullName;
    if (phone !== undefined && phone !== null) updates.phone = phone;
    const doc = await db.updateDocument(COLLECTION, userId, updates);
    return normalize(doc);
  }

  static async markVerified(userId) {
    const db = getDatabase();
    const doc = await db.updateDocument(COLLECTION, userId, {
      emailVerified: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return normalize(doc);
  }
}

export default User;
