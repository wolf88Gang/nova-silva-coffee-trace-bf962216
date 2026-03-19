import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'danger' | 'neutral';

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0',
  danger: 'bg-destructive/10 text-destructive border-0',
  neutral: 'bg-muted text-muted-foreground border-0',
};

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusBadge({ label, variant = 'neutral', className }: StatusBadgeProps) {
  return <Badge className={cn(VARIANT_CLASSES[variant], className)}>{label}</Badge>;
}
