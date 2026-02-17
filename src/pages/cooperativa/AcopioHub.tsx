import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DEMO_LOTES_ACOPIO, DEMO_ENTREGAS } from '@/lib/demo-data';
import { Package, Truck, Plus } from 'lucide-react';

const estadoLoteBadge = (s: string) => {
  if (s === 'disponible') return <Badge variant="default">Disponible</Badge>;
  if (s === 'en_proceso') return <Badge variant="secondary">En proceso</Badge>;
  return <Badge variant="outline">Vendido</Badge>;
};

const estadoPagoBadge = (s: string) => {
  if (s === 'pagado') return <Badge variant="default">Pagado</Badge>;
  if (s === 'pendiente') return <Badge variant="secondary">Pendiente</Badge>;
  return <Badge variant="outline">Parcial</Badge>;
};

export default function AcopioHub() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Acopio y Comercial</h1>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo lote</Button>
      </div>

      <Tabs defaultValue="lotes">
        <TabsList>
          <TabsTrigger value="lotes"><Package className="h-4 w-4 mr-1" /> Lotes de acopio</TabsTrigger>
          <TabsTrigger value="entregas"><Truck className="h-4 w-4 mr-1" /> Entregas</TabsTrigger>
        </TabsList>

        <TabsContent value="lotes" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="px-4 py-3 font-medium">Código</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Peso (QQ)</th>
                      <th className="px-4 py-3 font-medium">Peso (kg)</th>
                      <th className="px-4 py-3 font-medium">Productores</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_LOTES_ACOPIO.map(l => (
                      <tr key={l.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{l.codigo}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.fecha}</td>
                        <td className="px-4 py-3 font-bold">{l.pesoQQ}</td>
                        <td className="px-4 py-3">{l.pesoKg.toLocaleString()}</td>
                        <td className="px-4 py-3">{l.productores}</td>
                        <td className="px-4 py-3">{l.tipoCafe}</td>
                        <td className="px-4 py-3">{estadoLoteBadge(l.estado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregas" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="px-4 py-3 font-medium">Productor</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Peso (kg)</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Precio/kg</th>
                      <th className="px-4 py-3 font-medium">Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_ENTREGAS.map(e => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{e.productorNombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{e.fecha}</td>
                        <td className="px-4 py-3">{e.pesoKg}</td>
                        <td className="px-4 py-3">{e.tipoCafe}</td>
                        <td className="px-4 py-3">₡{e.precioUnitario.toLocaleString()}</td>
                        <td className="px-4 py-3">{estadoPagoBadge(e.estadoPago)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
