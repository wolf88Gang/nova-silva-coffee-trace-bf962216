import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDemoDocumentos } from '@/lib/demoSeedData';
import { FileText, Search, AlertTriangle, CheckCircle2, FolderOpen } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const estadoColor: Record<string, string> = { Vigente: 'default', 'Pendiente revisión': 'secondary', Vencido: 'destructive', Borrador: 'outline' };
const chartTooltip = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' };

export default function DocumentosIndex() {
  const docs = getDemoDocumentos();
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');

  const tipos = useMemo(() => [...new Set(docs.map(d => d.tipo))], [docs]);

  const filtered = useMemo(() => docs.filter(d => {
    const matchSearch = d.nombre.toLowerCase().includes(search.toLowerCase()) || d.parcela.toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoFilter === 'todos' || d.tipo === tipoFilter;
    return matchSearch && matchTipo;
  }), [docs, search, tipoFilter]);

  const porTipo = useMemo(() => {
    const map: Record<string, number> = {};
    docs.forEach(d => { map[d.tipo] = (map[d.tipo] || 0) + 1; });
    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];
    return Object.entries(map).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));
  }, [docs]);

  const pendientes = docs.filter(d => d.estado === 'Pendiente revisión').length;
  const vencidos = docs.filter(d => d.estado === 'Vencido').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Documentos" description="Repositorio de evidencias, certificados y documentación operativa" />
        <DemoBadge />
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary shrink-0" /><div><p className="text-xl font-bold">{docs.length}</p><p className="text-xs text-muted-foreground">Total</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /><div><p className="text-xl font-bold">{docs.filter(d => d.estado === 'Vigente').length}</p><p className="text-xs text-muted-foreground">Vigentes</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-warning shrink-0" /><div><p className="text-xl font-bold">{pendientes}</p><p className="text-xs text-muted-foreground">Pendientes</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive shrink-0" /><div><p className="text-xl font-bold">{vencidos}</p><p className="text-xs text-muted-foreground">Vencidos</p></div></div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribución por tipo</CardTitle></CardHeader>
          <CardContent><div className="h-48 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={porTipo} cx="50%" cy="50%" innerRadius={30} outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>{porTipo.map((d, i) => <Cell key={i} fill={d.fill} />)}</Pie><Tooltip contentStyle={chartTooltip} /></PieChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Actividad documental reciente</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {docs.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-6).reverse().map((d, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm font-medium truncate max-w-[250px]">{d.nombre}</p><p className="text-xs text-muted-foreground">{d.origen} · {d.fecha}</p></div>
                </div>
                <Badge variant={(estadoColor[d.estado] as any) || 'secondary'} className="text-xs shrink-0">{d.estado}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar documento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos los tipos</SelectItem>{tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
      </div>

      <Card>
        <CardContent className="p-0"><div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Documento</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tipo</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Parcela</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Origen</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
            </tr></thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium max-w-[220px] truncate">{d.nombre}</td>
                  <td className="py-3 px-4 text-muted-foreground">{d.tipo}</td>
                  <td className="py-3 px-4 text-muted-foreground">{d.parcela}</td>
                  <td className="py-3 px-4 text-muted-foreground">{d.origen}</td>
                  <td className="py-3 px-4 text-muted-foreground">{d.fecha}</td>
                  <td className="py-3 px-4"><Badge variant={(estadoColor[d.estado] as any) || 'secondary'} className="text-xs">{d.estado}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></CardContent>
      </Card>
    </div>
  );
}
