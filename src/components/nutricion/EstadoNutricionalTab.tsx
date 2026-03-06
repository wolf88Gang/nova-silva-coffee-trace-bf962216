import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout, Droplets, Leaf, AlertTriangle, CheckCircle, HelpCircle, FileText } from 'lucide-react';

// ── Status helpers ──

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

// ── Types matching the MV / RPC return ──

interface ResumenRow {
  organization_id: string;
  parcela_id: string;
  parcela_nombre: string;
  // contexto
  variedades: string | null;
  edad_promedio_anios: number | null;
  altitud_msnm: number | null;
  // último suelo
  suelo_fecha: string | null;
  ph_agua: number | null;
  materia_organica_pct: number | null;
  p_disponible: number | null;
  k_intercambiable: number | null;
  ca_intercambiable: number | null;
  mg_intercambiable: number | null;
  // último foliar
  foliar_fecha: string | null;
  n_pct: number | null;
  f_p_pct: number | null;
  k_pct: number | null;
  ca_pct: number | null;
  mg_pct: number | null;
  // último plan
  plan_id: string | null;
  plan_estado: string | null;
  nivel_confianza: string | null;
}

export default function EstadoNutricionalTab() {
  const { organizationId } = useOrgContext();

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['nutricion_resumen', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_nutricion_parcela_resumen');
      if (error) throw error;
      return (data ?? []) as ResumenRow[];
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
          <p className="text-sm text-muted-foreground">Error al cargar estado nutricional. Verifica que la RPC esté configurada.</p>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
      {items.map((row) => {
        const phSt = phStatus(row.ph_agua);
        const moSt = moStatus(row.materia_organica_pct);
        const overallStatus = phSt === 'critical' || moSt === 'critical' ? 'critical'
          : phSt === 'warning' || moSt === 'warning' ? 'warning'
          : phSt === 'ok' && moSt === 'ok' ? 'ok' : 'unknown';

        return (
          <Card key={row.parcela_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{row.parcela_nombre}</CardTitle>
                <StatusBadge status={overallStatus} />
              </div>
              {row.variedades && (
                <p className="text-xs text-muted-foreground">{row.variedades}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Contexto */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-muted-foreground">Edad</p>
                  <p className="font-semibold text-foreground">{row.edad_promedio_anios != null ? `${row.edad_promedio_anios} años` : '—'}</p>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-muted-foreground">Altitud</p>
                  <p className="font-semibold text-foreground">{row.altitud_msnm != null ? `${row.altitud_msnm} msnm` : '—'}</p>
                </div>
              </div>

              {/* Suelo */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Droplets className="h-3.5 w-3.5" /> Suelo
                  {row.suelo_fecha && (
                    <span className="ml-auto text-muted-foreground/70">
                      {new Date(row.suelo_fecha).toLocaleDateString('es')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <StatusIcon status={phSt} />
                    <span>pH {row.ph_agua?.toFixed(1) ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusIcon status={moSt} />
                    <span>MO {row.materia_organica_pct?.toFixed(1) ?? '—'}%</span>
                  </div>
                  {row.p_disponible != null && (
                    <span className="text-muted-foreground">P {row.p_disponible} ppm</span>
                  )}
                </div>
              </div>

              {/* Foliar */}
              {row.foliar_fecha && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Leaf className="h-3.5 w-3.5" /> Foliar
                    <span className="ml-auto text-muted-foreground/70">
                      {new Date(row.foliar_fecha).toLocaleDateString('es')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>N {row.n_pct?.toFixed(2) ?? '—'}%</span>
                    <span>P {row.f_p_pct?.toFixed(2) ?? '—'}%</span>
                    <span>K {row.k_pct?.toFixed(2) ?? '—'}%</span>
                  </div>
                </div>
              )}

              {/* Plan activo */}
              {row.plan_id && (
                <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-border">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span className="text-foreground font-medium">Plan {row.plan_estado}</span>
                  {row.nivel_confianza && (
                    <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                      {row.nivel_confianza}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
