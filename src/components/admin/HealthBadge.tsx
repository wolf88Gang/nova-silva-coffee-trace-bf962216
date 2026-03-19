import { Badge } from '@/components/ui/badge';
import type { HealthStatus } from '@/types/admin';

const LABELS: Record<HealthStatus, string> = {
  healthy: 'Saludable',
  warning: 'Advertencia',
  critical: 'Crítico',
};

const STYLES: Record<HealthStatus, string> = {
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0',
  critical: 'bg-destructive/10 text-destructive border-0',
};

interface HealthBadgeProps {
  status: HealthStatus;
}

export function HealthBadge({ status }: HealthBadgeProps) {
  return <Badge className={STYLES[status]}>{LABELS[status]}</Badge>;
}
