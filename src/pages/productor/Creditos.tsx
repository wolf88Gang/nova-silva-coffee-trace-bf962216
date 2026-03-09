import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet, AlertTriangle, ArrowLeft, Calendar, DollarSign, FileText,
  CheckCircle, Clock, TrendingUp, Receipt, Leaf,
} from 'lucide-react';

interface Credito {
  id: string;
  monto: number;
  saldo: number;
  estado: 'activo' | 'pagado' | 'vencido';
  tipo: string;
  fechaSolicitud: string;
  fechaAprobacion: string;
  fechaDesembolso: string;
  fechaVencimiento: string;
  proximoPago: string | null;
  tasaInteres: number;
  plazoMeses: number;
  cuotaMensual: number;
  pagos: { fecha: string; monto: number; tipo: string; metodo: string }[];
  garantia: string;
  aprobadoPor: string;
  scoreNova: number;
  motivo: string;
  condiciones: string[];
  interpretacion: string;
}

const creditos: Credito[] = [
  {
    id: '1', monto: 15000, saldo: 8500, estado: 'activo', tipo: 'Insumos',
    fechaSolicitud: '2025-12-15', fechaAprobacion: '2025-12-20', fechaDesembolso: '2025-12-22',
    fechaVencimiento: '2026-06-30', proximoPago: '2026-03-15',
    tasaInteres: 8, plazoMeses: 18, cuotaMensual: 925,
    pagos: [
      { fecha: '2026-01-15', monto: 925, tipo: 'Cuota mensual', metodo: 'Descuento de entrega' },
      { fecha: '2026-01-28', monto: 2000, tipo: 'Abono extraordinario', metodo: 'Transferencia' },
      { fecha: '2026-02-15', monto: 925, tipo: 'Cuota mensual', metodo: 'Descuento de entrega' },
      { fecha: '2026-02-28', monto: 1500, tipo: 'Abono extraordinario', metodo: 'Efectivo' },
      { fecha: '2026-03-01', monto: 1150, tipo: 'Cuota mensual', metodo: 'Descuento de entrega' },
    ],
    garantia: 'Cosecha comprometida 2026 — 30 quintales pergamino',
    aprobadoPor: 'Comité de Crédito — María García',
    scoreNova: 74,
    motivo: 'Compra de fertilizantes y enmiendas para plan de nutrición ciclo 2026. Incluye: 20 sacos de 18-46-0, 15 sacos de KCl, 5 sacos de cal dolomítica, análisis de suelo.',
    condiciones: [
      'Mantener entregas regulares de café a la cooperativa',
      'Implementar plan de nutrición con seguimiento técnico',
      'Análisis de suelo antes de primera aplicación',
      'Informe de progreso a los 90 días',
    ],
    interpretacion: 'Crédito aprobado con base en el Score Crediticio Nova (SCN) de 74 puntos — nivel "Aceptable". El historial de entregas del productor muestra consistencia: 28 quintales/año promedio en los últimos 3 ciclos, con tasa de cumplimiento del 92%. La inversión en nutrición tiene un ROI proyectado de 2.3x según el modelo de Monte Carlo (10,000 simulaciones), con probabilidad de retorno negativo de solo 8.2%. La garantía de cosecha comprometida (30 qq) cubre el 108% del saldo, brindando margen suficiente. El DSCR (Debt Service Coverage Ratio) de 1.45 indica capacidad de pago adecuada. Factor de riesgo identificado: exposición a volatilidad de precio del café — mitigado por contrato forward con exportador a $215/qq.',
  },
  {
    id: '2', monto: 5000, saldo: 0, estado: 'pagado', tipo: 'Emergencia',
    fechaSolicitud: '2025-06-10', fechaAprobacion: '2025-06-11', fechaDesembolso: '2025-06-12',
    fechaVencimiento: '2025-12-31', proximoPago: null,
    tasaInteres: 5, plazoMeses: 6, cuotaMensual: 855,
    pagos: [
      { fecha: '2025-07-15', monto: 855, tipo: 'Cuota mensual', metodo: 'Descuento de entrega' },
      { fecha: '2025-08-15', monto: 855, tipo: 'Cuota mensual', metodo: 'Descuento de entrega' },
      { fecha: '2025-09-15', monto: 855, tipo: 'Cuota mensual', metodo: 'Transferencia' },
      { fecha: '2025-10-15', monto: 855, tipo: 'Cuota mensual', metodo: 'Descuento de entrega' },
      { fecha: '2025-11-15', monto: 855, tipo: 'Cuota mensual', metodo: 'Descuento de entrega' },
      { fecha: '2025-12-10', monto: 725, tipo: 'Pago final', metodo: 'Efectivo' },
    ],
    garantia: 'Cosecha en proceso',
    aprobadoPor: 'Comité de Crédito — María García (vía rápida)',
    scoreNova: 71,
    motivo: 'Crédito de emergencia por daños causados por tormenta tropical. Reparación de secador solar, reposición de despulpadora y compra de lonas para secado.',
    condiciones: [
      'Aprobación vía rápida por emergencia climática',
      'Verificación fotográfica de daños',
      'Comprobantes de compra de equipos',
    ],
    interpretacion: 'Crédito de emergencia otorgado bajo protocolo de respuesta rápida por evento climático. El SCN de 71 puntos al momento de la solicitud, combinado con el historial limpio del productor, justificó la aprobación acelerada (24 horas). El crédito fue pagado en su totalidad 20 días antes del vencimiento, lo que mejora el score de comportamiento del productor en +3 puntos para futuras solicitudes. La inversión en infraestructura de post-cosecha (secador solar, despulpadora) incrementó la capacidad de procesamiento en un 25%.',
  },
];

