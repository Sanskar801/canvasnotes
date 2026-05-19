/**
 * LinkNodeShape — Custom tldraw shape for [[wikilink]] pills.
 *
 * Renders as a clickable pill showing `📄 Canvas Name`.
 * Click → dispatches "canvas:navigate" event.
 * Hover 400ms → dispatches "canvas:preview" event for tooltip.
 */

import { ShapeUtil, HTMLContainer, Rectangle2d, type TLShape } from "tldraw";

// ---------------------------------------------------------------------------
// 1. Declare shape type via module augmentation (tldraw v5 pattern)
// ---------------------------------------------------------------------------

export const LINK_NODE_TYPE = "link-node" as const;

declare module "tldraw" {
  interface TLGlobalShapePropsMap {
    [LINK_NODE_TYPE]: {
      w: number;
      h: number;
      targetCanvasId: string;
      canvasName: string;
    };
  }
}

export type LinkNodeShape = TLShape<typeof LINK_NODE_TYPE>;

// ---------------------------------------------------------------------------
// 2. ShapeUtil implementation
// ---------------------------------------------------------------------------

export class LinkNodeShapeUtil extends ShapeUtil<LinkNodeShape> {
  static override type = LINK_NODE_TYPE;

  override getDefaultProps(): LinkNodeShape["props"] {
    return { w: 190, h: 44, targetCanvasId: "", canvasName: "Untitled" };
  }

  override getGeometry(shape: LinkNodeShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override getIndicatorPath(shape: LinkNodeShape) {
    const path = new Path2D();
    path.rect(0, 0, shape.props.w, shape.props.h);
    return path;
  }

  override canResize() {
    return false;
  }

  override isAspectRatioLocked() {
    return true;
  }

  override component(shape: LinkNodeShape) {
    return (
      <HTMLContainer>
        <div
          style={{
            width: shape.props.w,
            height: shape.props.h,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 14px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            color: "#e2e8f0",
            fontSize: 14,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            transition: "all 0.2s ease",
            userSelect: "none",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
          onPointerDown={(e) => {
            // Only navigate on double-click to avoid interfering with selection
            if (e.detail >= 2) {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("canvas:navigate", {
                  detail: { canvasId: shape.props.targetCanvasId },
                })
              );
            }
          }}
          onPointerEnter={() => {
            const timer = setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent("canvas:preview", {
                  detail: { canvasId: shape.props.targetCanvasId },
                })
              );
            }, 400);
            (window as any).__linkHoverTimer = timer;
          }}
          onPointerLeave={() => {
            clearTimeout((window as any).__linkHoverTimer);
            window.dispatchEvent(new CustomEvent("canvas:preview-hide"));
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {shape.props.canvasName}
          </span>
        </div>
      </HTMLContainer>
    );
  }
}
