import crypto from 'crypto';

/**
 * Data encryption utilities for sensitive payment information
 * Implements RFC 4880-style encryption for data at rest
 * CRITICAL for PCI compliance and data protection
 */

class EncryptionManager {
  constructor() {
    // Use AES-256-GCM for authenticated encryption
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.authTagLength = 16; // 128 bits
  }

  /**
   * Get encryption key from environment
   * @returns {Buffer}
   */
  getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable not set');
    }

    // Derive a consistent 32-byte key from the environment variable
    return crypto.createHash('sha256')
      .update(key)
      .digest();
  }

  /**
   * Encrypt sensitive data
   * @param {string} plaintext - Data to encrypt
   * @returns {Object} - Encrypted data with IV and auth tag
   */
  encrypt(plaintext) {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);

      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: this.algorithm
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encrypted - Encrypted data (hex)
   * @param {string} iv - Initialization vector (hex)
   * @param {string} authTag - Authentication tag (hex)
   * @returns {string} - Decrypted plaintext
   */
  decrypt(encrypted, iv, authTag) {
    try {
      const key = this.getEncryptionKey();

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt a specific field in an object
   * @param {Object} obj - Object containing field
   * @param {string} fieldName - Name of field to encrypt
   * @returns {Object} - Object with encrypted field
   */
  encryptField(obj, fieldName) {
    if (!obj[fieldName]) {
      return obj;
    }

    const encrypted = this.encrypt(obj[fieldName]);

    return {
      ...obj,
      [`${fieldName}_encrypted`]: encrypted.encrypted,
      [`${fieldName}_iv`]: encrypted.iv,
      [`${fieldName}_auth_tag`]: encrypted.authTag
    };
  }

  /**
   * Decrypt a specific field in an object
   * @param {Object} obj - Object containing encrypted field
   * @param {string} fieldName - Name of field (without _encrypted suffix)
   * @returns {Object} - Object with decrypted field
   */
  decryptField(obj, fieldName) {
    const encryptedField = `${fieldName}_encrypted`;
    const ivField = `${fieldName}_iv`;
    const authTagField = `${fieldName}_auth_tag`;

    if (!obj[encryptedField] || !obj[ivField] || !obj[authTagField]) {
      return obj;
    }

    try {
      const decrypted = this.decrypt(
        obj[encryptedField],
        obj[ivField],
        obj[authTagField]
      );

      return {
        ...obj,
        [fieldName]: decrypted
      };
    } catch (error) {
      console.error(`Failed to decrypt field ${fieldName}:`, error);
      return obj;
    }
  }

  /**
   * Hash sensitive data for comparison (one-way)
   * Uses SHA-256 for deterministic hashing
   * @param {string} data - Data to hash
   * @param {string} salt - Optional salt
   * @returns {string} - Hex digest
   */
  hash(data, salt = '') {
    return crypto.createHash('sha256')
      .update(data + salt)
      .digest('hex');
  }

  /**
   * Generate a secure random token
   * @param {number} bytes - Number of bytes (default: 32)
   * @returns {string} - Hex-encoded random token
   */
  generateToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Mask sensitive data for logging
   * Shows first 4 and last 4 characters
   * @param {string} data - Sensitive data (e.g., credit card, account number)
   * @returns {string} - Masked string
   */
  maskSensitiveData(data) {
    if (!data || data.length < 8) {
      return '****';
    }

    const start = data.substring(0, 4);
    const end = data.substring(data.length - 4);
    const middle = '*'.repeat(data.length - 8);

    return `${start}${middle}${end}`;
  }

  /**
   * Validate encrypted data structure
   * @param {Object} encryptedData - Data to validate
   * @returns {boolean}
   */
  validateEncryptedData(encryptedData) {
    return !!(
      encryptedData &&
      encryptedData.encrypted &&
      encryptedData.iv &&
      encryptedData.authTag
    );
  }
}

// Singleton instance
const encryptionManager = new EncryptionManager();

export default encryptionManager;

/**
 * Helper function to encrypt sensitive fields before database storage
 * @param {Object} data - Data object
 * @param {string[]} fields - Array of field names to encrypt
 * @returns {Object} - Data with encrypted fields
 */
export function encryptSensitiveFields(data, fields = []) {
  let result = { ...data };

  for (const field of fields) {
    if (result[field]) {
      const encrypted = encryptionManager.encrypt(result[field]);
      result[`${field}_encrypted`] = encrypted.encrypted;
      result[`${field}_iv`] = encrypted.iv;
      result[`${field}_auth_tag`] = encrypted.authTag;
      delete result[field]; // Remove plaintext field
    }
  }

  return result;
}

/**
 * Helper function to decrypt sensitive fields after database retrieval
 * @param {Object} data - Data object with encrypted fields
 * @param {string[]} fields - Array of field names to decrypt
 * @returns {Object} - Data with decrypted fields
 */
export function decryptSensitiveFields(data, fields = []) {
  let result = { ...data };

  for (const field of fields) {
    const encryptedField = `${field}_encrypted`;
    const ivField = `${field}_iv`;
    const authTagField = `${field}_auth_tag`;

    if (result[encryptedField] && result[ivField] && result[authTagField]) {
      try {
        result[field] = encryptionManager.decrypt(
          result[encryptedField],
          result[ivField],
          result[authTagField]
        );
        delete result[encryptedField];
        delete result[ivField];
        delete result[authTagField];
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
      }
    }
  }

  return result;
}
