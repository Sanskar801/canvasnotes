/**
 * WikilinkPopup — floating search UI for creating/selecting canvas links.
 *
 * Opens when user triggers `[[`, shows search results from the API,
 * and allows creating new canvases or linking to existing ones.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { canvasApi, type SearchResult } from "../../api/canvasApi";

interface WikilinkPopupProps {
  position: { x: number; y: number };
  onSelect: (canvas: { id: string; title: string; isNew: boolean }) => void;
  onClose: () => void;
}

export default function WikilinkPopup({ position, onSelect, onClose }: WikilinkPopupProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Search as user types
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await canvasApi.search(q);
      setResults(res);
      setActiveIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 200);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + (query.trim() ? 1 : 0); // +1 for "Create new"
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex < results.length) {
        onSelect({ id: results[activeIndex].id, title: results[activeIndex].title, isNew: false });
      } else if (query.trim()) {
        onSelect({ id: "", title: query.trim(), isNew: true });
      }
    }
  };

  const exactMatch = results.some((r) => r.title.toLowerCase() === query.trim().toLowerCase());

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />

      {/* Popup */}
      <div
        className="fixed z-[9999] w-72 rounded-xl overflow-hidden"
        style={{
          left: position.x,
          top: position.y,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          border: "1px solid rgba(139, 92, 246, 0.25)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(139,92,246,0.1)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Search input */}
        <div className="p-3 border-b border-white/10">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or create canvas…"
            className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2
                       border border-white/10 outline-none
                       placeholder:text-white/30
                       focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
                       transition-all"
          />
        </div>

        {/* Results */}
        <div className="max-h-52 overflow-y-auto py-1">
          {loading && (
            <div className="px-4 py-3 text-white/40 text-sm text-center">Searching…</div>
          )}

          {!loading && results.length === 0 && query.trim() === "" && (
            <div className="px-4 py-3 text-white/30 text-sm text-center">
              Type to search or create
            </div>
          )}

          {results.map((r, idx) => (
            <button
              key={r.id}
              onClick={() => onSelect({ id: r.id, title: r.title, isNew: false })}
              className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5
                         transition-colors cursor-pointer
                         ${idx === activeIndex
                           ? "bg-violet-500/20 text-white"
                           : "text-white/70 hover:bg-white/5"}`}
            >
              <span className="text-base flex-shrink-0">📄</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{r.title}</div>
                {r.summary && (
                  <div className="truncate text-xs text-white/40 mt-0.5">{r.summary}</div>
                )}
              </div>
            </button>
          ))}

          {/* Create new option */}
          {query.trim() && !exactMatch && (
            <button
              onClick={() => onSelect({ id: "", title: query.trim(), isNew: true })}
              className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5
                         transition-colors cursor-pointer border-t border-white/5
                         ${activeIndex === results.length
                           ? "bg-violet-500/20 text-white"
                           : "text-violet-400 hover:bg-white/5"}`}
            >
              <span className="text-base flex-shrink-0">✨</span>
              <span>
                Create <strong>"{query.trim()}"</strong>
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
