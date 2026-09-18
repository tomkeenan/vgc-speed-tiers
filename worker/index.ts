// Cloudflare Worker sitting in front of the static SPA. It owns the /api/* surface and delegates
// everything else to the static assets binding (which handles the SPA fallback).
//
// Identity model: Google verifies *who* the player is (an opaque `sub`); we then mint a signed
// session cookie and the player picks a unique display name. Later actions authorize off the
// session cookie. Only the display name is ever returned to the client - never the Google name,
// email, or picture.

import { verifyGoogleToken } from './verifyGoogleToken';
import { getPlayerBySub, getPlayerIdBySub, registerPlayer, renamePlayer } from './players';
import type { Player } from './players';
import { normalizeDisplayName } from './validateDisplayName';
import { isBoardKey, MAX_PLAUSIBLE_STREAK } from './boards';
import { getAllLeaderboards, recentSubmissionCount, submitScore } from './scores';
import {
  clearSessionCookie,
  createSession,
  readSession,
  readSessionCookie,
  sessionCookie,
} from './session';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RENAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // once a week

// Score submission rate limit: at most this many submissions per player within the window.
const SCORE_WINDOW_MS = 60 * 1000;
const SCORE_MAX_PER_WINDOW = 20;
const LEADERBOARD_DEFAULT_LIMIT = 50;
const LEADERBOARD_MAX_LIMIT = 100;

interface Env {
  GOOGLE_CLIENT_ID: string;
  SESSION_SECRET: string;
  DB: D1Database;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

/** When the player may next change their name (epoch ms), or null if allowed now. */
function canRenameAt(player: Player): number | null {
  return player.renamedAt === null ? null : player.renamedAt + RENAME_COOLDOWN_MS;
}

/** The authenticated Google subject from the session cookie, or null. */
function sessionSub(request: Request, env: Env): Promise<string | null> {
  return readSession(readSessionCookie(request.headers.get('cookie')), env.SESSION_SECRET);
}

async function readDisplayName(request: Request): Promise<string | null> {
  try {
    const { displayName } = (await request.json()) as { displayName?: unknown };
    return normalizeDisplayName(displayName);
  } catch {
    return null;
  }
}

/** POST /api/auth/google -> verify the Google token, start a session, report registration status. */
async function handleGoogleAuth(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!env.GOOGLE_CLIENT_ID || !env.SESSION_SECRET) {
    return json({ error: 'auth_not_configured' }, 500);
  }

  let credential: unknown;
  try {
    ({ credential } = (await request.json()) as { credential?: unknown });
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  if (typeof credential !== 'string') return json({ error: 'missing_credential' }, 400);

  let sub: string;
  try {
    ({ sub } = await verifyGoogleToken(credential, env.GOOGLE_CLIENT_ID));
  } catch {
    return json({ error: 'invalid_token' }, 401);
  }

  const token = await createSession(sub, env.SESSION_SECRET, SESSION_TTL_MS);
  const secure = new URL(request.url).protocol === 'https:';
  const headers = { 'set-cookie': sessionCookie(token, SESSION_TTL_MS, secure) };

  const player = await getPlayerBySub(env.DB, sub);
  return json(
    {
      registered: player !== null,
      displayName: player?.handle ?? null,
      canRenameAt: player ? canRenameAt(player) : null,
    },
    200,
    headers,
  );
}

/** POST /api/register {displayName} -> claim a unique display name (authorized by session cookie). */
async function handleRegister(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const sub = await sessionSub(request, env);
  if (!sub) return json({ error: 'unauthorized' }, 401);

  const name = await readDisplayName(request);
  if (name === null) return json({ error: 'invalid_name' }, 400);

  const result = await registerPlayer(env.DB, sub, name);
  if (result.ok) return json({ displayName: result.handle, canRenameAt: null });
  if (result.reason === 'already_registered') {
    const player = await getPlayerBySub(env.DB, sub);
    return json({
      displayName: result.handle,
      canRenameAt: player ? canRenameAt(player) : null,
    });
  }
  return json({ error: 'name_taken' }, 409);
}

/** POST /api/rename {displayName} -> change the display name (session cookie + weekly cooldown). */
async function handleRename(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const sub = await sessionSub(request, env);
  if (!sub) return json({ error: 'unauthorized' }, 401);

  const name = await readDisplayName(request);
  if (name === null) return json({ error: 'invalid_name' }, 400);

  const result = await renamePlayer(env.DB, sub, name, RENAME_COOLDOWN_MS);
  if (result.ok) {
    return json({
      displayName: result.handle,
      canRenameAt: result.renamedAt === null ? null : result.renamedAt + RENAME_COOLDOWN_MS,
    });
  }
  if (result.reason === 'name_taken') return json({ error: 'name_taken' }, 409);
  if (result.reason === 'cooldown') {
    return json({ error: 'rename_cooldown', canRenameAt: result.nextAt }, 429);
  }
  return json({ error: 'not_registered' }, 400);
}

/** POST /api/score {boardKey, streak} -> record a ranked streak (session + rate limit + cap). */
async function handleScore(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const sub = await sessionSub(request, env);
  if (!sub) return json({ error: 'unauthorized' }, 401);

  let boardKey: unknown;
  let streak: unknown;
  try {
    ({ boardKey, streak } = (await request.json()) as { boardKey?: unknown; streak?: unknown });
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  if (!isBoardKey(boardKey)) return json({ error: 'invalid_board' }, 400);
  if (typeof streak !== 'number' || !Number.isInteger(streak) || streak < 0) {
    return json({ error: 'invalid_streak' }, 400);
  }
  if (streak > MAX_PLAUSIBLE_STREAK) return json({ error: 'implausible_streak' }, 422);

  const playerId = await getPlayerIdBySub(env.DB, sub);
  if (!playerId) return json({ error: 'not_registered' }, 403);

  const recent = await recentSubmissionCount(env.DB, playerId, Date.now() - SCORE_WINDOW_MS);
  if (recent >= SCORE_MAX_PER_WINDOW) return json({ error: 'rate_limited' }, 429);

  const standing = await submitScore(env.DB, playerId, boardKey, streak);
  return json(standing);
}

/**
 * GET /api/leaderboards?limit=50 -> every board's public top-N in one read, each with the caller's
 * own standing when signed in and registered. The client fetches all boards on opening the
 * leaderboard so switching between tabs and chips never waits on a per-board request.
 */
async function handleLeaderboards(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get('limit') ?? LEADERBOARD_DEFAULT_LIMIT);
  const limit = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), 1), LEADERBOARD_MAX_LIMIT)
    : LEADERBOARD_DEFAULT_LIMIT;

  let playerId: string | null = null;
  const sub = await sessionSub(request, env);
  if (sub) playerId = await getPlayerIdBySub(env.DB, sub);

  const boards = await getAllLeaderboards(env.DB, limit, playerId);
  return json({ boards });
}

/** POST /api/signout -> clear the session cookie. */
function handleSignOut(request: Request): Response {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const secure = new URL(request.url).protocol === 'https:';
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie(secure) });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/auth/google') return handleGoogleAuth(request, env);
    if (url.pathname === '/api/register') return handleRegister(request, env);
    if (url.pathname === '/api/rename') return handleRename(request, env);
    if (url.pathname === '/api/score') return handleScore(request, env);
    if (url.pathname === '/api/leaderboards') return handleLeaderboards(request, env);
    if (url.pathname === '/api/signout') return handleSignOut(request);
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
