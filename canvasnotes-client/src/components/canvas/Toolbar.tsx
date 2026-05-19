/**
 * Toolbar — Fixed left-side panel with drawing tool buttons.
 */

import type { Editor } from "tldraw";

interface ToolbarProps {
  editor: Editor | null;
  onWikilinkTrigger: () => void;
}

const tools = [
  { id: "select", label: "Select", icon: "↖", shortcut: "V" },
  { id: "hand", label: "Hand", icon: "✋", shortcut: "H" },
  { id: "draw", label: "Pen", icon: "✏️", shortcut: "D" },
  { id: "text", label: "Text", icon: "T", shortcut: "T" },
  { id: "geo", label: "Shape", icon: "⬜", shortcut: "R" },
  { id: "arrow", label: "Arrow", icon: "↗", shortcut: "A" },
  { id: "eraser", label: "Eraser", icon: "🧹", shortcut: "E" },
] as const;

export default function Toolbar({ editor, onWikilinkTrigger }: ToolbarProps) {
  if (!editor) return null;

  const currentTool = editor.getCurrentToolId();

  return (
    <div
      className="fixed left-4 top-1/2 -translate-y-1/2 z-[200] flex flex-col gap-1
                 rounded-2xl p-2 pointer-events-auto select-none"
      style={{
        background: "linear-gradient(180deg, rgba(26,26,46,0.92) 0%, rgba(22,33,62,0.92) 100%)",
        border: "1px solid rgba(139, 92, 246, 0.15)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(139,92,246,0.05)",
        backdropFilter: "blur(16px)",
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => editor.setCurrentTool(tool.id)}
          title={`${tool.label} (${tool.shortcut})`}
          className={`w-10 h-10 flex items-center justify-center rounded-xl text-base
                     transition-all duration-150 cursor-pointer
                     ${
                       currentTool === tool.id
                         ? "bg-violet-500/25 text-white shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                         : "text-white/50 hover:text-white hover:bg-white/8"
                     }`}
        >
          {tool.icon}
        </button>
      ))}

      {/* Divider */}
      <div className="h-px bg-white/10 my-1" />

      {/* Wikilink trigger */}
      <button
        onClick={onWikilinkTrigger}
        title="Insert [[wikilink]] (⌘K)"
        className="w-10 h-10 flex items-center justify-center rounded-xl text-sm
                   text-violet-400 hover:text-violet-300 hover:bg-violet-500/10
                   transition-all duration-150 cursor-pointer font-bold"
      >
        [[
      </button>
    </div>
  );
}
