import { SearchResult } from "@/lib/types";
import Marked from "./Marked";

const TYPE_META = {
  web: { label: "Web", tone: "bg-ink text-canvas" },
  file: { label: "Drive", tone: "bg-mustard text-ink" },
  mail: { label: "Mail", tone: "bg-surface2 text-ink" },
  event: { label: "Calendar", tone: "bg-ink text-mustard" },
  video: { label: "Video", tone: "bg-accent text-white" },
} as const;

/** "https://a.com/b/c" -> { host: "a.com", path: "b / c" } */
function prettyUrl(url: string): { host: string; path: string } {
  try {
    const u = new URL(url);
    const path = u.pathname.split("/").filter(Boolean).join(" / ");
    return { host: u.hostname.replace(/^www\./, ""), path };
  } catch {
    return { host: url, path: "" };
  }
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

export default function ResultCard({ result, index }: { result: SearchResult; index: number }) {
  const meta = TYPE_META[result.type] ?? TYPE_META.web;
  const external = result.type === "web";
  const { host, path } = external ? prettyUrl(result.url) : { host: meta.label, path: "" };
  const date = external ? "" : formatDate(result.date);

  return (
    <article className="group border-b-2 border-line last:border-b-0">
      <a
        href={result.url}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="grid grid-cols-[3.25rem_1fr] gap-4 px-4 py-5 transition-colors hover:bg-mustard sm:grid-cols-[5rem_1fr] sm:px-5"
      >
        <span className="text-4xl font-black leading-none tracking-tighter text-accent group-hover:text-ink sm:text-6xl">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0">
          <span className="mb-2 flex min-w-0 items-center gap-3">
            <span className={`kicker shrink-0 px-2 py-1 ${meta.tone}`}>{meta.label}</span>
            <span className="truncate text-xs font-medium text-mute group-hover:text-ink">
              {host}
              {path && ` / ${path}`}
              {date && ` · ${date}`}
            </span>
          </span>
          <h2 className="display block text-2xl leading-[0.95] sm:text-3xl">
            <Marked text={result.titleMarked || result.title} />
          </h2>
          {result.snippet && (
            <span className="mt-2 line-clamp-3 block text-sm font-medium leading-relaxed">
              <Marked text={result.snippet} />
            </span>
          )}
        </span>
      </a>
    </article>
  );
}
