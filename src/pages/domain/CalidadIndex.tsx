/**
 * Índice del dominio Calidad.
 */
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Award } from 'lucide-react';

export default function CalidadIndex() {
  return (
    <>
      <MainHeader title="Calidad" subtitle="Nova Cup y trazabilidad de calidad" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <Link to="/calidad/nova-cup">
          <Card className="hover:border-primary/50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span>Nova Cup</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Conectado a lotes, proveedores y oferta
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
