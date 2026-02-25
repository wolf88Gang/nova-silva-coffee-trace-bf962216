import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bug, CloudRain, MapPin, AlertTriangle } from 'lucide-react';

const alertasActivas = [
  { id: 1, titulo: 'Brote de Broca en Sector Norte', zona: 'Zona Norte — Veredas El Progreso, La Unión', fecha: '2026-02-24', severity: 'destructive' as const },
  { id: 2, titulo: 'Condiciones favorables para Roya', zona: 'Zona Central — Humedad relativa >85%', fecha: '2026-02-23', severity: 'warning' as const },
  { id: 3, titulo: 'Aplicación preventiva completada', zona: 'Zona Sur — 12 fincas tratadas', fecha: '2026-02-22', severity: 'success' as const },
];

const severityBadge = (s: string) => {
  if (s === 'destructive') return <Badge variant="destructive">Crítica</Badge>;
  if (s === 'warning') return <Badge className="bg-amber-500 text-white border-0">Moderada</Badge>;
  return <Badge className="bg-emerald-500 text-white border-0">Resuelta</Badge>;
};

export default function NovaGuardTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Monitoreo fitosanitario y alertas de campo</p>

      {/* Incidence cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">Roya</span>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">Normal</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Incidencia en parcelas monitoreadas</p>
            <p className="text-3xl font-bold text-primary mt-1">2.1%</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-destructive" />
                <span className="font-bold text-foreground">Broca</span>
              </div>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0">⚠ ALERTA</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Umbral económico: 5%</p>
            <p className="text-3xl font-bold text-destructive mt-1">15.4%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-blue-500" />
                <span className="font-bold text-foreground">Clima</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">Estable</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Condiciones actuales promedio</p>
            <p className="text-xl font-bold text-foreground mt-1">28°C / 78% HR</p>
          </CardContent>
        </Card>
      </div>

      {/* Map + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-destructive" />
              Mapa de Riesgo Fitosanitario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[350px] rounded-lg bg-muted/50 border border-border flex flex-col items-center justify-center gap-2">
              <MapPin className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Mapa interactivo — Próximamente</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent" />
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertasActivas.map((a) => (
              <div key={a.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.zona}</p>
                    <p className="text-xs text-muted-foreground">{a.fecha}</p>
                  </div>
                  {severityBadge(a.severity)}
                </div>
                <Button variant="outline" size="sm" className="w-full">Ver detalles</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
