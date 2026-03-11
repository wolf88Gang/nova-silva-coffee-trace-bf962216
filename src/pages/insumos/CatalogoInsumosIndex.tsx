import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Boxes, Leaf, Bug, Wrench, Sprout } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CatalogItem {
  id: string;
  nombre: string;
  categoria: string;
  tipo: string;
  unidad: string;
  precioRef: string;
  proveedor: string;
  disponible: boolean;
}

function getDemoCatalog(): CatalogItem[] {
  return [
    { id: '1', nombre: 'NPK 18-5-15-6-2(Mg)', categoria: 'Fertilizante', tipo: 'Granulado', unidad: 'Saco 46kg', precioRef: '₡18,500', proveedor: 'AgroCentro Nacional', disponible: true },
    { id: '2', nombre: 'DAP 18-46-0', categoria: 'Fertilizante', tipo: 'Granulado', unidad: 'Saco 46kg', precioRef: '₡22,800', proveedor: 'FertiMax Costa Rica', disponible: true },
    { id: '3', nombre: 'Urea 46-0-0', categoria: 'Fertilizante', tipo: 'Granulado', unidad: 'Saco 46kg', precioRef: '₡15,200', proveedor: 'AgroCentro Nacional', disponible: true },
    { id: '4', nombre: 'Sulfato de Magnesio', categoria: 'Enmienda', tipo: 'Polvo', unidad: 'Saco 25kg', precioRef: '₡8,900', proveedor: 'FertiMax Costa Rica', disponible: true },
    { id: '5', nombre: 'Cal dolomita', categoria: 'Correctivo', tipo: 'Polvo', unidad: 'Saco 46kg', precioRef: '₡4,500', proveedor: 'NutriSuelos del Valle', disponible: true },
    { id: '6', nombre: 'Boro líquido 10%', categoria: 'Micronutriente', tipo: 'Líquido', unidad: 'Litro', precioRef: '₡7,200', proveedor: 'BioProtect S.A.', disponible: true },
    { id: '7', nombre: 'Clorotalonil 720 SC', categoria: 'Fitosanitario', tipo: 'Suspensión', unidad: 'Litro', precioRef: '₡12,400', proveedor: 'BioProtect S.A.', disponible: true },
    { id: '8', nombre: 'Azoxystrobin 250 SC', categoria: 'Fitosanitario', tipo: 'Suspensión', unidad: 'Litro', precioRef: '₡28,500', proveedor: 'Agro Insumos del Sur', disponible: false },
    { id: '9', nombre: 'Trichoderma harzianum', categoria: 'Biológico', tipo: 'Polvo', unidad: 'Kg', precioRef: '₡15,800', proveedor: 'EcoFert Orgánicos', disponible: true },
    { id: '10', nombre: 'Abono orgánico Premium', categoria: 'Enmienda', tipo: 'Granulado', unidad: 'Saco 25kg', precioRef: '₡6,200', proveedor: 'EcoFert Orgánicos', disponible: true },
    { id: '11', nombre: 'Plantas Caturra (vivero)', categoria: 'Planta', tipo: 'Plántula', unidad: 'Unidad', precioRef: '₡350', proveedor: 'Vivero Verde Esperanza', disponible: true },
    { id: '12', nombre: 'Tijera de poda Felco', categoria: 'Herramienta', tipo: 'Manual', unidad: 'Unidad', precioRef: '₡32,000', proveedor: 'MaquiAgro Ltda.', disponible: true },
  ];
}

const catIcon: Record<string, typeof Leaf> = { Fertilizante: Leaf, Enmienda: Sprout, Correctivo: Sprout, Micronutriente: Leaf, Fitosanitario: Bug, Biológico: Sprout, Planta: Sprout, Herramienta: Wrench };

export default function CatalogoInsumosIndex() {
  const items = getDemoCatalog();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('todas');
  const categorias = useMemo(() => [...new Set(items.map(i => i.categoria))], [items]);
  const filtered = useMemo(() => items.filter(i => {
    const ms = i.nombre.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'todas' || i.categoria === catFilter;
    return ms && mc;
  }), [items, search, catFilter]);

  const disponibles = items.filter(i => i.disponible).length;

  const porCat = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => { map[i.categoria] = (map[i.categoria] || 0) + 1; });
    const colors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];
    return Object.entries(map).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Catálogo de insumos" description="Productos disponibles para la red de productores afiliados" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-5 pb-4"><div className="flex items-center gap-2 mb-2"><Boxes className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total productos</span></div><p className="text-2xl font-bold">{items.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><div className="flex items-center gap-2 mb-2"><Leaf className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Disponibles</span></div><p className="text-2xl font-bold">{disponibles}</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><div className="flex items-center gap-2 mb-2"><Bug className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Categorías</span></div><p className="text-2xl font-bold">{categorias.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><div className="flex items-center gap-2 mb-2"><Wrench className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Proveedores</span></div><p className="text-2xl font-bold">{new Set(items.map(i => i.proveedor)).size}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Productos del catálogo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
              <Select value={catFilter} onValueChange={setCatFilter}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="rounded-md border overflow-auto max-h-[420px]">
              <Table>
                <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Categoría</TableHead><TableHead>Tipo</TableHead><TableHead>Unidad</TableHead><TableHead className="text-right">Precio ref.</TableHead><TableHead>Proveedor</TableHead><TableHead>Disp.</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nombre}</TableCell>
                      <TableCell><Badge variant="outline">{item.categoria}</Badge></TableCell>
                      <TableCell>{item.tipo}</TableCell>
                      <TableCell>{item.unidad}</TableCell>
                      <TableCell className="text-right font-mono">{item.precioRef}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.proveedor}</TableCell>
                      <TableCell>{item.disponible ? <Badge variant="default">Sí</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Distribución por categoría</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={porCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>{porCat.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1">
              {porCat.map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: c.fill }} /><span className="text-muted-foreground">{c.name}</span></div>
                  <span className="font-medium">{c.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
