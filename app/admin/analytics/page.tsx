import { cookies } from "next/headers";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import AdminStatCard from "@/components/AdminStatCard";
import Header from "@/components/Header";
import PageTitle from "@/components/PageTitle";
import { ApiError, getAnalytics } from "@/lib/api";
import { TOKEN_COOKIE } from "@/lib/auth";

function QueryList({ title, rows, empty }: { title: string; rows: { query: string; count: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div>
      <h2 className="display mb-3 text-3xl">{title}</h2>
      {rows.length === 0 ? (
        <p className="border-2 border-line bg-surface px-4 py-6 text-sm font-medium text-mute">{empty}</p>
      ) : (
        <ol className="border-2 border-line bg-surface">
          {rows.map((r, i) => (
            <li key={r.query} className="relative border-b-2 border-line last:border-b-0">
              <span className="absolute inset-y-0 left-0 bg-mustard" style={{ width: `${(r.count / max) * 100}%` }} />
              <span className="relative flex items-center gap-3 px-4 py-2.5 text-sm font-bold">
                <span className="w-6 text-accent-fg">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate">{r.query}</span>
                <span>{r.count}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const raw = cookies().get(TOKEN_COOKIE)?.value;
  let data = null;
  let denied: number | null = null;
  let failed = false;

  try {
    data = await getAnalytics(raw ? decodeURIComponent(raw) : undefined);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) denied = e.status;
    else failed = true;
  }

  const maxDay = Math.max(1, ...(data?.perDay.map((d) => d.count) ?? [1]));

  return (
    <main>
      <Header />
      <div className="page">
        <PageTitle kicker="Section 05 / Control room" title="Analytics" subtitle="Search behaviour over the last two weeks." />

        {denied ? (
          <div className="card max-w-xl border-4 p-6">
            <p className="kicker mb-2 text-danger">Restricted</p>
            <h2 className="display text-4xl">Admin only</h2>
            <p className="mt-3 text-sm font-medium">
              {denied === 401 ? "Sign in with an admin account to see analytics." : "This account doesn't have admin access."}
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

            {failed || !data ? (
              <p className="border-2 border-danger bg-surface px-3 py-2 text-sm font-bold text-danger">
                Analytics unavailable. Is the backend running?
              </p>
            ) : (
              <>
                <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <AdminStatCard label="Total searches" value={data.totalSearches} />
                  <AdminStatCard label="By signed-in users" value={data.signedInSearches} />
                  <AdminStatCard label="With no results" value={data.zeroResultSearches} />
                  <AdminStatCard label="Avg results" value={data.averageResults} />
                </div>

                <h2 className="display mb-3 text-3xl">Searches per day</h2>
                <div className="card mb-10 p-5">
                  <div className="flex h-44 items-end gap-1.5">
                    {data.perDay.map((d) => (
                      <div key={d.date} className="flex h-full flex-1 flex-col justify-end" title={`${d.date}: ${d.count}`}>
                        <span className="mb-1 text-center text-[10px] font-bold">{d.count || ""}</span>
                        <span
                          className={d.count ? "bg-accent" : "bg-surface2"}
                          style={{ height: `${Math.max(d.count ? 6 : 2, (d.count / maxDay) * 100)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] font-bold text-mute">
                    <span>{data.perDay[0]?.date}</span>
                    <span>{data.perDay[data.perDay.length - 1]?.date}</span>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <QueryList title="Top queries" rows={data.topQueries} empty="No anonymous searches yet." />
                  <QueryList title="Searches with no results" rows={data.zeroResultQueries} empty="Nothing here. Every search found something." />
                </div>

                <p className="mt-8 max-w-2xl text-xs font-medium text-mute">
                  Privacy: query text is only listed for anonymous searches. Signed-in users&apos; searches are counted above but their
                  words are never shown here; each user can see and clear their own history from the search box.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
