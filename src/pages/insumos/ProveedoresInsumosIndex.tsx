import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ShoppingCart, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface InputSupplier {
  id: string;
  nombre: string;
  tipo: string;
  categorias: string[];
  productos: number;
  ultimaCompra: string;
  montoAnual: string;
  estado: 'activo' | 'inactivo' | 'nuevo';
  calificacion: number;
}

function getDemoInputSuppliers(): InputSupplier[] {
  return [
    { id: '1', nombre: 'AgroCentro Nacional', tipo: 'Distribuidor', categorias: ['Fertilizantes', 'Correctivos'], productos: 24, ultimaCompra: '2026-02-28', montoAnual: '₡4.2M', estado: 'activo', calificacion: 4.5 },
    { id: '2', nombre: 'FertiMax Costa Rica', tipo: 'Fabricante', categorias: ['Fertilizantes', 'Enmiendas'], productos: 18, ultimaCompra: '2026-03-05', montoAnual: '₡3.8M', estado: 'activo', calificacion: 4.8 },
    { id: '3', nombre: 'BioProtect S.A.', tipo: 'Fabricante', categorias: ['Fitosanitarios', 'Biológicos'], productos: 12, ultimaCompra: '2026-02-15', montoAnual: '₡1.9M', estado: 'activo', calificacion: 4.2 },
    { id: '4', nombre: 'Vivero Verde Esperanza', tipo: 'Vivero', categorias: ['Plantas', 'Semillas'], productos: 8, ultimaCompra: '2026-01-20', montoAnual: '₡850K', estado: 'activo', calificacion: 4.0 },
    { id: '5', nombre: 'MaquiAgro Ltda.', tipo: 'Maquinaria', categorias: ['Herramientas', 'Equipos'], productos: 15, ultimaCompra: '2026-03-01', montoAnual: '₡2.1M', estado: 'activo', calificacion: 3.9 },
    { id: '6', nombre: 'NutriSuelos del Valle', tipo: 'Fabricante', categorias: ['Correctivos', 'Enmiendas'], productos: 6, ultimaCompra: '2025-11-10', montoAnual: '₡420K', estado: 'inactivo', calificacion: 3.5 },
    { id: '7', nombre: 'Agro Insumos del Sur', tipo: 'Distribuidor', categorias: ['Fertilizantes', 'Fitosanitarios', 'EPP'], productos: 32, ultimaCompra: '2026-03-08', montoAnual: '₡5.1M', estado: 'activo', calificacion: 4.6 },
    { id: '8', nombre: 'EcoFert Orgánicos', tipo: 'Fabricante', categorias: ['Biológicos', 'Enmiendas'], productos: 9, ultimaCompra: '2026-02-22', montoAnual: '₡1.2M', estado: 'nuevo', calificacion: 4.1 },
  ];
}

const estadoVariant: Record<string, 'default' | 'secondary' | 'outline'> = { activo: 'default', inactivo: 'secondary', nuevo: 'outline' };
const estadoLabel: Record<string, string> = { activo: 'Activo', inactivo: 'Inactivo', nuevo: 'Nuevo' };

export default function ProveedoresInsumosIndex() {
  const suppliers = getDemoInputSuppliers();
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => suppliers.filter(s => s.nombre.toLowerCase().includes(search.toLowerCase())), [search, suppliers]);
  const activos = suppliers.filter(s => s.estado === 'activo').length;
  const totalProductos = suppliers.reduce((a, s) => a + s.productos, 0);

  const porTipo = useMemo(() => {
    const map: Record<string, number> = {};
    suppliers.forEach(s => { map[s.tipo] = (map[s.tipo] || 0) + 1; });
    const colors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
    return Object.entries(map).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));
  }, [suppliers]);

  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    suppliers.forEach(s => s.categorias.forEach(c => { map[c] = (map[c] || 0) + 1; }));
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [suppliers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Proveedores de insumos" description="Gestión de proveedores de fertilizantes, fitosanitarios, herramientas y materiales" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-5 pb-4"><div className="flex items-center gap-2 mb-2"><ShoppingCart className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Proveedores</span></div><p className="text-2xl font-bold">{suppliers.length}</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Activos</span></div><p className="text-2xl font-bold">{activos}</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Productos registrados</span></div><p className="text-2xl font-bold">{totalProductos}</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-destructive" /><span className="text-xs text-muted-foreground">Inactivos</span></div><p className="text-2xl font-bold">{suppliers.length - activos}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Directorio de proveedores</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar proveedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
            <div className="rounded-md border overflow-auto max-h-[420px]">
              <Table>
                <TableHeader><TableRow><TableHead>Proveedor</TableHead><TableHead>Tipo</TableHead><TableHead>Categorías</TableHead><TableHead className="text-right">Productos</TableHead><TableHead>Última compra</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.nombre}</TableCell>
                      <TableCell>{s.tipo}</TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{s.categorias.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}</div></TableCell>
                      <TableCell className="text-right">{s.productos}</TableCell>
                      <TableCell>{s.ultimaCompra}</TableCell>
                      <TableCell><Badge variant={estadoVariant[s.estado]}>{estadoLabel[s.estado]}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Por tipo</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={porTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={3}>{porTipo.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">{porTipo.map(t => <span key={t.name} className="text-xs text-muted-foreground">{t.name} ({t.value})</span>)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Categorías cubiertas</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={porCategoria} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" width={100} className="text-xs fill-muted-foreground" />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Tooltip />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
