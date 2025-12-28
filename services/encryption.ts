/**
 * Simple encryption utilities for sensitive data
 * Note: For production, use stronger encryption libraries like crypto-js
 */

// Simple XOR encryption (for demo purposes)
// In production, use proper encryption like AES-256
export const encrypt = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    result += String.fromCharCode(char ^ keyChar);
  }
  return btoa(result); // Base64 encode
};

export const decrypt = (encryptedText: string, key: string): string => {
  try {
    const text = atob(encryptedText); // Base64 decode
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(char ^ keyChar);
    }
    return result;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

// Hash PIN (simple hash for demo - use proper hashing in production)
export const hashPIN = (pin: string): string => {
  // Simple hash function (in production, use bcrypt or similar)
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

export const verifyPIN = (pin: string, hash: string): boolean => {
  return hashPIN(pin) === hash;
};

// Get encryption key from user ID (for data encryption)
export const getEncryptionKey = (userId: string): string => {
  // In production, derive from user's master password or keychain
  return userId + '_wealthsense_key_2024';
};

