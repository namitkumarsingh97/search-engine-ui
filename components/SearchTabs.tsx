import Link from "next/link";
import { searchHref } from "@/lib/searchLinks";
import { SearchFacets, SearchSort, SearchType } from "@/lib/types";

const TABS = [
  { type: "all", label: "All" },
  { type: "web", label: "Web" },
  { type: "file", label: "Drive" },
  { type: "mail", label: "Mail" },
  { type: "event", label: "Calendar" },
  { type: "video", label: "Videos" },
] as const;

export default function SearchTabs({
  query,
  active,
  sort,
  facets,
}: {
  query: string;
  active: SearchType;
  sort: SearchSort;
  /** Result counts per type for this query; shown next to each tab when known. */
  facets?: SearchFacets;
}) {
  return (
    <nav className="flex overflow-x-auto border-2 border-line bg-surface" aria-label="Search categories">
      {TABS.map(({ type, label }, i) => {
        const isActive = type === active;
        const count = facets?.[type];
        return (
          <Link
            key={type}
            href={searchHref(query, { type, sort })}
            aria-current={isActive ? "page" : undefined}
            className={`kicker flex shrink-0 items-center gap-2 px-4 py-3 transition-colors ${
              i > 0 ? "border-l-2 border-line" : ""
            } ${isActive ? "bg-ink text-canvas" : "hover:bg-mustard"} ${count === 0 && !isActive ? "text-mute" : ""}`}
          >
            <span className={isActive ? "text-mustard" : "text-mute"}>{String(i + 1).padStart(2, "0")}</span>
            {label}
            {count !== undefined && (
              <span className={`px-1.5 text-[10px] ${isActive ? "bg-mustard text-ink" : "bg-surface2 text-ink"}`}>{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
