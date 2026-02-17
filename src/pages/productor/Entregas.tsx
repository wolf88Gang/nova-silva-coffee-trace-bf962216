import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, DollarSign, Package } from 'lucide-react';

const entregas = [
  { id: '1', fecha: '2026-02-10', pesoKg: 460, pesoQQ: 10, tipoCafe: 'Pergamino', precio: 3200, estadoPago: 'pagado' as const },
  { id: '2', fecha: '2026-01-28', pesoKg: 230, pesoQQ: 5, tipoCafe: 'Pergamino', precio: 3100, estadoPago: 'parcial' as const },
  { id: '3', fecha: '2026-01-15', pesoKg: 345, pesoQQ: 7.5, tipoCafe: 'Cereza', precio: 1750, estadoPago: 'pagado' as const },
  { id: '4', fecha: '2025-12-20', pesoKg: 575, pesoQQ: 12.5, tipoCafe: 'Pergamino', precio: 3000, estadoPago: 'pagado' as const },
];

const pagoBadge = (estado: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    pagado: { label: 'Pagado', variant: 'default' },
    pendiente: { label: 'Pendiente', variant: 'destructive' },
    parcial: { label: 'Parcial', variant: 'secondary' },
  };
  const { label, variant } = map[estado] ?? map.pendiente;
  return <Badge variant={variant}>{label}</Badge>;
};

const totalKg = entregas.reduce((s, e) => s + e.pesoKg, 0);
const totalIngresos = entregas.reduce((s, e) => s + e.pesoKg * e.precio / 1000, 0);

export default function Entregas() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Truck className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total entregas</span></div>
          <p className="text-2xl font-bold text-foreground">{entregas.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Peso total</span></div>
          <p className="text-2xl font-bold text-foreground">{totalKg.toLocaleString()} kg</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Ingresos estimados</span></div>
          <p className="text-2xl font-bold text-foreground">Q {totalIngresos.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Historial de Entregas</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4">Fecha</th><th className="pb-2 pr-4">Peso (kg)</th><th className="pb-2 pr-4">qq</th><th className="pb-2 pr-4">Tipo</th><th className="pb-2 pr-4">Precio/kg</th><th className="pb-2">Estado</th>
              </tr></thead>
              <tbody>
                {entregas.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4 text-foreground">{e.fecha}</td>
                    <td className="py-3 pr-4 font-medium text-foreground">{e.pesoKg}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{e.pesoQQ}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{e.tipoCafe}</td>
                    <td className="py-3 pr-4 text-foreground">Q {e.precio.toLocaleString()}</td>
                    <td className="py-3">{pagoBadge(e.estadoPago)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
