import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, AlertTriangle, TrendingDown, Boxes } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { getDemoInventario } from '@/lib/demoSeedData';

const estadoColor: Record<string, string> = { Crítico: 'destructive', Bajo: 'secondary', OK: 'default' };

export default function InventarioIndex() {
  const items = getDemoInventario();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('todas');

  const categorias = useMemo(() => [...new Set(items.map(i => i.categoria))], [items]);

  const filtered = useMemo(() => items.filter(i => {
    const matchSearch = i.nombre.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'todas' || i.categoria === catFilter;
    return matchSearch && matchCat;
  }), [items, search, catFilter]);

  const criticos = items.filter(i => i.estado === 'Crítico');
  const bajos = items.filter(i => i.estado === 'Bajo');

  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => { map[i.categoria] = (map[i.categoria] || 0) + 1; });
    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];
    return Object.entries(map).map(([cat, count], i) => ({ name: cat, value: count, fill: colors[i % colors.length] }));
  }, [items]);

  const movimientosRecientes = useMemo(() =>
    [...items].sort((a, b) => a.ultimoMovimiento.localeCompare(b.ultimoMovimiento)).slice(0, 10),
    [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Inventario" description="Control de insumos, materiales y equipos operativos" />
        <DemoBadge />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Boxes className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{items.length}</p><p className="text-xs text-muted-foreground">Items registrados</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-destructive" /><div><p className="text-2xl font-bold">{criticos.length}</p><p className="text-xs text-muted-foreground">Stock crítico</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><TrendingDown className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">{bajos.length}</p><p className="text-xs text-muted-foreground">Stock bajo</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Package className="h-5 w-5 text-accent" /><div><p className="text-2xl font-bold">{categorias.length}</p><p className="text-xs text-muted-foreground">Categorías</p></div></div></CardContent></Card>
      </div>

      {/* Distribution chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribución por categoría</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={porCategoria} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {porCategoria.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Critical items */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Items con stock crítico</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {criticos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas de stock crítico</p>
            ) : (
              criticos.slice(0, 6).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-destructive/5 border border-destructive/10">
                  <div>
                    <p className="text-sm font-medium">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">{item.categoria} · {item.proveedor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">{item.stockActual} {item.unidad}</p>
                    <p className="text-xs text-muted-foreground">Min: {item.stockMinimo}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar insumo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos ({filtered.length})</TabsTrigger>
          <TabsTrigger value="alertas">Alertas ({criticos.length + bajos.length})</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos recientes</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Nombre</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Categoría</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Stock</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Mínimo</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Costo</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Últ. mov.</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium">{item.nombre}</td>
                        <td className="py-2 px-3 text-muted-foreground">{item.categoria}</td>
                        <td className="py-2 px-3 text-center font-medium">{item.stockActual} {item.unidad}</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{item.stockMinimo}</td>
                        <td className="py-2 px-3 text-muted-foreground">{item.costoUnitario}</td>
                        <td className="py-2 px-3 text-muted-foreground">{item.ultimoMovimiento}</td>
                        <td className="py-2 px-3"><Badge variant={(estadoColor[item.estado] as any) || 'default'} className="text-xs">{item.estado}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="mt-4 space-y-2">
          {[...criticos, ...bajos].map((item, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">{item.categoria} · Proveedor: {item.proveedor}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.stockActual}/{item.stockMinimo} {item.unidad}</span>
                    <Badge variant={(estadoColor[item.estado] as any) || 'default'} className="text-xs">{item.estado}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="movimientos" className="mt-4 space-y-2">
          {movimientosRecientes.map((item, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">{item.categoria} · {item.costoUnitario}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{item.ultimoMovimiento}</p>
                    <p className="text-xs text-muted-foreground">Stock: {item.stockActual} {item.unidad}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
