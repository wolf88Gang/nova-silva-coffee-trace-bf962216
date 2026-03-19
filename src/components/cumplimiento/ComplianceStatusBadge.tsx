import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ComplianceLevel =
  | 'prohibido'
  | 'lista_roja'
  | 'cancelado'
  | 'lista_naranja'
  | 'restringido'
  | 'phase_out_2026'
  | 'lista_amarilla'
  | 'phase_out_2030'
  | 'permitido';

interface ComplianceStatusBadgeProps {
  nivel: string;
  className?: string;
}

export function ComplianceStatusBadge({ nivel, className }: ComplianceStatusBadgeProps) {
  const n = nivel?.toLowerCase().replace(/\s+/g, '_') as ComplianceLevel | undefined;

  const destructiveLevels: ComplianceLevel[] = ['prohibido', 'lista_roja', 'cancelado'];
  const warningLevels: ComplianceLevel[] = ['lista_naranja', 'restringido', 'phase_out_2026'];
  const yellowLevels: ComplianceLevel[] = ['lista_amarilla', 'phase_out_2030'];

  if (destructiveLevels.includes(n ?? '')) {
    return (
      <Badge variant="destructive" className={cn(className)}>
        {nivel}
      </Badge>
    );
  }
  if (warningLevels.includes(n ?? '')) {
    return (
      <Badge variant="outline" className={cn('border-warning/50 bg-warning/10 text-warning', className)}>
        {nivel}
      </Badge>
    );
  }
  if (yellowLevels.includes(n ?? '')) {
    return (
      <Badge variant="outline" className={cn(className)}>
        {nivel}
      </Badge>
    );
  }
  return (
    <Badge variant="default" className={cn(className)}>
      {nivel || 'permitido'}
    </Badge>
  );
}
