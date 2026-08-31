import { SearchResponse } from "@/lib/types";
import ResultCard from "./ResultCard";

export default function SearchResults({ data }: { data: SearchResponse }) {
  if (data.results.length === 0) {
    return (
      <p className="text-gray-600">
        No results found for <span className="font-medium">&quot;{data.query}&quot;</span>.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        About {data.total} results ({(data.tookMs / 1000).toFixed(2)} seconds)
      </p>
      {data.results.map((result) => (
        <ResultCard key={result.id} result={result} />
      ))}
    </div>
  );
}
