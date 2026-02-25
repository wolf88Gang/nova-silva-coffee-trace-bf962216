import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sprout, MapPin, Package, Users, Mountain } from 'lucide-react';

const parcelas = [
  { nombre: 'El Mirador', area: 2.0, variedad: 'Caturra', altitud: 1450, plantas: 4200 },
  { nombre: 'La Esperanza', area: 1.5, variedad: 'Bourbon', altitud: 1380, plantas: 3100 },
  { nombre: 'Cerro Verde', area: 1.0, variedad: 'Catuaí', altitud: 1520, plantas: 2800 },
];

const insumos = [
  { nombre: 'Fertilizante 18-6-12', stock: 8, minimo: 5, unidad: 'sacos' },
  { nombre: 'Cal dolomita', stock: 3, minimo: 4, unidad: 'sacos' },
  { nombre: 'Beauveria bassiana', stock: 2, minimo: 2, unidad: 'kg' },
  { nombre: 'Fungicida cúprico', stock: 5, minimo: 3, unidad: 'litros' },
];

const jornales = [
  { actividad: 'Cosecha selectiva', cuadrilla: 'Familia', dias: 12, estado: 'completado' },
  { actividad: 'Poda de sombra', cuadrilla: 'Contratada', dias: 3, estado: 'en_curso' },
  { actividad: 'Fertilización', cuadrilla: 'Familia', dias: 2, estado: 'programado' },
];

const stockBadge = (stock: number, minimo: number) => {
  if (stock < minimo * 0.5) return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Crítico</Badge>;
  if (stock <= minimo) return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Bajo</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">OK</Badge>;
};

export default function ProduccionHub() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="parcelas">
        <TabsList>
          <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="jornales">Jornales</TabsTrigger>
        </TabsList>

        <TabsContent value="parcelas" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><MapPin className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Parcelas</span></div><p className="text-2xl font-bold text-foreground">{parcelas.length}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Sprout className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Hectáreas</span></div><p className="text-2xl font-bold text-foreground">{parcelas.reduce((s, p) => s + p.area, 0).toFixed(1)} ha</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Mountain className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Altitud promedio</span></div><p className="text-2xl font-bold text-foreground">{Math.round(parcelas.reduce((s, p) => s + p.altitud, 0) / parcelas.length)} msnm</p></CardContent></Card>
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="pb-2 pr-4">Parcela</th><th className="pb-2 pr-4">Área</th><th className="pb-2 pr-4">Variedad</th><th className="pb-2 pr-4">Altitud</th><th className="pb-2">Plantas</th></tr></thead>
                  <tbody>
                    {parcelas.map(p => (
                      <tr key={p.nombre} className="border-b border-border/50"><td className="py-3 pr-4 font-medium text-foreground">{p.nombre}</td><td className="py-3 pr-4 text-muted-foreground">{p.area} ha</td><td className="py-3 pr-4 text-muted-foreground">{p.variedad}</td><td className="py-3 pr-4 text-muted-foreground">{p.altitud} msnm</td><td className="py-3 text-foreground">{p.plantas.toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventario" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Insumos</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="pb-2 pr-4">Insumo</th><th className="pb-2 pr-4">Stock</th><th className="pb-2 pr-4">Mínimo</th><th className="pb-2 pr-4">Unidad</th><th className="pb-2">Estado</th></tr></thead>
                  <tbody>
                    {insumos.map(ins => (
                      <tr key={ins.nombre} className={`border-b border-border/50 ${ins.stock <= ins.minimo ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''}`}>
                        <td className="py-3 pr-4 font-medium text-foreground">{ins.nombre}</td>
                        <td className="py-3 pr-4 text-foreground">{ins.stock}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{ins.minimo}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{ins.unidad}</td>
                        <td className="py-3">{stockBadge(ins.stock, ins.minimo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jornales" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Jornales Asignados</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {jornales.map((j, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{j.actividad}</p>
                    <p className="text-xs text-muted-foreground">Cuadrilla: {j.cuadrilla} — {j.dias} días</p>
                  </div>
                  <Badge variant={j.estado === 'completado' ? 'default' : j.estado === 'en_curso' ? 'secondary' : 'outline'}>{j.estado === 'completado' ? 'Completado' : j.estado === 'en_curso' ? 'En curso' : 'Programado'}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
