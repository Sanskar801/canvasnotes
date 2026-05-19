/**
 * Canvas API client — thin wrapper around fetch for the CanvasNotes backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanvasListItem {
  id: string;
  title: string;
  summary: string | null;
  updated_at: string;
  child_count: number;
}

export interface CanvasDetail {
  id: string;
  title: string;
  summary: string | null;
  snapshot: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  links: { target_id: string; shape_id: string }[];
}

export interface CanvasResponse {
  id: string;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  title: string;
  summary: string | null;
}

export interface LinkResponse {
  id: string;
  source_canvas_id: string;
  target_canvas_id: string;
  link_shape_id: string;
  created_at: string;
}

export interface CanvasTree {
  canvases: CanvasListItem[];
  edges: { source: string; target: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ---------------------------------------------------------------------------
// Canvas CRUD
// ---------------------------------------------------------------------------

export const canvasApi = {
  list: () => request<CanvasListItem[]>("/canvases"),

  get: (id: string) => request<CanvasDetail>(`/canvases/${id}`),

  create: (title = "Untitled canvas") =>
    request<CanvasResponse>("/canvases", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  update: (id: string, data: { title?: string; summary?: string; snapshot?: unknown }) =>
    request<CanvasResponse>(`/canvases/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/canvases/${id}`, { method: "DELETE" }),

  search: (q: string) =>
    request<SearchResult[]>(`/canvases/search?q=${encodeURIComponent(q)}`),

  tree: () => request<CanvasTree>("/canvases/tree"),

  // Links
  createLink: (canvasId: string, targetCanvasId: string, linkShapeId: string) =>
    request<LinkResponse>(`/canvases/${canvasId}/links`, {
      method: "POST",
      body: JSON.stringify({ target_canvas_id: targetCanvasId, link_shape_id: linkShapeId }),
    }),

  deleteLink: (canvasId: string, shapeId: string) =>
    request<void>(`/canvases/${canvasId}/links/${shapeId}`, { method: "DELETE" }),
};
