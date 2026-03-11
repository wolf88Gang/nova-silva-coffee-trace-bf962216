/**
 * Admin Module Explorer — Internal QA tool for platform administrators.
 * Shows all registered modules, routes, health status, and data connectivity.
 * Only accessible to admin role users.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MODULE_REGISTRY, type ModuleDefinition } from '@/modules/registry';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  CheckCircle, AlertTriangle, XCircle, ChevronRight,
  Database, Route as RouteIcon, Eye, EyeOff, Layers,
  BarChart3, Search, Package, Shield, Info,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// ── Route health definitions ──
// Maps every app route to its data readiness status

type RouteHealth = 'operational' | 'demo_fallback' | 'no_data' | 'placeholder';

interface RouteEntry {
  path: string;
  label: string;
  domain: string;
  moduleId?: string;
  health: RouteHealth;
  dataSource: string;
  queryHook: string;
  notes?: string;
}

/**
 * Static route registry with health assessments.
 * This is the source of truth for page-level diagnostics.
 */
const ROUTE_HEALTH: RouteEntry[] = [
  // Producción
  { path: '/produccion', label: 'Resumen Producción', domain: 'Producción', moduleId: 'core', health: 'demo_fallback', dataSource: 'v_produccion_overview', queryHook: 'useViewData', notes: 'Usa datos demo' },
  { path: '/produccion/productores', label: 'Productores', domain: 'Producción', moduleId: 'core_actors', health: 'demo_fallback', dataSource: 'productores', queryHook: 'useViewData', notes: 'Mock data activo' },
  { path: '/produccion/parcelas', label: 'Parcelas', domain: 'Producción', moduleId: 'core_plots', health: 'demo_fallback', dataSource: 'parcelas', queryHook: 'useViewData' },
  { path: '/produccion/cultivos', label: 'Cultivos', domain: 'Producción', moduleId: 'core', health: 'no_data', dataSource: 'cultivos', queryHook: '—', notes: 'Sin dataset ni query' },
  { path: '/produccion/entregas', label: 'Entregas', domain: 'Producción', moduleId: 'core_deliveries', health: 'demo_fallback', dataSource: 'entregas', queryHook: 'useViewData' },
  { path: '/produccion/documentos', label: 'Documentos', domain: 'Producción', health: 'placeholder', dataSource: '—', queryHook: '—', notes: 'Página placeholder' },

  // Abastecimiento
  { path: '/abastecimiento', label: 'Abastecimiento Index', domain: 'Abastecimiento', health: 'demo_fallback', dataSource: 'proveedores', queryHook: 'useViewData' },
  { path: '/abastecimiento/recepcion', label: 'Recepción', domain: 'Abastecimiento', health: 'no_data', dataSource: 'recepciones', queryHook: '—', notes: 'UI lista, sin query' },
  { path: '/abastecimiento/compras', label: 'Compras y lotes', domain: 'Abastecimiento', health: 'no_data', dataSource: 'compras_lotes', queryHook: '—' },
  { path: '/abastecimiento/evidencias', label: 'Evidencias proveedor', domain: 'Abastecimiento', health: 'no_data', dataSource: '—', queryHook: '—' },
  { path: '/abastecimiento/riesgo', label: 'Riesgo de origen', domain: 'Abastecimiento', health: 'no_data', dataSource: 'riesgo_origen', queryHook: '—' },

  // Orígenes
  { path: '/origenes', label: 'Orígenes', domain: 'Orígenes', health: 'demo_fallback', dataSource: 'proveedores', queryHook: 'useViewData' },

  // Agronomía
  { path: '/agronomia', label: 'Agronomía Index', domain: 'Agronomía', health: 'demo_fallback', dataSource: 'v_guard_overview', queryHook: 'useViewData' },
  { path: '/agronomia/nutricion', label: 'Nutrición Dashboard', domain: 'Agronomía', moduleId: 'nutrition', health: 'demo_fallback', dataSource: 'nutricion_planes', queryHook: 'useViewData' },
  { path: '/agronomia/guard', label: 'Nova Guard', domain: 'Agronomía', moduleId: 'nova_guard', health: 'demo_fallback', dataSource: 'disease_assessments', queryHook: 'useViewData' },
  { path: '/agronomia/yield', label: 'Nova Yield', domain: 'Agronomía', health: 'demo_fallback', dataSource: 'yield_estimates', queryHook: 'useViewData' },
  { path: '/agronomia/alertas', label: 'Alertas Agronomía', domain: 'Agronomía', health: 'demo_fallback', dataSource: 'alertas', queryHook: 'useAgroAlerts' },

  // Analítica
  { path: '/analitica', label: 'Analítica Agronómica', domain: 'Analítica', health: 'demo_fallback', dataSource: 'analytics_views', queryHook: 'useViewData' },

  // Inventario
  { path: '/operaciones/inventario', label: 'Inventario', domain: 'Operaciones', moduleId: 'inventory', health: 'no_data', dataSource: 'inventario', queryHook: '—', notes: 'Sin dataset' },

  // Insumos
  { path: '/insumos/proveedores', label: 'Proveedores Insumos', domain: 'Insumos', health: 'no_data', dataSource: 'ag_suppliers', queryHook: '—' },
  { path: '/insumos/catalogo', label: 'Catálogo Insumos', domain: 'Insumos', health: 'no_data', dataSource: 'ag_fertilizers', queryHook: '—' },

  // Jornales
  { path: '/jornales', label: 'Jornales', domain: 'Jornales', moduleId: 'labor_jornales', health: 'demo_fallback', dataSource: 'jornales', queryHook: 'useViewData' },

  // Resiliencia
  { path: '/resiliencia/vital', label: 'Protocolo VITAL', domain: 'Resiliencia', moduleId: 'vital_clima', health: 'demo_fallback', dataSource: 'v_vital_overview', queryHook: 'useViewData' },

  // Cumplimiento
  { path: '/cumplimiento', label: 'Cumplimiento Index', domain: 'Cumplimiento', health: 'demo_fallback', dataSource: 'v_compliance_overview', queryHook: 'useViewData' },
  { path: '/cumplimiento/trazabilidad', label: 'Trazabilidad', domain: 'Cumplimiento', health: 'no_data', dataSource: 'trazabilidad', queryHook: '—', notes: 'UI lista, sin datos' },
  { path: '/cumplimiento/lotes', label: 'Lotes Cumplimiento', domain: 'Cumplimiento', health: 'no_data', dataSource: 'lotes_cumplimiento', queryHook: '—' },
  { path: '/cumplimiento/eudr', label: 'EUDR', domain: 'Cumplimiento', moduleId: 'eudr', health: 'demo_fallback', dataSource: 'paquetes_eudr', queryHook: 'useViewData' },
  { path: '/cumplimiento/data-room', label: 'Data Room', domain: 'Cumplimiento', health: 'placeholder', dataSource: '—', queryHook: '—' },

  // Calidad
  { path: '/calidad', label: 'Calidad / Nova Cup', domain: 'Calidad', moduleId: 'quality_cupping', health: 'demo_fallback', dataSource: 'v_novacup_overview', queryHook: 'useViewData' },

  // Comercial
  { path: '/comercial', label: 'Comercial Index', domain: 'Comercial', moduleId: 'exporter_trade', health: 'demo_fallback', dataSource: 'lotes_comerciales', queryHook: 'useViewData' },
  { path: '/comercial/lotes', label: 'Lotes Comerciales', domain: 'Comercial', health: 'demo_fallback', dataSource: 'lotes_comerciales', queryHook: 'useLotesComerciales' },
  { path: '/comercial/contratos', label: 'Contratos', domain: 'Comercial', health: 'demo_fallback', dataSource: 'contratos', queryHook: 'useContratos' },

  // Finanzas
  { path: '/finanzas', label: 'Finanzas Index', domain: 'Finanzas', moduleId: 'finance', health: 'demo_fallback', dataSource: 'finanzas', queryHook: 'useViewData' },
  { path: '/finanzas/panel', label: 'Panel Finanzas', domain: 'Finanzas', health: 'demo_fallback', dataSource: 'finanzas', queryHook: 'useViewData' },
  { path: '/finanzas/creditos', label: 'Créditos', domain: 'Finanzas', moduleId: 'credits', health: 'demo_fallback', dataSource: 'creditos', queryHook: 'useViewData' },
  { path: '/finanzas/facturacion', label: 'Facturación', domain: 'Finanzas', health: 'operational', dataSource: 'billing_subscriptions', queryHook: 'useViewData', notes: 'Solo lectura' },

  // Admin
  { path: '/admin/usuarios', label: 'Usuarios Org', domain: 'Admin', health: 'operational', dataSource: 'organizacion_usuarios', queryHook: 'useOrganizacionUsuarios' },
  { path: '/admin/organizacion', label: 'Directorio', domain: 'Admin', health: 'demo_fallback', dataSource: 'platform_organizations', queryHook: 'useViewData' },
];

