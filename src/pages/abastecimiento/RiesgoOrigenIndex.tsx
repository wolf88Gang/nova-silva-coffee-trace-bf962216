import { useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDemoRiskScores } from '@/lib/demoSeedData';
import { AlertTriangle, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const riskColor: Record<string, string> = { Bajo: 'default', Medio: 'secondary', Alto: 'destructive' };
const eudrColor: Record<string, string> = { Conforme: 'default', Pendiente: 'secondary', Riesgo: 'destructive' };
const chartTooltip = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' };

export default function RiesgoOrigenIndex() {
  const scores = getDemoRiskScores();

  const altoRiesgo = scores.filter(s => s.riesgoAgro === 'Alto' || s.riesgoDoc === 'Alto').length;
  const scoreProm = useMemo(() => Math.round(scores.reduce((s, r) => s + r.scoreGeneral, 0) / scores.length), [scores]);

  const porRegion = useMemo(() => {
    const map: Record<string, { count: number; scoreSum: number }> = {};
    scores.forEach(s => {
      if (!map[s.region]) map[s.region] = { count: 0, scoreSum: 0 };
      map[s.region].count++;
      map[s.region].scoreSum += s.scoreGeneral;
    });
    return Object.entries(map).map(([region, v]) => ({ region, proveedores: v.count, score: Math.round(v.scoreSum / v.count) })).sort((a, b) => a.score - b.score);
  }, [scores]);

  const distribucionRiesgo = useMemo(() => {
    const bajo = scores.filter(s => s.scoreGeneral >= 75).length;
    const medio = scores.filter(s => s.scoreGeneral >= 50 && s.scoreGeneral < 75).length;
    const alto = scores.filter(s => s.scoreGeneral < 50).length;
    return [
      { name: 'Bajo', value: bajo, fill: 'hsl(var(--primary))' },
      { name: 'Medio', value: medio, fill: 'hsl(var(--warning))' },
      { name: 'Alto', value: alto, fill: 'hsl(var(--destructive))' },
    ];
  }, [scores]);

  const alertas = scores.filter(s => s.scoreGeneral < 50).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Riesgo de origen" description="Evaluación de riesgo agronómico, documental y de cumplimiento por proveedor" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{scores.length}</p><p className="text-xs text-muted-foreground">Proveedores evaluados</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-accent" /><div><p className="text-2xl font-bold">{scoreProm}</p><p className="text-xs text-muted-foreground">Score promedio</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-destructive" /><div><p className="text-2xl font-bold">{altoRiesgo}</p><p className="text-xs text-muted-foreground">Alto riesgo</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{scores.filter(s => s.eudr === 'Conforme').length}</p><p className="text-xs text-muted-foreground">EUDR conforme</p></div></div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribución de riesgo</CardTitle></CardHeader>
          <CardContent><div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={distribucionRiesgo} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>{distribucionRiesgo.map((d, i) => <Cell key={i} fill={d.fill} />)}</Pie><Tooltip contentStyle={chartTooltip} /></PieChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Score promedio por región</CardTitle></CardHeader>
          <CardContent><div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porRegion} layout="vertical"><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><YAxis type="category" dataKey="region" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={90} /><Tooltip contentStyle={chartTooltip} /><Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} /></BarChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Alertas prioritarias</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {alertas.map((a, i) => (
              <div key={i} className="p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                <p className="text-sm font-medium">{a.proveedor}</p>
                <p className="text-xs text-muted-foreground">{a.region} · Score: {a.scoreGeneral} · Agro: {a.riesgoAgro} · Doc: {a.riesgoDoc}</p>
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
              <th className="text-left py-3 px-4 text-muted-foreground font-medium">Región</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">EUDR</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Calidad</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">R. agronómico</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">R. documental</th>
              <th className="text-center py-3 px-4 text-muted-foreground font-medium">Score</th>
            </tr></thead>
            <tbody>
              {scores.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{s.proveedor}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.region}</td>
                  <td className="py-3 px-4 text-center"><Badge variant={(eudrColor[s.eudr] as any) || 'outline'} className="text-xs">{s.eudr}</Badge></td>
                  <td className="py-3 px-4 text-center">{s.calidad}</td>
                  <td className="py-3 px-4 text-center"><Badge variant={(riskColor[s.riesgoAgro] as any) || 'outline'} className="text-xs">{s.riesgoAgro}</Badge></td>
                  <td className="py-3 px-4 text-center"><Badge variant={(riskColor[s.riesgoDoc] as any) || 'outline'} className="text-xs">{s.riesgoDoc}</Badge></td>
                  <td className="py-3 px-4 text-center font-bold">{s.scoreGeneral}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></CardContent>
      </Card>
    </div>
  );
}
