/**
 * Índice del dominio Producción.
 */
import { Link } from 'react-router-dom';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin, Sprout } from 'lucide-react';
import { useProduccionOverview } from '@/hooks/useProduccionOverview';
import { DemoFallbackBadge } from '@/components/domain/DemoFallbackBadge';

export default function ProduccionIndex() {
  const { data: overview, isFallback } = useProduccionOverview();

  return (
    <>
      <MainHeader
        title="Producción"
        subtitle="Parcelas, lotes y trazabilidad"
        actions={<DemoFallbackBadge show={isFallback} />}
      />
      {overview && (overview.productores > 0 || overview.parcelas > 0) && (
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold">{overview.productores}</p>
              <p className="text-sm text-muted-foreground">Productores</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold">{overview.parcelas}</p>
              <p className="text-sm text-muted-foreground">Parcelas</p>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <Link to="/produccion/parcelas">
          <Card className="hover:border-primary/50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Parcelas</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gestión de parcelas y ficha de parcela como hub central
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card className="opacity-75">
          <CardHeader className="flex flex-row items-center gap-2">
            <Sprout className="h-5 w-5 text-muted-foreground" />
            <span>Lotes</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Próximamente</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
