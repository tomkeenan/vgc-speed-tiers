// Lightweight signed session for the Worker. After Google verifies who a player is, we mint a
// compact HMAC-signed token carrying only the opaque Google subject and an expiry, and set it as an
// HttpOnly cookie. Later actions (register a name, rename, submit a score) authorize off this cookie
// instead of re-verifying a short-lived Google ID token. WebCrypto only; no external SDK.

const COOKIE_NAME = 'speedtiers_session';
const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(input: string): Uint8Array<ArrayBuffer> {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/** Mints a signed session token for a Google subject, valid for ttlMs. */
export async function createSession(sub: string, secret: string, ttlMs: number): Promise<string> {
  const body = b64url(encoder.encode(JSON.stringify({ sub, exp: Date.now() + ttlMs })));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body)));
  return `${body}.${b64url(sig)}`;
}

/** Verifies a session token and returns its subject, or null if missing/tampered/expired. */
export async function readSession(
  token: string | undefined,
  secret: string,
): Promise<string | null> {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, b64urlToBytes(sig), encoder.encode(body));
  if (!valid) return null;
  try {
    const { sub, exp } = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as {
      sub?: unknown;
      exp?: unknown;
    };
    if (typeof sub !== 'string' || typeof exp !== 'number' || exp < Date.now()) return null;
    return sub;
  } catch {
    return null;
  }
}

/** A Set-Cookie value carrying the session token. `secure` is off for local http. */
export function sessionCookie(token: string, ttlMs: number, secure: boolean): string {
  const attrs = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${Math.floor(ttlMs / 1000)}`,
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

/** A Set-Cookie value that clears the session cookie. */
export function clearSessionCookie(secure: boolean): string {
  const attrs = [`${COOKIE_NAME}=`, 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

/** Reads the session token out of a Cookie header. */
export function readSessionCookie(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === COOKIE_NAME) return part.slice(eq + 1).trim();
  }
  return undefined;
}
