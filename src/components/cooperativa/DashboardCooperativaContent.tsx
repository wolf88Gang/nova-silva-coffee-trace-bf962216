import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Package, Shield, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const entregas6m = [
  { mes: 'Sep', kg: 12400 },
  { mes: 'Oct', kg: 15800 },
  { mes: 'Nov', kg: 18200 },
  { mes: 'Dic', kg: 9600 },
  { mes: 'Ene', kg: 14300 },
  { mes: 'Feb', kg: 18450 },
];

const alertas = [
  { id: 1, titulo: 'Broca detectada - Sector Norte', tiempo: 'Hace 2 horas', severity: 'destructive' as const },
  { id: 2, titulo: 'Stock fertilizante bajo mínimo', tiempo: 'Hace 1 día', severity: 'warning' as const },
  { id: 3, titulo: '3 productores sin visita técnica > 30 días', tiempo: 'Hace 2 días', severity: 'warning' as const },
  { id: 4, titulo: 'Protocolo VITAL completado - Lote 045', tiempo: 'Hace 3 días', severity: 'success' as const },
];

const ultimasEntregas = [
  { fecha: '2026-02-24', productor: 'María del Carmen Ortiz', parcela: 'El Mirador', kg: 320, tipo: 'Caturra lavado', pago: 'Pagado' },
  { fecha: '2026-02-23', productor: 'José Hernández López', parcela: 'La Esperanza', kg: 480, tipo: 'Castillo natural', pago: 'Pendiente' },
  { fecha: '2026-02-22', productor: 'Ana Lucía Betancourt', parcela: 'Buena Vista', kg: 215, tipo: 'Colombia lavado', pago: 'En proceso' },
  { fecha: '2026-02-21', productor: 'Carlos Andrés Muñoz', parcela: 'Las Palmas', kg: 560, tipo: 'Geisha honey', pago: 'Pagado' },
  { fecha: '2026-02-20', productor: 'Rosa Elena Castillo', parcela: 'San Rafael', kg: 390, tipo: 'Caturra lavado', pago: 'Pendiente' },
];

const severityColor = (s: string) => {
  if (s === 'destructive') return 'bg-destructive text-destructive-foreground';
  if (s === 'warning') return 'bg-amber-500 text-white';
  return 'bg-emerald-500 text-white';
};

const pagoVariant = (p: string) => {
  if (p === 'Pagado') return 'default';
  if (p === 'Pendiente') return 'secondary';
  return 'outline';
};

const kpis = [
  { label: 'Productores Activos', value: '247', sub: '+12 este trimestre', icon: Users, color: 'text-primary' },
  { label: 'Entregas del Mes', value: '18,450 kg', sub: '↑ 8% vs mes anterior', icon: Package, color: 'text-accent' },
  { label: 'Protocolo VITAL Promedio', value: '72/100', sub: 'Nivel 3 - Resiliente', icon: Shield, color: 'text-emerald-600' },
  { label: 'Alertas Activas', value: '3', sub: '1 crítica, 2 moderadas', icon: AlertTriangle, color: 'text-destructive' },
];

export default function DashboardCooperativaContent() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <k.icon className={`h-5 w-5 ${k.color}`} />
                <span className="text-xs text-muted-foreground">{k.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Entregas Últimos 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={entregas6m}>
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Entregas']}
                />
                <Bar dataKey="kg" name="kg" radius={[4, 4, 0, 0]}>
                  {entregas6m.map((_, i) => <Cell key={i} fill="hsl(var(--primary))" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent" />
              Alertas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-0">
                {alertas.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b last:border-0">
                    <span className={`mt-0.5 inline-block w-2 h-2 rounded-full shrink-0 ${severityColor(a.severity)}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{a.titulo}</p>
                      <p className="text-xs text-muted-foreground">{a.tiempo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Últimas Entregas Registradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Productor</th>
                  <th className="px-4 py-3 font-medium">Parcela</th>
                  <th className="px-4 py-3 font-medium">Cantidad (kg)</th>
                  <th className="px-4 py-3 font-medium">Tipo café</th>
                  <th className="px-4 py-3 font-medium">Estado pago</th>
                </tr>
              </thead>
              <tbody>
                {ultimasEntregas.map((e, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{e.fecha}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{e.productor}</td>
                    <td className="px-4 py-3">{e.parcela}</td>
                    <td className="px-4 py-3 font-medium">{e.kg.toLocaleString()}</td>
                    <td className="px-4 py-3">{e.tipo}</td>
                    <td className="px-4 py-3">
                      <Badge variant={pagoVariant(e.pago) as any}>{e.pago}</Badge>
                    </td>
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
