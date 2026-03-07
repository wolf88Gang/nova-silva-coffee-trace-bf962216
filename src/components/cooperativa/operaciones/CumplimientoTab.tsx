import OrgCertificationsManager from '@/components/cumplimiento/OrgCertificationsManager';
import OrgExportMarketsManager from '@/components/cumplimiento/OrgExportMarketsManager';
import BlockedIngredientsPanel from '@/components/cumplimiento/BlockedIngredientsPanel';
import PhaseoutAlertsCard from '@/components/cumplimiento/PhaseoutAlertsCard';

export default function CumplimientoTab() {
  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          El sistema cruza sus certificaciones y mercados de exportación para determinar automáticamente qué ingredientes activos están prohibidos o en fase de eliminación.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OrgCertificationsManager />
        <OrgExportMarketsManager />
      </div>

      <BlockedIngredientsPanel />
      <PhaseoutAlertsCard />
    </div>
  );
}
