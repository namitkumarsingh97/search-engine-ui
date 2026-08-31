import SearchBar from "@/components/SearchBar";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-8 text-5xl font-semibold text-brand-dark">
        MiniSearch
      </h1>
      <div className="w-full max-w-xl">
        <SearchBar autoFocus size="large" />
      </div>
      <p className="mt-6 text-xs text-gray-400">
        A small search engine, built from scratch.
      </p>
    </main>
  );
}
