import { describe, expect, it } from 'vitest';
import { createSession, readSession, readSessionCookie } from './session';

const SECRET = 'test-secret-please-ignore';

describe('session token', () => {
  it('round-trips a subject', async () => {
    const token = await createSession('google-sub-123', SECRET, 60_000);
    expect(await readSession(token, SECRET)).toBe('google-sub-123');
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await createSession('sub', SECRET, 60_000);
    expect(await readSession(token, 'other-secret')).toBeNull();
  });

  it('rejects a tampered token', async () => {
    const token = await createSession('sub', SECRET, 60_000);
    const [body, sig] = token.split('.');
    expect(await readSession(`${body}x.${sig}`, SECRET)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await createSession('sub', SECRET, -1);
    expect(await readSession(token, SECRET)).toBeNull();
  });

  it('rejects missing or malformed tokens', async () => {
    expect(await readSession(undefined, SECRET)).toBeNull();
    expect(await readSession('nodot', SECRET)).toBeNull();
  });
});

describe('readSessionCookie', () => {
  it('extracts the session cookie among others', () => {
    expect(readSessionCookie('a=1; speedtiers_session=abc.def; b=2')).toBe('abc.def');
  });

  it('returns undefined when absent', () => {
    expect(readSessionCookie('a=1; b=2')).toBeUndefined();
    expect(readSessionCookie(null)).toBeUndefined();
  });
});
