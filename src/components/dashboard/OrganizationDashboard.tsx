/**
 * Unified Organization Dashboard — the "Centro Operativo" for every org type.
 * Assembles dynamic blocks based on useOrgContext: orgTipo, role, activeModules.
 * Replaces all legacy per-role dashboards.
 */
import { useOrgContext } from '@/hooks/useOrgContext';
import { OrgHeader } from './blocks/OrgHeader';
import { KPISection } from './blocks/KPISection';
import { AlertsSection } from './blocks/AlertsSection';
import { ModuleStatusSection } from './blocks/ModuleStatusSection';
import { QuickActionsSection } from './blocks/QuickActionsSection';
import { ActivitySection } from './blocks/ActivitySection';
import { getCooperativaStats, getProductorStats, getExportadorStats } from '@/lib/demo-data';

/** Resolve demo header stats based on role/orgTipo */
function getHeaderStats(role: string | null, orgTipo: string | null) {
  if (role === 'cooperativa' || orgTipo === 'cooperativa') {
    const s = getCooperativaStats();
    return { vitalScore: s.promedioVITAL, eudrStatus: `${s.eudrCompliance}% compliant`, plan: 'Smart' };
  }
  if (role === 'exportador' || orgTipo === 'exportador') {
    const s = getExportadorStats();
    return { vitalScore: undefined, eudrStatus: `${s.eudrCompliance}% compliant`, plan: 'Enterprise' };
  }
  if (role === 'productor') {
    const s = getProductorStats();
    return { vitalScore: s.puntajeVITAL, eudrStatus: undefined, plan: undefined };
  }
  return {};
}

export default function OrganizationDashboard() {
  const { organizationId, role, orgTipo, orgName, activeModules, isLoading } = useOrgContext();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-muted-foreground">Cargando dashboard…</p>
      </div>
    );
  }

  const headerStats = getHeaderStats(role, orgTipo);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header contextual */}
      <OrgHeader
        orgName={orgName}
        orgTipo={orgTipo}
        activeModules={activeModules}
        vitalScore={headerStats.vitalScore}
        eudrStatus={headerStats.eudrStatus}
        plan={headerStats.plan}
      />

      {/* 2. KPIs principales */}
      <KPISection role={role} orgTipo={orgTipo} activeModules={activeModules} />

      {/* 3. Alertas + 4. Estado módulos */}
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
