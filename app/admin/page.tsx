import AdminNav from "@/components/AdminNav";
import AdminStatCard from "@/components/AdminStatCard";
import Header from "@/components/Header";
import { getAdminStats, getRecentCrawls } from "@/lib/api";

export default async function AdminOverviewPage() {
  const [stats, recentCrawls] = await Promise.all([
    getAdminStats().catch(() => null),
    getRecentCrawls().catch(() => []),
  ]);

  return (
    <main>
      <Header />
      <div className="px-6">
        <h1 className="mb-4 text-2xl font-semibold">Nexa Admin</h1>
        <AdminNav />

        {stats ? (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <AdminStatCard label="Indexed pages" value={stats.indexedPages} />
            <AdminStatCard label="Domains" value={stats.domains} />
            <AdminStatCard label="Search terms" value={stats.searchTerms} />
            <AdminStatCard label="Crawl queue" value={stats.crawlQueue} />
          </div>
        ) : (
          <p className="mb-8 text-sm text-gray-500">
            Stats unavailable — is the backend running?
          </p>
        )}

        <h2 className="mb-3 text-lg font-medium">Recent Crawls</h2>
        <table className="w-full max-w-2xl text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="py-2">URL</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentCrawls.length === 0 && (
              <tr>
                <td colSpan={2} className="py-3 text-gray-400">
                  No crawls yet.
                </td>
              </tr>
            )}
            {recentCrawls.map((crawl) => (
              <tr key={crawl.url} className="border-b border-gray-100">
                <td className="py-2 truncate">{crawl.url}</td>
                <td className="py-2">
                  {crawl.status === "success" ? "✓ Success" : "✗ Failed"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
