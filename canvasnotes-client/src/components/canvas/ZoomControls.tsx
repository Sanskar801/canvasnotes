/**
 * ZoomControls — Fixed bottom-right overlay with zoom in/out, %, and go-to-centre.
 */

import type { Editor } from "tldraw";

interface ZoomControlsProps {
  editor: Editor | null;
}

export default function ZoomControls({ editor }: ZoomControlsProps) {
  if (!editor) return null;

  const zoom = Math.round(editor.getZoomLevel() * 100);

  return (
    <div
      className="fixed bottom-14 right-4 z-[200] flex items-center gap-1
                 rounded-xl px-1.5 py-1.5 pointer-events-auto select-none"
      style={{
        background: "rgba(26,26,46,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Zoom Out */}
      <button
        onClick={() => editor.zoomOut(editor.getViewportScreenCenter(), { animation: { duration: 200 } })}
        className="w-8 h-8 flex items-center justify-center rounded-lg
                   text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        title="Zoom out"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M5 12h14" />
        </svg>
      </button>

      {/* Zoom % */}
      <button
        onClick={() => editor.resetZoom(editor.getViewportScreenCenter(), { animation: { duration: 200 } })}
        className="min-w-[48px] h-8 flex items-center justify-center rounded-lg
                   text-white/70 text-xs font-mono hover:text-white hover:bg-white/10
                   transition-all cursor-pointer"
        title="Reset zoom to 100%"
      >
        {zoom}%
      </button>

      {/* Zoom In */}
      <button
        onClick={() => editor.zoomIn(editor.getViewportScreenCenter(), { animation: { duration: 200 } })}
        className="w-8 h-8 flex items-center justify-center rounded-lg
                   text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        title="Zoom in"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M12 5v14m-7-7h14" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-white/10 mx-0.5" />

      {/* Go to centre */}
      <button
        onClick={() => {
          editor.setCamera({ x: 0, y: 0, z: 1 }, { animation: { duration: 300 } });
        }}
        className="w-8 h-8 flex items-center justify-center rounded-lg
                   text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        title="Go to centre"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        </svg>
      </button>
    </div>
  );
}
