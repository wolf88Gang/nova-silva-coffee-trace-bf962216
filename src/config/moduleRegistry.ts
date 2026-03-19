/**
 * Registry central de módulos para Admin Module Explorer.
 * Mapea rutas, hooks, datasets y estado de conexión.
 */
export type ModuleStatus = 'operativo' | 'fallback' | 'sin_datos';

export const STATUS_CONFIG: Record<
  ModuleStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  operativo: { label: 'Operativo', variant: 'default' },
  fallback: { label: 'Fallback demo', variant: 'secondary' },
  sin_datos: { label: 'Sin datos', variant: 'destructive' },
};

export interface ModuleEntry {
  key: string;
  label: string;
  route: string;
  domain: string;
  status: ModuleStatus;
  dataset: string | null;
  hook: string | null;
  component: string;
  ready: boolean;
  children?: string[];
}

export const MODULE_REGISTRY: ModuleEntry[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    domain: 'dashboard',
    status: 'operativo',
    dataset: 'dashboard',
    hook: null,
    component: 'DashboardIndex',
    ready: true,
  },
  {
    key: 'produccion',
    label: 'Producción',
    route: '/produccion',
    domain: 'produccion',
    status: 'fallback',
    dataset: 'demoProduccion',
    hook: 'useProduccionOverview',
    component: 'ProduccionIndex',
    ready: true,
    children: ['parcelas', 'parcela-detail'],
  },
  {
    key: 'parcelas',
    label: 'Parcelas',
    route: '/produccion/parcelas',
    domain: 'produccion',
    status: 'fallback',
    dataset: 'demoProduccion',
    hook: 'useParcelas',
    component: 'ParcelasListPage',
    ready: true,
  },
  {
    key: 'parcela-detail',
    label: 'Ficha parcela',
    route: '/produccion/parcelas/:id',
    domain: 'produccion',
    status: 'fallback',
    dataset: 'demoParcelHub',
    hook: 'useParcelHubSummaryDemoAware',
    component: 'ParcelDetailPage',
    ready: true,
  },
  {
    key: 'abastecimiento',
    label: 'Abastecimiento',
    route: '/abastecimiento',
    domain: 'abastecimiento',
    status: 'sin_datos',
    dataset: null,
    hook: null,
    component: 'AbastecimientoIndex',
    ready: false,
  },
  {
    key: 'agronomia',
    label: 'Agronomía',
    route: '/agronomia',
    domain: 'agronomia',
    status: 'operativo',
    dataset: null,
    hook: null,
    component: 'AgronomiaIndex',
    ready: true,
    children: ['nutricion', 'guard', 'yield'],
  },
  {
    key: 'nutricion',
    label: 'Nutrición',
    route: '/agronomia/nutricion',
    domain: 'agronomia',
    status: 'fallback',
    dataset: 'demoNutricion',
    hook: 'useNutricionOverview',
    component: 'NutritionOverviewPage',
    ready: true,
  },
  {
    key: 'guard',
    label: 'Nova Guard',
    route: '/agronomia/guard',
    domain: 'agronomia',
    status: 'fallback',
    dataset: 'demoGuard',
    hook: 'useGuardOverview',
    component: 'GuardOverviewPage',
    ready: true,
  },
  {
    key: 'yield',
    label: 'Nova Yield',
    route: '/agronomia/yield',
    domain: 'agronomia',
    status: 'sin_datos',
    dataset: 'demoYield',
    hook: null,
    component: 'YieldOverviewPage',
    ready: false,
  },
  {
    key: 'resiliencia',
    label: 'Resiliencia',
    route: '/resiliencia',
    domain: 'resiliencia',
    status: 'operativo',
    dataset: null,
    hook: null,
    component: 'ResilienciaIndex',
    ready: true,
    children: ['vital'],
  },
  {
    key: 'vital',
    label: 'Protocolo VITAL',
    route: '/resiliencia/vital',
    domain: 'resiliencia',
    status: 'fallback',
    dataset: 'demoVital',
    hook: 'useVitalOverview',
    component: 'VitalOverviewPage',
    ready: true,
  },
  {
    key: 'cumplimiento',
    label: 'Cumplimiento',
    route: '/cumplimiento',
    domain: 'cumplimiento',
    status: 'fallback',
    dataset: 'demoCompliance',
    hook: 'useComplianceOverview',
    component: 'ComplianceHubPage',
    ready: true,
  },
  {
    key: 'calidad',
    label: 'Calidad',
    route: '/calidad',
    domain: 'calidad',
    status: 'operativo',
    dataset: null,
    hook: null,
    component: 'CalidadIndex',
    ready: true,
    children: ['nova-cup'],
  },
  {
    key: 'nova-cup',
    label: 'Nova Cup',
    route: '/calidad/nova-cup',
    domain: 'calidad',
    status: 'fallback',
    dataset: 'demoNovaCup',
    hook: 'useNovaCupOverview',
    component: 'NovaCupOverviewPage',
    ready: true,
  },
  {
    key: 'finanzas',
    label: 'Finanzas',
    route: '/finanzas',
    domain: 'finanzas',
    status: 'sin_datos',
    dataset: null,
    hook: null,
    component: 'FinanceOverviewPage',
    ready: false,
  },
  {
    key: 'jornales',
    label: 'Jornales',
    route: '/produccion/jornales',
    domain: 'produccion',
    status: 'sin_datos',
    dataset: 'demoJornales',
    hook: null,
    component: 'PlaceholderPage',
    ready: false,
  },
  {
    key: 'administracion',
    label: 'Administración',
    route: '/administracion',
    domain: 'administracion',
    status: 'sin_datos',
    dataset: null,
    hook: null,
    component: 'PlaceholderPage',
    ready: false,
  },
  {
    key: 'ayuda',
    label: 'Ayuda',
    route: '/ayuda',
    domain: 'ayuda',
    status: 'sin_datos',
    dataset: null,
    hook: null,
    component: 'PlaceholderPage',
    ready: false,
  },
];

/** Módulos por dominio para agrupar */
export function getModulesByDomain(): Record<string, ModuleEntry[]> {
  const byDomain: Record<string, ModuleEntry[]> = {};
  for (const m of MODULE_REGISTRY) {
    if (!byDomain[m.domain]) byDomain[m.domain] = [];
    byDomain[m.domain].push(m);
  }
  return byDomain;
}

/** Módulo por key */
export function getModuleByKey(key: string): ModuleEntry | undefined {
  return MODULE_REGISTRY.find((m) => m.key === key);
}

/** Health report por dominio */
export function getPageHealthReport(): { domain: string; modules: { key: string; status: ModuleStatus }[] }[] {
  const byDomain = getModulesByDomain();
  return Object.entries(byDomain).map(([domain, modules]) => ({
    domain,
    modules: modules.map((m) => ({ key: m.key, status: m.status })),
  }));
}
