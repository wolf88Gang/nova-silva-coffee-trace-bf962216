/**
 * Sales Intelligence — Lead board / sessions list
 * Behaves as an active commercial lead list until a dedicated lead table exists.
 * REAL SCHEMA: sales_sessions + sales_session_outcomes
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, ArrowRight, AlertCircle, Inbox, Target, TrendingUp, TrendingDown,
  Minus, FileText, Clock, CheckCircle2, User, Calendar, Filter, Archive, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLIENT_TYPE_LABELS } from '@/lib/commercialBriefEngine';
import { useState } from 'react';

interface SalesSession {
  id: string;
  lead_name: string | null;
  lead_company: string | null;
  lead_type: string | null;
  commercial_stage: string | null;
  status: string | null;
  score_total: number | null;
  created_at: string;
  updated_at: string | null;
}

interface SessionOutcome {
  session_id: string;
  outcome: string;
  deal_value: number | null;
}

type BackendStatus = 'available' | 'unavailable';

function useSalesSessions() {
  return useQuery({
    queryKey: ['sales-sessions-list'],
    queryFn: async (): Promise<{ sessions: SalesSession[]; outcomes: Map<string, SessionOutcome>; status: BackendStatus }> => {
      const { data, error } = await supabase
        .from('sales_sessions' as any)
        .select('id, lead_name, lead_company, lead_type, commercial_stage, status, score_total, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          return { sessions: [], outcomes: new Map(), status: 'unavailable' };
        }
        throw error;
      }

      const sessions = (data as SalesSession[]) ?? [];
      const outcomeMap = new Map<string, SessionOutcome>();

      if (sessions.length > 0) {
        const { data: outData } = await supabase
          .from('sales_session_outcomes' as any)
          .select('session_id, outcome, deal_value');

        if (outData) {
          for (const o of outData as SessionOutcome[]) {
            outcomeMap.set(o.session_id, o);
          }
        }
      }

      return { sessions, outcomes: outcomeMap, status: 'available' };
    },
    staleTime: 1000 * 60 * 3,
  });
}

const STATUS_LABELS: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  draft: { label: 'Borrador', className: 'border-muted-foreground/30 text-muted-foreground', icon: FileText },
  in_progress: { label: 'En progreso', className: 'border-amber-500/30 text-amber-600 dark:text-amber-400', icon: Clock },
  completed: { label: 'Diagnóstico completado', className: 'border-primary/30 text-primary', icon: CheckCircle2 },
  archived: { label: 'Archivado', className: 'border-muted-foreground/20 text-muted-foreground/60', icon: Archive },
};

const OUTCOME_BADGE: Record<string, { label: string; className: string; icon: typeof TrendingUp }> = {
  won: { label: 'Ganado', className: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400', icon: TrendingUp },
  lost: { label: 'Perdido', className: 'border-destructive/30 text-destructive', icon: TrendingDown },
  no_decision: { label: 'Sin decisión', className: 'border-muted-foreground/30 text-muted-foreground', icon: Minus },
};

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  discovery: 'Discovery',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  follow_up: 'Seguimiento',
  hold: 'En pausa',
};

type FilterStatus = 'all' | 'draft' | 'in_progress' | 'completed' | 'won' | 'lost' | 'archived';

export default function SalesIntelligenceIndex() {
  const { data: result, isLoading, isError, refetch } = useSalesSessions();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterStatus>('all');

  const sessions = result?.sessions ?? [];
  const outcomes = result?.outcomes ?? new Map<string, SessionOutcome>();

  // Filter — 'all' hides archived by default
  const filtered = sessions.filter(s => {
    if (filter === 'archived') return s.status === 'archived';
    if (s.status === 'archived' && filter !== 'archived') return false;
    if (filter === 'all') return true;
    if (filter === 'won' || filter === 'lost') {
      const o = outcomes.get(s.id);
      return o?.outcome === filter;
    }
    return s.status === filter;
  });

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Archivar esta sesión?')) return;
    const { error } = await supabase.from('sales_sessions' as any).update({ status: 'archived' } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Sesión archivada');
    refetch();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar permanentemente? No se puede deshacer.')) return;
    await supabase.from('sales_session_outcomes' as any).delete().eq('session_id', id);
    await supabase.from('sales_session_objections' as any).delete().eq('session_id', id);
    await supabase.from('sales_session_recommendations' as any).delete().eq('session_id', id);
    const { error } = await supabase.from('sales_sessions' as any).delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Sesión eliminada');
    refetch();
  };

  // Summary counts (excluding archived)
  const activeSessions = sessions.filter(s => s.status !== 'archived');
  const counts = {
    total: activeSessions.length,
    active: activeSessions.filter(s => s.status !== 'completed' && !outcomes.has(s.id)).length,
    completed: activeSessions.filter(s => s.status === 'completed').length,
    won: activeSessions.filter(s => outcomes.get(s.id)?.outcome === 'won').length,
    lost: activeSessions.filter(s => outcomes.get(s.id)?.outcome === 'lost').length,
    archived: sessions.filter(s => s.status === 'archived').length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sales Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {counts.total} lead{counts.total !== 1 ? 's' : ''} · {counts.active} activo{counts.active !== 1 ? 's' : ''} · {counts.won} ganado{counts.won !== 1 ? 's' : ''} · {counts.lost} perdido{counts.lost !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/sales/new')} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Nueva sesión
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/sales/diagnostic')} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Diagnóstico
          </Button>
        </div>
      </div>

      {/* Filters */}
      {!isLoading && !isError && result?.status === 'available' && sessions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {([
            ['all', 'Todos'],
            ['draft', 'Borradores'],
            ['in_progress', 'En progreso'],
            ['completed', 'Completados'],
            ['won', 'Ganados'],
            ['lost', 'Perdidos'],
          ] as [FilterStatus, string][]).map(([value, label]) => (
            <Button
              key={value}
              variant={filter === value ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      {/* States */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      )}

      {isError && (
        <Card className="border-destructive/30">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-7 w-7 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Error al cargar sesiones</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && result?.status === 'unavailable' && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Target className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Backend no disponible</p>
            <p className="text-xs text-muted-foreground mt-1">La tabla <code className="bg-muted px-1 rounded text-[11px]">sales_sessions</code> no existe todavía</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && result?.status === 'available' && sessions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Sin leads registrados</p>
            <p className="text-xs text-muted-foreground mt-1">Crea un nuevo diagnóstico comercial para empezar</p>
          </CardContent>
        </Card>
      )}

      {/* Session cards — behaving as lead board */}
      {!isLoading && !isError && result?.status === 'available' && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((s) => {
            const outcomeData = outcomes.get(s.id);
            const ob = outcomeData ? OUTCOME_BADGE[outcomeData.outcome] : null;
            const statusInfo = s.status ? STATUS_LABELS[s.status] : null;
            const typeLabel = s.lead_type ? (CLIENT_TYPE_LABELS[s.lead_type] ?? s.lead_type) : null;
            const stageLabel = s.commercial_stage ? STAGE_LABELS[s.commercial_stage] ?? s.commercial_stage : null;
            const lastActivity = s.updated_at || s.created_at;
            const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));

            return (
              <Card
                key={s.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/admin/sales/sessions/${s.id}`)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Row 1: identity */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {s.lead_company || s.lead_name || 'Sin nombre'}
                        </span>
                        {typeLabel && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                            {typeLabel}
                          </span>
                        )}
                        {stageLabel && (
                          <span className="text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded shrink-0">
                            {stageLabel}
                          </span>
                        )}
                      </div>
                      {/* Row 2: metadata */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {s.lead_name && s.lead_company && (
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {s.lead_name}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(s.created_at).toLocaleDateString('es')}
                        </span>
                        {daysSince > 0 && (
                          <span className={cn('text-[10px]', daysSince > 7 ? 'text-amber-600 dark:text-amber-400' : '')}>
                            hace {daysSince}d
                          </span>
                        )}
                        {s.score_total != null && s.score_total > 0 && (
                          <span className="font-mono text-[10px]">Score: {s.score_total}</span>
                        )}
                        {outcomeData?.deal_value != null && outcomeData.deal_value > 0 && (
                          <span className="font-mono font-semibold text-foreground">${outcomeData.deal_value.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    {/* Right: status + action */}
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      {ob ? (
                        <Badge variant="outline" className={cn('text-[10px] gap-1', ob.className)}>
                          <ob.icon className="h-2.5 w-2.5" /> {ob.label}
                        </Badge>
                      ) : statusInfo ? (
                        <Badge variant="outline" className={cn('text-[10px] gap-1', statusInfo.className)}>
                          <statusInfo.icon className="h-2.5 w-2.5" /> {statusInfo.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Sin decisión</Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filtered empty */}
      {!isLoading && !isError && result?.status === 'available' && sessions.length > 0 && filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Sin leads en este filtro</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setFilter('all')}>Ver todos</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
