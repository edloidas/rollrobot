const encoder = new TextEncoder();

let cachedSalt: string | undefined;
let cachedKey: Promise<CryptoKey> | undefined;

/** Imports the HMAC key once per isolate, re-importing only if the salt changes. */
function hmacKey(salt: string): Promise<CryptoKey> {
  if (cachedKey == null || cachedSalt !== salt) {
    cachedSalt = salt;
    cachedKey = crypto.subtle
      .importKey('raw', encoder.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .catch((error) => {
        // ! A rejected promise left in the cache would poison the isolate for good
        cachedSalt = undefined;
        cachedKey = undefined;
        throw error;
      });
  }

  return cachedKey;
}

/** HMAC-SHA256 of a Telegram user ID, hex encoded. */
export async function hashUserId(salt: string, userId: number): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(salt),
    encoder.encode(String(userId)),
  );

  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
