/**
 * Nova Cup - dominio de Calidad.
 * Conectado a lotes, proveedores y oferta.
 */
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Package, Users } from 'lucide-react';
import { useNovaCupOverview } from '@/hooks/useNovaCupOverview';
import { DemoFallbackBadge } from '@/components/domain/DemoFallbackBadge';
import { demoMuestrasDestacadas } from '@/demo/demoNovaCup';
import { useDemoContext } from '@/contexts/DemoContext';

export default function NovaCupOverviewPage() {
  const { data: overview, isFallback } = useNovaCupOverview();
  const { org } = useDemoContext();
  const archetype = org?.orgType ?? 'cooperativa';
  const muestras = isFallback ? demoMuestrasDestacadas(archetype) : [];

  return (
    <>
      <MainHeader
        title="Nova Cup"
        subtitle="Calidad conectada a lotes, proveedores y oferta"
        actions={<DemoFallbackBadge show={isFallback} />}
      />
      <div className="mt-4 space-y-4">
        {overview && overview.snapshots > 0 && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold">{overview.snapshots}</p>
              <p className="text-sm text-muted-foreground">Muestras evaluadas</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Nova Cup</h3>
                <p className="text-sm text-muted-foreground">
                  Dominio de Calidad
                </p>
              </div>
            </div>
            <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Lotes
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Proveedores
              </span>
              <span>Oferta</span>
            </div>
            {muestras.length > 0 && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">Lote</th>
                      <th className="text-left p-2">Puntaje</th>
                      <th className="text-left p-2">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {muestras.map((m, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{m.lote}</td>
                        <td className="p-2 font-medium">{m.puntaje}</td>
                        <td className="p-2 text-muted-foreground">{m.notas}</td>
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
