import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Sprout, Droplets, Leaf, AlertTriangle, CheckCircle, HelpCircle,
  FlaskConical, FileText, Zap, DollarSign, Calendar,
} from 'lucide-react';

// ── Demo Data ──

const DEMO_PARCELAS_ESTADO = [
  {
    parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1',
    densidad_plantas_ha: 5200, sombra_pct: 45, pendiente_pct: 18,
    suelo_ph: 5.1, suelo_mo_pct: 4.8, suelo_p_ppm: 12, suelo_k_cmol: 0.35, suelo_ca_cmol: 4.2, suelo_mg_cmol: 1.1,
    ultimo_suelo_fecha: '2026-01-15',
    hoja_n_pct: 2.8, hoja_p_pct: 0.15, hoja_k_pct: 2.1, hoja_ca_pct: 1.0, hoja_mg_pct: 0.32,
    ultimo_hoja_fecha: '2026-01-20',
  },
  {
    parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central',
    densidad_plantas_ha: 4800, sombra_pct: 60, pendiente_pct: 25,
    suelo_ph: 4.6, suelo_mo_pct: 2.9, suelo_p_ppm: 6, suelo_k_cmol: 0.18, suelo_ca_cmol: 2.5, suelo_mg_cmol: 0.7,
    ultimo_suelo_fecha: '2025-11-08',
    hoja_n_pct: 2.2, hoja_p_pct: 0.11, hoja_k_pct: 1.6, hoja_ca_pct: 0.7, hoja_mg_pct: 0.22,
    ultimo_hoja_fecha: '2025-11-15',
  },
  {
    parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes',
    densidad_plantas_ha: 5500, sombra_pct: 35, pendiente_pct: 12,
    suelo_ph: 5.4, suelo_mo_pct: 5.2, suelo_p_ppm: 18, suelo_k_cmol: 0.42, suelo_ca_cmol: 5.8, suelo_mg_cmol: 1.5,
    ultimo_suelo_fecha: '2026-02-10',
    hoja_n_pct: 3.1, hoja_p_pct: 0.18, hoja_k_pct: 2.4, hoja_ca_pct: 1.2, hoja_mg_pct: 0.38,
    ultimo_hoja_fecha: '2026-02-15',
  },
  {
    parcela_id: 'p4', parcela_nombre: 'Finca Agua Dulce — Lote Norte',
    densidad_plantas_ha: 4200, sombra_pct: 55, pendiente_pct: 30,
    suelo_ph: 4.3, suelo_mo_pct: 1.8, suelo_p_ppm: 4, suelo_k_cmol: 0.12, suelo_ca_cmol: 1.8, suelo_mg_cmol: 0.4,
    ultimo_suelo_fecha: '2025-09-20',
    hoja_n_pct: null, hoja_p_pct: null, hoja_k_pct: null, hoja_ca_pct: null, hoja_mg_pct: null,
    ultimo_hoja_fecha: null,
  },
  {
    parcela_id: 'p5', parcela_nombre: 'Finca Monte Verde',
    densidad_plantas_ha: 5000, sombra_pct: 40, pendiente_pct: 15,
    suelo_ph: 5.3, suelo_mo_pct: 4.1, suelo_p_ppm: 14, suelo_k_cmol: 0.38, suelo_ca_cmol: 4.5, suelo_mg_cmol: 1.2,
    ultimo_suelo_fecha: '2026-02-28',
    hoja_n_pct: 2.9, hoja_p_pct: 0.16, hoja_k_pct: 2.3, hoja_ca_pct: 1.1, hoja_mg_pct: 0.35,
    ultimo_hoja_fecha: '2026-03-01',
  },
];

