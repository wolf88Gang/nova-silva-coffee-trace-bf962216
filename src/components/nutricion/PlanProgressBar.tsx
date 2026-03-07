import { useEffect, useRef, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PlanProgressBarProps {
  pctTotal: number;
  pctByNutrient?: Record<string, number>;
  compact?: boolean;
}

const NUTRIENT_LABELS: Record<string, string> = {
  N_kg_ha: 'N',
  P2O5_kg_ha: 'P₂O₅',
  K2O_kg_ha: 'K₂O',
};

export default function PlanProgressBar({ pctTotal, pctByNutrient, compact = false }: PlanProgressBarProps) {
  const clamped = Math.min(pctTotal, 100);
  const color = clamped >= 100 ? 'text-primary' : clamped >= 50 ? 'text-accent-foreground' : 'text-muted-foreground';

  // Pulse animation when value changes
  const prevRef = useRef(pctTotal);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (prevRef.current !== pctTotal) {
      prevRef.current = pctTotal;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1500);
      return () => clearTimeout(t);
    }
  }, [pctTotal]);

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 min-w-[120px] transition-all duration-500',
        pulse && 'animate-pulse ring-2 ring-primary/30 rounded-full px-1'
      )}>
        <Progress value={clamped} className="h-1.5 flex-1" />
        <span className={cn('text-xs font-semibold transition-colors duration-500', color, pulse && 'text-primary')}>
          {Math.round(pctTotal)}%
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      'space-y-2 transition-all duration-500 rounded-lg p-2 -m-2',
      pulse && 'ring-2 ring-primary/20 bg-primary/5'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Avance total</span>
        <Badge variant="secondary" className={cn('text-xs transition-all duration-500', pulse && 'bg-primary text-primary-foreground')}>
          {Math.round(pctTotal)}%
        </Badge>
      </div>
      <Progress value={clamped} className="h-2" />

      {pctByNutrient && Object.keys(pctByNutrient).length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-1">
          {Object.entries(pctByNutrient).map(([key, pct]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{NUTRIENT_LABELS[key] ?? key}</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <Progress value={Math.min(pct, 100)} className="h-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
