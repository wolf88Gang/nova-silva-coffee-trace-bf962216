import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SalesProgressBarProps {
  answered: number;
  totalVisible: number;
  percentage: number;
  className?: string;
}

export function SalesProgressBar({
  answered,
  totalVisible,
  percentage,
  className,
}: SalesProgressBarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {answered} de {totalVisible}
        </span>
        <span className="font-medium tabular-nums">{percentage}%</span>
      </div>
      <Progress value={Math.min(100, Math.max(0, percentage))} className="h-2" />
    </div>
  );
}
