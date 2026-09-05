"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search, Menu, X, ArrowRight } from "lucide-react";
interface SearchBarProps {
  initialQuery?: string;
  autoFocus?: boolean;
  size?: "large" | "compact";
}

export default function SearchBar({
  initialQuery = "",
  autoFocus = false,
  size = "large",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  const inputPadding =
    size === "large" ? "py-3 px-5 text-lg" : "py-2 px-4 text-base";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 rounded-full border border-gray-300 shadow-sm hover:shadow-md focus-within:shadow-md transition-shadow">
        <span className="pl-4 text-gray-400" aria-hidden>
          <Search size={18} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the index..."
          autoFocus={autoFocus}
          className={`flex-1 rounded-full outline-none ${inputPadding}`}
        />
        <button
          type="submit"
          className="mr-2 rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-dark transition-colors"
        >
          Search
          {/* <Search size={18} /> */}
        </button>
      </div>
    </form>
  );
}
