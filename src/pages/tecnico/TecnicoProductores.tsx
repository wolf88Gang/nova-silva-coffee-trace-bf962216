import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Leaf, Eye, Search, Filter, MapPin, Package, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { DEMO_PRODUCTORES, DEMO_ENTREGAS, type DemoProductor } from '@/lib/demo-data';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle } from '@/lib/chartStyles';

import { getVitalLevel, VITAL_FILTER_OPTIONS } from '@/lib/vitalLevels';

const getNivel = (p: number) => {
  const l = getVitalLevel(p);
  return { label: l.label, color: l.badgeColor };
};

// Simulated VITAL component scores
const getVitalComponents = (score: number) => [
  { axis: 'Agua', value: Math.min(100, score + Math.round(Math.random() * 20 - 10)) },
  { axis: 'Suelo', value: Math.min(100, score + Math.round(Math.random() * 20 - 10)) },
  { axis: 'Biodiversidad', value: Math.min(100, score + Math.round(Math.random() * 20 - 10)) },
  { axis: 'Económico', value: Math.min(100, score + Math.round(Math.random() * 20 - 10)) },
  { axis: 'Social', value: Math.min(100, score + Math.round(Math.random() * 20 - 10)) },
  { axis: 'Clima', value: Math.min(100, score + Math.round(Math.random() * 20 - 10)) },
];

