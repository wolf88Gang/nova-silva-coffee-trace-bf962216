import { Progress } from '@/components/ui/progress';

interface WizardProgressProps {
  responded: number;
  total: number;
  label?: string;
}

export function WizardProgress({ responded, total, label = 'Progreso general' }: WizardProgressProps) {
  const pct = total > 0 ? Math.round((responded / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{responded}/{total}</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
