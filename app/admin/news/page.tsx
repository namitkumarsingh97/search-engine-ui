"use client";

import { Eye, EyeOff, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import Header from "@/components/Header";
import PageTitle from "@/components/PageTitle";
import { AdminNewsItem, ApiError, getAdminNews, setNewsHidden, syncNewsNow } from "@/lib/api";
import { timeAgo } from "@/lib/news";

export default function AdminNewsPage() {
  const [items, setItems] = useState<AdminNewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [denied, setDenied] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getAdminNews(page);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) setDenied(e.status);
      else setError(e instanceof Error ? e.message : "Failed to load news.");
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action: () => Promise<unknown>, done?: (r: never) => string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      if (done) setNotice(done(result as never));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const pages = Math.ceil(total / 50);

  return (
    <main>
      <Header />
      <div className="page">
        <PageTitle kicker="Section 05 / Control room" title="News" subtitle="Updates are read from each product's public GitHub repo automatically. Hide anything you don't want shown.">
          {!denied && (
            <button
              className="btn-primary !py-3"
              disabled={busy}
              onClick={() =>
                run(syncNewsNow, ((r: { added: number; repos: number; errors: string[] }) =>
                  `Checked ${r.repos} repo${r.repos === 1 ? "" : "s"}: ${r.added} new update${r.added === 1 ? "" : "s"}.${r.errors.length ? ` Problems: ${r.errors.join("; ")}` : ""}`) as never)
              }
            >
              <RefreshCw size={15} strokeWidth={3} /> Check GitHub now
            </button>
          )}
        </PageTitle>

        {denied ? (
          <div className="card max-w-xl border-4 p-6">
            <p className="kicker mb-2 text-danger">Restricted</p>
            <h2 className="display text-4xl">Admin only</h2>
            <p className="mt-3 text-sm font-medium">
              {denied === 401 ? "Sign in with an admin account to manage news." : "This account doesn't have admin access."}
            </p>
            {denied === 401 && (
              <Link href="/login" className="btn-primary mt-4">
                Sign in
              </Link>
            )}
          </div>
        ) : (
          <>
            <AdminNav />
            {error && <p className="mb-4 border-2 border-danger bg-surface px-3 py-2 text-sm font-bold text-danger">{error}</p>}
            {notice && <p className="mb-4 border-2 border-ok bg-surface px-3 py-2 text-sm font-bold text-ok">{notice}</p>}

            {items.length === 0 && !error && (
              <p className="border-2 border-line bg-surface px-4 py-8 text-sm font-semibold">
                No updates yet. Add a GitHub repo to a product under Products, then press &ldquo;Check GitHub now&rdquo;.
              </p>
            )}

            <ul className="border-2 border-line bg-surface">
              {items.map((i) => (
                <li key={i.id} className={`flex items-center gap-4 border-b-2 border-line px-4 py-3 last:border-b-0 ${i.hidden ? "bg-surface2/70" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-black ${i.hidden ? "line-through opacity-60" : ""}`}>{i.message}</p>
                    <p className="kicker mt-0.5 text-mute">
                      {i.product} · {i.repo} · {timeAgo(i.committedAt)}
                      {i.hidden && <span className="ml-2 bg-ink px-1.5 py-0.5 text-canvas">Hidden</span>}
                    </p>
                  </div>
                  <button
                    className="icon-btn"
                    title={i.hidden ? "Show in News" : "Hide from News"}
                    disabled={busy}
                    onClick={() => run(() => setNewsHidden(i.id, !i.hidden))}
                  >
                    {i.hidden ? <Eye size={17} /> : <EyeOff size={17} />}
                  </button>
                </li>
              ))}
            </ul>

            {pages > 1 && (
              <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Newer
                </button>
                <span>
                  {page} / {pages}
                </span>
                <button className="btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Older
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
