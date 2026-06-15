import crypto from 'crypto';

// Enforce standard AES 256 GCM algorithm for authenticated encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV is optimal for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Encrypts cleartext using AES-256-GCM.
 * Returns a colon-separated string: iv:authTag:encryptedData.
 */
export const encrypt = (text, secretKey) => {
    if (!text) return '';
    
    // Hash key to ensure it is exactly 32 bytes (256 bits)
    const key = crypto.createHash('sha256').update(String(secretKey)).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts GCM-encrypted cipher text.
 */
export const decrypt = (cipherText, secretKey) => {
    if (!cipherText) return '';
    
    try {
        const parts = cipherText.split(':');
        if (parts.length !== 3) {
            // Unencrypted fallback for legacy migration resilience
            return cipherText;
        }
        
        const key = crypto.createHash('sha256').update(String(secretKey)).digest();
        const iv = Buffer.from(parts[0], 'hex');
        const tag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (err) {
        console.error('[Crypto Error] Decryption failed:', err.message);
        return 'Decryption Error';
    }
};

/**
 * Encrypts specific sensitive attributes of child profiles (e.g. medical conditions, allergies, weight)
 * prior to database saves.
 */
export const encryptChildProfile = (profile, secretKey) => {
    const p = { ...profile };
    if (p.weight) p.weight = encrypt(String(p.weight), secretKey);
    if (p.condition) p.condition = encrypt(p.condition, secretKey);
    if (p.allergies && p.allergies.length > 0) {
        p.allergies = p.allergies.map(a => encrypt(a, secretKey));
    }
    return p;
};

/**
 * Restores child profile cleartext for authorized paren/pediatrician requests.
 */
export const decryptChildProfile = (profile, secretKey) => {
    const p = { ...profile };
    if (p.weight) {
        const dec = decrypt(p.weight, secretKey);
        p.weight = parseFloat(dec) || dec;
    }
    if (p.condition) p.condition = decrypt(p.condition, secretKey);
    if (p.allergies && p.allergies.length > 0) {
        p.allergies = p.allergies.map(a => decrypt(a, secretKey));
    }
    return p;
};
