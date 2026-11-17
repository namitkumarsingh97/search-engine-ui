import Link from "next/link";
import Header from "@/components/Header";
import NewsList from "@/components/NewsList";
import PageTitle from "@/components/PageTitle";
import { fetchNews } from "@/lib/news";

// Rendered per request: the API refreshes from GitHub when its copy is stale.
export const dynamic = "force-dynamic";

export default async function NewsPage({ searchParams }: { searchParams: { product?: string; page?: string } }) {
  const product = searchParams.product;
  const page = Math.max(1, Math.floor(Number(searchParams.page) || 1));
  const data = await fetchNews({ product, page, limit: 20 });

  const href = (p: { product?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (p.product) q.set("product", p.product);
    if (p.page && p.page > 1) q.set("page", String(p.page));
    const s = q.toString();
    return s ? `/news?${s}` : "/news";
  };
  const chip = (active: boolean) =>
    `kicker border-2 border-line px-3.5 py-2 transition-colors ${active ? "bg-ink text-canvas" : "bg-surface hover:bg-mustard"}`;
  const pages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <main>
      <Header />
      <div className="page">
        <PageTitle kicker="Section 06 / Dispatches" title="News" subtitle="What's new across Nexa's products, taken straight from their code as it ships." />

        {data && data.products.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            <Link href="/news" className={chip(!product)}>
              All
            </Link>
            {data.products.map((p) => (
              <Link key={p.slug} href={href({ product: p.slug })} className={chip(product === p.slug)}>
                {p.name}
              </Link>
            ))}
          </div>
        )}

        {!data && (
          <p className="border-2 border-danger bg-surface px-4 py-3 text-sm font-bold text-danger">
            News is unavailable right now. Try again in a moment.
          </p>
        )}

        {data && data.items.length === 0 && (
          <div className="border-2 border-line bg-surface px-6 py-14 text-center">
            <p className="display text-3xl">Quiet for now</p>
            <p className="mt-2 text-sm font-medium text-mute">No recent changes to show. New updates appear here automatically.</p>
          </div>
        )}

        {data && data.items.length > 0 && <NewsList items={data.items} />}

        {pages > 1 && (
          <nav className="mt-6 flex" aria-label="Pages">
            {page > 1 ? (
              <Link href={href({ product, page: page - 1 })} className="kicker border-2 border-line bg-surface px-4 py-2.5 hover:bg-mustard">
                Newer
              </Link>
            ) : (
              <span className="kicker border-2 border-line bg-surface2 px-4 py-2.5 text-mute">Newer</span>
            )}
            <span className="kicker -ml-0.5 border-2 border-line bg-ink px-4 py-2.5 text-canvas">
              {page} / {pages}
            </span>
            {page < pages ? (
              <Link href={href({ product, page: page + 1 })} className="kicker -ml-0.5 border-2 border-line bg-surface px-4 py-2.5 hover:bg-mustard">
                Older
              </Link>
            ) : (
              <span className="kicker -ml-0.5 border-2 border-line bg-surface2 px-4 py-2.5 text-mute">Older</span>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
