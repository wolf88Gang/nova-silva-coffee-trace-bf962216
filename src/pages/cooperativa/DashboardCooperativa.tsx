import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  Users, MapPin, Package, Wallet, ShieldCheck, AlertTriangle,
  TrendingUp, Leaf, ArrowRight
} from 'lucide-react';
import { getCooperativaStats, DEMO_ALERTAS, DEMO_ENTREGAS } from '@/lib/demo-data';

const nivelColor = (nivel: string) => {
  if (nivel === 'rojo') return 'destructive';
  if (nivel === 'ambar') return 'secondary';
  return 'default';
};

export default function DashboardCooperativa() {
  const stats = getCooperativaStats();
  const navigate = useNavigate();

  const kpis = [
    { label: 'Productores activos', value: stats.totalProductores, icon: Users, route: '/cooperativa/productores' },
    { label: 'Hectáreas bajo gestión', value: `${stats.hectareasTotales.toFixed(1)} ha`, icon: MapPin },
    { label: 'Volumen acopiado', value: `${stats.volumenAcopiado} QQ`, icon: Package, route: '/cooperativa/lotes-acopio' },
    { label: 'Lotes en proceso', value: stats.lotesEnProceso, icon: Package, route: '/cooperativa/lotes-acopio' },
    { label: 'Créditos activos', value: `₡${stats.creditosActivos.toLocaleString()}`, icon: Wallet, route: '/cooperativa/creditos' },
    { label: 'EUDR Compliance', value: `${stats.eudrCompliance}%`, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className={kpi.route ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
            onClick={() => kpi.route && navigate(kpi.route)}
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* VITAL Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" />
              Protocolo VITAL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Puntaje promedio</span>
              <span className="text-lg font-bold text-foreground">{stats.promedioVITAL}/100</span>
            </div>
            <Progress value={stats.promedioVITAL} className="h-2" />
            <div className="grid grid-cols-4 gap-2 text-xs text-center pt-2">
              <div className="rounded bg-destructive/10 text-destructive p-1.5">
                <p className="font-bold">1</p><p>Crítico</p>
              </div>
              <div className="rounded bg-yellow-500/10 text-yellow-600 p-1.5">
                <p className="font-bold">1</p><p>Desarrollo</p>
              </div>
              <div className="rounded bg-primary/10 text-primary p-1.5">
                <p className="font-bold">4</p><p>Sostenible</p>
              </div>
              <div className="rounded bg-emerald-500/10 text-emerald-600 p-1.5">
                <p className="font-bold">2</p><p>Ejemplar</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/cooperativa/vital')}>
              Ver detalles <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent" />
              Alertas pendientes
              <Badge variant="destructive" className="ml-auto">{stats.alertasPendientes}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO_ALERTAS.map((alerta) => (
              <div key={alerta.id} className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                <Badge variant={nivelColor(alerta.nivel)} className="mt-0.5 text-[10px] uppercase shrink-0">
                  {alerta.nivel}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{alerta.titulo}</p>
                  <p className="text-xs text-muted-foreground">{alerta.fecha}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Últimas entregas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Últimas entregas
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/cooperativa/lotes-acopio')}>
              Ver todo <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="py-2 font-medium">Productor</th>
                  <th className="py-2 font-medium">Fecha</th>
                  <th className="py-2 font-medium">Peso (kg)</th>
                  <th className="py-2 font-medium">Tipo</th>
                  <th className="py-2 font-medium">Estado pago</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ENTREGAS.slice(0, 5).map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 text-foreground font-medium">{e.productorNombre}</td>
                    <td className="py-2 text-muted-foreground">{e.fecha}</td>
                    <td className="py-2">{e.pesoKg}</td>
                    <td className="py-2">{e.tipoCafe}</td>
                    <td className="py-2">
                      <Badge variant={e.estadoPago === 'pagado' ? 'default' : e.estadoPago === 'pendiente' ? 'secondary' : 'outline'}>
                        {e.estadoPago}
                      </Badge>
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
