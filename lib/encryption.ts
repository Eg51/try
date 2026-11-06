// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // For GCM, 12 bytes is recommended
const AUTH_TAG_LENGTH = 16;

// Ensure the key is exactly 32 bytes (64 hex characters)
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY is missing from environment variables.");
  }
  const buffer = Buffer.from(key, 'hex');
  if (buffer.length !== 32) {
    throw new Error(`Invalid ENCRYPTION_KEY length: ${buffer.length} bytes. Must be exactly 32 bytes (64 hex characters).`);
  }
  return buffer;
};

export function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(hash: string): string {
  if (!hash) return hash;
  
  // Check if it's a valid encrypted string (has 3 parts separated by colons)
  const parts = hash.split(':');
  if (parts.length !== 3) {
    // If it's not encrypted (e.g., legacy data), return as is
    return hash;
  }

  const [ivHex, authTagHex, encryptedText] = parts;
  
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      getEncryptionKey(), 
      Buffer.from(ivHex, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Decryption Error]";
  }
}