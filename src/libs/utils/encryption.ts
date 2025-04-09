import crypto from "node:crypto";
import env from "../env";

// Encryption configuration
const ENCRYPTION_KEY = env.ENCRYPTION_KEY;
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts text using AES-256-GCM
 * @param text The text to encrypt
 * @returns Object containing encrypted data, IV, and authentication tag
 */
export function encryptText(text: string): { encryptedData: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
        ENCRYPTION_ALGORITHM,
        Buffer.from(ENCRYPTION_KEY, "hex"),
        iv,
    );

    let encryptedData = cipher.update(text, "utf8", "hex");
    encryptedData += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
        encryptedData,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
    };
}

/**
 * Decrypts text using AES-256-GCM
 * @param encryptedData The encrypted data
 * @param iv The initialization vector
 * @param authTag The authentication tag
 * @returns The decrypted text
 */
export function decryptText(encryptedData: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
        ENCRYPTION_ALGORITHM,
        Buffer.from(ENCRYPTION_KEY, "hex"),
        Buffer.from(iv, "hex"),
    );

    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    let decryptedData = decipher.update(encryptedData, "hex", "utf8");
    decryptedData += decipher.final("utf8");

    return decryptedData;
}

/**
 * Encodes encrypted data for storage
 * @param encryptedData The encrypted data
 * @param iv The initialization vector
 * @param authTag The authentication tag
 * @returns JSON string containing all encryption data
 */
export function encodeEncryptedData(encryptedData: string, iv: string, authTag: string): string {
    return JSON.stringify({
        data: encryptedData,
        iv: iv,
        authTag: authTag,
    });
}

/**
 * Decodes encrypted data from storage
 * @param encodedData The encoded data from storage
 * @returns Object containing encrypted data, IV, and authentication tag
 */
export function decodeEncryptedData(encodedData: string | null): {
    encryptedData: string;
    iv: string;
    authTag: string;
} {
    if (!encodedData) {
        return {
            encryptedData: "",
            iv: "",
            authTag: "",
        };
    }

    try {
        const parsed = JSON.parse(encodedData);
        return {
            encryptedData: parsed.data,
            iv: parsed.iv,
            authTag: parsed.authTag,
        };
    } catch (error) {
        console.error("Error decoding encrypted data:", error);
        return {
            encryptedData: "",
            iv: "",
            authTag: "",
        };
    }
}
