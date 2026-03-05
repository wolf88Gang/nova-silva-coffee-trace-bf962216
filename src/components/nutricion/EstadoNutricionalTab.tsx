import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout, Droplets, Leaf, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface ParcelaEstado {
  parcela_id: string;
  parcela_nombre: string;
  cooperativa_id: string;
  pendiente_pct: number | null;
  densidad_plantas_ha: number | null;
  sombra_pct: number | null;
  textura_suelo: string | null;
  mo_pct: number | null;
  ph: number | null;
  cice: number | null;
  ultimo_suelo_fecha: string | null;
  suelo_ph: number | null;
  suelo_mo_pct: number | null;
  suelo_p_ppm: number | null;
  suelo_k_cmol: number | null;
  suelo_ca_cmol: number | null;
  suelo_mg_cmol: number | null;
  ultimo_hoja_fecha: string | null;
  hoja_n_pct: number | null;
  hoja_p_pct: number | null;
  hoja_k_pct: number | null;
  hoja_ca_pct: number | null;
  hoja_mg_pct: number | null;
}

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

export default function EstadoNutricionalTab() {
  const { user } = useAuth();

  const { data: parcelas, isLoading, error } = useQuery({
    queryKey: ['ag_parcela_estado_nutricion'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ag_parcela_estado_nutricion');
      if (error) throw error;
      return (data ?? []) as ParcelaEstado[];
    },
    enabled: !!user,
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

  if (!parcelas || parcelas.length === 0) {
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
      {parcelas.map((p) => {
        const phSt = phStatus(p.suelo_ph ?? p.ph);
        const moSt = moStatus(p.suelo_mo_pct ?? p.mo_pct);
        const overallStatus = phSt === 'critical' || moSt === 'critical' ? 'critical'
          : phSt === 'warning' || moSt === 'warning' ? 'warning'
          : phSt === 'ok' && moSt === 'ok' ? 'ok' : 'unknown';

        return (
          <Card key={p.parcela_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.parcela_nombre || 'Parcela sin nombre'}</CardTitle>
                <StatusBadge status={overallStatus} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Context */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-muted-foreground">Densidad</p>
                  <p className="font-semibold text-foreground">{p.densidad_plantas_ha?.toLocaleString() ?? '—'}</p>
                  <p className="text-muted-foreground">pl/ha</p>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-muted-foreground">Sombra</p>
                  <p className="font-semibold text-foreground">{p.sombra_pct != null ? `${p.sombra_pct}%` : '—'}</p>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-muted-foreground">Pendiente</p>
                  <p className="font-semibold text-foreground">{p.pendiente_pct != null ? `${p.pendiente_pct}%` : '—'}</p>
                </div>
              </div>

              {/* Soil */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Droplets className="h-3.5 w-3.5" /> Suelo
                  {p.ultimo_suelo_fecha && (
                    <span className="ml-auto text-muted-foreground/70">
                      {new Date(p.ultimo_suelo_fecha).toLocaleDateString('es')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <StatusIcon status={phSt} />
                    <span>pH {(p.suelo_ph ?? p.ph)?.toFixed(1) ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusIcon status={moSt} />
                    <span>MO {(p.suelo_mo_pct ?? p.mo_pct)?.toFixed(1) ?? '—'}%</span>
                  </div>
                  {p.suelo_p_ppm != null && (
                    <span className="text-muted-foreground">P {p.suelo_p_ppm} ppm</span>
                  )}
                </div>
              </div>

              {/* Foliar */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Leaf className="h-3.5 w-3.5" /> Foliar
                  {p.ultimo_hoja_fecha && (
                    <span className="ml-auto text-muted-foreground/70">
                      {new Date(p.ultimo_hoja_fecha).toLocaleDateString('es')}
                    </span>
                  )}
                </div>
                {p.hoja_n_pct != null ? (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>N {p.hoja_n_pct}%</span>
                    <span>P {p.hoja_p_pct}%</span>
                    <span>K {p.hoja_k_pct}%</span>
                    <span>Ca {p.hoja_ca_pct}%</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60">Sin análisis foliar</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
