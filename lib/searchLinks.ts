import { SearchSort, SearchType } from "./types";

/** URL of the results page for a query, leaving out anything that is at its default. */
export function searchHref(q: string, opts: { type?: SearchType; page?: number; sort?: SearchSort } = {}): string {
  const params = new URLSearchParams({ q });
  if (opts.type && opts.type !== "all") params.set("type", opts.type);
  if (opts.sort && opts.sort !== "relevance") params.set("sort", opts.sort);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  return `/search?${params.toString()}`;
}
