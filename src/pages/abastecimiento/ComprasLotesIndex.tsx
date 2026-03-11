import { useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDemoLotesComerciales } from '@/lib/demoSeedData';
import { Package, ShieldCheck, AlertTriangle, Truck } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const eudrBadge: Record<string, { variant: any; label: string }> = {
  Verde: { variant: 'default', label: 'Cumple' },
  Ámbar: { variant: 'secondary', label: 'Pendiente' },
  Rojo: { variant: 'destructive', label: 'No cumple' },
};
const estadoBadge: Record<string, string> = { Disponible: 'default', Comprometido: 'secondary', 'En tránsito': 'outline', Entregado: 'outline' };
const chartTooltip = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' };

export default function ComprasLotesIndex() {
  const lotes = getDemoLotesComerciales();

  const disponibles = lotes.filter(l => l.estado === 'Disponible').length;
  const comprometidos = lotes.filter(l => l.estado === 'Comprometido').length;
  const enTransito = lotes.filter(l => l.estado === 'En tránsito').length;

  const porOrigen = useMemo(() => {
    const map: Record<string, number> = {};
    lotes.forEach(l => { map[l.origen] = (map[l.origen] || 0) + 1; });
    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--warning))'];
    return Object.entries(map).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));
  }, [lotes]);

  const porEstado = useMemo(() => [
    { name: 'Disponible', value: disponibles, fill: 'hsl(var(--primary))' },
    { name: 'Comprometido', value: comprometidos, fill: 'hsl(var(--accent))' },
    { name: 'En tránsito', value: enTransito, fill: 'hsl(var(--warning))' },
    { name: 'Entregado', value: lotes.filter(l => l.estado === 'Entregado').length, fill: 'hsl(var(--muted-foreground))' },
  ], [lotes, disponibles, comprometidos, enTransito]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Compras y lotes" description="Lotes originados, compras recientes y estado de inventario" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Package className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{lotes.length}</p><p className="text-xs text-muted-foreground">Lotes totales</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{disponibles}</p><p className="text-xs text-muted-foreground">Disponibles</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Truck className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">{enTransito}</p><p className="text-xs text-muted-foreground">En tránsito</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-destructive" /><div><p className="text-2xl font-bold">{lotes.filter(l => l.eudr === 'Rojo').length}</p><p className="text-xs text-muted-foreground">EUDR riesgo</p></div></div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Composición por origen</CardTitle></CardHeader>
          <CardContent><div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={porOrigen} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>{porOrigen.map((d, i) => <Cell key={i} fill={d.fill} />)}</Pie><Tooltip contentStyle={chartTooltip} /></PieChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Estado de lotes</CardTitle></CardHeader>
          <CardContent><div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={porEstado} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>{porEstado.map((d, i) => <Cell key={i} fill={d.fill} />)}</Pie><Tooltip contentStyle={chartTooltip} /></PieChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0"><div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Origen</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Volumen</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Calidad</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">EUDR</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Composición</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
            </tr></thead>
            <tbody>
              {lotes.map(l => {
                const eb = eudrBadge[l.eudr] || { variant: 'outline', label: l.eudr };
                return (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{l.codigo}</td>
                    <td className="py-3 px-4 text-muted-foreground">{l.origen}</td>
                    <td className="py-3 px-4">{l.volumen}</td>
                    <td className="py-3 px-4 text-center">{l.calidad}</td>
                    <td className="py-3 px-4"><Badge variant={(estadoBadge[l.estado] as any) || 'outline'} className="text-xs">{l.estado}</Badge></td>
                    <td className="py-3 px-4 text-center"><Badge variant={eb.variant} className="text-xs">{eb.label}</Badge></td>
                    <td className="py-3 px-4 text-xs text-muted-foreground max-w-[180px] truncate">{l.composicion}</td>
                    <td className="py-3 px-4 text-muted-foreground">{l.fecha}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></CardContent>
      </Card>
    </div>
  );
}
