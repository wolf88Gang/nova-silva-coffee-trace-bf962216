import { useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDemoRecepciones, getMonthlyTimeSeries } from '@/lib/demoSeedData';
import { Package, Users, TrendingUp, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const docColor: Record<string, string> = { Completa: 'default', Parcial: 'secondary', Pendiente: 'destructive' };
const chartTooltip = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' };

export default function RecepcionIndex() {
  const recepciones = getDemoRecepciones();
  const recepcionesMes = getMonthlyTimeSeries(45, 20, 'recepciones');

  const proveedoresUnicos = useMemo(() => new Set(recepciones.map(r => r.proveedor)).size, [recepciones]);
  const volTotal = useMemo(() => recepciones.reduce((s, r) => s + parseInt(r.volumen), 0), [recepciones]);
  const calidadProm = useMemo(() => (recepciones.reduce((s, r) => s + r.calidad, 0) / recepciones.length).toFixed(1), [recepciones]);

  const topProveedores = useMemo(() => {
    const map: Record<string, number> = {};
    recepciones.forEach(r => { map[r.proveedor] = (map[r.proveedor] || 0) + parseInt(r.volumen); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, vol]) => ({ proveedor: name, volumen: vol }));
  }, [recepciones]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Recepción de café" description="Ingresos de café por proveedor, volumen y calidad" />
        <DemoBadge />
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Package className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{recepciones.length}</p><p className="text-xs text-muted-foreground">Recepciones</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-accent" /><div><p className="text-2xl font-bold">{volTotal} qq</p><p className="text-xs text-muted-foreground">Volumen total</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">{proveedoresUnicos}</p><p className="text-xs text-muted-foreground">Proveedores</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="text-2xl font-bold">{calidadProm}</p><p className="text-xs text-muted-foreground">Calidad prom.</p></div></div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recepciones mensuales</CardTitle></CardHeader>
          <CardContent><div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recepcionesMes}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} /><Tooltip contentStyle={chartTooltip} /><Bar dataKey="recepciones" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top proveedores por volumen</CardTitle></CardHeader>
          <CardContent><div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProveedores} layout="vertical"><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><YAxis type="category" dataKey="proveedor" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={100} /><Tooltip contentStyle={chartTooltip} /><Bar dataKey="volumen" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} name="qq" /></BarChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0"><div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Proveedor</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Región</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Volumen</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Lote</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Calidad</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Documentación</th>
            </tr></thead>
            <tbody>
              {recepciones.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 text-muted-foreground">{r.fecha}</td>
                  <td className="py-3 px-4 font-medium">{r.proveedor}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.region}</td>
                  <td className="py-3 px-4">{r.volumen}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.lote}</td>
                  <td className="py-3 px-4 text-center">{r.calidad}</td>
                  <td className="py-3 px-4"><Badge variant={(docColor[r.estadoDoc] as any) || 'secondary'} className="text-xs">{r.estadoDoc}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></CardContent>
      </Card>
    </div>
  );
}
