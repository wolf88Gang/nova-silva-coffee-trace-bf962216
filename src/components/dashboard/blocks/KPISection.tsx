import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, Users, Package, Shield, Wallet, AlertTriangle, MapPin, Ship, FileText, ShieldCheck, Leaf, Boxes, Calendar, Sprout, Activity, FlaskConical, Briefcase, TrendingUp, DollarSign } from 'lucide-react';
import { hasModule, type OrgModule } from '@/lib/org-modules';
import { getActorsLabel } from '@/lib/org-terminology';
import { getOperatingModel, getVisibilityPolicy, type OperatingModel } from '@/lib/operatingModel';
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

/**
 * Build KPIs based on operating model, not role.
 * This ensures single_farm never shows "Productores activos", etc.
 */
function buildKPIs(model: OperatingModel, orgTipo: string | null): KPI[] {
  const v = getVisibilityPolicy(model);
  const s = getCooperativaStats();
  const n = getNutricionStats();

  switch (model) {
    case 'single_farm': {
      const ps = getProductorStats();
      return [
        { label: 'Parcelas activas', value: ps.parcelas, icon: MapPin, route: '/produccion/parcelas', module: 'parcelas' },
        { label: 'Hectáreas', value: `${ps.hectareas} ha`, icon: Leaf },
        { label: 'Score VITAL', value: `${ps.puntajeVITAL}/100`, icon: Shield, route: '/resiliencia/vital', module: 'vital' },
        { label: 'Rendimiento est.', value: '22 qq/ha', sub: 'Campaña actual', icon: TrendingUp, route: '/agronomia/yield' },
        { label: 'Costos finca', value: '₡2.4M', sub: 'Mes actual', icon: DollarSign, route: '/finanzas/panel' },
        { label: 'Alertas', value: ps.avisosNoLeidos, icon: AlertTriangle },
      ];
    }

    case 'estate':
    case 'estate_hybrid': {
      const kpis: KPI[] = [
        { label: 'Hectáreas propias', value: `74 ha`, icon: MapPin, route: '/produccion/parcelas', module: 'parcelas' },
        { label: 'Parcelas activas', value: 14, icon: Leaf, route: '/produccion/parcelas' },
        { label: 'Cuadrillas', value: 6, icon: Briefcase, route: '/jornales' },
      ];
      if (v.canSeeCoffeeSuppliers) {
        kpis.push({ label: 'Proveedores café', value: 82, sub: 'Abastecimiento externo', icon: Users, route: '/abastecimiento/recepcion' });
      }
      kpis.push({ label: 'VITAL promedio', value: `${s.promedioVITAL}/100`, icon: Shield, route: '/resiliencia/vital', module: 'vital' });
      kpis.push({ label: 'Alertas', value: s.alertasPendientes, icon: AlertTriangle });
      return kpis;
    }

    case 'aggregator': {
      const actorsLabel = getActorsLabel(orgTipo);
      const kpis: KPI[] = [
        { label: `${actorsLabel} activos`, value: s.totalProductores, sub: 'Registrados', icon: Users, route: '/produccion/productores', module: 'productores' },
        { label: 'Hectáreas totales', value: `${s.hectareasTotales} ha`, icon: MapPin, module: 'parcelas' },
        { label: 'Volumen campaña', value: `${s.volumenAcopiado} QQ`, sub: `${s.lotesEnProceso} lotes`, icon: Package, route: '/abastecimiento/recepcion', module: 'entregas' },
        { label: 'VITAL promedio', value: `${s.promedioVITAL}/100`, icon: Shield, route: '/resiliencia/vital', module: 'vital' },
        { label: 'Alertas', value: s.alertasPendientes, icon: AlertTriangle },
        { label: 'Planes nutrición', value: `${n.pctPlanActivo}%`, sub: `${n.parcelasConPlan} parcelas`, icon: Sprout, route: '/agronomia/nutricion', module: 'nutricion' },
      ];
      return kpis;
    }

    case 'trader': {
      const es = getExportadorStats();
      return [
        { label: 'Proveedores activos', value: es.proveedoresActivos, icon: Users, route: '/origenes' },
        { label: 'Lotes comerciales', value: `${es.volumenTotal} sacos`, icon: Package, route: '/comercial/lotes', module: 'lotes_comerciales' },
        { label: 'Contratos activos', value: es.contratosActivos, icon: FileText, route: '/comercial/contratos', module: 'contratos' },
        { label: 'Embarques en tránsito', value: es.embarquesEnTransito, icon: Ship, module: 'lotes_comerciales' },
        { label: 'EUDR Compliance', value: `${es.eudrCompliance}%`, icon: ShieldCheck, route: '/cumplimiento/eudr', module: 'eudr' },
      ];
    }

    case 'auditor':
      return [
        { label: 'Auditorías programadas', value: 5, icon: FileText, route: '/cumplimiento/auditorias' },
        { label: 'Organizaciones activas', value: 3, icon: Users },
        { label: 'Verificaciones completadas', value: 12, icon: ShieldCheck },
        { label: 'Reportes generados', value: 8, icon: Boxes },
      ];

    default:
      return [];
  }
}

export function getKPIsForContext(role: string | null, orgTipo: string | null): KPI[] {
  const demoConfig = getDemoConfig();
  const effectiveOrgType = demoConfig?.orgType || orgTipo;
  const model = getOperatingModel(effectiveOrgType);

  // For aggregator sub-roles (tecnico), use specialized KPIs
  if (model === 'aggregator' && role === 'tecnico') {
    const ts = getTecnicoStats();
    return [
      { label: 'Productores asignados', value: ts.productoresAsignados, icon: Users, route: '/tecnico/productores', module: 'productores' },
      { label: 'Evaluaciones pendientes', value: ts.evaluacionesPendientes, icon: Shield, route: '/tecnico/vital', module: 'vital' },
      { label: 'Completadas (mes)', value: ts.evaluacionesCompletadas, icon: Leaf },
      { label: 'Visitas hoy', value: ts.visitasHoy, icon: Calendar, route: '/tecnico/agenda' },
      { label: 'Bajo VITAL (<50)', value: ts.productoresBajoVITAL, icon: AlertTriangle },
    ];
  }

  return buildKPIs(model, effectiveOrgType);
}

interface KPISectionProps {
  role: string | null;
  orgTipo: string | null;
  activeModules: OrgModule[];
}

export function KPISection({ role, orgTipo, activeModules }: KPISectionProps) {
  const navigate = useNavigate();
  const allKpis = getKPIsForContext(role, orgTipo);

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
