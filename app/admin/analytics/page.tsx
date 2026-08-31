import AdminNav from "@/components/AdminNav";
import Header from "@/components/Header";

export default function AdminAnalyticsPage() {
  return (
    <main>
      <Header />
      <div className="px-6">
        <h1 className="mb-4 text-2xl font-semibold">Analytics</h1>
        <AdminNav />
        <p className="text-sm text-gray-500">
          Search analytics (top queries, zero-result queries, query volume
          over time) go here once <code>/api/analytics</code> exists on the
          backend. Placeholder for now — wire this up after Phase 13.
        </p>
      </div>
    </main>
  );
}
