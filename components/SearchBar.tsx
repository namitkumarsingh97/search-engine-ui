"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Search } from "lucide-react";
import { getAutocomplete } from "@/lib/api"; // adjust path if needed

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  /*
   * Fetch autocomplete suggestions whenever query changes.
   */
  useEffect(() => {
    const trimmed = query.trim();

    // Don't call API for empty input
    if (!trimmed) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    setSelectedIndex(-1);
    setLoading(true);

    // Debounce API request
    const timer = setTimeout(async () => {
      try {
        const results = await getAutocomplete(trimmed);

        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  /*
   * Close dropdown when clicking outside.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
   * Submit normal search.
   */
  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) return;

    setShowSuggestions(false);

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  /*
   * Select autocomplete suggestion.
   */
  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
    setShowSuggestions(false);

    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  }

  /*
   * Keyboard navigation.
   */
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();

      setSelectedIndex((current) =>
        current < suggestions.length - 1 ? current + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      setSelectedIndex((current) =>
        current > 0 ? current - 1 : suggestions.length - 1
      );
    }

    if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();

      handleSuggestionClick(suggestions[selectedIndex]);
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  }

  const inputPadding =
    size === "large" ? "py-3 px-5 text-lg" : "py-2 px-4 text-base";

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md">
          <span className="pl-4 text-gray-400" aria-hidden>
            <Search size={18} />
          </span>

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (query.trim() && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search the index..."
            autoFocus={autoFocus}
            autoComplete="off"
            className={`flex-1 rounded-full outline-none ${inputPadding}`}
          />

          <button
            type="submit"
            className="mr-2 rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Search
          </button>
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {showSuggestions && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-5 py-3 text-sm text-gray-500">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="py-2">
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion}-${index}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition-colors ${
                      selectedIndex === index
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Search
                      size={16}
                      className="shrink-0 text-gray-400"
                    />

                    <span className="truncate text-gray-800">
                      {suggestion}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-3 text-sm text-gray-500">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
