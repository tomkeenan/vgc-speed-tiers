// Google ID token verification for the Cloudflare Worker. Validates the token's signature against
// Google's published RSA keys (JWKS) and checks the standard claims, so the server never trusts a
// client-supplied identity on faith. No external auth SDK; WebCrypto only.

const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const VALID_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/** The subset of Google ID token claims we rely on. */
export interface GoogleClaims {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  aud: string;
  iss: string;
  exp: number;
}

interface Jwk {
  kid: string;
  n: string;
  e: string;
  kty: string;
  alg?: string;
}

let cachedKeys: { keys: Jwk[]; expiresAt: number } | null = null;

function b64urlToBytes(input: string): Uint8Array<ArrayBuffer> {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function b64urlToJson<T>(input: string): T {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(input))) as T;
}

async function getGoogleKeys(): Promise<Jwk[]> {
  const now = Date.now();
  if (cachedKeys && cachedKeys.expiresAt > now) return cachedKeys.keys;

  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error('Could not fetch Google signing keys');
  const body = (await res.json()) as { keys: Jwk[] };

  // Respect Google's Cache-Control max-age so we refresh keys on their rotation schedule.
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1] ?? 3600);
  cachedKeys = { keys: body.keys, expiresAt: now + maxAge * 1000 };
  return body.keys;
}

/**
 * Verifies a Google ID token and returns its claims.
 * Takes the raw JWT credential and the expected audience (OAuth client id); throws if invalid.
 */
export async function verifyGoogleToken(
  credential: string,
  clientId: string,
): Promise<GoogleClaims> {
  const parts = credential.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [headerB64, payloadB64, signatureB64] = parts;

  const header = b64urlToJson<{ kid: string; alg: string }>(headerB64);
  if (header.alg !== 'RS256') throw new Error('Unexpected token algorithm');

  const jwk = (await getGoogleKeys()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('No matching signing key');

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const signed = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(signatureB64),
    signed,
  );
  if (!valid) throw new Error('Bad signature');

  const claims = b64urlToJson<GoogleClaims>(payloadB64);
  if (!VALID_ISSUERS.includes(claims.iss)) throw new Error('Unexpected issuer');
  if (claims.aud !== clientId) throw new Error('Audience mismatch');
  if (claims.exp * 1000 < Date.now()) throw new Error('Token expired');

  return claims;
}
