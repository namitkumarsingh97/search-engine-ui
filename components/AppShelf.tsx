import { ArrowUpRight } from "lucide-react";
import { appLinkProps, iconFor, PublicApp, TONE_CLASSES } from "@/lib/apps";

/** Apps matching the search, shown above the results the way big engines surface their own products. */
export default function AppShelf({ apps }: { apps: PublicApp[] }) {
  if (apps.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="kicker mb-2 flex items-center gap-3">
        <span className="inline-block h-3 w-3 bg-accent" />
        Nexa {apps.length === 1 ? "product" : "products"}
      </p>
      <div className="grid gap-3">
        {apps.map((app) => {
          const Icon = iconFor(app.icon);
          return (
            <a
              key={app.id}
              {...appLinkProps(app)}
              className="group flex items-stretch border-4 border-line bg-surface transition-transform hover:-translate-y-0.5"
            >
              <span className={`flex w-20 shrink-0 items-center justify-center sm:w-28 ${TONE_CLASSES[app.tone] ?? TONE_CLASSES.mustard}`}>
                <Icon size={34} strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1 px-4 py-4">
                <span className="display block text-3xl sm:text-4xl">{app.name}</span>
                {app.tagline && <span className="mt-1 block text-sm font-semibold">{app.tagline}</span>}
                {app.description && app.description !== app.tagline && (
                  <span className="mt-1 line-clamp-2 block text-xs font-medium text-mute">{app.description}</span>
                )}
              </span>
              <span className="flex items-center px-4 transition-colors group-hover:bg-mustard">
                <span className="kicker flex items-center gap-1.5">
                  Open <ArrowUpRight size={16} strokeWidth={3} />
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
