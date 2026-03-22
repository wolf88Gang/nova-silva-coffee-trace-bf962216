/**
 * Corrective Actions — Track issues, owners, due dates, resolution status.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, AlertTriangle, Clock, CheckCircle2, User, Calendar,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  generateDemoCorrectiveActions,
  getSeverityLabel,
  getSeverityColor,
  getCorrectiveStatusLabel,
  getRequirementById,
  getSchemeByKey,
  type CorrectiveAction,
  type CorrectiveStatus,
} from '@/lib/certificationEngine';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<CorrectiveStatus, string> = {
  pendiente: 'bg-accent/10 text-accent-foreground border-accent/30',
  en_progreso: 'bg-primary/10 text-primary border-primary/30',
  resuelto: 'bg-primary/10 text-primary border-primary/30',
  vencido: 'bg-destructive text-destructive-foreground',
  escalado: 'bg-destructive/80 text-destructive-foreground',
};

export default function CertificacionCorrectiveActions() {
  const navigate = useNavigate();
  const actions = useMemo(() => generateDemoCorrectiveActions(), []);
  const [filter, setFilter] = useState<string>('active');

  const filtered = filter === 'active'
    ? actions.filter(a => a.status !== 'resuelto')
    : filter === 'all' ? actions
    : actions.filter(a => a.status === filter);

  const urgent = actions.filter(a => a.status === 'vencido' || a.status === 'escalado').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/certificacion')}><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Acciones correctivas</h1>
          <p className="text-xs text-muted-foreground">Seguimiento de hallazgos, responsables y fechas de resolución</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-3 pb-2 px-3 text-center">
          <p className="text-2xl font-bold text-foreground">{actions.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card className={urgent > 0 ? 'border-destructive/30' : ''}><CardContent className="pt-3 pb-2 px-3 text-center">
          <p className={cn('text-2xl font-bold', urgent > 0 ? 'text-destructive' : 'text-foreground')}>{urgent}</p>
          <p className="text-[10px] text-muted-foreground">Urgentes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2 px-3 text-center">
          <p className="text-2xl font-bold text-foreground">{actions.filter(a => a.status === 'en_progreso').length}</p>
          <p className="text-[10px] text-muted-foreground">En progreso</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-2 px-3 text-center">
          <p className="text-2xl font-bold text-primary">{actions.filter(a => a.status === 'resuelto').length}</p>
          <p className="text-[10px] text-muted-foreground">Resueltas</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {[
          { key: 'active', label: 'Activas' },
          { key: 'pendiente', label: 'Pendientes' },
          { key: 'en_progreso', label: 'En progreso' },
          { key: 'vencido', label: 'Vencidas' },
          { key: 'escalado', label: 'Escaladas' },
          { key: 'all', label: 'Todas' },
        ].map(f => (
          <Button key={f.key} variant={filter === f.key ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(a => (
          <CorrectiveCard key={a.id} action={a} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No hay acciones correctivas con este filtro</p>
        )}
      </div>
    </div>
  );
}

function CorrectiveCard({ action: a }: { action: CorrectiveAction }) {
  const [expanded, setExpanded] = useState(a.status === 'vencido' || a.status === 'escalado');
  const scheme = getSchemeByKey(a.scheme);
  const req = getRequirementById(a.requirementId);
  const isOverdue = a.status === 'vencido' || a.status === 'escalado';

  return (
    <Card className={cn(isOverdue ? 'border-destructive/30' : '')}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={getSeverityColor(a.severity)}>{getSeverityLabel(a.severity)}</Badge>
              <Badge className={cn('text-[10px]', STATUS_COLORS[a.status])}>{getCorrectiveStatusLabel(a.status)}</Badge>
              <Badge variant="outline" className="text-[10px]">{scheme?.shortName}</Badge>
            </div>
            <p className="text-sm font-medium text-foreground">{a.issue}</p>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {a.owner}</span>
          <span className={cn('flex items-center gap-1', isOverdue ? 'text-destructive' : '')}>
            <Calendar className="h-3 w-3" /> {isOverdue ? 'Venció: ' : 'Vence: '}{a.dueDate}
          </span>
          <span>Creada: {a.createdDate}</span>
        </div>

        {expanded && req && (
          <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs font-medium text-foreground mb-1">Requisito vinculado</p>
            <p className="text-xs text-foreground">{req.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{req.whyItMatters}</p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" /> Marcar resuelta</Button>
              <Button variant="outline" size="sm" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Escalar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
