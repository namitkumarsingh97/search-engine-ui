import { ArrowUpRight } from "lucide-react";
import { SearchResponse, SearchType } from "@/lib/types";

/** The same words on Google. Nexa's own `type:` filter means nothing there, so it is left out. */
export function googleHref(query: string): string {
  const q = query.replace(/\btype:\w+/gi, "").replace(/\s+/g, " ").trim();
  return `https://www.google.com/search?q=${encodeURIComponent(q || query)}`;
}

const LINK = { target: "_blank", rel: "noopener noreferrer" } as const;

/**
 * Nexa only knows what is in its own database, so when it has little or nothing to show,
 * offer the same search on Google. It never appears for adult searches (the age check handles those)
 * or on tabs about private content (Drive, Mail, Calendar, Videos).
 */
export default function GoogleFallback({ data, type }: { data: SearchResponse; type: SearchType }) {
  if (data.ageCheck) return null;
  if (type !== "all" && type !== "web" && type !== "news") return null;

  const href = googleHref(data.query);
  const none = data.results.length === 0;
  const few = !none && data.page === 1 && data.total < 5;

  if (!none && !few) {
    return (
      <p className="mt-6 text-sm font-semibold">
        Not what you were looking for?{" "}
        <a href={href} {...LINK} className="link">
          Search Google for &ldquo;{data.query}&rdquo;
        </a>
      </p>
    );
  }

  return (
    <section className={`${none ? "mb-0" : "mt-6"} border-2 border-line bg-mustard p-5`} aria-label="Search Google instead">
      <p className="kicker">{none ? "Not in Nexa yet" : "Only a few results here"}</p>
      <h2 className="mt-1 text-xl font-black uppercase tracking-tight">
        {none ? "Nexa doesn't have this one." : "Want to see more?"}
      </h2>
      <p className="mt-2 max-w-xl text-sm font-medium">
        Nexa searches its own collection, so it can&apos;t answer everything. Try the same search on Google.
      </p>
      <a href={href} {...LINK} className="btn-primary mt-4 inline-flex items-center gap-2">
        Search Google for &ldquo;{data.query}&rdquo; <ArrowUpRight size={16} strokeWidth={3} />
      </a>
    </section>
  );
}
