/**
 * Protocolo VITAL - capa de resiliencia contextual.
 */
import { useSearchParams, Link } from 'react-router-dom';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function VitalOverviewPage() {
  const [searchParams] = useSearchParams();
  const parcelaId = searchParams.get('parcela');

  return (
    <>
      <MainHeader
        title="Protocolo VITAL"
        subtitle={parcelaId ? `Contexto: Parcela ${parcelaId}` : 'Resiliencia climática'}
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
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Protocolo VITAL</h3>
                <p className="text-sm text-muted-foreground">
                  Capa de resiliencia climática contextual a parcelas
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
