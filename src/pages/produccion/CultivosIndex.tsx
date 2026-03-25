import { useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDemoParcelas, getTopVariedades } from '@/lib/demoSeedData';
import { useOperatingModel, showsProductores } from '@/lib/operatingModel';
import { Leaf, Mountain, Sprout, Map } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const chartTooltip = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' };

export default function CultivosIndex() {
  const parcelas = getDemoParcelas();
  const topVar = getTopVariedades();
  const model = useOperatingModel();
  const showProd = showsProductores(model);

  const variedades = useMemo(() => {
    const map: Record<string, number> = {};
    parcelas.forEach(p => { map[p.variedad] = (map[p.variedad] || 0) + 1; });
    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--warning))'];
    return Object.entries(map).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));
  }, [parcelas]);

  const altRanges = useMemo(() => {
    const ranges = [
      { rango: '< 1000', min: 0, max: 999, count: 0 },
      { rango: '1000-1200', min: 1000, max: 1200, count: 0 },
      { rango: '1200-1400', min: 1200, max: 1400, count: 0 },
      { rango: '1400-1600', min: 1400, max: 1600, count: 0 },
      { rango: '> 1600', min: 1600, max: 9999, count: 0 },
    ];
    parcelas.forEach(p => {
      const r = ranges.find(r => p.altitud >= r.min && p.altitud <= r.max);
      if (r) r.count++;
    });
    return ranges;
  }, [parcelas]);

  const totalArea = parcelas.reduce((s, p) => s + p.area, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Cultivos" description="Inventario productivo por parcela, variedad y altitud" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Sprout className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{parcelas.length}</p><p className="text-xs text-muted-foreground">Parcelas activas</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Leaf className="h-5 w-5 text-accent" /><div><p className="text-2xl font-bold">{variedades.length}</p><p className="text-xs text-muted-foreground">Variedades</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Map className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">{totalArea.toFixed(0)} ha</p><p className="text-xs text-muted-foreground">Área total</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Mountain className="h-5 w-5 text-muted-foreground" /><div><p className="text-2xl font-bold">{Math.round(parcelas.reduce((s, p) => s + p.altitud, 0) / parcelas.length)}</p><p className="text-xs text-muted-foreground">Altitud prom. (msnm)</p></div></div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribución por variedad</CardTitle></CardHeader>
          <CardContent><div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={variedades} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>{variedades.map((d, i) => <Cell key={i} fill={d.fill} />)}</Pie><Tooltip contentStyle={chartTooltip} /></PieChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Parcelas por rango altitudinal</CardTitle></CardHeader>
          <CardContent><div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={altRanges}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="rango" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} /><Tooltip contentStyle={chartTooltip} /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Parcelas" /></BarChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Parcela</th>
                {showProd && <th className="text-left py-3 px-4 text-muted-foreground font-medium">Productor</th>}
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Variedad</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Área (ha)</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Altitud</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Región</th>
              </tr></thead>
              <tbody>
                {parcelas.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{p.nombre}</td>
                    {showProd && <td className="py-3 px-4 text-muted-foreground">{p.productor}</td>}
                    <td className="py-3 px-4">{p.variedad}</td>
                    <td className="py-3 px-4 text-center">{p.area}</td>
                    <td className="py-3 px-4 text-center">{p.altitud} msnm</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.region}</td>
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
