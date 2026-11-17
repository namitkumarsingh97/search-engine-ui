import { API_URL } from "./drive";

export interface NewsProduct {
  slug: string;
  name: string;
  tone: "mustard" | "orange" | "charcoal" | "paper";
  icon: string;
  url: string;
}

/** One change shipped to a product. */
export interface NewsEntry {
  id: string;
  product: NewsProduct | null;
  message: string;
  /** The commit on GitHub. */
  url: string;
  repo: string;
  committedAt: string;
}

export interface NewsResponse {
  page: number;
  pageSize: number;
  total: number;
  products: { slug: string; name: string }[];
  items: NewsEntry[];
}

/**
 * Works on the server and in the browser. Resolves to null if the API is unreachable
 * or slow, so a page can simply leave the news out instead of breaking.
 */
export async function fetchNews(opts: { product?: string; page?: number; limit?: number } = {}): Promise<NewsResponse | null> {
  const params = new URLSearchParams();
  if (opts.product) params.set("product", opts.product);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  if (opts.limit) params.set("limit", String(opts.limit));
  try {
    // The API may refresh from GitHub while answering; give it a few seconds, then move on.
    const res = await fetch(`${API_URL}/news?${params.toString()}`, { cache: "no-store", signal: AbortSignal.timeout(9000) });
    return res.ok ? ((await res.json()) as NewsResponse) : null;
  } catch {
    return null;
  }
}

/** "3 hours ago", "2 days ago", or a date for anything older than a month. */
export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 31) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}
