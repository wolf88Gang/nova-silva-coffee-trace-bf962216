/**
 * Índice del dominio Finanzas.
 */
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function FinanzasIndex() {
  return (
    <>
      <MainHeader title="Finanzas" subtitle="Gestión financiera" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span>Resumen</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vista general financiera
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
