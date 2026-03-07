import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, Users, Package, Shield, Wallet, AlertTriangle, MapPin, Ship, FileText, ShieldCheck, Leaf, Boxes, Calendar, Sprout, Activity, FlaskConical } from 'lucide-react';
import { hasModule, type OrgModule } from '@/lib/org-modules';
import { getActorsLabel } from '@/lib/org-terminology';
import {
  getCooperativaStats, getExportadorStats, getProductorStats, getTecnicoStats, getNutricionStats,
} from '@/lib/demo-data';

interface KPI {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  route?: string;
  module?: OrgModule;
}

function buildCooperativaKPIs(orgTipo: string | null): KPI[] {
  const s = getCooperativaStats();
  const n = getNutricionStats();
  const actorsLabel = getActorsLabel(orgTipo);
  return [
    { label: `${actorsLabel} activos`, value: s.totalProductores, sub: 'Registrados', icon: Users, route: '/cooperativa/productores-hub', module: 'productores' },
    { label: 'Hectáreas totales', value: `${s.hectareasTotales} ha`, icon: MapPin, module: 'parcelas' },
    { label: 'Volumen campaña', value: `${s.volumenAcopiado} QQ`, sub: `${s.lotesEnProceso} lotes en proceso`, icon: Package, route: '/cooperativa/acopio', module: 'entregas' },
    { label: 'VITAL promedio', value: `${s.promedioVITAL}/100`, sub: 'Score organizacional', icon: Shield, route: '/cooperativa/vital', module: 'vital' },
    { label: 'Créditos activos', value: `$${s.creditosActivos.toLocaleString()}`, icon: Wallet, route: '/cooperativa/finanzas-hub', module: 'creditos' },
    { label: 'Alertas', value: s.alertasPendientes, sub: 'Requieren atención', icon: AlertTriangle },
    // Nutrición KPIs (§3.8.1 Fase 3)
    { label: 'Planes nutrición activos', value: `${n.pctPlanActivo}%`, sub: `${n.parcelasConPlan}/${n.parcelasTotales} parcelas`, icon: Sprout, route: '/cooperativa/nutricion', module: 'nutricion' },
    { label: 'Ejecución ≥70%', value: `${n.pctEjecucion70}%`, sub: `Desviación: ${n.desviacionPromedio}%`, icon: Activity, route: '/cooperativa/nutricion', module: 'nutricion' },
    { label: 'Análisis válidos', value: `${n.analisisValidos}/${n.analisisTotales}`, sub: `${n.analisisVencidos} vencidos`, icon: FlaskConical, route: '/cooperativa/nutricion', module: 'nutricion' },
  ];
}

function buildExportadorKPIs(orgTipo: string | null): KPI[] {
  const s = getExportadorStats();
  const actorsLabel = getActorsLabel(orgTipo);
  return [
    { label: `${actorsLabel} activos`, value: s.proveedoresActivos, icon: Users, route: '/exportador/proveedores', module: 'productores' },
    { label: 'Lotes comerciales', value: `${s.volumenTotal} sacos`, icon: Package, route: '/exportador/lotes', module: 'lotes_comerciales' },
    { label: 'Contratos activos', value: s.contratosActivos, icon: FileText, route: '/exportador/contratos', module: 'contratos' },
    { label: 'Embarques en tránsito', value: s.embarquesEnTransito, icon: Ship, module: 'lotes_comerciales' },
    { label: 'EUDR Compliance', value: `${s.eudrCompliance}%`, icon: ShieldCheck, route: '/exportador/eudr', module: 'eudr' },
  ];
}

function buildProductorKPIs(): KPI[] {
  const s = getProductorStats();
  return [
    { label: 'Parcelas activas', value: s.parcelas, icon: MapPin, route: '/productor/produccion', module: 'parcelas' },
    { label: 'Hectáreas', value: `${s.hectareas} ha`, icon: Leaf },
    { label: 'Score VITAL', value: `${s.puntajeVITAL}/100`, icon: Shield, route: '/productor/sostenibilidad', module: 'vital' },
    { label: 'Créditos activos', value: s.creditosActivos, icon: Wallet, route: '/productor/finanzas', module: 'creditos' },
    { label: 'Avisos', value: s.avisosNoLeidos, icon: AlertTriangle, route: '/productor/avisos' },
  ];
}

function buildTecnicoKPIs(): KPI[] {
  const s = getTecnicoStats();
  return [
    { label: 'Productores asignados', value: s.productoresAsignados, icon: Users, route: '/tecnico/productores', module: 'productores' },
    { label: 'Evaluaciones pendientes', value: s.evaluacionesPendientes, icon: Shield, route: '/tecnico/vital', module: 'vital' },
    { label: 'Completadas (mes)', value: s.evaluacionesCompletadas, icon: Leaf },
    { label: 'Visitas hoy', value: s.visitasHoy, icon: Calendar, route: '/tecnico/agenda' },
    { label: 'Bajo VITAL (<50)', value: s.productoresBajoVITAL, icon: AlertTriangle },
  ];
}

function buildCertificadoraKPIs(): KPI[] {
  return [
    { label: 'Auditorías programadas', value: 5, icon: FileText, route: '/certificadora/auditorias' },
    { label: 'Organizaciones activas', value: 3, icon: Users, route: '/certificadora/orgs' },
    { label: 'Verificaciones completadas', value: 12, icon: ShieldCheck, route: '/certificadora/verificar' },
    { label: 'Reportes generados', value: 8, icon: Boxes, route: '/certificadora/reportes' },
  ];
}

export function getKPIsForContext(role: string | null, orgTipo: string | null): KPI[] {
  switch (role) {
    case 'cooperativa': return buildCooperativaKPIs(orgTipo);
    case 'exportador': return buildExportadorKPIs(orgTipo);
    case 'productor': return buildProductorKPIs();
    case 'tecnico': return buildTecnicoKPIs();
    case 'certificadora': return buildCertificadoraKPIs();
    default: return [];
  }
}

interface KPISectionProps {
  role: string | null;
  orgTipo: string | null;
  activeModules: OrgModule[];
}

export function KPISection({ role, orgTipo, activeModules }: KPISectionProps) {
  const navigate = useNavigate();
  const allKpis = getKPIsForContext(role, orgTipo);

  // Filter by active modules
  const kpis = allKpis.filter(k => !k.module || hasModule(activeModules, k.module));

  if (kpis.length === 0) return null;

  const cols = kpis.length <= 4 ? `md:grid-cols-${kpis.length}` : kpis.length === 5 ? 'md:grid-cols-5' : 'md:grid-cols-3 lg:grid-cols-6';

  return (
    <div className={`grid grid-cols-2 ${cols} gap-4 stagger-children`}>
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className={kpi.route ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
          onClick={() => kpi.route && navigate(kpi.route)}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            {kpi.sub && <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
