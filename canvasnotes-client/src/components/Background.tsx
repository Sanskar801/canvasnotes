import { useCallback, useEffect, useRef, useState } from "react";

const DOT_GRID_SIZE = 20;

export default function Background() {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera] = useState({ x: 0, y: 0, zoom: 1 });
  const dprRef = useRef(1); // Store DPR so renderCanvas always knows it

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = dprRef.current;

    // Clear in CSS pixels
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // Calculate visible world bounds
    const startX = -camera.x / camera.zoom;
    const startY = -camera.y / camera.zoom;
    const endX = startX + cssWidth / camera.zoom;
    const endY = startY + cssHeight / camera.zoom;

    // Snap to grid to keep dots stable while panning
    const offsetX = ((startX % DOT_GRID_SIZE) + DOT_GRID_SIZE) % DOT_GRID_SIZE;
    const offsetY = ((startY % DOT_GRID_SIZE) + DOT_GRID_SIZE) % DOT_GRID_SIZE;

    const dotRadius = 1.5 / camera.zoom;

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    ctx.fillStyle = "#d1d1d1";

    for (let x = startX - offsetX; x <= endX + DOT_GRID_SIZE; x += DOT_GRID_SIZE) {
      for (let y = startY - offsetY; y <= endY + DOT_GRID_SIZE; y += DOT_GRID_SIZE) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }, [camera]);

  // Resize handler — keeps canvas sharp on all displays
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;

      const rect = canvas.parentElement!.getBoundingClientRect();

      // Physical pixels
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // CSS pixels
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Scale context once so all drawing uses CSS pixel units
      const ctx = canvas.getContext("2d");
      ctx?.scale(dpr, dpr);

      renderCanvas();
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [renderCanvas]);

  // Re-render whenever camera changes
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 bg-gray-200" />
  )
}
