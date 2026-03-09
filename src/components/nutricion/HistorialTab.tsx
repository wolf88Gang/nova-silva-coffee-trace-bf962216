import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Download, Eye, FileText, Image, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Aplicacion {
  id: string;
  plan_id: string;
  fecha_aplicacion: string;
  tipo_aplicacion: string | null;
  producto_aplicado: string | null;
  cantidad_aplicada_kg: number | null;
  costo_real: number | null;
  dosis_aplicada_json: Record<string, unknown> | null;
  evidencias: { files?: { path: string; name: string; size: number; type: string }[] } | null;
  notas: string | null;
  created_at: string;
}


const DEMO_APLICACIONES: Aplicacion[] = [
  { id: 'da-1', plan_id: 'demo-plan-001', fecha_aplicacion: '2026-03-05', tipo_aplicacion: 'edafica', producto_aplicado: 'Urea (46-0-0)', cantidad_aplicada_kg: 120, costo_real: 45, dosis_aplicada_json: { nutrientes: { N_kg_ha: 55 } }, evidencias: null, notas: 'Primera aplicación — cabeza de alfiler', created_at: '2026-03-05T10:00:00Z' },
  { id: 'da-2', plan_id: 'demo-plan-001', fecha_aplicacion: '2026-02-20', tipo_aplicacion: 'edafica', producto_aplicado: 'DAP (18-46-0)', cantidad_aplicada_kg: 85, costo_real: 65, dosis_aplicada_json: { nutrientes: { N_kg_ha: 15, P2O5_kg_ha: 30 } }, evidencias: null, notas: 'Fósforo pre-floración', created_at: '2026-02-20T09:00:00Z' },
  { id: 'da-3', plan_id: 'demo-plan-002', fecha_aplicacion: '2026-03-12', tipo_aplicacion: 'enmienda', producto_aplicado: 'Cal dolomítica', cantidad_aplicada_kg: 1200, costo_real: 30, dosis_aplicada_json: { nutrientes: { CaCO3_kg_ha: 1200 } }, evidencias: null, notas: 'Encalado correctivo — La Ceiba', created_at: '2026-03-12T08:00:00Z' },
  { id: 'da-4', plan_id: 'demo-plan-003', fecha_aplicacion: '2025-10-05', tipo_aplicacion: 'edafica', producto_aplicado: 'Fórmula 18-5-15-6-2', cantidad_aplicada_kg: 350, costo_real: 140, dosis_aplicada_json: { nutrientes: { N_kg_ha: 63, P2O5_kg_ha: 17.5, K2O_kg_ha: 52.5 } }, evidencias: null, notas: 'Aplicación 1 — cafetal joven', created_at: '2025-10-05T10:00:00Z' },
  { id: 'da-5', plan_id: 'demo-plan-001', fecha_aplicacion: '2026-01-10', tipo_aplicacion: 'foliar', producto_aplicado: 'Zinc + Boro foliar', cantidad_aplicada_kg: 5, costo_real: 18, dosis_aplicada_json: { nutrientes: { Zn_kg_ha: 2, B_kg_ha: 1.5 } }, evidencias: null, notas: 'Micronutrientes foliares — El Roble', created_at: '2026-01-10T14:00:00Z' },
];

const TIPO_COLORS: Record<string, string> = {
  edafica: 'bg-success/10 text-success border-success/20',
  foliar: 'bg-primary/10 text-primary border-primary/20',
  fertirriego: 'bg-accent/20 text-accent-foreground border-accent/30',
  enmienda: 'bg-muted text-foreground border-border',
  otro: 'bg-muted text-muted-foreground',
};

