/**
 * Índice del dominio Abastecimiento.
 */
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function AbastecimientoIndex() {
  return (
    <>
      <MainHeader title="Abastecimiento" subtitle="Origen y compras" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span>Proveedores y lotes</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gestión de abastecimiento
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
