/**
 * Índice del dominio Cumplimiento.
 */
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileCheck, Globe } from 'lucide-react';

export default function CumplimientoIndex() {
  return (
    <>
      <MainHeader title="Cumplimiento" subtitle="EUDR y normativas" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <span>EUDR</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Señal transversal en lote/proveedor/parcela cuando aplique
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <FileCheck className="h-5 w-5 text-muted-foreground" />
            <span>Normativas</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Próximamente</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
