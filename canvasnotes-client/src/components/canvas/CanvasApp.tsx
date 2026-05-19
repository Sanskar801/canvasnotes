/**
 * CanvasApp — Root component for the canvas experience.
 *
 * Manages:
 * - Active canvas ID + data fetching
 * - Breadcrumb navigation stack
 * - Sidebar toggle
 * - Save status
 * - Wikilink popup
 * - Editor reference
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import type { Editor, TLStoreSnapshot, TLShapeId } from "tldraw";
import { canvasApi, type CanvasDetail } from "../../api/canvasApi";
import InfiniteCanvas from "./InfiniteCanvas";
import BreadcrumbBar from "./BreadcrumbBar";
import MetadataHeader from "./MetadataHeader";
import LibrarySidebar from "./LibrarySidebar";
import SaveIndicator, { type SaveStatus } from "./SaveIndicator";
import ZoomControls from "./ZoomControls";
import Toolbar from "./Toolbar";
import WikilinkPopup from "./WikilinkPopup";
import { LINK_NODE_TYPE } from "./LinkNodeShape";

interface BreadcrumbItem {
  id: string;
  title: string;
}

const HOME_CANVAS_KEY = "canvasnotes_home_id";

export default function CanvasApp() {
  const { id: paramId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Core state
  const [activeCanvasId, setActiveCanvasId] = useState<string>("");
  const [canvasData, setCanvasData] = useState<CanvasDetail | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [wikilinkPopup, setWikilinkPopup] = useState<{ x: number; y: number } | null>(null);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  const editorRef = useRef<Editor | null>(null);
  const [, forceUpdate] = useState(0); // to re-render zoom controls

  // ------------------------------------------------------------------
  // Initialisation: get or create home canvas
  // ------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      let targetId = paramId;

      if (!targetId) {
        // Check localStorage for home canvas
        const homeId = localStorage.getItem(HOME_CANVAS_KEY);
        if (homeId) {
          targetId = homeId;
        } else {
          // Create a new home canvas
          try {
            const canvas = await canvasApi.create("Home");
            localStorage.setItem(HOME_CANVAS_KEY, canvas.id);
            targetId = canvas.id;
          } catch (err) {
            console.error("Failed to create home canvas:", err);
            return;
          }
        }
      }

      setActiveCanvasId(targetId);
    };

    init();
  }, [paramId]);

  // ------------------------------------------------------------------
  // Fetch canvas data when active ID changes
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!activeCanvasId) return;

    const fetchCanvas = async () => {
      try {
        const data = await canvasApi.get(activeCanvasId);
        setCanvasData(data);

        // Update breadcrumbs if this is a fresh navigation
        setBreadcrumbs((prev) => {
          const existingIdx = prev.findIndex((b) => b.id === data.id);
          if (existingIdx >= 0) {
            // Navigating back up — trim
            return prev.slice(0, existingIdx + 1);
          }
          // Navigating deeper — push
          return [...prev, { id: data.id, title: data.title }];
        });
      } catch (err) {
        console.error("Failed to fetch canvas:", err);
        // If canvas not found, create home
        localStorage.removeItem(HOME_CANVAS_KEY);
        const canvas = await canvasApi.create("Home");
        localStorage.setItem(HOME_CANVAS_KEY, canvas.id);
        setActiveCanvasId(canvas.id);
      }
    };

    fetchCanvas();
  }, [activeCanvasId]);

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------
  const navigateTo = useCallback(
    (id: string) => {
      setActiveCanvasId(id);
      navigate(`/canvas/${id}`, { replace: true });
    },
    [navigate]
  );

  const navigateBreadcrumb = useCallback(
    (id: string) => {
      navigateTo(id);
    },
    [navigateTo]
  );

  // Listen for link-node click events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.canvasId) {
        navigateTo(detail.canvasId);
      }
    };
    window.addEventListener("canvas:navigate", handler);
    return () => window.removeEventListener("canvas:navigate", handler);
  }, [navigateTo]);

  // ------------------------------------------------------------------
  // Auto-save
  // ------------------------------------------------------------------
  const lastSnapshotRef = useRef<TLStoreSnapshot | null>(null);

  const handleSave = useCallback(
    async (snapshot: TLStoreSnapshot) => {
      if (!activeCanvasId) return;
      lastSnapshotRef.current = snapshot;
      setSaveStatus("saving");
      try {
        await canvasApi.update(activeCanvasId, { snapshot: snapshot as unknown as Record<string, unknown> });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSaveStatus("error");
      }
    },
    [activeCanvasId]
  );

  const handleRetry = useCallback(() => {
    if (lastSnapshotRef.current) {
      handleSave(lastSnapshotRef.current);
    }
  }, [handleSave]);

  // ------------------------------------------------------------------
  // Metadata save
  // ------------------------------------------------------------------
  const handleMetaSave = useCallback(
    async (data: { title?: string; summary?: string }) => {
      if (!activeCanvasId) return;
      try {
        await canvasApi.update(activeCanvasId, data);
        setCanvasData((prev) => prev ? { ...prev, ...data } : prev);
        // Update breadcrumb title if needed
        if (data.title) {
          setBreadcrumbs((prev) =>
            prev.map((b) => (b.id === activeCanvasId ? { ...b, title: data.title! } : b))
          );
        }
        setSidebarRefresh((n) => n + 1);
      } catch (err) {
        console.error("Failed to save metadata:", err);
      }
    },
    [activeCanvasId]
  );

  // ------------------------------------------------------------------
  // Wikilink popup
  // ------------------------------------------------------------------
  const handleWikilinkTrigger = useCallback((position: { x: number; y: number }) => {
    setWikilinkPopup(position);
  }, []);

  const handleWikilinkSelect = useCallback(
    async (canvas: { id: string; title: string; isNew: boolean }) => {
      setWikilinkPopup(null);
      const editor = editorRef.current;
      if (!editor || !activeCanvasId) return;

      let targetId = canvas.id;

      // Create canvas if new
      if (canvas.isNew) {
        try {
          const created = await canvasApi.create(canvas.title);
          targetId = created.id;
        } catch (err) {
          console.error("Failed to create canvas:", err);
          return;
        }
      }

      // Create link-node shape on canvas
      const shapeId = `shape:link_${Date.now()}` as TLShapeId;
      const center = editor.getViewportScreenCenter();
      const pagePoint = editor.screenToPage(center);

      editor.createShape({
        id: shapeId,
        type: LINK_NODE_TYPE,
        x: pagePoint.x - 95,
        y: pagePoint.y - 22,
        props: {
          w: 190,
          h: 44,
          targetCanvasId: targetId,
          canvasName: canvas.title,
        },
      });

      // Register link in backend
      try {
        await canvasApi.createLink(activeCanvasId, targetId, shapeId);
        setSidebarRefresh((n) => n + 1);
      } catch (err) {
        console.error("Failed to register link:", err);
      }
    },
    [activeCanvasId]
  );

  // ------------------------------------------------------------------
  // Editor ready
  // ------------------------------------------------------------------
  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor;

    // Re-render periodically to update zoom display
    const interval = setInterval(() => forceUpdate((n) => n + 1), 500);
    return () => clearInterval(interval);
  }, []);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (!activeCanvasId || !canvasData) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="flex items-center gap-3 text-white/40">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading canvas…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1a1a2e] relative">
      {/* tldraw canvas */}
      <InfiniteCanvas
        key={activeCanvasId}
        canvasId={activeCanvasId}
        snapshot={canvasData.snapshot as TLStoreSnapshot | null}
        onSave={handleSave}
        onEditorReady={handleEditorReady}
        onWikilinkTrigger={handleWikilinkTrigger}
      />

      {/* UI Overlays */}
      <MetadataHeader
        title={canvasData.title}
        summary={canvasData.summary ?? ""}
        onSave={handleMetaSave}
      />

      <BreadcrumbBar stack={breadcrumbs} onNavigate={navigateBreadcrumb} />

      <Toolbar
        editor={editorRef.current}
        onWikilinkTrigger={() =>
          handleWikilinkTrigger({
            x: window.innerWidth / 2 - 144,
            y: window.innerHeight / 3,
          })
        }
      />

      {/* Library toggle button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 right-4 z-[200] w-10 h-10 flex items-center justify-center
                   rounded-xl pointer-events-auto cursor-pointer transition-all
                   text-white/50 hover:text-white hover:bg-white/10"
        style={{
          background: "rgba(26,26,46,0.85)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}
        title="Open library"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.478.887 6.078 2.348M12 6.042c1.6-1.461 3.747-2.348 6.078-2.348.938 0 1.948.18 3 .512v14.25a8.987 8.987 0 00-3-.512c-2.331 0-4.478.887-6.078 2.348M12 6.042V20.348" />
        </svg>
      </button>

      <LibrarySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeCanvasId={activeCanvasId}
        onNavigate={navigateTo}
        refreshKey={sidebarRefresh}
      />

      <ZoomControls editor={editorRef.current} />
      <SaveIndicator status={saveStatus} onRetry={handleRetry} />

      {/* Wikilink popup */}
      {wikilinkPopup && (
        <WikilinkPopup
          position={wikilinkPopup}
          onSelect={handleWikilinkSelect}
          onClose={() => setWikilinkPopup(null)}
        />
      )}
    </div>
  );
}
