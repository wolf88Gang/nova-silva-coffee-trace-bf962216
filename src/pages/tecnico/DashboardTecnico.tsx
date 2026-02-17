import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, Stethoscope, Calendar, AlertTriangle, ArrowRight, Leaf } from 'lucide-react';
import { getTecnicoStats, DEMO_VISITAS, DEMO_PRODUCTORES } from '@/lib/demo-data';

export default function DashboardTecnico() {
  const stats = getTecnicoStats();
  const navigate = useNavigate();

  const kpis = [
    { label: 'Productores asignados', value: stats.productoresAsignados, icon: Users, route: '/tecnico/productores' },
    { label: 'Evaluaciones pendientes', value: stats.evaluacionesPendientes, icon: ClipboardList, route: '/tecnico/vital' },
    { label: 'Completadas (mes)', value: stats.evaluacionesCompletadas, icon: Stethoscope },
    { label: 'Visitas hoy', value: stats.visitasHoy, icon: Calendar, route: '/tecnico/visitas' },
    { label: 'Bajo VITAL (<50)', value: stats.productoresBajoVITAL, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Visitas programadas hoy</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tecnico/visitas')}>Ver todo <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </div>
            <div className="space-y-2">
              {DEMO_VISITAS.filter(v => v.fecha === '2026-02-17').map(v => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{v.productorNombre}</p>
                    <p className="text-xs text-muted-foreground">{v.tipo} — {v.comunidad}</p>
                  </div>
                  <Badge variant={v.estado === 'programada' ? 'secondary' : 'default'}>{v.estado}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-accent" /> Productores con bajo VITAL</h3>
            <div className="space-y-2">
              {DEMO_PRODUCTORES.filter(p => p.puntajeVITAL < 50).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-md bg-destructive/5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">{p.comunidad}</p>
                  </div>
                  <span className="text-lg font-bold text-destructive">{p.puntajeVITAL}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
