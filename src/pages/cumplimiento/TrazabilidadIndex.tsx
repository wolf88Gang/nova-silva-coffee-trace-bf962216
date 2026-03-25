import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDemoTraceability } from '@/lib/demoSeedData';
import { useOperatingModel } from '@/lib/operatingModel';
import { ShieldCheck, Package, CheckCircle2, Clock, AlertTriangle, MapPin, FileText, Upload, Leaf } from 'lucide-react';
import { toast } from 'sonner';

const estadoColor: Record<string, string> = { Trazado: 'default', 'En proceso': 'secondary', Pendiente: 'destructive' };

// Demo parcels for producer traceability
const demoParcelas = [
  { id: '1', nombre: 'Lote El Roble', variedad: 'Caturra', hectareas: 1.2, coordenadas: '9.9345, -83.9123', eudr: 'Aprobado', ultimaEntrega: '2026-02-20', volumen: '12 qq' },
  { id: '2', nombre: 'Lote La Cumbre', variedad: 'Catuaí', hectareas: 0.8, coordenadas: '9.9350, -83.9130', eudr: 'En revisión', ultimaEntrega: '2026-02-15', volumen: '8 qq' },
  { id: '3', nombre: 'Lote Sombra', variedad: 'Gesha', hectareas: 0.5, coordenadas: '9.9340, -83.9140', eudr: 'Pendiente', ultimaEntrega: null, volumen: '—' },
];

const demoEntregas = [
  { fecha: '2026-02-20', lote: 'Lote El Roble', volumen: '12 qq', estado: 'Recibido', receptor: 'Cooperativa Tarrazú', codigoTrazabilidad: 'TRZ-2026-0234' },
  { fecha: '2026-02-15', lote: 'Lote La Cumbre', volumen: '8 qq', estado: 'En tránsito', receptor: 'Cooperativa Tarrazú', codigoTrazabilidad: 'TRZ-2026-0219' },
  { fecha: '2026-01-28', lote: 'Lote El Roble', volumen: '15 qq', estado: 'Recibido', receptor: 'Cooperativa Tarrazú', codigoTrazabilidad: 'TRZ-2026-0187' },
];

function ProducerTraceability() {
  const parcelasAprobadas = demoParcelas.filter(p => p.eudr === 'Aprobado').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Mi Trazabilidad" description="Origen de tu café, pasaporte EUDR y cadena de custodia" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{demoParcelas.length}</p><p className="text-xs text-muted-foreground">Parcelas registradas</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{parcelasAprobadas}/{demoParcelas.length}</p><p className="text-xs text-muted-foreground">EUDR aprobadas</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Package className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{demoEntregas.length}</p><p className="text-xs text-muted-foreground">Entregas trazadas</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">100%</p><p className="text-xs text-muted-foreground">Trazabilidad</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="parcelas">
        <TabsList>
          <TabsTrigger value="parcelas">Mis parcelas</TabsTrigger>
          <TabsTrigger value="entregas">Entregas trazadas</TabsTrigger>
          <TabsTrigger value="eudr">Pasaporte EUDR</TabsTrigger>
        </TabsList>

        <TabsContent value="parcelas" className="mt-4 space-y-3">
          {demoParcelas.map(p => (
            <Card key={p.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-primary" />
                      <p className="font-medium text-sm">{p.nombre}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.variedad} · {p.hectareas} ha · GPS: {p.coordenadas}</p>
                    <p className="text-xs text-muted-foreground">Última entrega: {p.ultimaEntrega ?? 'Sin entregas'} · {p.volumen}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.eudr === 'Aprobado' ? 'default' : p.eudr === 'En revisión' ? 'secondary' : 'destructive'} className="text-xs">
                      EUDR: {p.eudr}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success('Solicitud de verificación EUDR enviada')}>
            <Upload className="h-4 w-4" /> Solicitar verificación EUDR
          </Button>
        </TabsContent>

        <TabsContent value="entregas" className="mt-4 space-y-3">
          {demoEntregas.map((e, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{e.lote} → {e.receptor}</p>
                    <p className="text-xs text-muted-foreground">{e.fecha} · {e.volumen} · Código: {e.codigoTrazabilidad}</p>
                  </div>
                  <Badge variant={e.estado === 'Recibido' ? 'default' : 'secondary'} className="text-xs">{e.estado}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="eudr" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Estado del Pasaporte EUDR</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium text-primary">Su finca tiene {parcelasAprobadas} de {demoParcelas.length} parcelas con verificación EUDR aprobada.</p>
                <p className="text-xs text-muted-foreground mt-1">La regulación EUDR exige que todo el café exportado a la UE demuestre origen libre de deforestación post-2020.</p>
              </div>
              {demoParcelas.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">GPS: {p.coordenadas} · {p.hectareas} ha</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.eudr === 'Aprobado' ? 'default' : p.eudr === 'En revisión' ? 'secondary' : 'destructive'} className="text-xs">{p.eudr}</Badge>
                    {p.eudr !== 'Aprobado' && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => toast.info('Documentación subida para revisión')}>
                        <FileText className="h-3 w-3" /> Subir evidencia
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TrazabilidadIndex() {
  const model = useOperatingModel();
  const isProducer = model === 'single_farm' || model === 'estate';

  if (isProducer) return <ProducerTraceability />;

  // Organization view (cooperativa, exportador, etc.)
  const traces = getDemoTraceability();
  const trazados = traces.filter(t => t.estado === 'Trazado').length;
  const enProceso = traces.filter(t => t.estado === 'En proceso').length;
  const pendientes = traces.filter(t => t.estado === 'Pendiente').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Trazabilidad" description="Cadena de custodia y estado de trazabilidad por lote" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Package className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{traces.length}</p><p className="text-xs text-muted-foreground">Lotes trazables</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{trazados}</p><p className="text-xs text-muted-foreground">Trazabilidad completa</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Clock className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">{enProceso}</p><p className="text-xs text-muted-foreground">En proceso</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-destructive" /><div><p className="text-2xl font-bold">{pendientes}</p><p className="text-xs text-muted-foreground">Pendientes</p></div></div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {traces.map((t, i) => (
          <Card key={i}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-medium">{t.lote}</p>
                  <p className="text-sm text-muted-foreground">{t.origen} · {t.productores} productores · {t.volumen}</p>
                </div>
                <Badge variant={(estadoColor[t.estado] as any) || 'secondary'} className="text-xs">{t.estado}</Badge>
              </div>
              <div className="flex items-center gap-1">
                {t.pasos.map((p, j) => (
                  <div key={j} className="flex items-center gap-1 flex-1">
                    <div className="flex flex-col items-center flex-1">
                      {j > 0 && <div className={`h-0.5 w-full mb-1 ${t.pasos[j - 1].completado ? 'bg-primary' : 'bg-border'}`} />}
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${p.completado ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-border'}`}>
                        {p.completado ? <CheckCircle2 className="h-4 w-4" /> : <span>{j + 1}</span>}
                      </div>
                      <p className={`text-[10px] mt-1 text-center leading-tight ${p.completado ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{p.etapa}</p>
                      {p.fecha && <p className="text-[9px] text-muted-foreground/60">{p.fecha}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
