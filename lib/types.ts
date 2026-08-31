export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  total: number;
  tookMs: number;
  results: SearchResult[];
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
  domains: number;
  searchTerms: number;
  crawlQueue: number;
}

export interface RecentCrawl {
  url: string;
  status: "success" | "failed";
  crawledAt: string;
}
