import { Client, Databases, Users, Storage } from 'node-appwrite';
import dotenv from 'dotenv';
import pool from '../config/database.js';


dotenv.config();

const hasAppwriteCredentials =
  process.env.APPWRITE_ENDPOINT &&
  process.env.APPWRITE_PROJECT_ID &&
  process.env.APPWRITE_API_KEY &&
  !process.env.APPWRITE_ENDPOINT.includes('placeholder') &&
  !process.env.APPWRITE_PROJECT_ID.includes('placeholder') &&
  !process.env.APPWRITE_API_KEY.includes('placeholder') &&
  !process.env.APPWRITE_API_KEY.includes('your_appwrite_api_key') &&
  process.env.APPWRITE_PROJECT_ID !== 'pika-production';

const hasPostgres = Boolean(process.env.DATABASE_URL);
let appwriteClient = null;
let databases = null;
let usersService = null;
let storage = null;
let postgresReady = false;

const mockDb = {
  users: new Map(),
  receiving_accounts: new Map(),
  payment_requests: new Map(),
  request_recipients: new Map(),
  payments: new Map(),
  ledger_events: new Map(),
  webhook_events: new Map(),
  share_events: new Map(),
  request_events: new Map(),
  contacts: new Map(),
  reminders: new Map(),
  receipts: new Map(),
  fraud_signals: new Map()
};

if (hasAppwriteCredentials) {
  try {
    appwriteClient = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    databases = new Databases(appwriteClient);
    usersService = new Users(appwriteClient);
    storage = new Storage(appwriteClient);

    console.log('✅ Appwrite client successfully initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Appwrite client:', error);
  }
} else if (hasPostgres) {
  console.log('✅ Appwrite credentials missing. Using PostgreSQL document store fallback.');
} else {
  console.log('⚠️ Appwrite/PostgreSQL credentials missing. Using local in-memory fallback database.');
}

async function ensurePostgresStore() {
  if (postgresReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS collection_documents (
      id TEXT PRIMARY KEY,
      collection_id TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_collection_documents_collection_id ON collection_documents(collection_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_collection_documents_data_gin ON collection_documents USING GIN(data)');
  postgresReady = true;
}

function withId(row) {
  return { $id: row.id, ...(row.data || {}) };
}

function uniqueId() {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const postgresDbImpl = {
  isMock: false,
  backend: 'postgres-document-store',
  listDocuments: async (collectionId) => {
    await ensurePostgresStore();
    const result = await pool.query(
      'SELECT id, data FROM collection_documents WHERE collection_id = $1 ORDER BY created_at ASC',
      [collectionId]
    );
    const documents = result.rows.map(withId);
    return { total: documents.length, documents };
  },
  createDocument: async (collectionId, documentId, data) => {
    await ensurePostgresStore();
    const id = documentId === 'unique()' ? uniqueId() : documentId;
    const now = new Date().toISOString();
    const doc = { $id: id, ...data, createdAt: data.createdAt || now, updatedAt: data.updatedAt || now };
    const stored = { ...doc };
    delete stored.$id;
    await pool.query(
      `INSERT INTO collection_documents (id, collection_id, data, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [id, collectionId, JSON.stringify(stored)]
    );
    return doc;
  },
  getDocument: async (collectionId, documentId) => {
    await ensurePostgresStore();
    const result = await pool.query(
      'SELECT id, data FROM collection_documents WHERE collection_id = $1 AND id = $2',
      [collectionId, documentId]
    );
    if (!result.rows[0]) throw new Error(`Document ${documentId} not found in ${collectionId}`);
    return withId(result.rows[0]);
  },
  updateDocument: async (collectionId, documentId, data) => {
    await ensurePostgresStore();
    const existing = await postgresDbImpl.getDocument(collectionId, documentId);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    const stored = { ...updated };
    delete stored.$id;
    await pool.query(
      'UPDATE collection_documents SET data = $3::jsonb, updated_at = NOW() WHERE collection_id = $1 AND id = $2',
      [collectionId, documentId, JSON.stringify(stored)]
    );
    return updated;
  },
  deleteDocument: async (collectionId, documentId) => {
    await ensurePostgresStore();
    await pool.query('DELETE FROM collection_documents WHERE collection_id = $1 AND id = $2', [collectionId, documentId]);
    return { success: true };
  }
};

const mockDbImpl = {
  isMock: true,
  backend: 'in-memory',
  listDocuments: async (collectionId) => {
    const docs = Array.from(mockDb[collectionId]?.values() || []);
    return { total: docs.length, documents: docs };
  },
  createDocument: async (collectionId, documentId, data) => {
    const id = documentId === 'unique()' ? uniqueId() : documentId;
    const doc = { $id: id, ...data, createdAt: data.createdAt || new Date().toISOString(), updatedAt: data.updatedAt || new Date().toISOString() };
    if (!mockDb[collectionId]) mockDb[collectionId] = new Map();
    mockDb[collectionId].set(id, doc);
    return doc;
  },
  getDocument: async (collectionId, documentId) => {
    const doc = mockDb[collectionId]?.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found in ${collectionId}`);
    return doc;
  },
  updateDocument: async (collectionId, documentId, data) => {
    const existing = mockDb[collectionId]?.get(documentId) || {};
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    if (!mockDb[collectionId]) mockDb[collectionId] = new Map();
    mockDb[collectionId].set(documentId, updated);
    return updated;
  },
  deleteDocument: async (collectionId, documentId) => {
    mockDb[collectionId]?.delete(documentId);
    return { success: true };
  }
};

export const getDatabase = () => {
  if (databases) {
    return {
      isMock: false,
      backend: 'appwrite',
      listDocuments: async (collectionId, queries = []) => databases.listDocuments('pika_main', collectionId, queries),
      createDocument: async (collectionId, documentId, data) => databases.createDocument('pika_main', collectionId, documentId, data),
      getDocument: async (collectionId, documentId) => databases.getDocument('pika_main', collectionId, documentId),
      updateDocument: async (collectionId, documentId, data) => databases.updateDocument('pika_main', collectionId, documentId, data),
      deleteDocument: async (collectionId, documentId) => databases.deleteDocument('pika_main', collectionId, documentId)
    };
  }

  if (hasPostgres) return postgresDbImpl;
  return mockDbImpl;
};

export const getStorage = () => {
  if (storage) return storage;
  return {
    isMock: true,
    createFile: async () => ({ $id: 'mock_file_id' }),
    getFileView: () => 'https://via.placeholder.com/300'
  };
};

export { appwriteClient, databases, usersService, storage };
