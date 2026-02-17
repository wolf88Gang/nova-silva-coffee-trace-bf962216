import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Clock, Boxes, Wrench } from 'lucide-react';
import { DEMO_ALERTAS } from '@/lib/demo-data';

export default function OperacionesHub() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Operaciones</h1>

      <Tabs defaultValue="monitor">
        <TabsList>
          <TabsTrigger value="monitor"><Shield className="h-4 w-4 mr-1" /> Nova Guard</TabsTrigger>
          <TabsTrigger value="jornales"><Clock className="h-4 w-4 mr-1" /> Jornales</TabsTrigger>
          <TabsTrigger value="inventario"><Boxes className="h-4 w-4 mr-1" /> Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-destructive/30">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Alertas rojas</p>
                <p className="text-2xl font-bold text-destructive">{DEMO_ALERTAS.filter(a => a.nivel === 'rojo').length}</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-500/30">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Alertas ámbar</p>
                <p className="text-2xl font-bold text-yellow-600">{DEMO_ALERTAS.filter(a => a.nivel === 'ambar').length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Zonas monitoreadas</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Alertas fitosanitarias</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {DEMO_ALERTAS.filter(a => a.tipo === 'fitosanitaria').map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <Badge variant={a.nivel === 'rojo' ? 'destructive' : 'secondary'}>{a.nivel}</Badge>
                  <div><p className="text-sm font-medium">{a.titulo}</p><p className="text-xs text-muted-foreground">{a.fecha}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jornales" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Registro de jornales</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-left">
                    <th className="px-4 py-2 font-medium">Trabajador</th><th className="px-4 py-2 font-medium">Fecha</th><th className="px-4 py-2 font-medium">Actividad</th><th className="px-4 py-2 font-medium">Horas</th><th className="px-4 py-2 font-medium">Costo</th>
                  </tr></thead>
                  <tbody>
                    {[
                      { nombre: 'Miguel Flores', fecha: '2026-02-17', actividad: 'Corte de café', horas: 8, tarifa: 2250 },
                      { nombre: 'Roberto Paz', fecha: '2026-02-17', actividad: 'Limpieza de cafetal', horas: 6, tarifa: 2250 },
                      { nombre: 'Sandra López', fecha: '2026-02-16', actividad: 'Aplicación fertilizante', horas: 4, tarifa: 2250 },
                    ].map((j, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium">{j.nombre}</td>
                        <td className="px-4 py-2 text-muted-foreground">{j.fecha}</td>
                        <td className="px-4 py-2">{j.actividad}</td>
                        <td className="px-4 py-2">{j.horas}h</td>
                        <td className="px-4 py-2 font-medium">₡{(j.horas * j.tarifa).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventario" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Inventario de insumos</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-left">
                    <th className="px-4 py-2 font-medium">Producto</th><th className="px-4 py-2 font-medium">Categoría</th><th className="px-4 py-2 font-medium">Stock</th><th className="px-4 py-2 font-medium">Unidad</th><th className="px-4 py-2 font-medium">Estado</th>
                  </tr></thead>
                  <tbody>
                    {[
                      { producto: 'Fertilizante 18-5-15', cat: 'Fertilizantes', stock: 45, unidad: 'sacos', bajo: false },
                      { producto: 'Cobre orgánico', cat: 'Agroquímicos', stock: 12, unidad: 'litros', bajo: true },
                      { producto: 'Machetes', cat: 'Herramientas', stock: 8, unidad: 'unidades', bajo: false },
                      { producto: 'Sacos de yute', cat: 'Insumos', stock: 200, unidad: 'unidades', bajo: false },
                    ].map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium">{item.producto}</td>
                        <td className="px-4 py-2 text-muted-foreground">{item.cat}</td>
                        <td className="px-4 py-2">{item.stock}</td>
                        <td className="px-4 py-2">{item.unidad}</td>
                        <td className="px-4 py-2">{item.bajo ? <Badge variant="destructive">Bajo</Badge> : <Badge variant="default">OK</Badge>}</td>
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
