import Link from "next/link";
import { searchHref } from "@/lib/searchLinks";
import { SearchResult } from "@/lib/types";
import Marked from "./Marked";

/** "From your mail": the signed-in person's own messages that match, above the web results. */
export default function MailShelf({ items, total, query }: { items: SearchResult[]; total: number; query: string }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="kicker mb-2 flex items-center gap-3">
        <span className="inline-block h-3 w-3 bg-ink" />
        From your mail
      </p>
      <ul className="border-2 border-line bg-surface">
        {items.map((m) => (
          <li key={m.id} className="border-b-2 border-line last:border-b-0">
            <Link href={m.url} className="block px-4 py-3 transition-colors hover:bg-mustard">
              <span className="display block truncate text-xl leading-tight">
                <Marked text={m.titleMarked || m.title} />
              </span>
              {m.snippet && (
                <span className="mt-1 line-clamp-2 block text-sm font-medium text-mute">
                  <Marked text={m.snippet} />
                </span>
              )}
            </Link>
          </li>
        ))}
        {total > items.length && (
          <li>
            <Link href={searchHref(query, { type: "mail" })} className="kicker block bg-surface2 px-4 py-2.5 hover:bg-mustard">
              See all {total} in Mail
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
