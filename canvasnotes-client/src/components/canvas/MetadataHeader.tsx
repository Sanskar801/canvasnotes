/**
 * MetadataHeader — Fixed top-left overlay for canvas title + summary editing.
 *
 * Collapsed: shows just the title.
 * Expanded (hover or click): shows title + summary textarea.
 * Saves on blur via PATCH API.
 */

import { useState, useRef, useEffect } from "react";

interface MetadataHeaderProps {
  title: string;
  summary: string;
  onSave: (data: { title?: string; summary?: string }) => void;
}

export default function MetadataHeader({ title, summary, onSave }: MetadataHeaderProps) {
  const [expanded, setExpanded] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localSummary, setLocalSummary] = useState(summary);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync props → local state when canvas changes
  useEffect(() => {
    setLocalTitle(title);
    setLocalSummary(summary);
  }, [title, summary]);

  const handleTitleBlur = () => {
    if (localTitle !== title) {
      onSave({ title: localTitle });
    }
  };

  const handleSummaryBlur = () => {
    if (localSummary !== summary) {
      onSave({ summary: localSummary });
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed top-4 left-4 z-[200] pointer-events-auto"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div
        className="rounded-xl overflow-hidden transition-all duration-300 ease-out"
        style={{
          width: expanded ? 320 : 220,
          background: "linear-gradient(135deg, rgba(26,26,46,0.95) 0%, rgba(22,33,62,0.95) 100%)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(139,92,246,0.05)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Title */}
        <div className="px-4 py-3">
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full bg-transparent text-white font-semibold text-base
                       outline-none border-none placeholder:text-white/30
                       truncate"
            placeholder="Canvas title…"
          />
        </div>

        {/* Summary (expanded) */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: expanded ? 140 : 0,
            opacity: expanded ? 1 : 0,
          }}
        >
          <div className="px-4 pb-3 border-t border-white/5 pt-2">
            <textarea
              value={localSummary}
              onChange={(e) => setLocalSummary(e.target.value)}
              onBlur={handleSummaryBlur}
              rows={3}
              className="w-full bg-white/5 text-white/70 text-sm rounded-lg px-3 py-2
                         border border-white/10 outline-none resize-none
                         placeholder:text-white/25
                         focus:border-violet-500/40 transition-colors"
              placeholder="Add a summary…"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
