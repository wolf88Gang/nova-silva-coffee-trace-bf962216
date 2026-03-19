import { Badge } from '@/components/ui/badge';

const STATUS_STYLES: Record<string, string> = {
  aprobado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0',
  activo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0',
  generado: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0',
  borrador: 'bg-muted text-muted-foreground border-0',
  ejecutado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0',
  bloqueado: 'bg-destructive/10 text-destructive border-0',
  recommended: 'bg-muted text-muted-foreground border-0',
  approved_tecnico: 'bg-green-100 text-green-800 border-0',
  in_execution: 'bg-blue-100 text-blue-800 border-0',
  completed: 'bg-emerald-100 text-emerald-800 border-0',
};

interface PlanStatusBadgeProps {
  status: string;
}

export default function PlanStatusBadge({ status }: PlanStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border-0';
  const label = status.replace(/_/g, ' ');
  return (
    <Badge className={style}>
      {label}
    </Badge>
  );
}
