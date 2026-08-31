import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import { search } from "@/lib/api";

interface SearchPageProps {
  searchParams: { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q?.trim() ?? "";

  if (!query) {
    return (
      <main>
        <Header />
        <div className="px-6">
          <p className="text-gray-600">Type something to search.</p>
        </div>
      </main>
    );
  }

  let data;
  let error: string | null = null;

  try {
    data = await search(query);
  } catch (e) {
    error = e instanceof Error ? e.message : "Something went wrong.";
  }

  return (
    <main>
      <Header />
      <div className="border-b border-gray-200 px-6 pb-4">
        <div className="max-w-2xl">
          <SearchBar initialQuery={query} size="compact" />
        </div>
      </div>
      <div className="px-6 py-6">
        {error && <p className="text-red-600">Failed to load results: {error}</p>}
        {data && <SearchResults data={data} />}
      </div>
    </main>
  );
}
