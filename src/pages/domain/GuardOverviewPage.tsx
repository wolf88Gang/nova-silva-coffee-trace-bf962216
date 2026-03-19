/**
 * Nova Guard - alertas y sanidad.
 * Contexto de parcela/productor/lote.
 */
import { useSearchParams, Link } from 'react-router-dom';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Bug, ArrowLeft } from 'lucide-react';

export default function GuardOverviewPage() {
  const [searchParams] = useSearchParams();
  const parcelaId = searchParams.get('parcela');

  return (
    <>
      <MainHeader
        title="Nova Guard"
        subtitle={parcelaId ? `Contexto: Parcela ${parcelaId}` : 'Alertas y sanidad vegetal'}
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
              <Bug className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Nova Guard</h3>
                <p className="text-sm text-muted-foreground">
                  Alertas de sanidad vegetal integradas con Nutrición y Yield
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Módulo en implementación. Los datos se conectarán próximamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