// ── Health helpers ──

const HEALTH_CONFIG: Record<RouteHealth, { label: string; color: string; icon: typeof CheckCircle }> = {
  operational: { label: 'Operativo', color: 'text-emerald-400', icon: CheckCircle },
  demo_fallback: { label: 'Demo / Fallback', color: 'text-amber-400', icon: AlertTriangle },
  no_data: { label: 'Sin datos', color: 'text-red-400', icon: XCircle },
  placeholder: { label: 'Placeholder', color: 'text-muted-foreground', icon: EyeOff },
};

function HealthBadge({ health }: { health: RouteHealth }) {
  const cfg = HEALTH_CONFIG[health];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', cfg.color)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Module health summary ──

interface ModuleHealth {
  module: ModuleDefinition;
  routes: RouteEntry[];
  overallHealth: RouteHealth;
  routeCount: number;
  operationalCount: number;
  demoCount: number;
  noDataCount: number;
}

function computeModuleHealth(): ModuleHealth[] {
  return MODULE_REGISTRY.filter(m => m.id !== 'platform_admin').map(mod => {
    const routes = ROUTE_HEALTH.filter(r => r.moduleId === mod.id);
    const operationalCount = routes.filter(r => r.health === 'operational').length;
    const demoCount = routes.filter(r => r.health === 'demo_fallback').length;
    const noDataCount = routes.filter(r => r.health === 'no_data' || r.health === 'placeholder').length;

    let overallHealth: RouteHealth = 'operational';
    if (noDataCount > 0) overallHealth = 'no_data';
    else if (demoCount > 0) overallHealth = 'demo_fallback';
    if (routes.length === 0) overallHealth = 'demo_fallback'; // no mapped routes

    return { module: mod, routes, overallHealth, routeCount: routes.length, operationalCount, demoCount, noDataCount };
  });
}

// ── Main component ──

export default function AdminModuleExplorer() {
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [tab, setTab] = useState('health');

  const moduleHealth = useMemo(computeModuleHealth, []);
  const allDomains = useMemo(() => [...new Set(ROUTE_HEALTH.map(r => r.domain))], []);

  // Stats
  const totalRoutes = ROUTE_HEALTH.length;
  const opCount = ROUTE_HEALTH.filter(r => r.health === 'operational').length;
  const demoCount = ROUTE_HEALTH.filter(r => r.health === 'demo_fallback').length;
  const noDataCount = ROUTE_HEALTH.filter(r => r.health === 'no_data').length;
  const placeholderCount = ROUTE_HEALTH.filter(r => r.health === 'placeholder').length;

  const filteredRoutes = useMemo(() => {
    let routes = ROUTE_HEALTH;
    if (search) {
      const q = search.toLowerCase();
      routes = routes.filter(r =>
        r.label.toLowerCase().includes(q) ||
        r.path.toLowerCase().includes(q) ||
        r.domain.toLowerCase().includes(q) ||
        r.dataSource.toLowerCase().includes(q)
      );
    }
    if (selectedModule) {
      routes = routes.filter(r => r.moduleId === selectedModule);
    }
    return routes;
  }, [search, selectedModule]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          Module Explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Diagnóstico interno de rutas, módulos, datasets y conectividad de datos.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Rutas totales" value={totalRoutes} icon={RouteIcon} />
        <StatCard label="Operativas" value={opCount} icon={CheckCircle} className="text-emerald-400" />
        <StatCard label="Demo / Fallback" value={demoCount} icon={AlertTriangle} className="text-amber-400" />
        <StatCard label="Sin datos" value={noDataCount} icon={XCircle} className="text-red-400" />
        <StatCard label="Placeholder" value={placeholderCount} icon={EyeOff} className="text-muted-foreground" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="health">Page Health</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="domains">Por Dominio</TabsTrigger>
        </TabsList>

        {/* ── Tab: Page Health ── */}
        <TabsContent value="health" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar ruta, módulo o dataset..."
                className="pl-9"
              />
            </div>
            {selectedModule && (
              <button onClick={() => setSelectedModule(null)} className="text-xs text-primary hover:underline">
                Limpiar filtro de módulo
              </button>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Ruta</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Dataset</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Query</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Notas</th>
                    <th className="px-4 py-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.map(route => (
                    <tr key={route.path} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <div>
                          <span className="font-medium text-foreground">{route.label}</span>
                          <span className="block text-[10px] text-muted-foreground font-mono">{route.path}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><HealthBadge health={route.health} /></td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{route.dataSource}</code>
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell">
                        <code className="text-[10px] text-muted-foreground">{route.queryHook}</code>
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-muted-foreground">{route.notes || '—'}</td>
                      <td className="px-4 py-2.5">
                        <Link to={route.path} className="text-primary hover:text-primary/80">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Modules ── */}
        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {moduleHealth.map(mh => {
              const Icon = mh.module.icon;
              return (
                <Card
                  key={mh.module.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md border',
                    selectedModule === mh.module.id ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                  )}
                  onClick={() => {
                    setSelectedModule(selectedModule === mh.module.id ? null : mh.module.id);
                    setTab('health');
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{mh.module.label}</h3>
                          <p className="text-[10px] text-muted-foreground">{mh.module.id}</p>
                        </div>
                      </div>
                      <HealthBadge health={mh.overallHealth} />
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">{mh.module.description}</p>

                    <div className="flex items-center gap-4 text-[10px]">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <RouteIcon className="h-3 w-3" /> {mh.routeCount} rutas
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Database className="h-3 w-3" /> {mh.module.dataResources.length} recursos
                      </span>
                      {mh.module.flags.length > 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Shield className="h-3 w-3" /> flag
                        </span>
                      )}
                    </div>

                    {mh.module.dependsOn.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {mh.module.dependsOn.map(dep => (
                          <span key={dep} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            dep: {dep}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Data resources */}
                    <div className="mt-3 pt-2 border-t border-border/50">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Recursos de datos</p>
                      <div className="flex flex-wrap gap-1">
                        {mh.module.dataResources.map(res => (
                          <code key={res} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground">
                            {res}
                          </code>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Tab: By Domain ── */}
        <TabsContent value="domains" className="space-y-6">
          {allDomains.map(domain => {
            const domainRoutes = ROUTE_HEALTH.filter(r => r.domain === domain);
            const opCount = domainRoutes.filter(r => r.health === 'operational').length;
            const demoCount = domainRoutes.filter(r => r.health === 'demo_fallback').length;
            const failCount = domainRoutes.filter(r => r.health === 'no_data' || r.health === 'placeholder').length;

            return (
              <Card key={domain} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{domain}</CardTitle>
                    <div className="flex items-center gap-3 text-xs">
                      {opCount > 0 && <span className="text-emerald-400">✔ {opCount}</span>}
                      {demoCount > 0 && <span className="text-amber-400">⚠ {demoCount}</span>}
                      {failCount > 0 && <span className="text-red-400">✘ {failCount}</span>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {domainRoutes.map(route => (
                      <div key={route.path} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <HealthBadge health={route.health} />
                          <Link to={route.path} className="text-xs text-foreground hover:text-primary truncate">{route.label}</Link>
                          <code className="text-[9px] text-muted-foreground hidden sm:inline">{route.path}</code>
                        </div>
                        <code className="text-[9px] text-muted-foreground shrink-0 hidden md:inline">{route.dataSource}</code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <Card className="border-border bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Leyenda de estados</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-muted-foreground"><strong className="text-foreground">Operativo</strong> — Conectado a datos reales o vistas</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-muted-foreground"><strong className="text-foreground">Demo / Fallback</strong> — Funciona con datos mock</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-muted-foreground"><strong className="text-foreground">Sin datos</strong> — UI existe pero no hay dataset ni query</span>
            </div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground"><strong className="text-foreground">Placeholder</strong> — Página genérica temporal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Stat card ──

function StatCard({ label, value, icon: Icon, className }: { label: string; value: number; icon: typeof CheckCircle; className?: string }) {
  return (
    <Card className="border-border">
      <CardContent className="p-3 flex items-center gap-3">
        <Icon className={cn('h-5 w-5', className || 'text-primary')} />
        <div>
          <p className="text-lg font-bold text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
