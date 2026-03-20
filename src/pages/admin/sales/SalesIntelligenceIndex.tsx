/**
 * Sales Intelligence — Sessions list
 * REAL SCHEMA: sales_sessions with score_* columns
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ArrowRight, AlertCircle, Inbox, Target, TrendingUp, TrendingDown, Minus, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLIENT_TYPE_LABELS } from '@/lib/commercialBriefEngine';

interface SalesSession {
  id: string;
  lead_name: string | null;
  lead_company: string | null;
  lead_type: string | null;
  commercial_stage: string | null;
  status: string | null;
  score_total: number | null;
  created_at: string;
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
        .select('id, lead_name, lead_company, lead_type, commercial_stage, status, score_total, created_at')
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
};

const outcomeBadge: Record<string, { label: string; className: string; icon: typeof TrendingUp }> = {
  won: { label: 'Ganado', className: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400', icon: TrendingUp },
  lost: { label: 'Perdido', className: 'border-destructive/30 text-destructive', icon: TrendingDown },
  no_decision: { label: 'Sin decisión', className: 'border-muted-foreground/30 text-muted-foreground', icon: Minus },
};

export default function SalesIntelligenceIndex() {
  const { data: result, isLoading, isError } = useSalesSessions();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sales Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sesiones de diagnóstico comercial</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/sales/new')} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Sesión rápida
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/sales/diagnostic')} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Diagnóstico adaptativo
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
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

      {!isLoading && !isError && result?.status === 'available' && result.sessions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Sin sesiones registradas</p>
            <p className="text-xs text-muted-foreground mt-1">Crea una nueva sesión de diagnóstico comercial</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && result?.status === 'available' && result.sessions.length > 0 && (
        <div className="space-y-2">
          {result.sessions.map((s) => {
            const outcomeData = result.outcomes.get(s.id);
            const ob = outcomeData ? outcomeBadge[outcomeData.outcome] : null;
            return (
              <Card
                key={s.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/admin/sales/sessions/${s.id}`)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {s.lead_company || s.lead_name || 'Sin nombre'}
                        </span>
                        {s.lead_type && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {s.lead_type}
                          </span>
                        )}
                        {s.commercial_stage && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {s.commercial_stage}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {s.score_total != null && (
                          <span className="font-mono">Score: {s.score_total}</span>
                        )}
                        <span>{new Date(s.created_at).toLocaleDateString('es')}</span>
                        {outcomeData?.deal_value != null && outcomeData.deal_value > 0 && (
                          <span className="font-mono">${outcomeData.deal_value.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ob ? (
                        <Badge variant="outline" className={cn('text-[10px] gap-1', ob.className)}>
                          <ob.icon className="h-2.5 w-2.5" /> {ob.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Pendiente</Badge>
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
    </div>
  );
}
