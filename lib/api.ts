import {
  AdminStats,
  CrawlerStatus,
  RecentCrawl,
  AnalyticsData,
  SearchResponse,
  SearchSort,
  SearchType,
} from "./types";
import { AdminApp } from "./apps";
import { AuthUser, getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/** An API error that keeps the HTTP status, so pages can tell "not allowed" from "down". */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error ?? `API error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/** Admin endpoints need the signed-in user's token: passed in on the server, read from the cookie in the browser. */
function adminFetch<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const t = token ?? (typeof document !== "undefined" ? getToken() : null);
  return apiFetch<T>(path, { ...init, headers: t ? { Authorization: `Bearer ${t}`, ...init.headers } : init.headers });
}

export async function getMe(token: string): Promise<AuthUser> {
  return (await apiFetch<{ user: AuthUser }>("/auth/me", { headers: { Authorization: `Bearer ${token}` } })).user;
}

export function search(
  query: string,
  options: { type?: SearchType; page?: number; sort?: SearchSort; mature?: boolean } = {},
  token?: string,
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, type: options.type ?? "all" });
  if (options.page && options.page > 1) params.set("page", String(options.page));
  if (options.sort && options.sort !== "relevance") params.set("sort", options.sort);
  if (options.mature) params.set("mature", "1");
  return apiFetch<SearchResponse>(`/search?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/** Sends the token when signed in, so the user's own recent searches come first. */
function optionalAuthInit(): RequestInit | undefined {
  const t = typeof document !== "undefined" ? getToken() : null;
  return t ? { headers: { Authorization: `Bearer ${t}` } } : undefined;
}

export function getAutocomplete(prefix: string): Promise<string[]> {
  const params = new URLSearchParams({ q: prefix });
  return apiFetch<string[]>(`/search/autocomplete?${params.toString()}`, optionalAuthInit());
}

/** The signed-in user's recent searches. Resolves to [] when signed out. */
export async function getSearchHistory(): Promise<string[]> {
  if (!optionalAuthInit()) return [];
  return apiFetch<string[]>("/search/history", optionalAuthInit());
}

export function clearSearchHistory(query?: string): Promise<{ deleted: number }> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : "";
  return apiFetch<{ deleted: number }>(`/search/history${qs}`, { ...optionalAuthInit(), method: "DELETE" });
}

export function getAnalytics(token?: string): Promise<AnalyticsData> {
  return adminFetch<AnalyticsData>("/analytics", {}, token);
}

export function getAdminStats(token?: string): Promise<AdminStats> {
  return adminFetch<AdminStats>("/stats", {}, token);
}

export function getRecentCrawls(token?: string): Promise<RecentCrawl[]> {
  return adminFetch<RecentCrawl[]>("/crawler/recent", {}, token);
}

export function getCrawlerStatus(): Promise<CrawlerStatus> {
  return adminFetch<CrawlerStatus>("/crawler/status");
}

export function startCrawler(seedUrls: string[]): Promise<{ started: boolean }> {
  return adminFetch<{ started: boolean }>("/crawler/start", {
    method: "POST",
    body: JSON.stringify({ seedUrls }),
  });
}

export function stopCrawler(): Promise<{ stopped: boolean }> {
  return adminFetch<{ stopped: boolean }>("/crawler/stop", { method: "POST" });
}

// ---- Nexa apps (admin) -----------------------------------------------------------

export type AppInput = Partial<Pick<AdminApp, "name" | "tagline" | "description" | "url" | "icon" | "tone" | "openInNewTab" | "visible" | "order">> & {
  keywords?: string;
  repos?: string;
};

export const getAllApps = () => adminFetch<AdminApp[]>("/apps/all");
export const createApp = (input: AppInput) => adminFetch<AdminApp>("/apps", { method: "POST", body: JSON.stringify(input) });
export const updateApp = (id: string, input: AppInput) =>
  adminFetch<AdminApp>(`/apps/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteApp = (id: string) => adminFetch<{ deleted: true }>(`/apps/${id}`, { method: "DELETE" });

// ---- News (admin) ------------------------------------------------------------------

export interface AdminNewsItem {
  id: string;
  product: string;
  message: string;
  url: string;
  repo: string;
  committedAt: string;
  hidden: boolean;
}

export const getAdminNews = (page = 1) =>
  adminFetch<{ page: number; pageSize: number; total: number; items: AdminNewsItem[] }>(`/news/all?page=${page}`);
export const syncNewsNow = () => adminFetch<{ added: number; repos: number; errors: string[] }>("/news/sync", { method: "POST" });
export const setNewsHidden = (id: string, hidden: boolean) =>
  adminFetch<{ id: string; hidden: boolean }>(`/news/${id}`, { method: "PATCH", body: JSON.stringify({ hidden }) });
