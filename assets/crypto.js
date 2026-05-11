/* ------------------------------------------------------------
 * crypto.js — client-side decryption for student profiles.
 * Matches build_profiles.py exactly:
 *   - lookup_hash(name, cred)        = SHA-256("v1:lookup:NAME:CRED")
 *   - PBKDF2-HMAC-SHA256(200k iter)  over UTF8("v1:key:NAME:CRED") with the
 *     shared salt → 32-byte AES-GCM-256 key
 *   - AES-GCM (12-byte IV, 128-bit authentication tag, no AAD)
 * ------------------------------------------------------------ */

const PBKDF2_ITER = 200000;

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(s) {
  const data = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hash));
}

async function lookupHash(name, credential) {
  return sha256Hex(`v1:lookup:${name}:${credential}`);
}

async function deriveKey(name, credential, saltBytes) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`v1:key:${name}:${credential}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITER, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

/**
 * Try to unlock a profile. Returns the profile object on success, throws on failure.
 *   enc      – the full enc.json contents
 *   name     – student name as typed
 *   cred     – credential string
 */
async function unlockProfile(enc, name, cred) {
  const id = await lookupHash(name, cred);
  const record = enc.records[id];
  if (!record) throw new Error('not_found');

  const salt = b64ToBytes(enc.kdf.salt);
  const key = await deriveKey(name, cred, salt);
  const iv = b64ToBytes(record.iv);
  const ct = b64ToBytes(record.ct);

  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  } catch (e) {
    throw new Error('decrypt_failed');
  }
  return JSON.parse(new TextDecoder().decode(plain));
}
