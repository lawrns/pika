import { Client, Databases, Users, Storage } from 'node-appwrite';
import dotenv from 'dotenv';

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

let appwriteClient = null;
let databases = null;
let usersService = null;
let storage = null;

// Clean mock database for in-memory fallback
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
  fraud_signals: []
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
} else {
  console.log('⚠️ Appwrite credentials missing. Using local in-memory fallback database.');
}

// Unified Database CRUD Helper - resolves to Appwrite or mock fallback
export const getDatabase = () => {
  const mockDbImpl = {
    isMock: true,
    listDocuments: async (collectionId) => {
      const docs = Array.from(mockDb[collectionId]?.values() || []);
      return { total: docs.length, documents: docs };
    },
    createDocument: async (collectionId, documentId, data) => {
      const id = documentId === 'unique()' ? 'doc_' + Math.random().toString(36).substring(2, 9) : documentId;
      const doc = { $id: id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
      mockDb[collectionId].set(documentId, updated);
      return updated;
    },
    deleteDocument: async (collectionId, documentId) => {
      mockDb[collectionId]?.delete(documentId);
      return { success: true };
    }
  };

  if (databases) {
    return {
      isMock: false,
      listDocuments: async (collectionId, queries = []) => {
        try {
          return await databases.listDocuments('pika_main', collectionId, queries);
        } catch (error) {
          console.warn(`⚠️ Appwrite listDocuments failed, falling back to mock: ${error.message}`);
          return mockDbImpl.listDocuments(collectionId);
        }
      },
      createDocument: async (collectionId, documentId, data) => {
        try {
          return await databases.createDocument('pika_main', collectionId, documentId, data);
        } catch (error) {
          console.warn(`⚠️ Appwrite createDocument failed, falling back to mock: ${error.message}`);
          return mockDbImpl.createDocument(collectionId, documentId, data);
        }
      },
      getDocument: async (collectionId, documentId) => {
        try {
          return await databases.getDocument('pika_main', collectionId, documentId);
        } catch (error) {
          console.warn(`⚠️ Appwrite getDocument failed, falling back to mock: ${error.message}`);
          return mockDbImpl.getDocument(collectionId, documentId);
        }
      },
      updateDocument: async (collectionId, documentId, data) => {
        try {
          return await databases.updateDocument('pika_main', collectionId, documentId, data);
        } catch (error) {
          console.warn(`⚠️ Appwrite updateDocument failed, falling back to mock: ${error.message}`);
          return mockDbImpl.updateDocument(collectionId, documentId, data);
        }
      },
      deleteDocument: async (collectionId, documentId) => {
        try {
          return await databases.deleteDocument('pika_main', collectionId, documentId);
        } catch (error) {
          console.warn(`⚠️ Appwrite deleteDocument failed, falling back to mock: ${error.message}`);
          return mockDbImpl.deleteDocument(collectionId, documentId);
        }
      }
    };
  }

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
