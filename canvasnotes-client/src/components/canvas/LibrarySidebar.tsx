/**
 * LibrarySidebar — Slide-in right panel showing all canvases in a tree view.
 */

import { useEffect, useState, useCallback } from "react";
import { canvasApi, type CanvasTree, type CanvasListItem } from "../../api/canvasApi";

interface LibrarySidebarProps {
  open: boolean;
  onClose: () => void;
  activeCanvasId: string;
  onNavigate: (id: string) => void;
  refreshKey: number; // increment to trigger re-fetch
}

interface TreeNode extends CanvasListItem {
  children: TreeNode[];
}

function buildTree(canvases: CanvasListItem[], edges: { source: string; target: string }[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  for (const c of canvases) {
    nodeMap.set(c.id, { ...c, children: [] });
  }

  const childIds = new Set<string>();
  for (const e of edges) {
    const parent = nodeMap.get(e.source);
    const child = nodeMap.get(e.target);
    if (parent && child) {
      parent.children.push(child);
      childIds.add(e.target);
    }
  }

  // Root nodes = canvases that are NOT a target of any link
  return Array.from(nodeMap.values()).filter((n) => !childIds.has(n.id));
}

function TreeItem({
  node,
  depth,
  activeCanvasId,
  onNavigate,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  activeCanvasId: string;
  onNavigate: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isActive = node.id === activeCanvasId;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
                   transition-all duration-150 text-sm
                   ${isActive
                     ? "bg-violet-500/20 text-white"
                     : "text-white/60 hover:bg-white/5 hover:text-white/90"}`}
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-4 h-4 flex items-center justify-center text-white/30 hover:text-white/60
                       transition-colors flex-shrink-0 cursor-pointer"
          >
            <span
              className="transition-transform duration-200 block text-xs"
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              ▶
            </span>
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Canvas name */}
        <button
          onClick={() => onNavigate(node.id)}
          className="flex-1 text-left truncate cursor-pointer"
        >
          <span className="mr-1.5">📄</span>
          {node.title}
        </button>

        {/* Delete button (visible on hover) */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(node.id, node.title); }}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center
                     rounded text-white/30 hover:text-red-400 hover:bg-red-500/10
                     transition-all cursor-pointer flex-shrink-0"
          title="Delete canvas"
        >
          ×
        </button>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activeCanvasId={activeCanvasId}
              onNavigate={onNavigate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LibrarySidebar({
  open,
  onClose,
  activeCanvasId,
  onNavigate,
  refreshKey,
}: LibrarySidebarProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const data: CanvasTree = await canvasApi.tree();
      const nodes = buildTree(data.canvases, data.edges);
      setTree(nodes);
    } catch (err) {
      console.error("Failed to load canvas tree:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchTree();
  }, [open, fetchTree, refreshKey]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await canvasApi.delete(id);
      fetchTree();
      // If we deleted the active canvas, navigate to first available
      if (id === activeCanvasId) {
        const remaining = tree.filter((n) => n.id !== id);
        if (remaining.length > 0) onNavigate(remaining[0].id);
      }
    } catch (err) {
      console.error("Failed to delete canvas:", err);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[299] bg-black/30 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className="fixed top-0 right-0 h-full z-[300] w-80 flex flex-col
                   transition-transform duration-300 ease-out"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
          borderLeft: "1px solid rgba(139, 92, 246, 0.15)",
          boxShadow: open ? "-8px 0 40px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm tracking-wide uppercase">Library</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-white/40 hover:text-white hover:bg-white/10
                       transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {loading ? (
            <div className="text-white/30 text-sm text-center py-8">Loading…</div>
          ) : tree.length === 0 ? (
            <div className="text-white/30 text-sm text-center py-8">No canvases yet</div>
          ) : (
            tree.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                depth={0}
                activeCanvasId={activeCanvasId}
                onNavigate={(id) => { onNavigate(id); onClose(); }}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Footer: Create new */}
        <div className="px-4 py-3 border-t border-white/8">
          <button
            onClick={async () => {
              try {
                const canvas = await canvasApi.create();
                fetchTree();
                onNavigate(canvas.id);
                onClose();
              } catch (err) {
                console.error("Failed to create canvas:", err);
              }
            }}
            className="w-full py-2.5 rounded-xl text-sm font-medium
                       bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 hover:text-violet-300
                       transition-all cursor-pointer border border-violet-500/20"
          >
            + New Canvas
          </button>
        </div>
      </div>
    </>
  );
}
