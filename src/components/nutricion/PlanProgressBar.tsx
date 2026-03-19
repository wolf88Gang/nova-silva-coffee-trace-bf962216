import { Progress } from '@/components/ui/progress';

interface PlanProgressBarProps {
  pctTotal: number;
  pctByNutrient?: Record<string, number>;
  compact?: boolean;
}

export default function PlanProgressBar({ pctTotal, pctByNutrient, compact }: PlanProgressBarProps) {
  if (compact) {
    return (
      <div className="w-16 shrink-0">
        <Progress value={pctTotal} className="h-1.5" />
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Ejecución total</span>
        <span>{pctTotal.toFixed(0)}%</span>
      </div>
      <Progress value={pctTotal} className="h-2" />
      {pctByNutrient && Object.keys(pctByNutrient).length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
          {Object.entries(pctByNutrient).map(([k, v]) => (
            <span key={k}>{k}: {v.toFixed(0)}%</span>
          ))}
        </div>
      )}
    </div>
  );
}
