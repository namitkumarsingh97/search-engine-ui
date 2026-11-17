export type SearchType = "all" | "web" | "file" | "mail" | "event" | "video" | "news";

export type SearchSort = "relevance" | "date";

export interface SearchResult {
  id: string;
  type: Exclude<SearchType, "all">;
  title: string;
  /** Title with \u0001 / \u0002 around matched words (see components/Marked.tsx). */
  titleMarked: string;
  url: string;
  /** Excerpt with \u0001 / \u0002 around matched words. */
  snippet: string;
  score: number;
  date?: string;
}

export type SearchFacets = Record<SearchType, number>;

export interface SearchResponse {
  /** Nexa apps (own projects) matching the query, for the shelf above results. */
  apps?: import("./apps").PublicApp[];
  query: string;
  total: number;
  page: number;
  pageSize: number;
  tookMs: number;
  results: SearchResult[];
  facets: SearchFacets;
  suggestion?: string;
}

export interface AnalyticsData {
  totalSearches: number;
  signedInSearches: number;
  zeroResultSearches: number;
  averageResults: number;
  perDay: { date: string; count: number }[];
  topQueries: { query: string; count: number }[];
  zeroResultQueries: { query: string; count: number }[];
}

export interface CrawlerStatus {
  running: boolean;
  queued: number;
  crawled: number;
  failed: number;
  currentUrl?: string;
}

export interface AdminStats {
  indexedPages: number;
  documentsByType?: Record<string, number>;
  domains: number;
  searchTerms: number;
  crawlQueue: number;
}

export interface RecentCrawl {
  url: string;
  status: "success" | "failed";
  crawledAt: string;
}
