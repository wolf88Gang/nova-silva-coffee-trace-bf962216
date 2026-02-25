import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MapPin, Wallet, Leaf, Bell, ArrowRight, Truck, Shield, Calendar } from 'lucide-react';
import { getProductorStats } from '@/lib/demo-data';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const entregasMock = [
  { mes: 'Sep', kg: 380 },
  { mes: 'Oct', kg: 520 },
  { mes: 'Nov', kg: 460 },
  { mes: 'Dic', kg: 0 },
  { mes: 'Ene', kg: 230 },
  { mes: 'Feb', kg: 460 },
];

export default function DashboardProductor() {
  const stats = getProductorStats();
  const navigate = useNavigate();

  const kpis = [
    { label: 'Última Cosecha', value: '460 kg', icon: Truck, route: '/productor/produccion' },
    { label: 'Próxima Visita', value: '1 Mar', icon: Calendar },
    { label: 'Score VITAL', value: `${stats.puntajeVITAL}/100`, icon: Shield, route: '/productor/sostenibilidad' },
    { label: 'Parcelas Activas', value: stats.parcelas, icon: MapPin, route: '/productor/produccion' },
    { label: 'Créditos', value: stats.creditosActivos, icon: Wallet, route: '/productor/finanzas' },
    { label: 'Avisos', value: stats.avisosNoLeidos, icon: Bell, route: '/productor/avisos' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={kpi.route ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={() => kpi.route && navigate(kpi.route)}>
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gráfico de entregas */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Mis Entregas (6 meses)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={entregasMock}>
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v} kg`, 'Entregado']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="kg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* VITAL + Avisos */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> Protocolo VITAL</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Nivel: Resiliente</span>
                <span className="text-lg font-bold">{stats.puntajeVITAL}/100</span>
              </div>
              <Progress value={stats.puntajeVITAL} className="h-2" />
              <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/productor/sostenibilidad')}>Ver detalle <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Bell className="h-4 w-4 text-accent" /> Avisos recientes</h3>
              <div className="space-y-2">
                {[
                  { titulo: 'Inicio de temporada de cosecha 2026', tipo: 'informativo', leido: false },
                  { titulo: 'Alerta: Broca detectada en Sector Norte', tipo: 'urgente', leido: false },
                ].map((a, i) => (
                  <div key={i} className={`p-2 rounded-md ${!a.leido ? 'bg-primary/5' : 'bg-muted/50'}`}>
                    <p className={`text-sm ${!a.leido ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{a.titulo}</p>
                    <Badge variant={a.tipo === 'urgente' ? 'destructive' : 'default'} className="mt-1 text-[10px]">{a.tipo}</Badge>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/productor/avisos')}>Ver todos <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accesos rápidos */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <h3 className="font-semibold text-foreground mb-3">Accesos Rápidos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Mis Parcelas', route: '/productor/produccion', icon: MapPin },
              { label: 'Sanidad Vegetal', route: '/productor/sanidad', icon: Shield },
              { label: 'Finanzas', route: '/productor/finanzas', icon: Wallet },
              { label: 'Evaluación VITAL', route: '/productor/vital', icon: Leaf },
            ].map(a => (
              <Button key={a.label} variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate(a.route)}>
                <a.icon className="h-5 w-5 text-primary" />
                <span className="text-xs">{a.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
