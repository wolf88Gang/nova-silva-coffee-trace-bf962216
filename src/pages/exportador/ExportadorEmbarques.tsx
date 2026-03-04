import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Ship, MapPin, Calendar, Package, Clock, CheckCircle, Anchor, Plus } from 'lucide-react';
import { toast } from 'sonner';

const embarques = [
  { id: '1', bl: 'BL-2026-0045', contrato: 'NS-2026-001', naviera: 'Maersk', buque: 'MV Cartagena Express', puertoOrigen: 'Puerto Quetzal, GT', puertoDestino: 'Hamburgo, DE', fechaSalida: '2026-03-20', llegadaEstimada: '2026-04-25', contenedores: 1, tipo: '20ft FCL', peso: 17250, sacos: 250, estado: 'programado' as const,
    timeline: [
      { paso: 'Booking confirmado', fecha: '2026-02-28', completo: true },
      { paso: 'Documentos entregados', fecha: '2026-03-10', completo: true },
      { paso: 'Contenedor cargado', fecha: '2026-03-18', completo: false },
      { paso: 'Zarpe', fecha: '2026-03-20', completo: false },
      { paso: 'Arribo estimado', fecha: '2026-04-25', completo: false },
    ],
  },
  { id: '2', bl: 'BL-2026-0038', contrato: 'NS-2026-002', naviera: 'Hapag-Lloyd', buque: 'MV Pacific Bridge', puertoOrigen: 'Puerto Limón, CR', puertoDestino: 'Gotemburgo, SE', fechaSalida: '2026-02-10', llegadaEstimada: '2026-03-15', contenedores: 1, tipo: '20ft FCL', peso: 12420, sacos: 180, estado: 'en_transito' as const,
    timeline: [
      { paso: 'Booking confirmado', fecha: '2026-01-20', completo: true },
      { paso: 'Documentos entregados', fecha: '2026-02-05', completo: true },
      { paso: 'Contenedor cargado', fecha: '2026-02-08', completo: true },
      { paso: 'Zarpe', fecha: '2026-02-10', completo: true },
      { paso: 'Arribo estimado', fecha: '2026-03-15', completo: false },
    ],
  },
  { id: '3', bl: 'BL-2025-0122', contrato: 'NS-2025-015', naviera: 'MSC', buque: 'MSC Floriana', puertoOrigen: 'Puerto Quetzal, GT', puertoDestino: 'Bremen, DE', fechaSalida: '2025-12-15', llegadaEstimada: '2026-01-18', contenedores: 2, tipo: '20ft FCL', peso: 22080, sacos: 320, estado: 'entregado' as const,
    timeline: [
      { paso: 'Booking confirmado', fecha: '2025-11-25', completo: true },
      { paso: 'Documentos entregados', fecha: '2025-12-10', completo: true },
      { paso: 'Contenedor cargado', fecha: '2025-12-13', completo: true },
      { paso: 'Zarpe', fecha: '2025-12-15', completo: true },
      { paso: 'Arribo y entrega', fecha: '2026-01-18', completo: true },
    ],
  },
];

const estadoConfig = {
  programado: { label: 'Programado', variant: 'outline' as const, icon: Clock },
  en_transito: { label: 'En tránsito', variant: 'default' as const, icon: Ship },
  entregado: { label: 'Entregado', variant: 'secondary' as const, icon: CheckCircle },
};

export default function ExportadorEmbarques() {
  const [selected, setSelected] = useState<typeof embarques[0] | null>(null);

  const enTransito = embarques.filter(e => e.estado === 'en_transito').length;
  const programados = embarques.filter(e => e.estado === 'programado').length;
  const totalSacos = embarques.filter(e => e.estado !== 'entregado').reduce((s, e) => s + e.sacos, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Embarques</h1>
          <p className="text-sm text-muted-foreground">Seguimiento de contenedores y logística marítima</p>
        </div>
        <Button onClick={() => toast.info('Formulario de nuevo embarque próximamente')}><Plus className="h-4 w-4 mr-1" /> Nuevo Embarque</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 mb-1"><Ship className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">En tránsito</span></div><p className="text-2xl font-bold text-foreground">{enTransito}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Programados</span></div><p className="text-2xl font-bold text-foreground">{programados}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Sacos en movimiento</span></div><p className="text-2xl font-bold text-foreground">{totalSacos}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 mb-1"><Anchor className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Entregados (periodo)</span></div><p className="text-2xl font-bold text-foreground">{embarques.filter(e => e.estado === 'entregado').length}</p></CardContent></Card>
      </div>

      <div className="space-y-4">
        {embarques.map((e) => {
          const cfg = estadoConfig[e.estado];
          const Icon = cfg.icon;
          const completados = e.timeline.filter(t => t.completo).length;
          return (
            <Card key={e.id} className="cursor-pointer hover:border-primary/30 transition-all" onClick={() => setSelected(e)}>
              <CardContent className="py-4 px-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{e.bl}</p>
                      <p className="text-xs text-muted-foreground">{e.naviera} · {e.buque}</p>
                    </div>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Origen</p><p className="font-medium text-foreground">{e.puertoOrigen}</p></div>
                  <div><p className="text-xs text-muted-foreground">Destino</p><p className="font-medium text-foreground">{e.puertoDestino}</p></div>
                  <div><p className="text-xs text-muted-foreground">Salida</p><p className="font-medium text-foreground">{e.fechaSalida}</p></div>
                  <div><p className="text-xs text-muted-foreground">Llegada est.</p><p className="font-medium text-foreground">{e.llegadaEstimada}</p></div>
                  <div><p className="text-xs text-muted-foreground">Carga</p><p className="font-medium text-foreground">{e.sacos} sacos · {e.contenedores}×{e.tipo}</p></div>
                </div>
                {/* Mini timeline */}
                <div className="flex gap-1 mt-3">
                  {e.timeline.map((t, i) => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full ${t.completo ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Ship className="h-5 w-5 text-primary" /> {selected?.bl}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <Badge variant={estadoConfig[selected.estado].variant}>{estadoConfig[selected.estado].label}</Badge>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'Naviera', v: selected.naviera },
                  { l: 'Buque', v: selected.buque },
                  { l: 'Contrato', v: selected.contrato },
                  { l: 'Contenedores', v: `${selected.contenedores}× ${selected.tipo}` },
                  { l: 'Peso total', v: `${selected.peso.toLocaleString()} kg` },
                  { l: 'Sacos', v: selected.sacos.toString() },
                ].map(i => (
                  <div key={i.l} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">{i.l}</p>
                    <p className="text-sm font-medium text-foreground">{i.v}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span className="text-sm text-foreground">{selected.puertoOrigen}</span></div>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /><span className="text-sm text-foreground">{selected.puertoDestino}</span></div>
              </div>

              {/* Timeline */}
              <div className="space-y-0">
                <p className="text-sm font-medium text-foreground mb-2">Timeline</p>
                {selected.timeline.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${t.completo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {t.completo ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      </div>
                      {i < selected.timeline.length - 1 && <div className={`w-0.5 h-8 ${t.completo ? 'bg-primary' : 'bg-muted'}`} />}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm ${t.completo ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{t.paso}</p>
                      <p className="text-xs text-muted-foreground">{t.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
