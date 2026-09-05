import { SearchResult } from "@/lib/types";

export default function ResultCard({ result }: { result: SearchResult }) {
  return (
    <article className="mb-6 max-w-2xl">
      <a
        href={result.url}
        // target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <p className="truncate text-sm text-green-700">{result.url}</p>
        <h2 className="text-xl text-blue-800 hover:underline">
          {result.title}
        </h2>
      </a>
      <p className="mt-1 text-sm text-gray-600">{result.snippet}</p>
    </article>
  );
}
