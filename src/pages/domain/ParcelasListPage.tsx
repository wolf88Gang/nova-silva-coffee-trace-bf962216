/**
 * Lista de parcelas (demo).
 */
import { Link } from 'react-router-dom';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent } from '@/components/ui/card';
import { DEMO_PARCELAS } from '@/config/demoParcelas';
import { MapPin, ArrowRight } from 'lucide-react';

export default function ParcelasListPage() {
  return (
    <>
      <MainHeader title="Parcelas" subtitle="Selecciona una parcela para ver su ficha" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {DEMO_PARCELAS.map((p) => (
          <Link key={p.id} to={`/produccion/parcelas/${p.id}`}>
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.productorName}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
