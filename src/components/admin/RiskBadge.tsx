import { Badge } from '@/components/ui/badge';
import type { RiskLevel } from '@/types/admin';

const LABELS: Record<RiskLevel, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
};

const STYLES: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0',
  high: 'bg-destructive/10 text-destructive border-0',
};

interface RiskBadgeProps {
  level: RiskLevel;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  return <Badge className={STYLES[level]}>{LABELS[level]}</Badge>;
}
