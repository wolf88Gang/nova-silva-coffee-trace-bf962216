/**
 * Shell layout for Calibration Review pages.
 * Provides consistent nav and header.
 */
import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/calibrationLabels';
import { Crosshair } from 'lucide-react';

interface CalibrationShellProps {
  children: ReactNode;
}

export function CalibrationShell({ children }: CalibrationShellProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentKey = (() => {
    const path = location.pathname;
    if (path.includes('/signals')) return 'signals';
    if (path.includes('/recommendations')) return 'recommendations';
    if (path.includes('/objections')) return 'objections';
    if (path.includes('/scores')) return 'scores';
    if (path.includes('/versions')) return 'versions';
    return 'overview';
  })();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Crosshair className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Calibration Review</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Sales Intelligence — Revisión y calibración de reglas</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-mono border-muted-foreground/30 text-muted-foreground">
          internal
        </Badge>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-1 border-b border-border pb-0 overflow-x-auto">
        {NAV_ITEMS.map(item => (
          <Button
            key={item.key}
            variant="ghost"
            size="sm"
            className={cn(
              'rounded-b-none border-b-2 text-xs h-9 px-3',
              currentKey === item.key
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            )}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
