/**
 * Sign-in through the separate accounts app (search-engine-auth).
 *
 *   1. startAuth() remembers a random `state` and where to return to, then sends the browser to
 *      <AUTH_URL>/login?return=<this app>/auth/callback&state=...
 *   2. The accounts app signs the user in and sends them back to /auth/callback?code=...&state=...
 *   3. /auth/callback checks the state and swaps the one-time code for a token (see exchangeCode).
 *
 * This app has no login or sign-up pages of its own any more: NEXT_PUBLIC_AUTH_URL must point at the
 * accounts app (search-engine-auth), and every "Sign in" link goes straight there (see components/SignInLink.tsx).
 */
import { API_URL } from "./drive";
import { AuthUser, saveSession } from "./auth";

export const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_URL ?? "").replace(/\/$/, "");
const FLOW_KEY = "nexa_auth_flow";

/** Only same-site paths: stops "?next=https://evil.example" from turning the callback into an open redirect. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}

function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const callbackUrl = () => `${window.location.origin}/auth/callback`;

/** Sends the browser to the accounts app. `next` is the page to come back to afterwards. */
export function startAuth(mode: "login" | "register", next?: string | null): void {
  if (!AUTH_URL) {
    console.error("NEXT_PUBLIC_AUTH_URL is not set, so there is no sign-in page to send you to.");
    return;
  }
  const state = randomState();
  try {
    sessionStorage.setItem(FLOW_KEY, JSON.stringify({ state, next: safeNext(next) }));
  } catch {
    // Storage blocked: the callback will refuse the sign-in rather than skip the check.
  }
  const url = `${AUTH_URL}/${mode}?return=${encodeURIComponent(callbackUrl())}&state=${state}`;
  window.location.replace(url);
}

/** Reads and removes the remembered flow: it can only be used once. */
export function takeFlow(): { state: string; next: string } | null {
  try {
    const raw = sessionStorage.getItem(FLOW_KEY);
    sessionStorage.removeItem(FLOW_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.state === "string" ? { state: parsed.state, next: safeNext(parsed.next) } : null;
  } catch {
    return null;
  }
}

/** Swaps the one-time code for a real session and stores it. */
export async function exchangeCode(code: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri: callbackUrl() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Sign-in failed (${res.status}).`);
  saveSession(data.token, data.user);
  return data.user as AuthUser;
}
