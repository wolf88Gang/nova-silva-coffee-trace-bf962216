/**
 * Nutrición - contexto de parcela.
 * Puede mostrar alertas de Guard cuando aplique.
 */
import { useSearchParams, Link } from 'react-router-dom';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent } from '@/components/ui/card';
import { FlaskConical, Bug, ArrowLeft } from 'lucide-react';
import { useNutricionOverview } from '@/hooks/useNutricionOverview';
import { DemoFallbackBadge } from '@/components/domain/DemoFallbackBadge';
import { demoPlanesActivos } from '@/demo/demoNutricion';
import { useDemoContext } from '@/contexts/DemoContext';

export default function NutritionOverviewPage() {
  const [searchParams] = useSearchParams();
  const parcelaId = searchParams.get('parcela');
  const { data: overview, isFallback } = useNutricionOverview();
  const { org } = useDemoContext();
  const archetype = org?.orgType ?? 'cooperativa';
  const planes = isFallback ? demoPlanesActivos(archetype) : [];

  return (
    <>
      <MainHeader
        title="Nutrición"
        subtitle={parcelaId ? `Contexto: Parcela ${parcelaId}` : 'Plan nutricional'}
        actions={<DemoFallbackBadge show={isFallback} />}
      />
      {overview && (overview.planes > 0 || overview.aplicaciones > 0) && (
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold">{overview.planes}</p>
              <p className="text-sm text-muted-foreground">Planes activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold">{overview.aplicaciones}</p>
              <p className="text-sm text-muted-foreground">Aplicaciones</p>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="mt-4 space-y-4">
        {parcelaId && (
          <Link
            to={`/produccion/parcelas/${parcelaId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a ficha de parcela
          </Link>
        )}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <FlaskConical className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Motor científico de Nutrición</h3>
                <p className="text-sm text-muted-foreground">
                  Recomendaciones y plan nutricional por parcela
                </p>
              </div>
            </div>
            {planes.length > 0 && (
              <div className="border rounded-lg overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">Parcela</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-left p-2">Última aplicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planes.map((p, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{p.parcela_nombre}</td>
                        <td className="p-2">{p.estado}</td>
                        <td className="p-2 text-muted-foreground">{p.ultima_aplicacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Módulo en implementación. Los datos se conectarán próximamente.
            </p>
          </CardContent>
        </Card>
        {parcelaId && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Bug className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-medium">Alertas Nova Guard</h3>
                  <p className="text-sm text-muted-foreground">
                    Las alertas de sanidad se mostrarán aquí cuando existan
                  </p>
                </div>
                <Link
                  to={`/agronomia/guard?parcela=${parcelaId}`}
                  className="ml-auto text-sm text-primary hover:underline"
                >
                  Ver Guard →
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
