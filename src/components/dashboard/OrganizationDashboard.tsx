/**
 * Unified Organization Dashboard — the "Centro Operativo" for every org type.
 * Assembles dynamic blocks based on useOrgContext: orgTipo, role, activeModules.
 * Replaces all legacy per-role dashboards.
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
import { getActorLabels } from '@/lib/terminology';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

/** Resolve demo header stats based on orgTipo + activeModules */
function getHeaderStats(orgTipo: string | null, modules: import('@/lib/org-modules').OrgModule[]) {
  const s = getDemoStats(orgTipo, modules);
  return {
    vitalScore: s.promedioVITAL > 0 ? s.promedioVITAL : undefined,
    eudrStatus: s.eudrCompliance > 0 ? `${s.eudrCompliance}% compliant` : undefined,
    plan: orgTipo === 'cooperativa' ? 'Smart' : orgTipo === 'exportador' ? 'Enterprise' : undefined,
    totalActores: s.totalActores,
  };
}

export default function OrganizationDashboard() {
  const { organizationId, role, orgTipo, orgName, activeModules, isLoading } = useOrgContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-muted-foreground">Cargando dashboard…</p>
      </div>
    );
  }

  const headerStats = getHeaderStats(orgTipo, activeModules);
  const actorLabels = getActorLabels(orgTipo);

  // Empty state — no data yet
  if (headerStats.totalActores === 0) {
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

  return (
    <div className="space-y-6 animate-fade-in">
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

      {/* 4. Alertas + Estado módulos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ModuleStatusSection activeModules={activeModules} />
        </div>
        <AlertsSection activeModules={activeModules} role={role} />
      </div>

      {/* 5. Acciones rápidas */}
      <QuickActionsSection role={role} orgTipo={orgTipo} activeModules={activeModules} />

      {/* 6. Actividad reciente */}
      <ActivitySection role={role} activeModules={activeModules} />
    </div>
  );
}
