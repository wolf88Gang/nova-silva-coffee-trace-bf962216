/**
 * Finanzas - vista general.
 */
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function FinanceOverviewPage() {
  return (
    <>
      <MainHeader title="Finanzas" subtitle="Gestión financiera" />
      <div className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Finanzas</h3>
                <p className="text-sm text-muted-foreground">
                  Vista general del dominio financiero
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
