import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, MapPin, DollarSign, Shield, CloudSun, AlertTriangle, Truck, TrendingUp } from 'lucide-react';
import { getProductorStats } from '@/lib/demo-data';

const entregasMensuales = [
  { mes: 'Sep', kg: 320 },
  { mes: 'Oct', kg: 480 },
  { mes: 'Nov', kg: 575 },
  { mes: 'Dic', kg: 690 },
  { mes: 'Ene', kg: 460 },
  { mes: 'Feb', kg: 345 },
];

const preciosTendencia = [
  { mes: 'Sep', precio: 2800 },
  { mes: 'Oct', precio: 2950 },
  { mes: 'Nov', precio: 3000 },
  { mes: 'Dic', precio: 3100 },
  { mes: 'Ene', precio: 3200 },
  { mes: 'Feb', precio: 3150 },
];

const ultimasEntregas = [
  { fecha: '2026-02-10', kg: 460, tipo: 'Pergamino', estado: 'pagado' as const },
  { fecha: '2026-01-28', kg: 230, tipo: 'Pergamino', estado: 'parcial' as const },
  { fecha: '2026-01-15', kg: 345, tipo: 'Cereza', estado: 'pagado' as const },
  { fecha: '2025-12-20', kg: 575, tipo: 'Pergamino', estado: 'pagado' as const },
  { fecha: '2025-11-20', kg: 520, tipo: 'Pergamino', estado: 'pagado' as const },
];

const alertasClima = [
  { texto: 'Lluvia intensa prevista para el 2 de marzo', nivel: 'ambar' as const },
  { texto: 'Broca detectada en sector norte — El Mirador', nivel: 'rojo' as const },
];

export default function DashboardProductor() {
  const navigate = useNavigate();
  const s = getProductorStats();
  const totalKg = ultimasEntregas.reduce((sum, e) => sum + e.kg, 0);

  const kpis = [
    { label: 'Total entregado', value: `${totalKg.toLocaleString()} kg`, icon: Package, route: '/productor/finanzas' },
    { label: 'Parcelas activas', value: s.parcelas, icon: MapPin, route: '/productor/produccion' },
    { label: 'Próximo pago est.', value: '₡125,000', icon: DollarSign, route: '/productor/finanzas' },
    { label: 'Score VITAL', value: `${s.puntajeVITAL}/100`, icon: Shield, route: '/productor/sostenibilidad' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(kpi.route)}
          >
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Entregas por mes (kg)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={entregasMensuales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="kg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Tendencia de precios (₡/kg)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={preciosTendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="precio" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent entregas + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Últimas entregas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ultimasEntregas.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.kg} kg — {e.tipo}</p>
                    <p className="text-xs text-muted-foreground">{e.fecha}</p>
                  </div>
                  <Badge variant={e.estado === 'pagado' ? 'default' : 'secondary'}>
                    {e.estado === 'pagado' ? 'Pagado' : 'Parcial'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CloudSun className="h-4 w-4 text-accent" /> Alertas y clima
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertasClima.map((a, i) => (
              <div
                key={i}
                className={`p-3 rounded-md border ${a.nivel === 'rojo' ? 'bg-destructive/5 border-destructive/20' : 'bg-accent/5 border-accent/20'}`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${a.nivel === 'rojo' ? 'text-destructive' : 'text-accent'}`} />
                  <p className="text-sm text-foreground">{a.texto}</p>
                </div>
              </div>
            ))}
            <div className="p-3 rounded-md bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">Temperatura: 22°C</p>
              <p className="text-xs text-muted-foreground">Humedad: 78%</p>
              <p className="text-xs text-muted-foreground">Pronóstico: Parcialmente nublado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
