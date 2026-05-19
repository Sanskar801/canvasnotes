/**
 * BreadcrumbBar — Fixed top-centre overlay showing canvas navigation path.
 */

interface BreadcrumbItem {
  id: string;
  title: string;
}

interface BreadcrumbBarProps {
  stack: BreadcrumbItem[];
  onNavigate: (id: string) => void;
}

export default function BreadcrumbBar({ stack, onNavigate }: BreadcrumbBarProps) {
  if (stack.length <= 1) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-1
                 px-4 py-2 rounded-xl text-sm font-medium
                 select-none pointer-events-auto"
      style={{
        background: "linear-gradient(135deg, rgba(26,26,46,0.92) 0%, rgba(22,33,62,0.92) 100%)",
        border: "1px solid rgba(139, 92, 246, 0.2)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(139,92,246,0.05)",
        backdropFilter: "blur(16px)",
      }}
    >
      {stack.map((crumb, idx) => (
        <span key={crumb.id} className="flex items-center gap-1">
          {idx > 0 && <span className="text-white/25 mx-1">›</span>}
          {idx < stack.length - 1 ? (
            <button
              onClick={() => onNavigate(crumb.id)}
              className="text-violet-400 hover:text-violet-300 transition-colors cursor-pointer
                         hover:underline underline-offset-2"
            >
              {crumb.title}
            </button>
          ) : (
            <span className="text-white/90">{crumb.title}</span>
          )}
        </span>
      ))}
    </div>
  );
}
