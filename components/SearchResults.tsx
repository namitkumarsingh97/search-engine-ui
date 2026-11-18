import Link from "next/link";
import { searchHref } from "@/lib/searchLinks";
import { SearchResponse, SearchSort, SearchType } from "@/lib/types";
import AppShelf from "./AppShelf";
import GoogleFallback from "./GoogleFallback";
import MailShelf from "./MailShelf";
import ResultCard from "./ResultCard";

interface Props {
  data: SearchResponse;
  type: SearchType;
  sort: SearchSort;
}

function Pagination({ data, type, sort }: Props) {
  const pages = Math.ceil(data.total / data.pageSize);
  if (pages <= 1) return null;

  // Window of page numbers around the current one.
  const first = Math.max(1, Math.min(data.page - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => first + i);
  const href = (page: number) => searchHref(data.query, { type, sort, page });
  const cell = "kicker border-2 border-line px-3.5 py-2.5 -ml-0.5 first:ml-0 transition-colors";

  return (
    <nav className="mt-6 flex flex-wrap items-center" aria-label="Pages">
      {data.page > 1 ? (
        <Link href={href(data.page - 1)} className={`${cell} bg-surface hover:bg-mustard`}>
          Prev
        </Link>
      ) : (
        <span className={`${cell} bg-surface2 text-mute`}>Prev</span>
      )}
      {nums.map((n) => (
        <Link
          key={n}
          href={href(n)}
          aria-current={n === data.page ? "page" : undefined}
          className={`${cell} ${n === data.page ? "bg-ink text-canvas" : "bg-surface hover:bg-mustard"}`}
        >
          {n}
        </Link>
      ))}
      {data.page < pages ? (
        <Link href={href(data.page + 1)} className={`${cell} bg-surface hover:bg-mustard`}>
          Next
        </Link>
      ) : (
        <span className={`${cell} bg-surface2 text-mute`}>Next</span>
      )}
    </nav>
  );
}

export default function SearchResults({ data, type, sort }: Props) {
  const didYouMean = data.suggestion && data.suggestion.toLowerCase() !== data.query.toLowerCase() && (
    <p className="mb-4 border-2 border-line bg-surface px-4 py-3 text-sm font-semibold">
      <span className="kicker mr-2 text-accent-fg">Did you mean</span>
      <Link href={searchHref(data.suggestion!, { type })} className="link">
        {data.suggestion}
      </Link>
      ?
    </p>
  );

  if (data.results.length === 0) {
    return (
      <div>
        <AppShelf apps={data.apps ?? []} />
        <MailShelf items={data.mail ?? []} total={data.facets.mail} query={data.query} />
        {didYouMean}
        <div className="border-2 border-line bg-surface">
          <div className="h-3 bg-accent" />
          <div className="p-8">
            <p className="kicker mb-3">No results</p>
            <h2 className="display text-4xl sm:text-5xl">
              Nothing for
              <br />
              &ldquo;{data.query}&rdquo;
            </h2>
            <p className="mt-4 max-w-md text-sm font-medium">
              Try different keywords or check the spelling. Private content only shows up when you&apos;re signed in.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <GoogleFallback data={data} type={type} />
        </div>
      </div>
    );
  }

  const firstIndex = (data.page - 1) * data.pageSize;

  return (
    <div>
      <AppShelf apps={data.apps ?? []} />
      <MailShelf items={data.mail ?? []} total={data.facets.mail} query={data.query} />
      {didYouMean}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="kicker flex items-center gap-3">
          <span className="inline-block h-3 w-3 bg-accent" />
          {data.total} result{data.total === 1 ? "" : "s"} · {(data.tookMs / 1000).toFixed(2)}s
        </p>
        <div className="flex items-center gap-2">
          <span className="kicker text-mute">Sort</span>
          <div className="flex">
            {(["relevance", "date"] as const).map((s, i) => (
              <Link
                key={s}
                href={searchHref(data.query, { type, sort: s })}
                aria-current={s === sort ? "true" : undefined}
                className={`kicker border-2 border-line px-3 py-1.5 transition-colors ${i > 0 ? "-ml-0.5" : ""} ${
                  s === sort ? "bg-ink text-canvas" : "bg-surface hover:bg-mustard"
                }`}
              >
                {s === "relevance" ? "Best match" : "Newest"}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-2 border-line bg-surface">
        {data.results.map((result, i) => (
          <ResultCard key={result.id} result={result} index={firstIndex + i} />
        ))}
      </div>
      <Pagination data={data} type={type} sort={sort} />
      <GoogleFallback data={data} type={type} />
    </div>
  );
}
