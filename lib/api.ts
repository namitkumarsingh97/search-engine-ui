import {
  AdminStats,
  CrawlerStatus,
  RecentCrawl,
  SearchResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export function search(query: string): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query });
  return apiFetch<SearchResponse>(`/search?${params.toString()}`);
}

export function getAutocomplete(prefix: string): Promise<string[]> {
  const params = new URLSearchParams({ q: prefix });
  return apiFetch<string[]>(`/search/autocomplete?${params.toString()}`);
}

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/stats");
}

export function getRecentCrawls(): Promise<RecentCrawl[]> {
  return apiFetch<RecentCrawl[]>("/crawler/recent");
}

export function getCrawlerStatus(): Promise<CrawlerStatus> {
  return apiFetch<CrawlerStatus>("/crawler/status");
}

export function startCrawler(seedUrls: string[]): Promise<{ started: boolean }> {
  return apiFetch<{ started: boolean }>("/crawler/start", {
    method: "POST",
    body: JSON.stringify({ seedUrls }),
  });
}

export function stopCrawler(): Promise<{ stopped: boolean }> {
  return apiFetch<{ stopped: boolean }>("/crawler/stop", { method: "POST" });
}
