/**
 * ParcelasNutricionTab — Vista centrada en parcelas que unifica:
 * - Estado nutricional (semáforo)
 * - Análisis de suelo + foliar (detalle completo)
 * - Diagnóstico edáfico (SoilIntelligenceCard)
 * - Enlace a plan activo / generar plan
 * - Registro de nuevos análisis
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { applyOrgFilter, applyLegacyOrgFilter, orgWriteFields } from '@/lib/orgFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InsightsPanel from '@/components/insights/InsightsPanel';
import ProductivityGapChart from '@/components/insights/ProductivityGapChart';
import { useModuleSnapshot } from '@/hooks/useModuleSnapshot';
import OrgCertificationsManager from '@/components/cumplimiento/OrgCertificationsManager';
import OrgExportMarketsManager from '@/components/cumplimiento/OrgExportMarketsManager';
import BlockedIngredientsPanel from '@/components/cumplimiento/BlockedIngredientsPanel';
import PhaseoutAlertsCard from '@/components/cumplimiento/PhaseoutAlertsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  Sprout, Droplets, Leaf, AlertTriangle, CheckCircle, HelpCircle,
  FileText, ChevronDown, Plus, Zap, Eye, Download, Layers,
} from 'lucide-react';
import SoilIntelligenceCard from './SoilIntelligenceCard';
import type { SoilAnalysisInput } from '@/lib/soilIntelligenceEngine';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, ShieldCheck, TrendingUp } from 'lucide-react';

// ── Sufficiency ranges for soil nutrients (coffee) ──

interface Range { low: number; high: number; }

const SOIL_RANGES: Record<string, Range> = {
  ph: { low: 5.3, high: 5.8 },
  mo_pct: { low: 3, high: 6 },
  p_ppm: { low: 20, high: 30 },
  k_cmol: { low: 0.5, high: 0.8 },
  ca_cmol: { low: 4, high: 8 },
  mg_cmol: { low: 1, high: 2.5 },
  s_ppm: { low: 12, high: 25 },
  al_cmol: { low: 0, high: 0.5 },
  fe_ppm: { low: 20, high: 100 },
  mn_ppm: { low: 10, high: 50 },
  cu_ppm: { low: 1, high: 5 },
  zn_ppm: { low: 3, high: 8 },
  b_ppm: { low: 0.5, high: 1.5 },
  cice: { low: 10, high: 20 },
  sat_bases: { low: 50, high: 70 },
};

function getStatus(value: number | null, key: string): 'ok' | 'warning' | 'critical' | 'unknown' {
  if (value == null) return 'unknown';
  const r = SOIL_RANGES[key];
  if (!r) return 'unknown';
  // For al_cmol, lower is better
  if (key === 'al_cmol') {
    if (value <= r.high * 0.6) return 'ok';
    if (value <= r.high) return 'warning';
    return 'critical';
  }
  if (value >= r.low && value <= r.high) return 'ok';
  if (value >= r.low * 0.7 && value <= r.high * 1.3) return 'warning';
  return 'critical';
}

function StatusIcon({ status }: { status: 'ok' | 'warning' | 'critical' | 'unknown' }) {
  switch (status) {
    case 'ok': return <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />;
    case 'warning': return <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />;
    case 'critical': return <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />;
    default: return <HelpCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  }
}

function OverallBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ok: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
    unknown: 'bg-muted text-muted-foreground border-border',
  };
  const labels: Record<string, string> = {
    ok: 'Óptimo', warning: 'Atención', critical: 'Crítico', unknown: 'Sin datos',
  };
  return <Badge variant="outline" className={styles[status] ?? styles.unknown}>{labels[status] ?? status}</Badge>;
}

// ── Types ──

interface ResumenRow {
  organization_id: string;
  parcela_id: string;
  parcela_nombre: string;
  variedades: any;
  edad_promedio_anios: number | null;
  altitud_msnm: number | null;
  densidad_plantas_ha: number | null;
  sombra_pct: number | null;
  pendiente_pct: number | null;
  suelo_fecha: string | null;
  ph_agua: number | null;
  materia_organica_pct: number | null;
  p_disponible: number | null;
  k_intercambiable: number | null;
  ca_intercambiable: number | null;
  mg_intercambiable: number | null;
  suelo_archivo_url: string | null;
  foliar_fecha: string | null;
  n_pct: number | null;
  f_p_pct: number | null;
  k_pct: number | null;
  ca_pct: number | null;
  mg_pct: number | null;
  plan_id: string | null;
  plan_estado: string | null;
  nivel_confianza: string | null;
}

interface SueloRow {
  id: string; parcela_id: string; fecha_analisis: string;
  ph: number | null; mo_pct: number | null; p_ppm: number | null;
  k_cmol: number | null; ca_cmol: number | null; mg_cmol: number | null;
  s_ppm: number | null; cice: number | null; textura: string | null;
  al_cmol: number | null;
  fe_ppm?: number | null; mn_ppm?: number | null; cu_ppm?: number | null;
  zn_ppm?: number | null; b_ppm?: number | null; sat_bases?: number | null;
}

interface Parcela { id: string; nombre: string; }

// ── Demo data for presentation ──

const DEMO_PARCELAS: ResumenRow[] = [
  {
    organization_id: '00000000-0000-0000-0000-000000000001',
    parcela_id: 'demo-p1', parcela_nombre: 'Lote 1 — El Roble',
    variedades: [{ variedad_codigo: 'Caturra' }, { variedad_codigo: 'Catuaí' }],
    edad_promedio_anios: 6, altitud_msnm: 1350, densidad_plantas_ha: 5000,
    sombra_pct: 45, pendiente_pct: 18,
    suelo_fecha: '2025-09-15', ph_agua: 5.1, materia_organica_pct: 4.2,
    p_disponible: 12, k_intercambiable: 0.42, ca_intercambiable: 4.8,
    mg_intercambiable: 1.1, suelo_archivo_url: null,
    foliar_fecha: '2025-10-02', n_pct: 2.65, f_p_pct: 0.14, k_pct: 1.82, ca_pct: 0.98, mg_pct: 0.31,
    plan_id: 'demo-plan-1', plan_estado: 'aprobado', nivel_confianza: 'alto',
  },
  {
    organization_id: '00000000-0000-0000-0000-000000000001',
    parcela_id: 'demo-p2', parcela_nombre: 'Lote 2 — La Cascada',
    variedades: [{ variedad_codigo: 'Geisha' }],
    edad_promedio_anios: 3, altitud_msnm: 1580, densidad_plantas_ha: 4200,
    sombra_pct: 55, pendiente_pct: 25,
    suelo_fecha: '2025-08-20', ph_agua: 4.7, materia_organica_pct: 3.1,
    p_disponible: 8, k_intercambiable: 0.28, ca_intercambiable: 2.9,
    mg_intercambiable: 0.7, suelo_archivo_url: null,
    foliar_fecha: '2025-09-10', n_pct: 2.30, f_p_pct: 0.11, k_pct: 1.55, ca_pct: 0.72, mg_pct: 0.22,
    plan_id: 'demo-plan-2', plan_estado: 'generado', nivel_confianza: 'medio',
  },
  {
    organization_id: '00000000-0000-0000-0000-000000000001',
    parcela_id: 'demo-p3', parcela_nombre: 'Lote 3 — Mirador',
    variedades: [{ variedad_codigo: 'SL28' }, { variedad_codigo: 'Bourbon' }],
    edad_promedio_anios: 12, altitud_msnm: 1200, densidad_plantas_ha: 4500,
    sombra_pct: 35, pendiente_pct: 12,
    suelo_fecha: '2025-07-05', ph_agua: 5.5, materia_organica_pct: 5.8,
    p_disponible: 24, k_intercambiable: 0.65, ca_intercambiable: 6.2,
    mg_intercambiable: 1.8, suelo_archivo_url: null,
    foliar_fecha: '2025-08-12', n_pct: 2.90, f_p_pct: 0.18, k_pct: 2.10, ca_pct: 1.15, mg_pct: 0.38,
    plan_id: 'demo-plan-3', plan_estado: 'ejecutado', nivel_confianza: 'alto',
  },
  {
    organization_id: '00000000-0000-0000-0000-000000000001',
    parcela_id: 'demo-p4', parcela_nombre: 'Lote 4 — Quebrada Honda',
    variedades: [{ variedad_codigo: 'Castillo' }],
    edad_promedio_anios: 8, altitud_msnm: 1420, densidad_plantas_ha: 5500,
    sombra_pct: 40, pendiente_pct: 22,
    suelo_fecha: '2025-06-18', ph_agua: 4.9, materia_organica_pct: 3.6,
    p_disponible: 15, k_intercambiable: 0.38, ca_intercambiable: 3.5,
    mg_intercambiable: 0.9, suelo_archivo_url: null,
    foliar_fecha: null, n_pct: null, f_p_pct: null, k_pct: null, ca_pct: null, mg_pct: null,
    plan_id: null, plan_estado: null, nivel_confianza: null,
  },
];

const DEMO_SUELO: Record<string, SueloRow> = {
  'demo-p1': {
    id: 'ds1', parcela_id: 'demo-p1', fecha_analisis: '2025-09-15',
    ph: 5.1, mo_pct: 4.2, p_ppm: 12, k_cmol: 0.42, ca_cmol: 4.8, mg_cmol: 1.1,
    s_ppm: 14, cice: 12.5, textura: 'Franco-arcilloso', al_cmol: 0.35,
    fe_ppm: 85, mn_ppm: 32, cu_ppm: 3.2, zn_ppm: 4.5, b_ppm: 0.8, sat_bases: 58,
  },
  'demo-p2': {
    id: 'ds2', parcela_id: 'demo-p2', fecha_analisis: '2025-08-20',
    ph: 4.7, mo_pct: 3.1, p_ppm: 8, k_cmol: 0.28, ca_cmol: 2.9, mg_cmol: 0.7,
    s_ppm: 9, cice: 8.2, textura: 'Franco', al_cmol: 0.62,
    fe_ppm: 120, mn_ppm: 55, cu_ppm: 2.1, zn_ppm: 2.8, b_ppm: 0.4, sat_bases: 42,
  },
  'demo-p3': {
    id: 'ds3', parcela_id: 'demo-p3', fecha_analisis: '2025-07-05',
    ph: 5.5, mo_pct: 5.8, p_ppm: 24, k_cmol: 0.65, ca_cmol: 6.2, mg_cmol: 1.8,
    s_ppm: 18, cice: 16.8, textura: 'Franco-arenoso', al_cmol: 0.12,
    fe_ppm: 45, mn_ppm: 22, cu_ppm: 4.1, zn_ppm: 6.2, b_ppm: 1.1, sat_bases: 65,
  },
  'demo-p4': {
    id: 'ds4', parcela_id: 'demo-p4', fecha_analisis: '2025-06-18',
    ph: 4.9, mo_pct: 3.6, p_ppm: 15, k_cmol: 0.38, ca_cmol: 3.5, mg_cmol: 0.9,
    s_ppm: 11, cice: 10.1, textura: 'Arcilloso', al_cmol: 0.48,
    fe_ppm: 95, mn_ppm: 42, cu_ppm: 2.8, zn_ppm: 3.5, b_ppm: 0.6, sat_bases: 50,
  },
};

// ── Per-parcela insights section ──

function ParcelaInsightsSection({ parcelaId }: { parcelaId: string }) {
  const ciclo = '2024-2025'; // TODO: make dynamic
  const { snapshot } = useModuleSnapshot(parcelaId, ciclo);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Lightbulb className="h-4 w-4 text-primary" /> Insights de Productividad
      </div>
      <InsightsPanel snapshot={snapshot ?? null} />
      <ProductivityGapChart parcelaId={parcelaId} useDemo />
    </div>
  );
}

// ── Main component ──

export default function ParcelasNutricionTab() {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();
  const [expandedParcela, setExpandedParcela] = useState<string | null>(null);
  const [showSueloForm, setShowSueloForm] = useState(false);
  const [showHojaForm, setShowHojaForm] = useState(false);
  const [formParcelaId, setFormParcelaId] = useState('');

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['nutricion_resumen', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_nutricion_parcela_resumen');
      if (error) throw error;
      return (data ?? []) as ResumenRow[];
    },
    enabled: !!organizationId,
  });

  // Fetch full soil analysis for expanded parcela
  const { data: sueloDetail } = useQuery({
    queryKey: ['suelo_detail', expandedParcela],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutricion_analisis_suelo')
        .select('*')
        .eq('parcela_id', expandedParcela!)
        .order('fecha_analisis', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SueloRow | null;
    },
    enabled: !!expandedParcela,
  });

  // Parcelas list for forms
  const { data: parcelas } = useQuery({
    queryKey: ['parcelas_for_nutricion', organizationId],
    queryFn: async () => {
      let q = supabase.from('parcelas').select('id, nombre');
      q = applyLegacyOrgFilter(q, organizationId);
      const { data, error } = await q.order('nombre');
      if (error) throw error;
      return (data ?? []) as Parcela[];
    },
    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Error al cargar estado nutricional.</p>
        </CardContent>
      </Card>
    );
  }

  if (!items?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Sin datos nutricionales</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registra contexto de parcela y análisis de suelo/foliar para ver el estado consolidado.
          </p>
          <div className="flex justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setFormParcelaId(''); setShowSueloForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Análisis de Suelo
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setFormParcelaId(''); setShowHojaForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Análisis Foliar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const openSueloForm = (parcelaId: string) => {
    setFormParcelaId(parcelaId);
    setShowSueloForm(true);
  };

  const openHojaForm = (parcelaId: string) => {
    setFormParcelaId(parcelaId);
    setShowHojaForm(true);
  };

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} parcela{items.length !== 1 ? 's' : ''} con datos nutricionales</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setFormParcelaId(''); setShowSueloForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Análisis Suelo
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setFormParcelaId(''); setShowHojaForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Análisis Foliar
          </Button>
        </div>
      </div>

      {/* Parcela cards */}
      <div className="space-y-3">
        {items.map((row) => {
          const phSt = getStatus(row.ph_agua, 'ph');
          const moSt = getStatus(row.materia_organica_pct, 'mo_pct');
          const overallStatus = phSt === 'critical' || moSt === 'critical' ? 'critical'
            : phSt === 'warning' || moSt === 'warning' ? 'warning'
            : phSt === 'ok' && moSt === 'ok' ? 'ok' : 'unknown';

          const isExpanded = expandedParcela === row.parcela_id;

          // Build soil input for intelligence card
          const soilInput: SoilAnalysisInput | null = sueloDetail && isExpanded ? {
            ph: sueloDetail.ph,
            mo_pct: sueloDetail.mo_pct,
            p_ppm: sueloDetail.p_ppm,
            k_cmol: sueloDetail.k_cmol,
            ca_cmol: sueloDetail.ca_cmol,
            mg_cmol: sueloDetail.mg_cmol,
            s_ppm: sueloDetail.s_ppm,
            cice: sueloDetail.cice,
            al_cmol: sueloDetail.al_cmol ?? null,
            textura: sueloDetail.textura,
          } : null;

          return (
            <Collapsible
              key={row.parcela_id}
              open={isExpanded}
              onOpenChange={(open) => setExpandedParcela(open ? row.parcela_id : null)}
            >
              <Card className="transition-shadow hover:shadow-md">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sprout className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <CardTitle className="text-base">{row.parcela_nombre}</CardTitle>
                          {row.variedades && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {Array.isArray(row.variedades)
                                ? row.variedades.map((v: any) => typeof v === 'object' ? v.variedad_codigo : v).join(', ')
                                : typeof row.variedades === 'string' ? row.variedades : JSON.stringify(row.variedades)}
                              {row.altitud_msnm ? ` · ${row.altitud_msnm} msnm` : ''}
                              {row.edad_promedio_anios ? ` · ${row.edad_promedio_anios} años` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <OverallBadge status={overallStatus} />
                        {row.suelo_fecha && (
                          <Badge variant="outline" className="text-xs hidden sm:flex">
                            📅 {new Date(row.suelo_fecha).toLocaleDateString('es')}
                          </Badge>
                        )}
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                {/* Summary row always visible */}
                <CardContent className="pt-0 pb-3">
                  {/* Context pills */}
                  {(row.densidad_plantas_ha || row.sombra_pct != null || row.pendiente_pct != null || row.altitud_msnm) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {row.densidad_plantas_ha && (
                        <div className="text-center p-2 rounded-md bg-muted/50">
                          <p className="text-[10px] text-muted-foreground">Densidad</p>
                          <p className="text-sm font-semibold text-foreground">{row.densidad_plantas_ha.toLocaleString()} pl/ha</p>
                        </div>
                      )}
                      {row.sombra_pct != null && (
                        <div className="text-center p-2 rounded-md bg-muted/50">
                          <p className="text-[10px] text-muted-foreground">Sombra</p>
                          <p className="text-sm font-semibold text-foreground">{row.sombra_pct}%</p>
                        </div>
                      )}
                      {row.pendiente_pct != null && (
                        <div className="text-center p-2 rounded-md bg-muted/50">
                          <p className="text-[10px] text-muted-foreground">Pendiente</p>
                          <p className="text-sm font-semibold text-foreground">{row.pendiente_pct}%</p>
                        </div>
                      )}
                      {row.altitud_msnm && (
                        <div className="text-center p-2 rounded-md bg-muted/50">
                          <p className="text-[10px] text-muted-foreground">Altitud</p>
                          <p className="text-sm font-semibold text-foreground">{row.altitud_msnm} m</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick nutrients summary */}
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
                      <StatusIcon status={phSt} />
                      <span className="text-foreground">pH {row.ph_agua?.toFixed(1) ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={moSt} />
                      <span className="text-foreground">MO {row.materia_organica_pct?.toFixed(1) ?? '—'}%</span>
                    </div>
                    {row.p_disponible != null && (
                      <span className="text-muted-foreground">P {row.p_disponible} ppm</span>
                    )}
                    {row.k_intercambiable != null && (
                      <span className="text-muted-foreground">K {row.k_intercambiable} cmol/kg</span>
                    )}
                  </div>

                  {/* Plan link */}
                  {row.plan_id && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border text-xs">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span className="text-foreground font-medium">Plan {row.plan_estado}</span>
                      {row.nivel_confianza && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{row.nivel_confianza}</Badge>
                      )}
                    </div>
                  )}
                </CardContent>

                {/* ── Expanded detail ── */}
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <Separator />

                    {/* Full soil analysis */}
                    {row.suelo_fecha && sueloDetail && isExpanded ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Droplets className="h-4 w-4 text-primary" /> Análisis de Suelo
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(sueloDetail.fecha_analisis).toLocaleDateString('es')}</span>
                            {sueloDetail.textura && <span>· {sueloDetail.textura}</span>}
                            {row.suelo_archivo_url && (
                              <a href={row.suelo_archivo_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Two-column nutrient grid like reference screenshots */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/20 border border-border">
                          {/* Left: Macronutrientes & pH */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase mb-2">Macronutrientes & pH</p>
                            <NutrientRow label="pH" value={sueloDetail.ph} rangeKey="ph" unit="" />
                            <NutrientRow label="Materia Orgánica" value={sueloDetail.mo_pct} rangeKey="mo_pct" unit="%" />
                            <NutrientRow label="Fósforo (P)" value={sueloDetail.p_ppm} rangeKey="p_ppm" unit="ppm" />
                            <NutrientRow label="Potasio (K)" value={sueloDetail.k_cmol} rangeKey="k_cmol" unit="cmol/kg" />
                            <NutrientRow label="Calcio (Ca)" value={sueloDetail.ca_cmol} rangeKey="ca_cmol" unit="cmol/kg" />
                            <NutrientRow label="Magnesio (Mg)" value={sueloDetail.mg_cmol} rangeKey="mg_cmol" unit="cmol/kg" />
                            <NutrientRow label="Azufre (S)" value={sueloDetail.s_ppm} rangeKey="s_ppm" unit="ppm" />
                          </div>
                          {/* Right: Micronutrientes & Capacidad */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase mb-2">Micronutrientes & Capacidad</p>
                            <NutrientRow label="Aluminio (Al)" value={sueloDetail.al_cmol} rangeKey="al_cmol" unit="cmol/kg" />
                            <NutrientRow label="CICE" value={sueloDetail.cice} rangeKey="cice" unit="cmol/kg" />
                          </div>
                        </div>

                        {sueloDetail.textura && (
                          <p className="text-xs text-muted-foreground">Textura: {sueloDetail.textura}</p>
                        )}
                      </div>
                    ) : row.suelo_fecha ? (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Cargando análisis de suelo...
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Sin análisis de suelo.
                        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => openSueloForm(row.parcela_id)}>
                          <Plus className="h-3 w-3 mr-1" /> Registrar
                        </Button>
                      </div>
                    )}

                    {/* Foliar analysis */}
                    {row.foliar_fecha ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Leaf className="h-4 w-4 text-primary" /> Análisis Foliar
                          <span className="ml-auto text-xs text-muted-foreground">
                            {new Date(row.foliar_fecha).toLocaleDateString('es')}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          <FoliarMetric label="N" value={row.n_pct} unit="%" />
                          <FoliarMetric label="P" value={row.f_p_pct} unit="%" />
                          <FoliarMetric label="K" value={row.k_pct} unit="%" />
                          <FoliarMetric label="Ca" value={row.ca_pct} unit="%" />
                          <FoliarMetric label="Mg" value={row.mg_pct} unit="%" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Leaf className="h-4 w-4" />
                        Sin análisis foliar.
                        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => openHojaForm(row.parcela_id)}>
                          <Plus className="h-3 w-3 mr-1" /> Registrar
                        </Button>
                      </div>
                    )}

                    {/* Soil Intelligence diagnosis */}
                    {soilInput && (
                      <div className="pt-2">
                        <SoilIntelligenceCard soilData={soilInput} parcelaName={row.parcela_nombre} />
                      </div>
                    )}

                    {/* Insights — per-parcela productivity analysis */}
                    {isExpanded && (
                      <ParcelaInsightsSection parcelaId={row.parcela_id} />
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      {row.plan_id ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`#plan-${row.plan_id}`} onClick={(e) => {
                            e.preventDefault();
                            // Navigate to Planes tab and select this plan
                            const tabTrigger = document.querySelector('[data-value="planes"]') as HTMLElement;
                            tabTrigger?.click();
                          }}>
                            <Eye className="h-4 w-4 mr-1" /> Ver Plan
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => {
                          const tabTrigger = document.querySelector('[data-value="planes"]') as HTMLElement;
                          tabTrigger?.click();
                        }}>
                          <Zap className="h-4 w-4 mr-1" /> Generar Plan
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openSueloForm(row.parcela_id)}>
                        <Droplets className="h-4 w-4 mr-1" /> + Suelo
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openHojaForm(row.parcela_id)}>
                        <Leaf className="h-4 w-4 mr-1" /> + Foliar
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* Cumplimiento — org-level compliance section */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Cumplimiento y Certificaciones</CardTitle>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Certificaciones, mercados de exportación e ingredientes prohibidos
              </p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <OrgCertificationsManager />
                <OrgExportMarketsManager />
              </div>
              <BlockedIngredientsPanel />
              <PhaseoutAlertsCard />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Soil analysis form dialog */}
      <Dialog open={showSueloForm} onOpenChange={setShowSueloForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo Análisis de Suelo</DialogTitle></DialogHeader>
          <SueloForm
            parcelas={parcelas ?? []}
            organizationId={organizationId}
            defaultParcelaId={formParcelaId}
            onSuccess={() => {
              setShowSueloForm(false);
              queryClient.invalidateQueries({ queryKey: ['nutricion_resumen'] });
              queryClient.invalidateQueries({ queryKey: ['nutricion_analisis_suelo'] });
              queryClient.invalidateQueries({ queryKey: ['suelo_detail'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Foliar analysis form dialog */}
      <Dialog open={showHojaForm} onOpenChange={setShowHojaForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo Análisis Foliar</DialogTitle></DialogHeader>
          <HojaForm
            parcelas={parcelas ?? []}
            organizationId={organizationId}
            defaultParcelaId={formParcelaId}
            onSuccess={() => {
              setShowHojaForm(false);
              queryClient.invalidateQueries({ queryKey: ['nutricion_resumen'] });
              queryClient.invalidateQueries({ queryKey: ['nutricion_analisis_foliar'] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Nutrient row with semaphore ──

function NutrientRow({ label, value, rangeKey, unit }: { label: string; value: number | null; rangeKey: string; unit: string }) {
  const status = getStatus(value, rangeKey);
  const range = SOIL_RANGES[rangeKey];

  return (
    <div className="flex items-center gap-2 py-1">
      <StatusIcon status={status} />
      <span className="text-sm text-foreground flex-1 min-w-0">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">
        {value != null ? (value < 1 && value > 0 ? value.toFixed(2) : value.toFixed(1)) : '—'}
      </span>
      <span className="text-xs text-muted-foreground w-14 text-right">{unit}</span>
      {range && (
        <span className="text-[10px] text-muted-foreground/60 w-16 text-right tabular-nums">
          ({range.low}–{range.high})
        </span>
      )}
    </div>
  );
}

// ── Foliar metric ──

function FoliarMetric({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="text-center p-2 rounded-md bg-muted/50">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {value != null ? value.toFixed(2) : '—'} {unit}
      </p>
    </div>
  );
}

// ── Soil Form (reused from AnalisisTab) ──

function SueloForm({ parcelas, organizationId, defaultParcelaId, onSuccess }: {
  parcelas: Parcela[]; organizationId: string | null; defaultParcelaId: string; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    parcela_id: defaultParcelaId, fecha_analisis: new Date().toISOString().split('T')[0],
    ph: '', mo_pct: '', p_ppm: '', k_cmol: '', ca_cmol: '', mg_cmol: '', s_ppm: '', cice: '', al_cmol: '', textura: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('nutricion_analisis_suelo').insert({
        parcela_id: form.parcela_id,
        fecha_analisis: form.fecha_analisis,
        ph: form.ph ? parseFloat(form.ph) : null,
        mo_pct: form.mo_pct ? parseFloat(form.mo_pct) : null,
        p_ppm: form.p_ppm ? parseFloat(form.p_ppm) : null,
        k_cmol: form.k_cmol ? parseFloat(form.k_cmol) : null,
        ca_cmol: form.ca_cmol ? parseFloat(form.ca_cmol) : null,
        mg_cmol: form.mg_cmol ? parseFloat(form.mg_cmol) : null,
        s_ppm: form.s_ppm ? parseFloat(form.s_ppm) : null,
        cice: form.cice ? parseFloat(form.cice) : null,
        al_cmol: form.al_cmol ? parseFloat(form.al_cmol) : null,
        textura: form.textura || null,
        ...orgWriteFields(organizationId),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Análisis de suelo registrado'); onSuccess(); },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Parcela *</Label>
        <Select value={form.parcela_id} onValueChange={v => set('parcela_id', v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar parcela" /></SelectTrigger>
          <SelectContent>
            {parcelas.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre || p.id.slice(0, 8)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Fecha análisis *</Label>
        <Input type="date" value={form.fecha_analisis} onChange={e => set('fecha_analisis', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>pH</Label><Input type="number" step="0.1" value={form.ph} onChange={e => set('ph', e.target.value)} placeholder="5.2" /></div>
        <div><Label>MO %</Label><Input type="number" step="0.1" value={form.mo_pct} onChange={e => set('mo_pct', e.target.value)} placeholder="4.5" /></div>
        <div><Label>P (ppm)</Label><Input type="number" step="0.1" value={form.p_ppm} onChange={e => set('p_ppm', e.target.value)} /></div>
        <div><Label>K (cmol/L)</Label><Input type="number" step="0.01" value={form.k_cmol} onChange={e => set('k_cmol', e.target.value)} /></div>
        <div><Label>Ca (cmol/L)</Label><Input type="number" step="0.01" value={form.ca_cmol} onChange={e => set('ca_cmol', e.target.value)} /></div>
        <div><Label>Mg (cmol/L)</Label><Input type="number" step="0.01" value={form.mg_cmol} onChange={e => set('mg_cmol', e.target.value)} /></div>
        <div><Label>S (ppm)</Label><Input type="number" step="0.1" value={form.s_ppm} onChange={e => set('s_ppm', e.target.value)} /></div>
        <div><Label>CICE</Label><Input type="number" step="0.1" value={form.cice} onChange={e => set('cice', e.target.value)} /></div>
        <div><Label>Al (cmol)</Label><Input type="number" step="0.01" value={form.al_cmol} onChange={e => set('al_cmol', e.target.value)} placeholder="0.30" /></div>
      </div>
      <div>
        <Label>Textura</Label>
        <Select value={form.textura} onValueChange={v => set('textura', v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar textura" /></SelectTrigger>
          <SelectContent>
            {['Arcilloso', 'Franco', 'Franco-arcilloso', 'Franco-arenoso', 'Arenoso'].map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!form.parcela_id || mutation.isPending} className="w-full">
        {mutation.isPending ? 'Guardando…' : 'Registrar Análisis de Suelo'}
      </Button>
    </div>
  );
}

// ── Foliar Form ──

function HojaForm({ parcelas, organizationId, defaultParcelaId, onSuccess }: {
  parcelas: Parcela[]; organizationId: string | null; defaultParcelaId: string; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    parcela_id: defaultParcelaId, fecha_muestreo: new Date().toISOString().split('T')[0],
    n_pct: '', p_pct: '', k_pct: '', ca_pct: '', mg_pct: '', s_pct: '',
    fe_ppm: '', mn_ppm: '', zn_ppm: '', b_ppm: '', cu_ppm: '',
    laboratorio: '', notas: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('nutricion_analisis_foliar' as any).insert({
        parcela_id: form.parcela_id,
        fecha_muestreo: form.fecha_muestreo,
        n_pct: form.n_pct ? parseFloat(form.n_pct) : null,
        p_pct: form.p_pct ? parseFloat(form.p_pct) : null,
        k_pct: form.k_pct ? parseFloat(form.k_pct) : null,
        ca_pct: form.ca_pct ? parseFloat(form.ca_pct) : null,
        mg_pct: form.mg_pct ? parseFloat(form.mg_pct) : null,
        s_pct: form.s_pct ? parseFloat(form.s_pct) : null,
        fe_ppm: form.fe_ppm ? parseFloat(form.fe_ppm) : null,
        mn_ppm: form.mn_ppm ? parseFloat(form.mn_ppm) : null,
        zn_ppm: form.zn_ppm ? parseFloat(form.zn_ppm) : null,
        b_ppm: form.b_ppm ? parseFloat(form.b_ppm) : null,
        cu_ppm: form.cu_ppm ? parseFloat(form.cu_ppm) : null,
        laboratorio: form.laboratorio || null,
        notas: form.notas || null,
        ...orgWriteFields(organizationId),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Análisis foliar registrado'); onSuccess(); },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Parcela *</Label>
        <Select value={form.parcela_id} onValueChange={v => set('parcela_id', v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar parcela" /></SelectTrigger>
          <SelectContent>
            {parcelas.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre || p.id.slice(0, 8)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Fecha análisis *</Label>
        <Input type="date" value={form.fecha_muestreo} onChange={e => set('fecha_muestreo', e.target.value)} />
      </div>
      <p className="text-xs font-medium text-muted-foreground">Macronutrientes (%)</p>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>N</Label><Input type="number" step="0.01" value={form.n_pct} onChange={e => set('n_pct', e.target.value)} /></div>
        <div><Label>P</Label><Input type="number" step="0.01" value={form.p_pct} onChange={e => set('p_pct', e.target.value)} /></div>
        <div><Label>K</Label><Input type="number" step="0.01" value={form.k_pct} onChange={e => set('k_pct', e.target.value)} /></div>
        <div><Label>Ca</Label><Input type="number" step="0.01" value={form.ca_pct} onChange={e => set('ca_pct', e.target.value)} /></div>
        <div><Label>Mg</Label><Input type="number" step="0.01" value={form.mg_pct} onChange={e => set('mg_pct', e.target.value)} /></div>
        <div><Label>S</Label><Input type="number" step="0.01" value={form.s_pct} onChange={e => set('s_pct', e.target.value)} /></div>
      </div>
      <p className="text-xs font-medium text-muted-foreground">Micronutrientes (ppm)</p>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Fe</Label><Input type="number" step="0.1" value={form.fe_ppm} onChange={e => set('fe_ppm', e.target.value)} /></div>
        <div><Label>Mn</Label><Input type="number" step="0.1" value={form.mn_ppm} onChange={e => set('mn_ppm', e.target.value)} /></div>
        <div><Label>Zn</Label><Input type="number" step="0.1" value={form.zn_ppm} onChange={e => set('zn_ppm', e.target.value)} /></div>
        <div><Label>B</Label><Input type="number" step="0.1" value={form.b_ppm} onChange={e => set('b_ppm', e.target.value)} /></div>
        <div><Label>Cu</Label><Input type="number" step="0.1" value={form.cu_ppm} onChange={e => set('cu_ppm', e.target.value)} /></div>
      </div>
      <div>
        <Label>Laboratorio</Label>
        <Input value={form.laboratorio} onChange={e => set('laboratorio', e.target.value)} placeholder="Nombre del laboratorio" />
      </div>
      <div>
        <Label>Notas</Label>
        <Textarea value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones del análisis..." />
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!form.parcela_id || mutation.isPending} className="w-full">
        {mutation.isPending ? 'Guardando…' : 'Registrar Análisis Foliar'}
      </Button>
    </div>
  );
}
