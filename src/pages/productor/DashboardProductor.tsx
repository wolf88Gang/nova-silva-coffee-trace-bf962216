import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sprout, MapPin, Wallet, Leaf, Bell, ArrowRight, TrendingUp } from 'lucide-react';
import { getProductorStats } from '@/lib/demo-data';

export default function DashboardProductor() {
  const stats = getProductorStats();
  const navigate = useNavigate();

  const kpis = [
    { label: 'Parcelas', value: stats.parcelas, icon: MapPin, route: '/productor/produccion' },
    { label: 'Hectáreas', value: `${stats.hectareas} ha`, icon: Sprout },
    { label: 'Última entrega', value: stats.ultimaEntrega, icon: TrendingUp },
    { label: 'Créditos activos', value: stats.creditosActivos, icon: Wallet, route: '/productor/finanzas-hub' },
    { label: 'Puntaje VITAL', value: `${stats.puntajeVITAL}/100`, icon: Leaf, route: '/productor/sostenibilidad' },
    { label: 'Avisos no leídos', value: stats.avisosNoLeidos, icon: Bell, route: '/productor/comunidad' },
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
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> Puntaje VITAL</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Nivel: Sostenible</span>
              <span className="text-lg font-bold">{stats.puntajeVITAL}/100</span>
            </div>
            <Progress value={stats.puntajeVITAL} className="h-2" />
            <div className="mt-3 p-3 rounded-md bg-primary/5 border border-primary/20">
              <p className="text-sm font-semibold text-primary">Su finca muestra buenas prácticas de sostenibilidad. Considere mejorar la dimensión económica para alcanzar nivel Ejemplar.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Bell className="h-4 w-4 text-accent" /> Avisos recientes</h3>
            <div className="space-y-2">
              {[
                { titulo: 'Inicio de temporada de cosecha 2026', tipo: 'informativo', leido: false },
                { titulo: 'Alerta: Roya detectada en zona El Progreso', tipo: 'urgente', leido: false },
                { titulo: 'Capacitación en buenas prácticas', tipo: 'evento', leido: true },
              ].map((a, i) => (
                <div key={i} className={`p-2 rounded-md ${!a.leido ? 'bg-primary/5' : 'bg-muted/50'}`}>
                  <p className={`text-sm ${!a.leido ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{a.titulo}</p>
                  <Badge variant={a.tipo === 'urgente' ? 'destructive' : a.tipo === 'evento' ? 'secondary' : 'default'} className="mt-1 text-[10px]">{a.tipo}</Badge>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/productor/comunidad')}>Ver todos <ArrowRight className="h-3 w-3 ml-1" /></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
