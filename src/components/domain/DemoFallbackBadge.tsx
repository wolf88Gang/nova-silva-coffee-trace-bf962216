/**
 * Badge discreto cuando la fuente es fallback demo.
 */
import { Info } from 'lucide-react';

interface DemoFallbackBadgeProps {
  show?: boolean;
  className?: string;
}

export function DemoFallbackBadge({ show = true, className }: DemoFallbackBadgeProps) {
  if (!show) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-muted-foreground bg-muted/50 border border-border ${className ?? ''}`}
      title="Datos ficticios de demostración"
    >
      <Info className="h-3 w-3" />
      Datos ficticios demo
    </span>
  );
}
