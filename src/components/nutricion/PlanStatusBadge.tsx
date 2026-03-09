import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Play, XCircle, FileText, ArrowRightLeft } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  borrador: { label: 'Borrador', className: 'bg-muted text-muted-foreground', icon: FileText },
  generado: { label: 'Generado', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', icon: Clock },
  aprobado: { label: 'Aprobado', className: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  activo: { label: 'Activo', className: 'bg-success/10 text-success border-success/20', icon: Play },
  programado: { label: 'Programado', className: 'bg-primary/10 text-primary border-primary/20', icon: Clock },
  en_ejecucion: { label: 'En ejecución', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', icon: Play },
  ejecutado: { label: 'Ejecutado', className: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle },
  completado: { label: 'Completado', className: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle },
  cancelado: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  superseded: { label: 'Reemplazado', className: 'bg-muted text-muted-foreground', icon: ArrowRightLeft },
  pendiente: { label: 'Pendiente', className: 'bg-muted text-muted-foreground', icon: Clock },
};

interface Props {
  status: string;
  size?: 'sm' | 'default';
}

export default function PlanStatusBadge({ status, size = 'default' }: Props) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-muted text-muted-foreground', icon: FileText };
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} ${size === 'sm' ? 'text-[10px] px-1.5 py-0' : ''}`}>
      <Icon className={`${size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
      {config.label}
    </Badge>
  );
}
