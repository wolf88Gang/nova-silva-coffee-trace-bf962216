import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const VARIANT_STYLES = {
  default: '',
  success: 'border-green-500/30 bg-green-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  danger: 'border-destructive/30 bg-destructive/5',
};

export function MetricCard({ label, value, icon: Icon, variant = 'default' }: MetricCardProps) {
  return (
    <Card className={VARIANT_STYLES[variant]}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
