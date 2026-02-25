import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Clock, Boxes, AlertTriangle, Bug, CloudRain, Bell, BarChart3, MapPin } from 'lucide-react';
import { DEMO_ALERTAS } from '@/lib/demo-data';

export default function OperacionesHub() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Operaciones</h1>

      <Tabs defaultValue="monitor">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="monitor"><Shield className="h-4 w-4 mr-1" /> Nova Guard</TabsTrigger>
          <TabsTrigger value="jornales"><Clock className="h-4 w-4 mr-1" /> Jornales</TabsTrigger>
          <TabsTrigger value="inventario"><Boxes className="h-4 w-4 mr-1" /> Inventario</TabsTrigger>
        </TabsList>

        {/* ── Nova Guard ── */}
        <TabsContent value="monitor" className="mt-4 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Monitor Nova Guard
              </h2>
              <p className="text-sm text-muted-foreground">Centro de comando fitosanitario regional</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary text-primary">● Sistema activo</Badge>
              <span className="text-xs text-muted-foreground">Última actualización: Hace 5 min</span>
            </div>
          </div>

          {/* Incidence cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-primary/30">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-primary" />
                    <span className="font-bold text-foreground">Roya</span>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary">Bajo</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Incidencia controlada</p>
                <p className="text-3xl font-bold text-primary mt-1">2% <span className="text-sm font-normal text-muted-foreground">incidencia</span></p>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-destructive" />
                    <span className="font-bold text-foreground">Broca</span>
                  </div>
                  <Badge variant="destructive">⚠ ALERTA</Badge>
                </div>
                <p className="text-sm text-muted-foreground">ALERTA DE VUELO en Zona Norte</p>
                <p className="text-3xl font-bold text-destructive mt-1">15% <span className="text-sm font-normal text-muted-foreground">incidencia</span></p>
              </CardContent>
            </Card>

            <Card className="border-accent/30">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CloudRain className="h-5 w-5 text-accent" />
                    <span className="font-bold text-foreground">Clima</span>
                  </div>
                  <Badge className="bg-accent text-accent-foreground">Humedad Alta</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Favorable para hongos</p>
                <p className="text-sm text-muted-foreground mt-1">⚡ Condiciones favorables para hongos</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Map placeholder */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-destructive" /> Mapa de Incidencias
                  </CardTitle>
                  <Badge variant="secondary">⚡ 8 reportes en 24h</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Haz clic en un pin para ver detalles</p>
              </CardHeader>
              <CardContent>
                <div className="w-full h-64 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Mapa interactivo — requiere integración Leaflet</p>
                </div>
              </CardContent>
            </Card>

            {/* Active alert + demand */}
            <div className="space-y-4">
              <Card className="border-l-4 border-l-destructive">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" /> Alerta Activa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-md bg-muted/50">
                    <p className="font-medium text-foreground">Brote de Broca en Zona Norte</p>
                    <p className="text-xs text-muted-foreground mt-1">Detectado por <strong>5 productores</strong> en las últimas 24 horas. Incidencia promedio del 15%.</p>
                  </div>
                  <Button className="w-full" size="sm">
                    <Bell className="h-4 w-4 mr-1" /> Emitir Alerta Push a Zona Norte
                  </Button>
                  <Button variant="outline" className="w-full justify-between" size="sm">
                    Verificar Stock de Beauveria <span>›</span>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Proyección de Demanda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">Basado en alertas activas en la zona</p>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm font-medium text-foreground">Beauveria bassiana</span>
                    <Badge variant="destructive">⚠ Stock Crítico</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Phytosanitary alerts list */}
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

        {/* ── Jornales ── */}
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

        {/* ── Inventario ── */}
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
                      { producto: 'Beauveria bassiana', cat: 'Biocontrol', stock: 3, unidad: 'litros', bajo: true },
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
