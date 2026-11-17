import { cookies } from "next/headers";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import AdminStatCard from "@/components/AdminStatCard";
import Header from "@/components/Header";
import PageTitle from "@/components/PageTitle";
import { ApiError, getAdminStats, getRecentCrawls } from "@/lib/api";
import { TOKEN_COOKIE } from "@/lib/auth";

export default async function AdminOverviewPage() {
  const raw = cookies().get(TOKEN_COOKIE)?.value;
  const token = raw ? decodeURIComponent(raw) : undefined;

  const [statsRes, crawlsRes] = await Promise.allSettled([getAdminStats(token), getRecentCrawls(token)]);
  const stats = statsRes.status === "fulfilled" ? statsRes.value : null;
  const recentCrawls = crawlsRes.status === "fulfilled" ? crawlsRes.value : [];
  const denied =
    statsRes.status === "rejected" && statsRes.reason instanceof ApiError && [401, 403].includes(statsRes.reason.status)
      ? (statsRes.reason as ApiError).status
      : null;

  return (
    <main>
      <Header />
      <div className="page">
        <PageTitle kicker="Section 04 / Control room" title="Admin" subtitle="Index health and crawler activity." />
        {denied ? (
          <div className="card max-w-xl border-4 p-6">
            <p className="kicker mb-2 text-danger">Restricted</p>
            <h2 className="display text-4xl">Admin only</h2>
            <p className="mt-3 text-sm font-medium">
              {denied === 401 ? "Sign in with an admin account to see this page." : "This account doesn't have admin access."}
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

        {stats ? (
          <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AdminStatCard label="Indexed documents" value={stats.indexedPages} />
            <AdminStatCard label="Domains" value={stats.domains} />
            <AdminStatCard label="Search terms" value={stats.searchTerms} />
            <AdminStatCard label="Crawl queue" value={stats.crawlQueue} />
          </div>
        ) : (
          <p className="mb-10 border-2 border-danger bg-surface px-3 py-2 text-sm font-bold text-danger">
            Stats unavailable. Is the backend running?
          </p>
        )}

        {stats?.documentsByType && (
          <div className="mb-10 flex flex-wrap border-2 border-line bg-surface">
            {Object.entries(stats.documentsByType).map(([type, n]) => (
              <div key={type} className="min-w-[7rem] flex-1 border-r-2 border-line px-4 py-3 last:border-r-0">
                <p className="kicker text-mute">{type}</p>
                <p className="display text-3xl">{n}</p>
              </div>
            ))}
          </div>
        )}

        <h2 className="display mb-3 text-3xl">Recent crawls</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-line bg-ink text-canvas">
                <th className="kicker px-4 py-3">URL</th>
                <th className="kicker px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-line">
              {recentCrawls.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-mute">
                    No crawls yet.
                  </td>
                </tr>
              )}
              {recentCrawls.map((crawl) => (
                <tr key={crawl.url} className="hover:bg-mustard">
                  <td className="max-w-md truncate px-4 py-3">{crawl.url}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`kicker px-2 py-1 ${crawl.status === "success" ? "bg-ok text-white" : "bg-danger text-white"}`}
                    >
                      {crawl.status === "success" ? "Success" : "Failed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
        )}
      </div>
    </main>
  );
}
