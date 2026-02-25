import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Boxes, AlertTriangle, Wallet } from 'lucide-react';

const kpis = [
  { label: 'Total Insumos', value: '24', icon: Boxes, color: '' },
  { label: 'Alertas Stock Bajo', value: '3', icon: AlertTriangle, color: 'text-destructive' },
  { label: 'Valor Inventario', value: '$8,500,000 COP', icon: Wallet, color: '' },
];

const insumos = [
  { producto: 'Fertilizante 18-5-15-6-2(MgO-S)', cat: 'Fertilizantes', stock: 45, minimo: 20, unidad: 'sacos (50 kg)', estado: 'ok' },
  { producto: 'Caldo bordelés (cobre orgánico)', cat: 'Fungicidas', stock: 12, minimo: 15, unidad: 'litros', estado: 'bajo' },
  { producto: 'Beauveria bassiana', cat: 'Biocontrol', stock: 3, minimo: 10, unidad: 'litros', estado: 'critico' },
  { producto: 'Machetes marca Tramontina', cat: 'Herramientas', stock: 18, minimo: 5, unidad: 'unidades', estado: 'ok' },
  { producto: 'Sacos de yute exportación', cat: 'Empaque', stock: 200, minimo: 100, unidad: 'unidades', estado: 'ok' },
  { producto: 'Cal dolomita', cat: 'Enmiendas', stock: 8, minimo: 10, unidad: 'sacos (25 kg)', estado: 'bajo' },
];

const estadoBadge = (e: string) => {
  if (e === 'ok') return <Badge className="bg-emerald-500 text-white border-0">OK</Badge>;
  if (e === 'bajo') return <Badge className="bg-amber-500 text-white border-0">Bajo</Badge>;
  return <Badge variant="destructive">Crítico</Badge>;
};

export default function InventarioTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Control de insumos y materiales</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className={`h-4 w-4 ${k.color || 'text-primary'}`} />
                <span className="text-xs text-muted-foreground">{k.label}</span>
              </div>
              <p className={`text-xl font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Inventario de Insumos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Insumo</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Stock Actual</th>
                  <th className="px-4 py-3 font-medium">Stock Mínimo</th>
                  <th className="px-4 py-3 font-medium">Unidad</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((item, i) => (
                  <tr
                    key={i}
                    className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${
                      item.estado !== 'ok' ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{item.producto}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.cat}</td>
                    <td className="px-4 py-3">{item.stock}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.minimo}</td>
                    <td className="px-4 py-3">{item.unidad}</td>
                    <td className="px-4 py-3">{estadoBadge(item.estado)}</td>
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