const DEMO_SUELO = [
  { id: 's1', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1', fecha_muestreo: '2026-01-15', ph: 5.1, mo_pct: 4.8, p_ppm: 12, k_cmol: 0.35, ca_cmol: 4.2, mg_cmol: 1.1, textura: 'Franco-arcilloso' },
  { id: 's2', parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central', fecha_muestreo: '2025-11-08', ph: 4.6, mo_pct: 2.9, p_ppm: 6, k_cmol: 0.18, ca_cmol: 2.5, mg_cmol: 0.7, textura: 'Franco' },
  { id: 's3', parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes', fecha_muestreo: '2026-02-10', ph: 5.4, mo_pct: 5.2, p_ppm: 18, k_cmol: 0.42, ca_cmol: 5.8, mg_cmol: 1.5, textura: 'Franco-arenoso' },
  { id: 's4', parcela_id: 'p4', parcela_nombre: 'Finca Agua Dulce — Lote Norte', fecha_muestreo: '2025-09-20', ph: 4.3, mo_pct: 1.8, p_ppm: 4, k_cmol: 0.12, ca_cmol: 1.8, mg_cmol: 0.4, textura: 'Arcilloso' },
  { id: 's5', parcela_id: 'p5', parcela_nombre: 'Finca Monte Verde', fecha_muestreo: '2026-02-28', ph: 5.3, mo_pct: 4.1, p_ppm: 14, k_cmol: 0.38, ca_cmol: 4.5, mg_cmol: 1.2, textura: 'Franco' },
  { id: 's6', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1', fecha_muestreo: '2025-07-10', ph: 5.0, mo_pct: 4.5, p_ppm: 10, k_cmol: 0.30, ca_cmol: 3.9, mg_cmol: 1.0, textura: 'Franco-arcilloso' },
];

const DEMO_HOJA = [
  { id: 'h1', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1', fecha_muestreo: '2026-01-20', n_pct: 2.8, p_pct: 0.15, k_pct: 2.1, ca_pct: 1.0, mg_pct: 0.32, interpretacion: 'N y K en rango óptimo. P ligeramente bajo. Incrementar fertilización fosfórica.' },
  { id: 'h2', parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central', fecha_muestreo: '2025-11-15', n_pct: 2.2, p_pct: 0.11, k_pct: 1.6, ca_pct: 0.7, mg_pct: 0.22, interpretacion: 'Deficiencias generalizadas de N, P y K. Requiere plan de nutrición correctivo urgente.' },
  { id: 'h3', parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes', fecha_muestreo: '2026-02-15', n_pct: 3.1, p_pct: 0.18, k_pct: 2.4, ca_pct: 1.2, mg_pct: 0.38, interpretacion: 'Excelente balance nutricional. Mantener plan actual de fertilización.' },
  { id: 'h4', parcela_id: 'p5', parcela_nombre: 'Finca Monte Verde', fecha_muestreo: '2026-03-01', n_pct: 2.9, p_pct: 0.16, k_pct: 2.3, ca_pct: 1.1, mg_pct: 0.35, interpretacion: 'Niveles adecuados. Monitorear K en próximo ciclo.' },
];

const DEMO_PLANES = [
  {
    id: 'plan1', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1',
    ciclo: '2026', objetivo: 'Optimización NPK para producción de especialidad',
    status: 'activo', created_at: '2026-01-25',
    aplicaciones: [
      { id: 'a1', orden: 1, producto: 'NPK 18-5-15-6-2(MgO-S) granulado', dosis_por_ha: '350 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Marzo 2026', costo_estimado_usd: 185, notas: 'Primera fertilización post-floración. Aplicar en corona del cafeto a 20cm del tallo.' },
      { id: 'a2', orden: 2, producto: 'Fertilización foliar — K₂O + B + Zn', dosis_por_ha: '3 L/ha', metodo: 'Aspersión foliar', mes_aplicacion: 'Abril 2026', costo_estimado_usd: 45, notas: 'Complemento de potasio y micronutrientes para llenado de fruto.' },
      { id: 'a3', orden: 3, producto: 'NPK 18-5-15-6-2(MgO-S) granulado', dosis_por_ha: '300 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Junio 2026', costo_estimado_usd: 160, notas: 'Segunda fertilización. Reducir dosis si lluvia excesiva para evitar lixiviación.' },
      { id: 'a4', orden: 4, producto: 'Enmienda calcárea (cal dolomítica)', dosis_por_ha: '500 kg/ha', metodo: 'Al voleo incorporado', mes_aplicacion: 'Agosto 2026', costo_estimado_usd: 65, notas: 'Corrección de pH. Solo si pH < 5.0 en próximo análisis.' },
    ],
  },
  {
    id: 'plan2', parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central',
    ciclo: '2026', objetivo: 'Plan correctivo — suelo ácido con baja MO',
    status: 'borrador', created_at: '2026-02-20',
    aplicaciones: [
      { id: 'a5', orden: 1, producto: 'Cal dolomítica', dosis_por_ha: '1500 kg/ha', metodo: 'Al voleo incorporado', mes_aplicacion: 'Marzo 2026', costo_estimado_usd: 195, notas: 'Corrección urgente de pH. Aplicar 60 días antes de primera fertilización.' },
      { id: 'a6', orden: 2, producto: 'Materia orgánica compostada (bocashi)', dosis_por_ha: '3000 kg/ha', metodo: 'En corona, incorporar al suelo', mes_aplicacion: 'Abril 2026', costo_estimado_usd: 280, notas: 'Reconstrucción de MO del suelo. Compostar mínimo 45 días antes de aplicar.' },
      { id: 'a7', orden: 3, producto: 'NPK 20-5-20 + S', dosis_por_ha: '400 kg/ha', metodo: 'Al suelo, media luna', mes_aplicacion: 'Mayo 2026', costo_estimado_usd: 220, notas: 'Fertilización correctiva con mayor aporte de N y K.' },
      { id: 'a8', orden: 4, producto: 'Fertilización foliar multimineral', dosis_por_ha: '4 L/ha', metodo: 'Aspersión foliar', mes_aplicacion: 'Junio 2026', costo_estimado_usd: 55, notas: 'Aporte rápido de micronutrientes mientras se corrige suelo.' },
      { id: 'a9', orden: 5, producto: 'NPK 20-5-20 + S', dosis_por_ha: '350 kg/ha', metodo: 'Al suelo, media luna', mes_aplicacion: 'Agosto 2026', costo_estimado_usd: 195, notas: 'Segunda dosis correctiva.' },
    ],
  },
  {
    id: 'plan3', parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes',
    ciclo: '2026', objetivo: 'Mantenimiento — parcela en excelente condición',
    status: 'activo', created_at: '2026-02-18',
    aplicaciones: [
      { id: 'a10', orden: 1, producto: 'NPK 17-6-18-2(MgO) granulado', dosis_por_ha: '300 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Marzo 2026', costo_estimado_usd: 165, notas: 'Fertilización de mantenimiento. Suelo en óptimas condiciones.' },
      { id: 'a11', orden: 2, producto: 'NPK 17-6-18-2(MgO) granulado', dosis_por_ha: '300 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Julio 2026', costo_estimado_usd: 165, notas: 'Segunda dosis de mantenimiento.' },
    ],
  },
  {
    id: 'plan4', parcela_id: 'p4', parcela_nombre: 'Finca Agua Dulce — Lote Norte',
    ciclo: '2025', objetivo: 'Recuperación de parcela degradada',
    status: 'completado', created_at: '2025-03-10',
    aplicaciones: [
      { id: 'a12', orden: 1, producto: 'Cal viva', dosis_por_ha: '2000 kg/ha', metodo: 'Al voleo', mes_aplicacion: 'Marzo 2025', costo_estimado_usd: 240, notas: 'Corrección severa de pH 4.3.' },
      { id: 'a13', orden: 2, producto: 'Compost + gallinaza', dosis_por_ha: '5000 kg/ha', metodo: 'En corona incorporado', mes_aplicacion: 'Mayo 2025', costo_estimado_usd: 420, notas: 'Aporte masivo de MO para recuperar biología del suelo.' },
      { id: 'a14', orden: 3, producto: 'NPK 15-15-15', dosis_por_ha: '250 kg/ha', metodo: 'Al suelo', mes_aplicacion: 'Julio 2025', costo_estimado_usd: 140, notas: 'Fertilización balanceada inicial.' },
    ],
  },
];

// ── Scoring helpers ──

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

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'ok': return <CheckCircle className="h-4 w-4 text-success" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default: return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    ok: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
    unknown: 'bg-muted text-muted-foreground border-border',
  };
  const labels: Record<string, string> = { ok: 'Óptimo', warning: 'Atención', critical: 'Crítico', unknown: 'Sin datos' };
  return <Badge variant="outline" className={variants[status] ?? variants.unknown}>{labels[status] ?? status}</Badge>;
}

const PLAN_STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-muted text-muted-foreground',
  activo: 'bg-success/10 text-success border-success/20',
  completado: 'bg-primary/10 text-primary border-primary/20',
};

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-center p-1.5 rounded bg-muted/50">
      <p className="text-muted-foreground text-[10px]">{label}</p>
      <p className="font-semibold text-foreground">{value?.toFixed(1) ?? '—'}</p>
    </div>
  );
}

// ── Main Component ──

export default function NutricionTab() {
  const [subTab, setSubTab] = useState<'estado' | 'analisis' | 'planes'>('estado');

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'estado' as const, icon: Sprout, label: 'Estado Nutricional' },
          { key: 'analisis' as const, icon: FlaskConical, label: 'Análisis' },
          { key: 'planes' as const, icon: FileText, label: 'Planes' },
        ].map(t => (
          <Button
            key={t.key}
            size="sm"
            variant={subTab === t.key ? 'default' : 'outline'}
            onClick={() => setSubTab(t.key)}
          >
            <t.icon className="h-4 w-4 mr-1" /> {t.label}
          </Button>
        ))}
      </div>

      {subTab === 'estado' && <EstadoSection />}
      {subTab === 'analisis' && <AnalisisSection />}
      {subTab === 'planes' && <PlanesSection />}
    </div>
  );
}