export default function TecnicoProductores() {
  const [search, setSearch] = useState('');
  const [filterNivel, setFilterNivel] = useState<string>('all');
  const [filterComunidad, setFilterComunidad] = useState<string>('all');
  const [selectedProductor, setSelectedProductor] = useState<DemoProductor | null>(null);

  const comunidades = useMemo(() => [...new Set(DEMO_PRODUCTORES.map(p => p.comunidad))], []);

  const filtered = useMemo(() => {
    return DEMO_PRODUCTORES.filter(p => {
      if (search && !p.nombre.toLowerCase().includes(search.toLowerCase()) && !p.comunidad.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterComunidad !== 'all' && p.comunidad !== filterComunidad) return false;
      if (filterNivel !== 'all') {
        const nivel = getNivel(p.puntajeVITAL).label;
        if (nivel !== filterNivel) return false;
      }
      return true;
    });
  }, [search, filterNivel, filterComunidad]);

  // Stats
  const criticos = DEMO_PRODUCTORES.filter(p => p.puntajeVITAL < 41).length;
  const promedio = Math.round(DEMO_PRODUCTORES.reduce((s, p) => s + p.puntajeVITAL, 0) / DEMO_PRODUCTORES.length);
  const sinEntrega30d = DEMO_PRODUCTORES.filter(p => !p.ultimaEntrega || p.ultimaEntrega < '2026-01-17').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Asignados</p>
          <p className="text-2xl font-bold text-foreground">{DEMO_PRODUCTORES.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Promedio VITAL</p>
          <p className="text-2xl font-bold text-foreground">{promedio}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" /> En riesgo</p>
          <p className="text-2xl font-bold text-destructive">{criticos}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Sin entrega &gt;30d</p>
          <p className="text-2xl font-bold text-foreground">{sinEntrega30d}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Users className="h-5 w-5 text-primary" /> Productores Asignados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o comunidad..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterNivel} onValueChange={setFilterNivel}>
              <SelectTrigger className="w-[160px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Nivel VITAL" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                {VITAL_FILTER_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterComunidad} onValueChange={setFilterComunidad}>
              <SelectTrigger className="w-[160px]"><MapPin className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Comunidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {comunidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">{filtered.length} de {DEMO_PRODUCTORES.length} productores</p>

          <div className="space-y-3">
            {filtered.map(p => {
              const nivel = getNivel(p.puntajeVITAL);
              return (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{p.nombre}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.comunidad}</span>
                      <span>{p.parcelas} parcelas · {p.hectareas} ha</span>
                      {p.ultimaEntrega && <span className="flex items-center gap-1"><Package className="h-3 w-3" />Última: {p.ultimaEntrega}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Leaf className="h-3 w-3 text-primary" />
                        <span className="text-lg font-bold text-foreground">{p.puntajeVITAL}</span>
                      </div>
                      <Badge className={nivel.color} variant="outline">{nivel.label}</Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedProductor(p)}>
                      <Eye className="h-3 w-3 mr-1" /> Detalle
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Producer detail dialog */}
      <Dialog open={!!selectedProductor} onOpenChange={() => setSelectedProductor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {selectedProductor?.nombre}
            </DialogTitle>
          </DialogHeader>
          {selectedProductor && (() => {
            const nivel = getNivel(selectedProductor.puntajeVITAL);
            const radarData = getVitalComponents(selectedProductor.puntajeVITAL);
            const entregas = DEMO_ENTREGAS.filter(e => e.productorNombre === selectedProductor.nombre);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg border border-border text-center">
                    <p className="text-xs text-muted-foreground">VITAL</p>
                    <p className="text-xl font-bold text-foreground">{selectedProductor.puntajeVITAL}</p>
                    <Badge className={nivel.color} variant="outline">{nivel.label}</Badge>
                  </div>
                  <div className="p-3 rounded-lg border border-border text-center">
                    <p className="text-xs text-muted-foreground">Parcelas</p>
                    <p className="text-xl font-bold text-foreground">{selectedProductor.parcelas}</p>
                    <p className="text-xs text-muted-foreground">{selectedProductor.hectareas} ha</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border text-center">
                    <p className="text-xs text-muted-foreground">EUDR</p>
                    <Badge variant={selectedProductor.estadoEUDR === 'compliant' ? 'default' : selectedProductor.estadoEUDR === 'pending' ? 'secondary' : 'destructive'}>
                      {selectedProductor.estadoEUDR === 'compliant' ? 'Cumple' : selectedProductor.estadoEUDR === 'pending' ? 'Pendiente' : 'No cumple'}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border border-border text-center">
                    <p className="text-xs text-muted-foreground">Entregas</p>
                    <p className="text-xl font-bold text-foreground">{entregas.length}</p>
                  </div>
                </div>

                {/* Radar */}
                <div className="p-4 rounded-lg border border-border">
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-primary" /> Perfil VITAL por componente
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Recent deliveries */}
                {entregas.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1"><Package className="h-4 w-4 text-primary" /> Últimas entregas</p>
                    <div className="space-y-2">
                      {entregas.map(e => (
                        <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-border text-sm">
                          <div>
                            <span className="text-foreground">{e.fecha}</span>
                            <span className="text-muted-foreground ml-2">{e.tipoCafe}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-foreground">{e.pesoKg} kg</span>
                            <Badge variant={e.estadoPago === 'pagado' ? 'default' : 'secondary'} className="ml-2">
                              {e.estadoPago === 'pagado' ? 'Pagado' : e.estadoPago === 'parcial' ? 'Parcial' : 'Pendiente'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-sm font-medium text-foreground mb-1">Recomendación Nova Silva</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedProductor.puntajeVITAL < 41
                      ? 'Productor en estado crítico. Priorizar visita de diagnóstico integral y programar plan de mejora urgente con enfoque en los ejes más débiles del radar VITAL.'
                      : selectedProductor.puntajeVITAL < 61
                      ? 'Productor en fragilidad sistémica. Reforzar capacitación en manejo sostenible y verificar cumplimiento de requisitos mínimos.'
                      : selectedProductor.puntajeVITAL < 81
                      ? 'Resiliencia en construcción. Focalizar mejora en los 2 ejes más bajos del radar para aspirar a nivel Resiliente.'
                      : 'Productor resiliente. Candidato para programa de promotor comunitario y mentoría de productores en fragilidad.'}
                  </p>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
