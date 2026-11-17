import { ArrowUpRight } from "lucide-react";
import { TONE_CLASSES } from "@/lib/apps";
import { NewsEntry, timeAgo } from "@/lib/news";

/** A stack of product updates: colored product tag, what changed, and when. */
export default function NewsList({ items }: { items: NewsEntry[] }) {
  return (
    <ul className="border-2 border-line bg-surface">
      {items.map((item) => (
        <li key={item.id} className="border-b-2 border-line last:border-b-0">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group grid grid-cols-[6.5rem_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-mustard sm:grid-cols-[9rem_1fr_auto]"
          >
            <span
              className={`kicker truncate px-2 py-2 text-center ${
                item.product ? TONE_CLASSES[item.product.tone] ?? TONE_CLASSES.mustard : "bg-surface2"
              } border-2 border-line`}
            >
              {item.product?.name ?? "Nexa"}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-black leading-tight tracking-tight sm:text-lg">{item.message}</span>
              <span className="kicker mt-1 block text-mute group-hover:text-ink">{timeAgo(item.committedAt)}</span>
            </span>
            <ArrowUpRight size={20} strokeWidth={3} className="shrink-0" />
          </a>
        </li>
      ))}
    </ul>
  );
}
