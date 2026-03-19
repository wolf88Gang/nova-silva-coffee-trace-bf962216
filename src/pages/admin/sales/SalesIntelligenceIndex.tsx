/**
 * Sales Intelligence — Sessions list
 * Reads from sales_sessions table via safeQuery pattern.
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ArrowRight, AlertCircle, Inbox, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesSession {
  id: string;
  org_name: string | null;
  org_type: string | null;
  total_score: number | null;
  outcome: string | null;
  deal_value: number | null;
  created_at: string;
}

type BackendStatus = 'available' | 'unavailable';

function useSalesSessions() {
  return useQuery({
    queryKey: ['sales-sessions-list'],
    queryFn: async (): Promise<{ data: SalesSession[]; status: BackendStatus }> => {
      const { data, error } = await supabase
        .from('sales_sessions' as any)
        .select('id, org_name, org_type, total_score, outcome, deal_value, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return { data: [], status: 'unavailable' };
        }
        throw error;
      }
      return { data: (data as SalesSession[]) ?? [], status: 'available' };
    },
    staleTime: 1000 * 60 * 3,
  });
}

const outcomeBadge: Record<string, { label: string; className: string; icon: typeof TrendingUp }> = {
  won: { label: 'Won', className: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400', icon: TrendingUp },
  lost: { label: 'Lost', className: 'border-destructive/30 text-destructive', icon: TrendingDown },
  no_decision: { label: 'No decision', className: 'border-muted-foreground/30 text-muted-foreground', icon: Minus },
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
        <Button size="sm" onClick={() => navigate('/admin/sales/new')} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nueva sesión
        </Button>
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

      {!isLoading && !isError && result?.status === 'available' && result.data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Sin sesiones registradas</p>
            <p className="text-xs text-muted-foreground mt-1">Crea una nueva sesión de diagnóstico comercial</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && result?.status === 'available' && result.data.length > 0 && (
        <div className="space-y-2">
          {result.data.map((s) => {
            const ob = s.outcome ? outcomeBadge[s.outcome] : null;
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
                          {s.org_name || 'Sin nombre'}
                        </span>
                        {s.org_type && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {s.org_type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {s.total_score != null && (
                          <span className="font-mono">Score: {s.total_score}</span>
                        )}
                        <span>{new Date(s.created_at).toLocaleDateString('es')}</span>
                        {s.deal_value != null && s.deal_value > 0 && (
                          <span className="font-mono">${s.deal_value.toLocaleString()}</span>
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
