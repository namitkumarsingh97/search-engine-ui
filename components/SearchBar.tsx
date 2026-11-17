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
import { clearSearchHistory, getAutocomplete, getSearchHistory } from "@/lib/api";
import { X } from "lucide-react";

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
  // Signed-in users see their recent searches when they click into an empty box.
  const [recent, setRecent] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typedRef = useRef(false); // true once the user has edited the box

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
        // Don't pop the dropdown open on page load for a prefilled query.
        setShowSuggestions(typedRef.current);
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
        setShowRecent(false);
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

  // Press "/" anywhere (outside a text field) to jump to the search box.
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      const el = document.activeElement as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const large = size === "large";
  const inputPadding = large ? "py-4 text-lg sm:text-xl" : "py-2 text-base";

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div
          className={`flex items-center gap-2 border-line bg-surface transition-colors focus-within:bg-white ${
            large ? "border-4 pl-5 pr-2" : "border-2 pl-4 pr-1.5"
          }`}
        >
          <span className="text-ink" aria-hidden>
            <Search size={large ? 20 : 18} />
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              typedRef.current = true;
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (!query.trim()) {
                getSearchHistory()
                  .then((items) => {
                    setRecent(items);
                    setShowRecent(items.length > 0);
                  })
                  .catch(() => undefined);
              }
              if (query.trim() && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search the web, your files, videos…"
            autoFocus={autoFocus}
            autoComplete="off"
            className={`min-w-0 flex-1 bg-transparent font-medium text-ink !outline-none placeholder:text-mute ${inputPadding}`}
          />

          {!query && (
            <kbd className="hidden border-2 border-line px-1.5 text-xs font-bold text-ink sm:block">/</kbd>
          )}

          <button type="submit" className={`btn-primary ${large ? "px-6 py-3" : "px-4 py-1.5"}`}>
            Search
          </button>
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {showRecent && !query.trim() && recent.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 border-2 border-t-0 border-line bg-surface">
          <div className="flex items-center justify-between border-b-2 border-line px-4 py-2">
            <span className="kicker">Recent searches</span>
            <button
              type="button"
              className="kicker underline hover:text-accent-fg"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                clearSearchHistory().catch(() => undefined);
                setRecent([]);
              }}
            >
              Clear all
            </button>
          </div>
          <ul>
            {recent.slice(0, 8).map((q) => (
              <li key={q} className="flex items-center hover:bg-mustard">
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate px-4 py-2.5 text-left text-sm font-semibold"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionClick(q)}
                >
                  {q}
                </button>
                <button
                  type="button"
                  className="icon-btn !p-2"
                  aria-label={`Forget "${q}"`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    clearSearchHistory(q).catch(() => undefined);
                    setRecent((r) => r.filter((x) => x !== q));
                  }}
                >
                  <X size={14} strokeWidth={3} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 border-2 border-t-0 border-line bg-surface">
          {loading ? (
            <div className="px-5 py-3 text-sm text-mute">
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
                        ? "bg-mustard"
                        : "hover:bg-surface2"
                    }`}
                  >
                    <Search
                      size={16}
                      className="shrink-0 text-mute"
                    />

                    <span className="truncate text-ink">
                      {suggestion}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-3 text-sm text-mute">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
