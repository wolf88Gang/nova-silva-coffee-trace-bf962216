/**
 * Unified Organization Dashboard — the "Centro Operativo" for every org type.
 * Assembles dynamic blocks based on useOrgContext: orgTipo, role, activeModules.
 * In demo mode, always shows rich content — never an empty state.
 */
import { useOrgContext } from '@/hooks/useOrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { OrgHeader } from './blocks/OrgHeader';
import { KPISection } from './blocks/KPISection';
import { AlertsSection } from './blocks/AlertsSection';
import { ModuleStatusSection } from './blocks/ModuleStatusSection';
import { QuickActionsSection } from './blocks/QuickActionsSection';
import { ActivitySection } from './blocks/ActivitySection';
import { ChartsSection } from './blocks/ChartsSection';
import { getDemoStats } from '@/lib/demoSeed';
import { getDashboardKPIs, getDashboardAlerts, getDashboardActivity } from '@/lib/demoSeedData';
import { getDemoConfig } from '@/hooks/useDemoConfig';
import { getActorLabels } from '@/lib/terminology';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, AlertTriangle, Activity } from 'lucide-react';

/** Resolve demo header stats based on orgTipo + activeModules */
function getHeaderStats(orgTipo: string | null, modules: import('@/lib/org-modules').OrgModule[]) {
  const s = getDemoStats(orgTipo, modules);
  const demoKPIs = getDashboardKPIs();
  // In demo mode, always show values
  const isDemo = !!getDemoConfig();
  const totalActores = isDemo
    ? (demoKPIs.kpi1?.value ?? s.totalActores)
    : s.totalActores;
  return {
    vitalScore: s.promedioVITAL > 0 ? s.promedioVITAL : (isDemo ? 68 : undefined),
    eudrStatus: s.eudrCompliance > 0 ? `${s.eudrCompliance}% compliant` : (isDemo ? '92% compliant' : undefined),
    plan: orgTipo === 'cooperativa' ? 'Smart' : orgTipo === 'exportador' ? 'Enterprise' : undefined,
    totalActores: typeof totalActores === 'number' ? totalActores : (isDemo ? 220 : 0),
  };
}

const alertTypeColors: Record<string, string> = {
  warning: 'bg-warning/10 border-warning/20 text-warning',
  destructive: 'bg-destructive/10 border-destructive/20 text-destructive',
  info: 'bg-accent/10 border-accent/20 text-accent',
};

const alertDotColors: Record<string, string> = {
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-accent',
};

export default function OrganizationDashboard() {
  const { organizationId, role, orgTipo, orgName, activeModules, isLoading } = useOrgContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDemo = !!getDemoConfig();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-muted-foreground">Cargando dashboard…</p>
      </div>
    );
  }

  const headerStats = getHeaderStats(orgTipo, activeModules);
  const actorLabels = getActorLabels(orgTipo);

  // Only show empty state for non-demo users with no data
  if (!isDemo && headerStats.totalActores === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <OrgHeader
          orgName={orgName}
          orgTipo={orgTipo}
          activeModules={activeModules}
          userName={user?.name}
        />
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <PlusCircle className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <h2 className="text-lg font-semibold text-foreground">
              Tu organización aún no tiene datos
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Puedes comenzar creando tu primer {actorLabels.singular.toLowerCase()} para empezar a gestionar tu operación.
            </p>
            <Button onClick={() => {
              const actorsRoute = role === 'exportador' ? '/exportador/proveedores' : '/cooperativa/productores-hub';
              navigate(actorsRoute);
            }}>
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Crear primer {actorLabels.singular.toLowerCase()}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Demo-aware dashboard alerts and activity
  const demoAlerts = isDemo ? getDashboardAlerts() : [];
  const demoActivity = isDemo ? getDashboardActivity() : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Demo badge */}
      {isDemo && (
        <div className="flex justify-end">
          <DemoBadge />
        </div>
      )}

      {/* 1. Header contextual */}
      <OrgHeader
        orgName={orgName}
        orgTipo={orgTipo}
        activeModules={activeModules}
        userName={user?.name}
        vitalScore={headerStats.vitalScore}
        eudrStatus={headerStats.eudrStatus}
        plan={headerStats.plan}
      />

      {/* 2. KPIs principales */}
      <KPISection role={role} orgTipo={orgTipo} activeModules={activeModules} />

      {/* 3. Charts — role-specific visualizations */}
      <ChartsSection role={role} activeModules={activeModules} />

      {/* 4. Demo-enriched alerts + Module status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ModuleStatusSection activeModules={activeModules} />
        </div>
        {demoAlerts.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Alertas activas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {demoAlerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${alertTypeColors[a.tipo] || 'bg-muted/50'}`}>
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${alertDotColors[a.tipo] || 'bg-muted-foreground'}`} />
                  <div className="min-w-0">
                    <p className="text-sm">{a.texto}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.modulo}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <AlertsSection activeModules={activeModules} role={role} />
        )}
      </div>

      {/* 5. Acciones rápidas */}
      <QuickActionsSection role={role} orgTipo={orgTipo} activeModules={activeModules} />

      {/* 6. Actividad reciente — demo enriched */}
      {demoActivity.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {demoActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{a.texto}</p>
                    <p className="text-xs text-muted-foreground">{a.fecha}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{a.modulo}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <ActivitySection role={role} activeModules={activeModules} />
      )}
    </div>
  );
}
