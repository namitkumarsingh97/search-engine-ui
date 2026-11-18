import { cookies } from "next/headers";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import AgeGate from "@/components/AgeGate";
import SearchTabs from "@/components/SearchTabs";
import { search } from "@/lib/api";
import { ADULT_COOKIE, TOKEN_COOKIE } from "@/lib/auth";
import { SearchSort, SearchType } from "@/lib/types";

const VALID_TYPES: SearchType[] = ["all", "web", "file", "mail", "event", "video", "news"];

interface SearchPageProps {
  searchParams: { q?: string; type?: string; page?: string; sort?: string };
}

function Tips() {
  const row = "flex items-baseline gap-3 border-b border-line py-1.5 last:border-b-0";
  const code = "w-44 shrink-0 bg-mustard px-1.5 py-0.5 font-mono text-xs font-bold";
  return (
    <details className="mt-3 max-w-3xl border-2 border-line bg-surface text-sm">
      <summary className="kicker cursor-pointer px-4 py-2.5 hover:bg-mustard">Search tips</summary>
      <div className="px-4 pb-3 font-medium">
        <p className={row}><code className={code}>&quot;exact phrase&quot;</code>words next to each other, in order</p>
        <p className={row}><code className={code}>python -django</code>leave out results containing a word</p>
        <p className={row}><code className={code}>site:example.com</code>only that website</p>
        <p className={row}><code className={code}>type:video</code>video, file, mail, event, news or web</p>
      </div>
    </details>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim() ?? "";
  const type = VALID_TYPES.includes(searchParams.type as SearchType) ? (searchParams.type as SearchType) : "all";
  const sort: SearchSort = searchParams.sort === "date" ? "date" : "relevance";
  const page = Math.max(1, Math.floor(Number(searchParams.page) || 1));

  if (!query) {
    return (
      <main>
        <Header />
        <div className="page pt-10">
          <div className="max-w-3xl">
            <SearchBar autoFocus size="large" />
          </div>
          <p className="kicker mt-6">Type something to search</p>
        </div>
      </main>
    );
  }

  let data;
  let error: string | null = null;
  // Self-declared "I am 18 or older", kept in this browser only.
  const adult = cookies().get(ADULT_COOKIE)?.value === "1";

  try {
    const rawToken = cookies().get(TOKEN_COOKIE)?.value;
    data = await search(query, { type, page, sort, mature: adult }, rawToken ? decodeURIComponent(rawToken) : undefined);
  } catch (e) {
    error = e instanceof Error ? e.message : "Something went wrong.";
  }

  return (
    <main>
      <Header />
      <div className="page pt-8">
        <div className="mb-6 max-w-3xl">
          <SearchBar initialQuery={query} size="compact" />
          <Tips />
        </div>
        <div className="mb-8 max-w-3xl">
          <SearchTabs query={query} active={type} sort={sort} facets={data?.facets} />
        </div>
        <div className="max-w-3xl">
          {error && (
            <div className="border-2 border-danger bg-surface p-4 text-sm font-bold text-danger">
              Failed to load results: {error}
            </div>
          )}
          {data && <AgeGate data={data} adult={adult} />}
          {data && !(data.ageCheck && !adult && (data.matureHidden ?? 0) === 0) && <SearchResults data={data} type={type} sort={sort} />}
        </div>
      </div>
    </main>
  );
}
