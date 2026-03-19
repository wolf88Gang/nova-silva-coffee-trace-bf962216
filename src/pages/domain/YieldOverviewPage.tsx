/**
 * Nova Yield - estimaciones y rendimiento.
 * Muestra contexto de Nutrición y Guard.
 */
import { useSearchParams, Link } from 'react-router-dom';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, FlaskConical, Bug, ArrowLeft } from 'lucide-react';

export default function YieldOverviewPage() {
  const [searchParams] = useSearchParams();
  const parcelaId = searchParams.get('parcela');

  return (
    <>
      <MainHeader
        title="Nova Yield"
        subtitle={parcelaId ? `Contexto: Parcela ${parcelaId}` : 'Estimaciones y rendimiento'}
      />
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
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Nova Yield</h3>
                <p className="text-sm text-muted-foreground">
                  Estimaciones con contexto de Nutrición y Guard
                </p>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <Link
                to={parcelaId ? `/agronomia/nutricion?parcela=${parcelaId}` : '/agronomia/nutricion'}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <FlaskConical className="h-4 w-4" />
                Nutrición
              </Link>
              <Link
                to={parcelaId ? `/agronomia/guard?parcela=${parcelaId}` : '/agronomia/guard'}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Bug className="h-4 w-4" />
                Nova Guard
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Módulo en implementación. Los datos se conectarán próximamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