const estadoBadge = (estado: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    activo: { label: 'Activo', variant: 'default' },
    pagado: { label: 'Pagado', variant: 'secondary' },
    vencido: { label: 'Vencido', variant: 'destructive' },
  };
  const { label, variant } = map[estado] ?? map.activo;
  return <Badge variant={variant}>{label}</Badge>;
};

const scoreColor = (s: number) => s >= 75 ? 'text-primary' : s >= 50 ? 'text-accent' : 'text-destructive';

export default function Creditos() {
  const [selected, setSelected] = useState<Credito | null>(null);
  const activos = creditos.filter(c => c.estado === 'activo');
  const saldoTotal = activos.reduce((s, c) => s + c.saldo, 0);
  const totalPagado = creditos.reduce((s, c) => s + c.pagos.reduce((a, p) => a + p.monto, 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Créditos activos</span></div>
          <p className="text-2xl font-bold text-foreground">{activos.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Saldo pendiente</span></div>
          <p className="text-2xl font-bold text-foreground">Q {saldoTotal.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total pagado</span></div>
          <p className="text-2xl font-bold text-foreground">Q {totalPagado.toLocaleString()}</p>
        </CardContent></Card>
      </div>

      <div className="space-y-4">
        {creditos.map((c) => (
          <Card key={c.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setSelected(c)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{c.tipo}</CardTitle>
                {estadoBadge(c.estado)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monto: <span className="font-medium text-foreground">Q {c.monto.toLocaleString()}</span></span>
                <span className="text-muted-foreground">Saldo: <span className="font-medium text-foreground">Q {c.saldo.toLocaleString()}</span></span>
                <span className="text-muted-foreground">Vence: <span className="font-medium text-foreground">{c.fechaVencimiento}</span></span>
              </div>
              <Progress value={((c.monto - c.saldo) / c.monto) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{Math.round(((c.monto - c.saldo) / c.monto) * 100)}% pagado · Click para ver detalle completo</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" /> Crédito: {selected.tipo}
                  <span className="ml-auto">{estadoBadge(selected.estado)}</span>
                </DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="resumen" className="mt-2">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="resumen">Resumen</TabsTrigger>
                  <TabsTrigger value="pagos">Pagos</TabsTrigger>
                  <TabsTrigger value="solicitud">Solicitud</TabsTrigger>
                  <TabsTrigger value="analisis">Análisis</TabsTrigger>
                </TabsList>

                <TabsContent value="resumen" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xl font-bold text-foreground">Q {selected.monto.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Monto aprobado</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xl font-bold text-foreground">Q {selected.saldo.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Saldo pendiente</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xl font-bold text-foreground">{selected.tasaInteres}%</p>
                      <p className="text-[10px] text-muted-foreground">Tasa anual</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xl font-bold text-foreground">Q {selected.cuotaMensual.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Cuota mensual</p>
                    </div>
                  </div>

                  <Progress value={((selected.monto - selected.saldo) / selected.monto) * 100} className="h-3" />
                  <p className="text-sm text-center text-muted-foreground">
                    {Math.round(((selected.monto - selected.saldo) / selected.monto) * 100)}% pagado — Q {(selected.monto - selected.saldo).toLocaleString()} de Q {selected.monto.toLocaleString()}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground">Plazo</p>
                      <p className="font-medium text-foreground">{selected.plazoMeses} meses</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground">Vencimiento</p>
                      <p className="font-medium text-foreground">{selected.fechaVencimiento}</p>
                    </div>
                    {selected.proximoPago && (
                      <div className="p-3 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground">Próximo pago</p>
                        <p className="font-medium text-foreground">{selected.proximoPago}</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground">Garantía</p>
                      <p className="font-medium text-foreground">{selected.garantia}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pagos" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">{selected.pagos.length} pagos registrados</p>
                  <div className="space-y-2">
                    {selected.pagos.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Receipt className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.tipo}</p>
                            <p className="text-xs text-muted-foreground">{p.fecha} · {p.metodo}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-primary">Q {p.monto.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-foreground">Total pagado</p>
                    <p className="text-lg font-bold text-primary">
                      Q {selected.pagos.reduce((a, p) => a + p.monto, 0).toLocaleString()}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="solicitud" className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Solicitud</p>
                      <p className="font-medium text-foreground">{selected.fechaSolicitud}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Aprobación</p>
                      <p className="font-medium text-foreground">{selected.fechaAprobacion}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Desembolso</p>
                      <p className="font-medium text-foreground">{selected.fechaDesembolso}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">MOTIVO DE LA SOLICITUD</p>
                    <p className="text-sm text-foreground">{selected.motivo}</p>
                  </div>

                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">APROBADO POR</p>
                    <p className="text-sm text-foreground">{selected.aprobadoPor}</p>
                  </div>

                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">CONDICIONES</p>
                    <div className="space-y-1.5">
                      {selected.condiciones.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <span className="text-foreground">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analisis" className="space-y-4 mt-4">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${scoreColor(selected.scoreNova)}`}>{selected.scoreNova}</p>
                      <p className="text-[10px] text-muted-foreground">Score Nova</p>
                    </div>
                    <Separator orientation="vertical" className="h-12" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {selected.scoreNova >= 75 ? 'Aprobación Rápida' : selected.scoreNova >= 50 ? 'Revisión Manual' : 'Requiere Garantía'}
                      </p>
                      <p className="text-xs text-muted-foreground">Score al momento de la solicitud</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Leaf className="h-3.5 w-3.5 text-primary" /> Interpretación Nova Silva
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{selected.interpretacion}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
