import { useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDemoProviderEvidence } from '@/lib/demoSeedData';
import { FileText, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const estadoColor: Record<string, string> = { Completo: 'default', Pendiente: 'secondary', Riesgo: 'destructive' };
const chartTooltip = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' };

export default function EvidenciasIndex() {
  const evidencias = getDemoProviderEvidence();

  const completos = evidencias.filter(e => e.estado === 'Completo').length;
  const pendientes = evidencias.filter(e => e.estado === 'Pendiente').length;
  const riesgo = evidencias.filter(e => e.estado === 'Riesgo').length;
  const proveedoresUnicos = new Set(evidencias.map(e => e.proveedor)).size;

  const porEstado = [
    { name: 'Completo', value: completos, fill: 'hsl(var(--primary))' },
    { name: 'Pendiente', value: pendientes, fill: 'hsl(var(--warning))' },
    { name: 'Riesgo', value: riesgo, fill: 'hsl(var(--destructive))' },
  ];

  const porTipo = useMemo(() => {
    const map: Record<string, number> = {};
    evidencias.forEach(e => { map[e.tipoEvidencia] = (map[e.tipoEvidencia] || 0) + 1; });
    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];
    return Object.entries(map).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));
  }, [evidencias]);

  // Proveedores con brechas
  const provConBrechas = useMemo(() => {
    const map: Record<string, { total: number; pendientes: number; riesgo: number; region: string }> = {};
    evidencias.forEach(e => {
      if (!map[e.proveedor]) map[e.proveedor] = { total: 0, pendientes: 0, riesgo: 0, region: e.region };
      map[e.proveedor].total++;
      if (e.estado === 'Pendiente') map[e.proveedor].pendientes++;
      if (e.estado === 'Riesgo') map[e.proveedor].riesgo++;
    });
    return Object.entries(map).filter(([, v]) => v.pendientes > 0 || v.riesgo > 0).map(([name, v]) => ({ proveedor: name, ...v })).slice(0, 8);
  }, [evidencias]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Evidencias proveedor" description="Completitud documental y expedientes por proveedor" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{evidencias.length}</p><p className="text-xs text-muted-foreground">Documentos</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-accent" /><div><p className="text-2xl font-bold">{proveedoresUnicos}</p><p className="text-xs text-muted-foreground">Proveedores</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{completos}</p><p className="text-xs text-muted-foreground">Completos</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-destructive" /><div><p className="text-2xl font-bold">{riesgo}</p><p className="text-xs text-muted-foreground">En riesgo</p></div></div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Estado de expedientes</CardTitle></CardHeader>
          <CardContent><div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={porEstado} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>{porEstado.map((d, i) => <Cell key={i} fill={d.fill} />)}</Pie><Tooltip contentStyle={chartTooltip} /></PieChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Proveedores con brechas documentales</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {provConBrechas.length === 0 ? <p className="text-sm text-muted-foreground">Sin brechas detectadas</p> : provConBrechas.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <div><p className="text-sm font-medium">{p.proveedor}</p><p className="text-xs text-muted-foreground">{p.region} · {p.total} documentos</p></div>
                <div className="flex gap-1.5">
                  {p.pendientes > 0 && <Badge variant="secondary" className="text-xs">{p.pendientes} pendiente{p.pendientes > 1 ? 's' : ''}</Badge>}
                  {p.riesgo > 0 && <Badge variant="destructive" className="text-xs">{p.riesgo} riesgo</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0"><div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Proveedor</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tipo evidencia</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Región</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Observación</th>
            </tr></thead>
            <tbody>
              {evidencias.map(e => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{e.proveedor}</td>
                  <td className="py-3 px-4 text-muted-foreground">{e.tipoEvidencia}</td>
                  <td className="py-3 px-4 text-muted-foreground">{e.region}</td>
                  <td className="py-3 px-4 text-muted-foreground">{e.fecha}</td>
                  <td className="py-3 px-4"><Badge variant={(estadoColor[e.estado] as any) || 'secondary'} className="text-xs">{e.estado}</Badge></td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{e.observacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></CardContent>
      </Card>
    </div>
  );
}
