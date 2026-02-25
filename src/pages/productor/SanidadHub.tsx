import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bug, AlertTriangle, Calendar, MapPin, Shield } from 'lucide-react';

const alertasMock = [
  { id: '1', titulo: 'Broca detectada — Parcela El Mirador', severidad: 'alta' as const, fecha: '2026-02-20', zona: 'Sector Norte' },
  { id: '2', titulo: 'Roya leve — Parcela La Esperanza', severidad: 'media' as const, fecha: '2026-02-15', zona: 'Sector Sur' },
  { id: '3', titulo: 'Ojo de gallo — monitoreo preventivo', severidad: 'baja' as const, fecha: '2026-02-10', zona: 'General' },
];

const parcelasPorRiesgo = [
  { nombre: 'El Mirador', riesgo: 'alto' as const, ultimoMonitoreo: '2026-02-20' },
  { nombre: 'La Esperanza', riesgo: 'medio' as const, ultimoMonitoreo: '2026-02-15' },
  { nombre: 'Cerro Verde', riesgo: 'bajo' as const, ultimoMonitoreo: '2026-02-10' },
];

const calendario = [
  { fecha: '2026-03-01', tipo: 'Monitoreo broca', parcela: 'El Mirador' },
  { fecha: '2026-03-05', tipo: 'Aplicación preventiva roya', parcela: 'La Esperanza' },
  { fecha: '2026-03-10', tipo: 'Monitoreo general', parcela: 'Todas' },
];

const sevBadge: Record<string, { label: string; class: string }> = {
  alta: { label: 'Alta', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  media: { label: 'Media', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  baja: { label: 'Baja', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const riesgoBadge: Record<string, { label: string; class: string }> = {
  alto: { label: 'Alto', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  medio: { label: 'Medio', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  bajo: { label: 'Bajo', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

export default function SanidadHub() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Bug className="h-4 w-4 text-destructive" /><span className="text-xs text-muted-foreground">Alertas Activas</span></div>
          <p className="text-2xl font-bold text-foreground">{alertasMock.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Shield className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Parcelas Monitoreadas</span></div>
          <p className="text-2xl font-bold text-foreground">3/3</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Calendar className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Próximo Monitoreo</span></div>
          <p className="text-2xl font-bold text-foreground">1 Mar</p>
        </CardContent></Card>
      </div>

      {/* Alertas */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-accent" /> Alertas Fitosanitarias</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {alertasMock.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{a.titulo}</p>
                <p className="text-xs text-muted-foreground">{a.fecha} — {a.zona}</p>
              </div>
              <Badge className={sevBadge[a.severidad].class}>{sevBadge[a.severidad].label}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Estado de parcelas */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Estado de Parcelas por Riesgo</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {parcelasPorRiesgo.map(p => (
            <div key={p.nombre} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{p.nombre}</p>
                <p className="text-xs text-muted-foreground">Último monitoreo: {p.ultimoMonitoreo}</p>
              </div>
              <Badge className={riesgoBadge[p.riesgo].class}>{riesgoBadge[p.riesgo].label}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Calendario */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Calendario de Monitoreo</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {calendario.map((c, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <div className="text-center bg-muted rounded-md px-3 py-1">
                <p className="text-xs text-muted-foreground">{c.fecha.split('-')[1]}/{c.fecha.split('-')[2]}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{c.tipo}</p>
                <p className="text-xs text-muted-foreground">Parcela: {c.parcela}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
