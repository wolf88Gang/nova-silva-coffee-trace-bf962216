import { BlockedIngredientsPanel } from '@/components/cumplimiento/BlockedIngredientsPanel';
import { PhaseoutAlertsCard } from '@/components/cumplimiento/PhaseoutAlertsCard';
import { OrgCertificationsManager } from '@/components/cumplimiento/OrgCertificationsManager';
import { OrgExportMarketsManager } from '@/components/cumplimiento/OrgExportMarketsManager';

export default function CumplimientoTab() {
  return (
    <div className="space-y-6 animate-fade-in">
      <p className="text-sm text-muted-foreground">
        El sistema cruza sus certificaciones y mercados de exportación para determinar
        automáticamente qué ingredientes activos están prohibidos o en fase de eliminación.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrgCertificationsManager />
        <OrgExportMarketsManager />
      </div>

      <BlockedIngredientsPanel />

      <PhaseoutAlertsCard />
    </div>
  );
}
