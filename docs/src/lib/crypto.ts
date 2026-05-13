/**
 * SocioCipher Cryptography Utility (lib/crypto.ts)
 * 
 * Implements:
 * 1. Uniform Message Padding (Hiding packet size)
 * 2. AES-GCM Encryption/Decryption placeholders
 * 3. Metadata Scrubbing logic (placeholder for server-side)
 */

const PADDING_BLOCK_SIZE = 1024; // 1KB fixed packets

/**
 * Padds a string with random noise to a fixed size multiple.
 * Prepends the original length to allow reconstruction.
 */
export function padData(data: string): Uint8Array {
  const encoder = new TextEncoder();
  const originalBytes = encoder.encode(data);
  const originalLength = originalBytes.length;

  // We need at least 4 bytes for length + originalBytes
  const totalSize = Math.ceil((originalLength + 4) / PADDING_BLOCK_SIZE) * PADDING_BLOCK_SIZE;
  const paddedBuffer = new Uint8Array(totalSize);

  // Store original length in first 4 bytes
  const view = new DataView(paddedBuffer.buffer);
  view.setUint32(0, originalLength);

  // Set the actual message
  paddedBuffer.set(originalBytes, 4);

  // Fill the remainder with cryptographically secure random noise
  if (typeof window !== 'undefined' && window.crypto) {
    const noise = new Uint8Array(totalSize - (originalLength + 4));
    window.crypto.getRandomValues(noise);
    paddedBuffer.set(noise, originalLength + 4);
  }

  return paddedBuffer;
}

/**
 * Unpads data by reading the length prefix.
 */
export function unpadData(paddedBuffer: Uint8Array): string {
  const view = new DataView(paddedBuffer.buffer);
  const originalLength = view.getUint32(0);
  const originalBytes = paddedBuffer.slice(4, 4 + originalLength);
  const decoder = new TextDecoder();
  return decoder.decode(originalBytes);
}

/**
 * Converts a Uint8Array to a Base64 string.
 */
export function bufferToBase64(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer));
}

/**
 * Converts a Base64 string to a Uint8Array.
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Placeholder for E2EE Encryption
 * In a real implementation, this would use SubtleCrypto.encrypt with a shared room key.
 */
export async function encryptMessage(text: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  if (typeof window === 'undefined') return { ciphertext: text, iv: '' };

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const padded = padData(text);
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    padded as any
  );

  return {
    ciphertext: bufferToBase64(new Uint8Array(ciphertextBuffer)),
    iv: bufferToBase64(iv)
  };
}

export async function decryptMessage(ciphertext: string, iv: string, key: CryptoKey): Promise<string> {
  if (typeof window === 'undefined') return ciphertext;

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuffer(iv) as any },
    key,
    base64ToBuffer(ciphertext) as any
  );

  return unpadData(new Uint8Array(decryptedBuffer));
}