// ── Estado Nutricional ──

function EstadoSection() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
      {DEMO_PARCELAS_ESTADO.map(p => {
        const phSt = phStatus(p.suelo_ph);
        const moSt = moStatus(p.suelo_mo_pct);
        const overall = phSt === 'critical' || moSt === 'critical' ? 'critical'
          : phSt === 'warning' || moSt === 'warning' ? 'warning'
          : phSt === 'ok' && moSt === 'ok' ? 'ok' : 'unknown';

        return (
          <Card key={p.parcela_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm leading-tight">{p.parcela_nombre}</CardTitle>
                <StatusBadge status={overall} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-muted-foreground">Densidad</p>
                  <p className="font-semibold text-foreground">{p.densidad_plantas_ha.toLocaleString()}</p>
                  <p className="text-muted-foreground">pl/ha</p>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-muted-foreground">Sombra</p>
                  <p className="font-semibold text-foreground">{p.sombra_pct}%</p>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <p className="text-muted-foreground">Pendiente</p>
                  <p className="font-semibold text-foreground">{p.pendiente_pct}%</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Droplets className="h-3.5 w-3.5" /> Suelo
                  <span className="ml-auto text-muted-foreground/70">{new Date(p.ultimo_suelo_fecha).toLocaleDateString('es')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1"><StatusIcon status={phSt} /><span>pH {p.suelo_ph.toFixed(1)}</span></div>
                  <div className="flex items-center gap-1"><StatusIcon status={moSt} /><span>MO {p.suelo_mo_pct.toFixed(1)}%</span></div>
                  <span className="text-muted-foreground">P {p.suelo_p_ppm} ppm</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Leaf className="h-3.5 w-3.5" /> Foliar
                  {p.ultimo_hoja_fecha && (
                    <span className="ml-auto text-muted-foreground/70">{new Date(p.ultimo_hoja_fecha).toLocaleDateString('es')}</span>
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

// ── Análisis ──

function AnalisisSection() {
  const [tipo, setTipo] = useState<'suelo' | 'foliar'>('suelo');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={tipo === 'suelo' ? 'default' : 'outline'} onClick={() => setTipo('suelo')}>
          <Droplets className="h-4 w-4 mr-1" /> Suelo ({DEMO_SUELO.length})
        </Button>
        <Button size="sm" variant={tipo === 'foliar' ? 'default' : 'outline'} onClick={() => setTipo('foliar')}>
          <Leaf className="h-4 w-4 mr-1" /> Foliar ({DEMO_HOJA.length})
        </Button>
      </div>

      {tipo === 'suelo' && (
        <div className="space-y-3 stagger-children">
          {DEMO_SUELO.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{s.parcela_nombre}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(s.fecha_muestreo).toLocaleDateString('es')}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  <Metric label="pH" value={s.ph} />
                  <Metric label="MO %" value={s.mo_pct} />
                  <Metric label="P ppm" value={s.p_ppm} />
                  <Metric label="K cmol" value={s.k_cmol} />
                  <Metric label="Ca cmol" value={s.ca_cmol} />
                  <Metric label="Mg cmol" value={s.mg_cmol} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Textura: {s.textura}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tipo === 'foliar' && (
        <div className="space-y-3 stagger-children">
          {DEMO_HOJA.map(h => (
            <Card key={h.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{h.parcela_nombre}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(h.fecha_muestreo).toLocaleDateString('es')}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                  <Metric label="N %" value={h.n_pct} />
                  <Metric label="P %" value={h.p_pct} />
                  <Metric label="K %" value={h.k_pct} />
                  <Metric label="Ca %" value={h.ca_pct} />
                  <Metric label="Mg %" value={h.mg_pct} />
                </div>
                {h.interpretacion && <p className="text-xs text-muted-foreground mt-2 italic">{h.interpretacion}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Planes ──

function PlanesSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Planes de fertilización generados por el motor de nutrición</p>
        <Button size="sm"><Zap className="h-4 w-4 mr-1" /> Generar Plan</Button>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {DEMO_PLANES.map(plan => {
          const totalCost = plan.aplicaciones.reduce((sum, a) => sum + a.costo_estimado_usd, 0);

          return (
            <AccordionItem key={plan.id} value={plan.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full mr-2">
                  <Sprout className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plan.parcela_nombre} — {plan.ciclo}</p>
                    <p className="text-xs text-muted-foreground truncate">{plan.objetivo}</p>
                  </div>
                  <Badge variant="outline" className={PLAN_STATUS_COLORS[plan.status] ?? ''}>{plan.status}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    <DollarSign className="h-3 w-3" />{totalCost.toFixed(0)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {plan.aplicaciones.map(app => (
                    <div key={app.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/30 text-sm">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {app.orden}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{app.producto}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span>Dosis: {app.dosis_por_ha}</span>
                          <span>Método: {app.metodo}</span>
                          <span><Calendar className="h-3 w-3 inline mr-0.5" />{app.mes_aplicacion}</span>
                          <span><DollarSign className="h-3 w-3 inline" />{app.costo_estimado_usd} USD</span>
                        </div>
                        {app.notas && <p className="text-xs text-muted-foreground/70 mt-1">{app.notas}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
