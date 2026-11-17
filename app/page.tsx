import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import NewsList from "@/components/NewsList";
import SearchBar from "@/components/SearchBar";
import { appLinkProps, fetchApps, TONE_CLASSES } from "@/lib/apps";
import { fetchNews } from "@/lib/news";

// Rendered per request so apps added in the admin page show up straight away.
export const dynamic = "force-dynamic";

const BUILT_IN = [
  { href: "/drive", label: "Drive", blurb: "Your files, searchable down to the last line.", block: "bg-mustard text-ink" },
  { href: "/videos", label: "Videos", blurb: "Watch, upload and share clips.", block: "bg-accent text-white" },
  { href: "/calendar", label: "Calendar", blurb: "Events, repeats and reminders.", block: "bg-ink text-canvas" },
  { href: "/mail", label: "Mail", blurb: "Write to other users. Every message searchable.", block: "bg-surface text-ink" },
];

/** Flat geometric composition: squares, a bar and a triangle. No curves, no gradients. */
function Composition() {
  return (
    <div className="relative hidden aspect-square w-full max-w-md lg:block" aria-hidden>
      <div className="absolute left-0 top-0 h-[58%] w-[58%] bg-mustard" />
      <div className="absolute bottom-0 right-0 h-[58%] w-[58%] bg-ink" />
      <div className="absolute right-0 top-0 h-[38%] w-[38%] bg-accent" />
      <div
        className="absolute bottom-[8%] left-[6%] h-[34%] w-[34%] bg-accent"
        style={{ clipPath: "polygon(0 100%, 100% 100%, 50% 0)" }}
      />
      <div className="absolute left-[58%] top-[38%] h-[10%] w-[42%] bg-canvas" />
      <span className="absolute bottom-[3%] right-[4%] text-6xl font-black leading-none tracking-tighter text-canvas">
        N°1
      </span>
    </div>
  );
}

export default async function HomePage() {
  const [apps, news] = await Promise.all([fetchApps(), fetchNews({ limit: 5 })]);

  // Built-in features and the owner's own apps share one grid, so they read as one product.
  const tiles = [
    ...BUILT_IN.map((t) => ({ key: t.href, label: t.label, blurb: t.blurb, block: t.block, link: { href: t.href } as { href: string; target?: string; rel?: string }, external: false })),
    ...apps.map((a) => ({
      key: a.id,
      label: a.name,
      blurb: a.tagline || a.description,
      block: TONE_CLASSES[a.tone] ?? TONE_CLASSES.mustard,
      link: appLinkProps(a),
      external: true,
    })),
  ];

  return (
    <main className="flex min-h-screen flex-col">
      <Header />

      <section className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div>
            <p className="kicker mb-5 flex items-center gap-3">
              <span className="inline-block h-3 w-10 bg-accent" />
              One search for everything
            </p>
            <h1 className="display text-[clamp(3rem,8vw,6.75rem)]">
              Find
              <br />
              every<span className="text-accent">thing.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg font-medium leading-snug">
              The web, your files, your videos and your calendar. One box. No noise.
            </p>
          </div>
          <Composition />
        </div>

        <div className="mt-12 border-y-4 border-line py-8">
          <div className="max-w-3xl">
            <SearchBar autoFocus size="large" />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 border-2 border-line sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map(({ key, label, blurb, block, link, external }, i) => {
            const cls = `flex min-h-[15rem] flex-col justify-between border-b-2 border-line p-5 sm:border-r-2 transition-transform hover:-translate-y-1 ${block}`;
            const inner = (
              <>
                <span className="flex items-start justify-between">
                  <span className="text-5xl font-black leading-none tracking-tighter">{String(i + 1).padStart(2, "0")}</span>
                  <ArrowUpRight size={26} strokeWidth={3} />
                </span>
                <span className="mt-12 block">
                  <span className="display block text-3xl">{label}</span>
                  <span className="mt-2 block text-sm font-medium leading-snug">{blurb}</span>
                </span>
              </>
            );
            // Built-in features navigate inside Nexa; apps route to their own URL.
            return external ? (
              <a key={key} {...link} className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={key} href={link.href} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>

        {news && news.items.length > 0 && (
          <div className="mt-12">
            <div className="mb-3 flex items-end justify-between gap-4 border-b-4 border-line pb-2">
              <h2 className="display text-4xl">What&apos;s new</h2>
              <Link href="/news" className="kicker flex items-center gap-1.5 hover:underline">
                All news <ArrowUpRight size={14} strokeWidth={3} />
              </Link>
            </div>
            <NewsList items={news.items} />
          </div>
        )}
      </section>

      <footer className="border-t-4 border-line">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <span className="kicker">Nexa — a small search engine</span>
          <span className="kicker hidden sm:block">
            Press <kbd className="border-2 border-line px-1.5">/</kbd> to search
          </span>
        </div>
      </footer>
    </main>
  );
}
