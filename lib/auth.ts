// Token + user live in cookies so server components (the search page) can read
// them via next/headers. Set from client JS, so NOT httpOnly — see AGENT.md.

export const TOKEN_COOKIE = "nexa_token";
export const USER_COOKIE = "nexa_user";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** UI hint only (shows the Admin link); the API enforces admin access itself. */
  isAdmin?: boolean;
}

const WEEK_SECONDS = 60 * 60 * 24 * 7;

export function saveSession(token: string, user: AuthUser): void {
  const attrs = `; path=/; max-age=${WEEK_SECONDS}; samesite=lax`;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}${attrs}`;
  document.cookie = `${USER_COOKIE}=${encodeURIComponent(JSON.stringify(user))}${attrs}`;
}

/** Client-side only: the current JWT, or null when signed out. */
export function getToken(): string | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${TOKEN_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(TOKEN_COOKIE.length + 1)) : null;
}

export function clearSession(): void {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${USER_COOKIE}=; path=/; max-age=0`;
}

export function parseUserCookie(value: string | undefined): AuthUser | null {
  if (!value) return null;
  try {
    const u = JSON.parse(decodeURIComponent(value));
    return typeof u?.name === "string" && typeof u?.email === "string" ? u : null;
  } catch {
    return null;
  }
}
