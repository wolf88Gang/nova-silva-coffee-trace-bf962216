import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { applyOrgFilter, applyLegacyOrgFilter } from '@/lib/orgFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout, Droplets, Leaf, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

// Ranges for coffee nutrition (simplified)
function phStatus(ph: number | null): 'ok' | 'warning' | 'critical' | 'unknown' {
  if (ph == null) return 'unknown';
  if (ph >= 5.0 && ph <= 5.5) return 'ok';
  if (ph >= 4.5 && ph <= 6.0) return 'warning';
  return 'critical';
}

function moStatus(mo: number | null): 'ok' | 'warning' | 'critical' | 'unknown' {
  if (mo == null) return 'unknown';
  if (mo >= 4) return 'ok';
  if (mo >= 2) return 'warning';
  return 'critical';
}

function StatusIcon({ status }: { status: 'ok' | 'warning' | 'critical' | 'unknown' }) {
  switch (status) {
    case 'ok': return <CheckCircle className="h-4 w-4 text-success" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default: return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: 'ok' | 'warning' | 'critical' | 'unknown' }) {
  const variants: Record<string, string> = {
    ok: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
    unknown: 'bg-muted text-muted-foreground border-border',
  };
  const labels: Record<string, string> = { ok: 'Óptimo', warning: 'Atención', critical: 'Crítico', unknown: 'Sin datos' };
  return <Badge variant="outline" className={variants[status]}>{labels[status]}</Badge>;
}

interface ParcelaRow { id: string; nombre: string; }
interface ContextoRow { parcela_id: string; densidad_plantas_ha: number | null; sombra_pct: number | null; pendiente_pct: number | null; ph: number | null; mo_pct: number | null; }
interface SueloRow { parcela_id: string; fecha_analisis: string; ph: number | null; mo_pct: number | null; p_ppm: number | null; k_cmol: number | null; ca_cmol: number | null; mg_cmol: number | null; }

export default function EstadoNutricionalTab() {
  const { organizationId } = useOrgContext();

  // Parcelas (legacy cooperativa_id)
  const { data: parcelas } = useQuery({
    queryKey: ['parcelas_estado_nut', organizationId],
    queryFn: async () => {
      let q = supabase.from('parcelas').select('id, nombre');
      q = applyLegacyOrgFilter(q, organizationId);
      const { data, error } = await q.order('nombre');
      if (error) throw error;
      return (data ?? []) as ParcelaRow[];
    },
    enabled: !!organizationId,
  });

  // Contextos (organization_id)
  const { data: contextos } = useQuery({
    queryKey: ['nutricion_contextos', organizationId],
    queryFn: async () => {
      let q = supabase.from('nutricion_parcela_contexto').select('parcela_id, densidad_plantas_ha, sombra_pct, pendiente_pct, ph, mo_pct');
      q = applyOrgFilter(q, organizationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ContextoRow[];
    },
    enabled: !!organizationId,
  });

  // Latest suelo per parcela (organization_id)
  const { data: sueloList, isLoading, error } = useQuery({
    queryKey: ['nutricion_suelo_estado', organizationId],
    queryFn: async () => {
      let q = supabase.from('nutricion_analisis_suelo').select('parcela_id, fecha_analisis, ph, mo_pct, p_ppm, k_cmol, ca_cmol, mg_cmol');
      q = applyOrgFilter(q, organizationId);
      const { data, error } = await q.order('fecha_analisis', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SueloRow[];
    },
    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Error al cargar estado nutricional. Verifica que las tablas de nutrición estén configuradas.</p>
        </CardContent>
      </Card>
    );
  }

  // Merge parcelas + contexto + latest suelo
  const parcelaIds = new Set([
    ...(parcelas?.map(p => p.id) ?? []),
    ...(contextos?.map(c => c.parcela_id) ?? []),
  ]);

  if (parcelaIds.size === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Sin datos nutricionales</h3>
          <p className="text-sm text-muted-foreground">
            Registra contexto de parcela y análisis de suelo/foliar para ver el estado consolidado.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Build merged view
  const sueloByParcela = new Map<string, SueloRow>();
  sueloList?.forEach(s => {
    if (!sueloByParcela.has(s.parcela_id)) sueloByParcela.set(s.parcela_id, s);
  });
  const ctxByParcela = new Map(contextos?.map(c => [c.parcela_id, c]) ?? []);
  const parcelaMap = new Map(parcelas?.map(p => [p.id, p]) ?? []);

  const items = Array.from(parcelaIds).map(pid => {
    const parcela = parcelaMap.get(pid);
    const ctx = ctxByParcela.get(pid);
    const suelo = sueloByParcela.get(pid);
    return { parcelaId: pid, nombre: parcela?.nombre ?? pid.slice(0, 8), ctx, suelo };
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
      {items.map(({ parcelaId, nombre, ctx, suelo }) => {
        const ph = suelo?.ph ?? ctx?.ph ?? null;
        const mo = suelo?.mo_pct ?? ctx?.mo_pct ?? null;
        const phSt = phStatus(ph);
        const moSt = moStatus(mo);
        const overallStatus = phSt === 'critical' || moSt === 'critical' ? 'critical'
          : phSt === 'warning' || moSt === 'warning' ? 'warning'
          : phSt === 'ok' && moSt === 'ok' ? 'ok' : 'unknown';

        return (
          <Card key={parcelaId} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{nombre}</CardTitle>
                <StatusBadge status={overallStatus} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Context */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-muted-foreground">Densidad</p>
                  <p className="font-semibold text-foreground">{ctx?.densidad_plantas_ha?.toLocaleString() ?? '—'}</p>
                  <p className="text-muted-foreground">pl/ha</p>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-muted-foreground">Sombra</p>
                  <p className="font-semibold text-foreground">{ctx?.sombra_pct != null ? `${ctx.sombra_pct}%` : '—'}</p>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-muted-foreground">Pendiente</p>
                  <p className="font-semibold text-foreground">{ctx?.pendiente_pct != null ? `${ctx.pendiente_pct}%` : '—'}</p>
                </div>
              </div>

              {/* Soil */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Droplets className="h-3.5 w-3.5" /> Suelo
                  {suelo?.fecha_analisis && (
                    <span className="ml-auto text-muted-foreground/70">
                      {new Date(suelo.fecha_analisis).toLocaleDateString('es')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <StatusIcon status={phSt} />
                    <span>pH {ph?.toFixed(1) ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusIcon status={moSt} />
                    <span>MO {mo?.toFixed(1) ?? '—'}%</span>
                  </div>
                  {suelo?.p_ppm != null && (
                    <span className="text-muted-foreground">P {suelo.p_ppm} ppm</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
