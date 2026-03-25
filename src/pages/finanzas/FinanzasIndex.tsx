import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, TrendingUp, Leaf, FileText, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { getFinanzasKPIs, getFinanzasMensuales, getDistribucionGastos } from '@/lib/demoSeedData';

export default function FinanzasIndex() {
  const navigate = useNavigate();
  const kpis = getFinanzasKPIs();
  const mensuales = getFinanzasMensuales();
  const gastos = getDistribucionGastos();

  const sections = [
    { title: 'Panel financiero', description: 'Ingresos, costos e indicadores operativos', icon: DollarSign, path: '/finanzas/panel', stat: kpis.ingresos_mes },
    { title: 'Créditos', description: 'Solicitudes, scoring y decisiones de comité', icon: CreditCard, path: '/finanzas/creditos', stat: `Score: ${kpis.score_nova}` },
    { title: 'Score Nova', description: 'Factores agronómicos y operativos del score crediticio', icon: TrendingUp, path: '/finanzas/score-nova', stat: String(kpis.score_nova) },
    { title: 'Carbono', description: 'Activos naturales, MRV y estimaciones de carbono', icon: Leaf, path: '/finanzas/carbono', stat: `${kpis.carbono_toneladas} tCO₂` },
    { title: 'Facturación', description: 'Plan, uso, add-ons e invoices', icon: FileText, path: '/finanzas/facturacion', stat: 'Vigente' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Finanzas" description="Monetización, scoring y capital" />
        <DemoBadge />
      </div>

      {/* KPI summary */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Ingresos (mes)', value: kpis.ingresos_mes },
          { label: 'Costos (mes)', value: kpis.costos_mes },
          { label: 'Margen', value: kpis.margen },
          { label: 'Score Nova', value: kpis.score_nova },
          { label: 'Carbono', value: `${kpis.carbono_toneladas} tCO₂` },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5 text-center">
              <p className="text-lg sm:text-2xl font-bold">{String(k.value)}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Ingresos vs Costos (12 meses, $K)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mensuales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  <Legend />
                  <Bar dataKey="ingresos" fill="hsl(var(--primary))" name="Ingresos" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costos" fill="hsl(var(--destructive))" name="Costos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Distribución de gastos (%)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gastos} dataKey="valor" nameKey="categoria" cx="50%" cy="50%" outerRadius={70} label={({ categoria, valor }) => `${categoria} ${valor}%`}>
                    {gastos.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module navigation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(s => (
          <Card key={s.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(s.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-accent/10 text-accent"><s.icon className="h-5 w-5" /></div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardTitle className="text-base mt-2">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{s.description}</p>
              <Badge variant="secondary" className="text-xs">{String(s.stat)}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}