export default function HistorialTab() {
  const { organizationId } = useOrgContext();
  const [filterPlanId, setFilterPlanId] = useState('');

  const { data: rawAplicaciones, isLoading } = useQuery({
    queryKey: ['nutricion_aplicaciones_historial', organizationId, filterPlanId],
    queryFn: async () => {
      let q = supabase
        .from('v_nutricion_aplicaciones_min')
        .select('id, plan_id, fecha_aplicacion, tipo_aplicacion, producto_aplicado, cantidad_aplicada_kg, costo_real, dosis_aplicada_json, evidencias, notas, created_at')
        .order('fecha_aplicacion', { ascending: false })
        .limit(50);
      if (filterPlanId.trim()) q = q.eq('plan_id', filterPlanId.trim());
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Aplicacion[];
    },
    enabled: !!organizationId,
  });

  const aplicaciones = (() => {
    const real = rawAplicaciones ?? [];
    const realIds = new Set(real.map(r => r.id));
    let extras = DEMO_APLICACIONES.filter(d => !realIds.has(d.id));
    if (filterPlanId.trim()) extras = extras.filter(d => d.plan_id === filterPlanId.trim());
    return [...real, ...extras];
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="filter-plan" className="text-xs text-muted-foreground">Filtrar por Plan ID</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="filter-plan"
              placeholder="UUID del plan (opcional)"
              value={filterPlanId}
              onChange={(e) => setFilterPlanId(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {aplicaciones?.length ?? 0} aplicaciones encontradas
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : !aplicaciones?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">Sin aplicaciones registradas</h3>
            <p className="text-sm text-muted-foreground">
              Registra una ejecución en la pestaña "Ejecución" para verla aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {aplicaciones.map(app => (
            <AplicacionCard key={app.id} aplicacion={app} />
          ))}
        </div>
      )}
    </div>
  );
}

function AplicacionCard({ aplicacion }: { aplicacion: Aplicacion }) {
  const nutrientes = (aplicacion.dosis_aplicada_json as any)?.nutrientes;

  async function openEvidence(path: string) {
    const { data, error } = await supabase
      .storage
      .from('nutrition-executions')
      .createSignedUrl(path, 60);
    if (error) {
      toast.error('No se pudo obtener el enlace de la evidencia');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  const evidenceFiles = aplicacion.evidencias?.files ?? [];

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Info principal */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground">
                {new Date(aplicacion.fecha_aplicacion).toLocaleDateString('es', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
              {aplicacion.tipo_aplicacion && (
                <Badge variant="outline" className={TIPO_COLORS[aplicacion.tipo_aplicacion] ?? ''}>
                  {aplicacion.tipo_aplicacion}
                </Badge>
              )}
            </div>

            {/* Nutrientes */}
            {nutrientes && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {nutrientes.N_kg_ha > 0 && <span>N: {nutrientes.N_kg_ha} kg/ha</span>}
                {nutrientes.P2O5_kg_ha > 0 && <span>P₂O₅: {nutrientes.P2O5_kg_ha} kg/ha</span>}
                {nutrientes.K2O_kg_ha > 0 && <span>K₂O: {nutrientes.K2O_kg_ha} kg/ha</span>}
              </div>
            )}

            {/* Producto y costo */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {aplicacion.producto_aplicado && (
                <span>Producto: <strong className="text-foreground">{aplicacion.producto_aplicado}</strong></span>
              )}
              {aplicacion.cantidad_aplicada_kg != null && (
                <span>Cantidad: {aplicacion.cantidad_aplicada_kg} kg</span>
              )}
              {aplicacion.costo_real != null && (
                <span>Costo: ${aplicacion.costo_real.toLocaleString('es')}</span>
              )}
            </div>

            {aplicacion.notas && (
              <p className="text-xs text-muted-foreground/70 italic">{aplicacion.notas}</p>
            )}

            {/* Plan ID */}
            <p className="text-xs text-muted-foreground">
              Plan: <span className="font-mono">{aplicacion.plan_id.slice(0, 8)}…</span>
            </p>
          </div>

          {/* Evidencias */}
          {evidenceFiles.length > 0 && (
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className="text-xs font-medium text-muted-foreground">
                {evidenceFiles.length} evidencia{evidenceFiles.length > 1 ? 's' : ''}
              </span>
              {evidenceFiles.map((file, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs justify-start gap-1.5"
                  onClick={() => openEvidence(file.path)}
                >
                  {file.type?.startsWith('image/') ? (
                    <Image className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Download className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span className="truncate max-w-[120px]">{file.name}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
