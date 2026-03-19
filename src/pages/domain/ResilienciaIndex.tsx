/**
 * Índice del dominio Resiliencia.
 */
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function ResilienciaIndex() {
  return (
    <>
      <MainHeader title="Resiliencia" subtitle="Protocolo VITAL y adaptación climática" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <Link to="/resiliencia/vital">
          <Card className="hover:border-primary/50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Protocolo VITAL</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Resiliencia climática y trazabilidad
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
