import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDemoTraceability } from '@/lib/demoSeedData';
import { ShieldCheck, Package, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const estadoColor: Record<string, string> = { Trazado: 'default', 'En proceso': 'secondary', Pendiente: 'destructive' };

export default function TrazabilidadIndex() {
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

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Package className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{traces.length}</p><p className="text-xs text-muted-foreground">Lotes trazables</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{trazados}</p><p className="text-xs text-muted-foreground">Trazabilidad completa</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Clock className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">{enProceso}</p><p className="text-xs text-muted-foreground">En proceso</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-destructive" /><div><p className="text-2xl font-bold">{pendientes}</p><p className="text-xs text-muted-foreground">Pendientes</p></div></div></CardContent></Card>
      </div>

      {/* Trace cards with chain of custody timeline */}
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

              {/* Chain of custody timeline */}
              <div className="flex items-center gap-1">
                {t.pasos.map((p, j) => (
                  <div key={j} className="flex items-center gap-1 flex-1">
                    <div className={`flex flex-col items-center flex-1 ${j > 0 ? '' : ''}`}>
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
