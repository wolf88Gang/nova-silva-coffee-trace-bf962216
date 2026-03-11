import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, Users, Package, Shield, Wallet, AlertTriangle, MapPin, Ship, FileText, ShieldCheck, Leaf, Boxes, Calendar, Sprout, Activity, FlaskConical, Briefcase, TrendingUp } from 'lucide-react';
import { hasModule, type OrgModule } from '@/lib/org-modules';
import { getActorsLabel } from '@/lib/org-terminology';
import { getOperatingModel, getVisibilityPolicy } from '@/lib/operatingModel';
import { getDemoConfig } from '@/hooks/useDemoConfig';
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
  const v = getVisibilityPolicy(getOperatingModel(getDemoConfig()?.orgType || orgTipo));
  const actorsLabel = getActorsLabel(orgTipo);

  const kpis: KPI[] = [];

  if (v.canSeeProducers) {
    kpis.push({ label: `${actorsLabel} activos`, value: s.totalProductores, sub: 'Registrados', icon: Users, route: '/produccion/productores', module: 'productores' });
  }
  kpis.push({ label: 'Hectáreas totales', value: `${s.hectareasTotales} ha`, icon: MapPin, module: 'parcelas' });
  if (v.canSeeReception) {
    kpis.push({ label: 'Volumen campaña', value: `${s.volumenAcopiado} QQ`, sub: `${s.lotesEnProceso} lotes en proceso`, icon: Package, route: '/abastecimiento/recepcion', module: 'entregas' });
  }
  kpis.push({ label: 'VITAL promedio', value: `${s.promedioVITAL}/100`, sub: 'Score organizacional', icon: Shield, route: '/resiliencia/vital', module: 'vital' });
  if (v.canSeeLabor) {
    kpis.push({ label: 'Jornales activos', value: 12, sub: 'Cuadrillas', icon: Briefcase, route: '/jornales' });
  }
  kpis.push({ label: 'Alertas', value: s.alertasPendientes, sub: 'Requieren atención', icon: AlertTriangle });
  // Nutrición
  kpis.push({ label: 'Planes nutrición activos', value: `${n.pctPlanActivo}%`, sub: `${n.parcelasConPlan}/${n.parcelasTotales} parcelas`, icon: Sprout, route: '/agronomia/nutricion', module: 'nutricion' });
  kpis.push({ label: 'Ejecución ≥70%', value: `${n.pctEjecucion70}%`, sub: `Desviación: ${n.desviacionPromedio}%`, icon: Activity, route: '/agronomia/nutricion', module: 'nutricion' });

  return kpis;
}

function buildEstateKPIs(orgTipo: string | null): KPI[] {
  const s = getCooperativaStats();
  const v = getVisibilityPolicy(getOperatingModel(getDemoConfig()?.orgType || orgTipo));

  const kpis: KPI[] = [
    { label: 'Hectáreas propias', value: `${s.hectareasTotales} ha`, icon: MapPin, route: '/produccion/parcelas', module: 'parcelas' },
    { label: 'Parcelas activas', value: 14, icon: Leaf, route: '/produccion/parcelas' },
  ];
  if (v.canSeeLabor) {
    kpis.push({ label: 'Cuadrillas', value: 6, icon: Briefcase, route: '/jornales' });
  }
  if (v.canSeeSuppliers) {
    kpis.push({ label: 'Proveedores', value: 82, sub: 'Abastecimiento externo', icon: Users, route: '/abastecimiento/recepcion' });
  }
  kpis.push({ label: 'VITAL promedio', value: `${s.promedioVITAL}/100`, icon: Shield, route: '/resiliencia/vital', module: 'vital' });
  kpis.push({ label: 'Alertas', value: s.alertasPendientes, icon: AlertTriangle });

  return kpis;
}

function buildExportadorKPIs(orgTipo: string | null): KPI[] {
  const s = getExportadorStats();
  return [
    { label: 'Proveedores activos', value: s.proveedoresActivos, icon: Users, route: '/origenes', module: 'productores' },
    { label: 'Lotes comerciales', value: `${s.volumenTotal} sacos`, icon: Package, route: '/comercial/lotes', module: 'lotes_comerciales' },
    { label: 'Contratos activos', value: s.contratosActivos, icon: FileText, route: '/comercial/contratos', module: 'contratos' },
    { label: 'Embarques en tránsito', value: s.embarquesEnTransito, icon: Ship, module: 'lotes_comerciales' },
    { label: 'EUDR Compliance', value: `${s.eudrCompliance}%`, icon: ShieldCheck, route: '/cumplimiento/eudr', module: 'eudr' },
  ];
}

function buildProductorKPIs(): KPI[] {
  const s = getProductorStats();
  return [
    { label: 'Parcelas activas', value: s.parcelas, icon: MapPin, route: '/produccion/parcelas', module: 'parcelas' },
    { label: 'Hectáreas', value: `${s.hectareas} ha`, icon: Leaf },
    { label: 'Score VITAL', value: `${s.puntajeVITAL}/100`, icon: Shield, route: '/resiliencia/vital', module: 'vital' },
    { label: 'Rendimiento est.', value: '22 qq/ha', sub: 'Campaña actual', icon: TrendingUp, route: '/agronomia/yield' },
    { label: 'Alertas', value: s.avisosNoLeidos, icon: AlertTriangle },
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
    { label: 'Auditorías programadas', value: 5, icon: FileText, route: '/cumplimiento/auditorias' },
    { label: 'Organizaciones activas', value: 3, icon: Users },
    { label: 'Verificaciones completadas', value: 12, icon: ShieldCheck },
    { label: 'Reportes generados', value: 8, icon: Boxes },
  ];
}

export function getKPIsForContext(role: string | null, orgTipo: string | null): KPI[] {
  const demoConfig = getDemoConfig();
  const effectiveOrgType = demoConfig?.orgType || orgTipo;
  const model = getOperatingModel(effectiveOrgType);

  // Use model-specific builders
  if (model === 'single_farm') return buildProductorKPIs();
  if (model === 'estate' || model === 'estate_hybrid') return buildEstateKPIs(effectiveOrgType);
  if (model === 'trader') return buildExportadorKPIs(effectiveOrgType);
  if (model === 'auditor') return buildCertificadoraKPIs();

  // Aggregator — check role for sub-profiles
  switch (role) {
    case 'cooperativa': return buildCooperativaKPIs(effectiveOrgType);
    case 'exportador': return buildExportadorKPIs(effectiveOrgType);
    case 'productor': return buildProductorKPIs();
    case 'tecnico': return buildTecnicoKPIs();
    case 'certificadora': return buildCertificadoraKPIs();
    default: return buildCooperativaKPIs(effectiveOrgType);
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
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 rounded-md bg-primary/10">
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            {kpi.sub && <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
