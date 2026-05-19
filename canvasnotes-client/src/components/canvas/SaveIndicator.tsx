/**
 * SaveIndicator — Fixed bottom-right overlay showing auto-save status.
 */

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
}

export default function SaveIndicator({ status, onRetry }: SaveIndicatorProps) {
  if (status === "idle") return null;

  const config = {
    saving: {
      icon: (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ),
      text: "Saving…",
      color: "text-white/50",
    },
    saved: {
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
      text: "Saved",
      color: "text-emerald-400/70",
    },
    error: {
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      text: "Save failed",
      color: "text-red-400",
    },
  };

  const c = config[status];

  return (
    <div
      className={`fixed bottom-4 right-4 z-[200] flex items-center gap-2 px-3 py-2
                  rounded-lg text-xs font-medium pointer-events-auto select-none
                  ${c.color}`}
      style={{
        background: "rgba(26,26,46,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {c.icon}
      <span>{c.text}</span>
      {status === "error" && onRetry && (
        <button
          onClick={onRetry}
          className="ml-1 text-violet-400 hover:text-violet-300 underline cursor-pointer transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
