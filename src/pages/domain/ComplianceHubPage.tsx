/**
 * Cumplimiento - EUDR y normativas.
 */
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent } from '@/components/ui/card';
import { EudrSignalBadge } from '@/components/domain/EudrSignalBadge';
import { DemoFallbackBadge } from '@/components/domain/DemoFallbackBadge';
import { useComplianceOverview } from '@/hooks/useComplianceOverview';
import { demoEudrDossiers } from '@/demo/demoCompliance';
import { useDemoContext } from '@/contexts/DemoContext';

export default function ComplianceHubPage() {
  const { data: overview, isFallback } = useComplianceOverview();
  const { org } = useDemoContext();
  const archetype = org?.orgType ?? 'cooperativa';
  const dossiers = isFallback ? demoEudrDossiers(archetype) : [];

  return (
    <>
      <MainHeader
        title="Cumplimiento"
        subtitle="EUDR y señal transversal en lote/proveedor/parcela"
        actions={<DemoFallbackBadge show={isFallback} />}
      />
      <div className="mt-4 space-y-4">
        {overview && (overview.eudr_logs > 0 || overview.certificaciones > 0) && (
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-semibold">{overview.eudr_logs}</p>
                <p className="text-sm text-muted-foreground">Registros EUDR</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-semibold">{overview.certificaciones}</p>
                <p className="text-sm text-muted-foreground">Certificaciones</p>
              </CardContent>
            </Card>
          </div>
        )}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">EUDR</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Señal transversal cuando aplique en lote, proveedor o parcela
            </p>
            <div className="flex gap-2 mb-4">
              <EudrSignalBadge status="compliant" />
              <EudrSignalBadge status="pending" />
              <EudrSignalBadge status="non_compliant" />
            </div>
            {dossiers.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">Lote</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-left p-2">Verificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossiers.map((d, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{d.lote}</td>
                        <td className="p-2">
                          <EudrSignalBadge status={d.estado === 'verde' ? 'compliant' : d.estado === 'rojo' ? 'non_compliant' : 'pending'} />
                        </td>
                        <td className="p-2 text-muted-foreground">{d.fecha_verificacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
