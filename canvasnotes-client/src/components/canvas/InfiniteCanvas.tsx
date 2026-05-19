/**
 * InfiniteCanvas — Wraps the tldraw `<Tldraw>` component.
 *
 * Handles:
 * - Loading snapshot from API into tldraw
 * - Debounced auto-save on store changes
 * - Camera persistence via localStorage
 * - Custom shape registration (LinkNodeShape)
 * - `[[` keyboard trigger for wikilink popup
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Tldraw, type Editor, type TLStoreSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { LinkNodeShapeUtil } from "./LinkNodeShape";

const customShapeUtils = [LinkNodeShapeUtil];

interface InfiniteCanvasProps {
  canvasId: string;
  snapshot: TLStoreSnapshot | null;
  onSave: (snapshot: TLStoreSnapshot) => void;
  onEditorReady: (editor: Editor) => void;
  onWikilinkTrigger: (position: { x: number; y: number }) => void;
}

export default function InfiniteCanvas({
  canvasId,
  snapshot,
  onSave,
  onEditorReady,
  onWikilinkTrigger,
}: InfiniteCanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const saveTimerRef = useRef<number>(0);
  const bracketCountRef = useRef<number>(0);
  const bracketTimerRef = useRef<number>(0);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      onEditorReady(editor);

      // Load snapshot if available
      if (snapshot) {
        try {
          editor.store.loadStoreSnapshot(snapshot);
        } catch (e) {
          console.warn("Failed to load snapshot, starting fresh:", e);
        }
      }

      // Restore camera from localStorage
      const savedCamera = localStorage.getItem(`canvas_camera_${canvasId}`);
      if (savedCamera) {
        try {
          const cam = JSON.parse(savedCamera);
          editor.setCamera(cam);
        } catch {
          // ignore
        }
      }

      // Auto-save: debounce store changes at 1500ms
      const removeListener = editor.store.listen(
        () => {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = window.setTimeout(() => {
            const snap = editor.store.getStoreSnapshot();
            onSave(snap);
          }, 1500);
        },
        { source: "user", scope: "document" }
      );

      // Save camera position on changes
      const removeCameraListener = editor.store.listen(
        () => {
          const camera = editor.getCamera();
          localStorage.setItem(`canvas_camera_${canvasId}`, JSON.stringify(camera));
        },
        { source: "user", scope: "session" }
      );

      return () => {
        removeListener();
        removeCameraListener();
        clearTimeout(saveTimerRef.current);
      };
    },
    [canvasId, snapshot, onSave, onEditorReady]
  );

  // Detect `[[` keystroke for wikilink trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "[") {
        clearTimeout(bracketTimerRef.current);
        const next = bracketCountRef.current + 1;
        if (next >= 2) {
          // Trigger wikilink popup at screen center
          onWikilinkTrigger({
            x: window.innerWidth / 2 - 144,
            y: window.innerHeight / 3,
          });
          bracketCountRef.current = 0;
          return;
        }
        bracketCountRef.current = next;
        // Reset after 500ms
        bracketTimerRef.current = window.setTimeout(() => {
          bracketCountRef.current = 0;
        }, 500);
      } else {
        bracketCountRef.current = 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onWikilinkTrigger]);

  return (
    <div className="absolute inset-0">
      <Tldraw
        shapeUtils={customShapeUtils}
        onMount={handleMount}
      />
    </div>
  );
}
