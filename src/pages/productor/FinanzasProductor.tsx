import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Truck, DollarSign, Wallet, TrendingDown, Plus, Leaf, Calendar, Send, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import CarbonoTab from '@/components/finanzas/CarbonoTab';

// ── Entregas data ──
const entregas = [
  { id: '1', fecha: '2026-02-10', pesoKg: 460, tipoCafe: 'Pergamino', precio: 3200, estadoPago: 'pagado' as const },
  { id: '2', fecha: '2026-01-28', pesoKg: 230, tipoCafe: 'Pergamino', precio: 3100, estadoPago: 'parcial' as const },
  { id: '3', fecha: '2026-01-15', pesoKg: 345, tipoCafe: 'Cereza', precio: 1750, estadoPago: 'pagado' as const },
  { id: '4', fecha: '2025-12-20', pesoKg: 575, tipoCafe: 'Pergamino', precio: 3000, estadoPago: 'pagado' as const },
];

const transacciones = [
  { fecha: '2026-02-10', concepto: 'Pago entrega #460kg', monto: 1472000, tipo: 'ingreso' },
  { fecha: '2026-01-28', concepto: 'Pago parcial entrega #230kg', monto: 357000, tipo: 'ingreso' },
  { fecha: '2026-02-01', concepto: 'Cuota crédito insumos', monto: -25000, tipo: 'egreso' },
  { fecha: '2026-01-15', concepto: 'Pago entrega #345kg', monto: 603750, tipo: 'ingreso' },
];

const creditos = [
  { id: '1', tipo: 'Insumos agrícolas', monto: 150000, saldo: 75000, cuota: 25000, otorgado: '14 sep 2024', cuotas: '3/6', estado: 'activo' as const },
  { id: '2', tipo: 'Capital de trabajo', monto: 80000, saldo: 40000, cuota: 20000, otorgado: '31 may 2024', cuotas: '2/4', estado: 'activo' as const },
];

const creditosKPIs = [
  { label: 'Saldo Pendiente', value: '₡95,000', sub: '2 créditos activos', icon: TrendingDown },
  { label: 'Créditos Activos', value: '2', sub: 'En proceso de pago', icon: Wallet },
  { label: 'Próximo Pago', value: '26 feb', sub: '₡25,000 aprox.', icon: Calendar },
];

const pagoBadge = (estado: string) => {
  if (estado === 'pagado') return <Badge variant="default">Pagado</Badge>;
  if (estado === 'parcial') return <Badge variant="secondary">Parcial</Badge>;
  return <Badge variant="destructive">Pendiente</Badge>;
};

const tiposCredito = ['Insumos agrícolas', 'Capital de trabajo', 'Mejoras de infraestructura', 'Emergencia', 'Renovación de cafetal'];

export default function FinanzasProductor() {
  const [showSolicitud, setShowSolicitud] = useState(false);
  const [solicitud, setSolicitud] = useState({ tipo: '', monto: '', plazo: '6', justificacion: '' });
  const [selectedCredito, setSelectedCredito] = useState<typeof creditos[0] | null>(null);

  const handleSolicitar = () => {
    if (!solicitud.tipo || !solicitud.monto || !solicitud.justificacion) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }
    toast.success(`Solicitud de crédito por ₡${Number(solicitud.monto).toLocaleString()} enviada exitosamente. Recibirá una respuesta en 3-5 días hábiles.`);
    setShowSolicitud(false);
    setSolicitud({ tipo: '', monto: '', plazo: '6', justificacion: '' });
  };

  // ── SCN (Score Crediticio Nova) ──
  const scnFactores = [
    { factor: 'Historial de pagos', peso: 25, score: 88, desc: '3/3 cuotas puntuales' },
    { factor: 'Volumen entregas', peso: 20, score: 75, desc: '1,610 kg últimos 6 meses' },
    { factor: 'Antigüedad', peso: 15, score: 90, desc: '4 años como socio' },
    { factor: 'Puntaje VITAL', peso: 15, score: 72, desc: 'Resiliencia media-alta' },
    { factor: 'Diversificación', peso: 10, score: 60, desc: '2 variedades, 2 parcelas' },
    { factor: 'Documentación', peso: 15, score: 95, desc: 'GPS + títulos al día' },
  ];
  const scnTotal = Math.round(scnFactores.reduce((s, f) => s + (f.score * f.peso / 100), 0));
  const scnColor = scnTotal >= 80 ? 'text-primary' : scnTotal >= 60 ? 'text-accent' : 'text-destructive';
  const scnLabel = scnTotal >= 80 ? 'Excelente' : scnTotal >= 60 ? 'Bueno' : scnTotal >= 40 ? 'Regular' : 'Bajo';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground">Entregas, transacciones, créditos, score crediticio y activos de carbono</p>
      </div>

      <Tabs defaultValue="entregas">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="entregas" className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Entregas</TabsTrigger>
          <TabsTrigger value="finanzas" className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Finanzas</TabsTrigger>
          <TabsTrigger value="creditos" className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Créditos</TabsTrigger>
          <TabsTrigger value="scn" className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Score SCN</TabsTrigger>
          <TabsTrigger value="carbono" className="flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5" /> Carbono</TabsTrigger>
        </TabsList>

        {/* ── ENTREGAS ── */}
        <TabsContent value="entregas" className="space-y-4 mt-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Mis entregas</h2>
            <p className="text-sm text-muted-foreground">Historial de entregas de café a la organización</p>
          </div>
          <div className="space-y-3">
            {entregas.map((e) => (
              <Card key={e.id}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.pesoKg} kg — {e.tipoCafe}</p>
                      <p className="text-xs text-muted-foreground">{e.fecha} • ₡{e.precio.toLocaleString()}/kg</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-foreground">₡{(e.pesoKg * e.precio).toLocaleString()}</p>
                      {pagoBadge(e.estadoPago)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── FINANZAS ── */}
        <TabsContent value="finanzas" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Ingresos (periodo)</span></div>
              <p className="text-2xl font-bold text-primary">₡2,432,750</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Egresos</span></div>
              <p className="text-2xl font-bold text-foreground">₡25,000</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Balance neto</span></div>
              <p className="text-2xl font-bold text-primary">₡2,407,750</p>
            </CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Movimientos recientes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {transacciones.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.concepto}</p>
                    <p className="text-xs text-muted-foreground">{t.fecha}</p>
                  </div>
                  <p className={`text-sm font-bold ${t.tipo === 'ingreso' ? 'text-primary' : 'text-accent'}`}>
                    {t.tipo === 'ingreso' ? '+' : ''}₡{Math.abs(t.monto).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CRÉDITOS ── */}
        <TabsContent value="creditos" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> Mis Créditos</h2>
              <p className="text-sm text-muted-foreground">Consulta el estado de tus créditos con la organización.</p>
            </div>
            <Button onClick={() => setShowSolicitud(true)}><Plus className="h-4 w-4 mr-1" /> Solicitar Crédito</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {creditosKPIs.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2"><kpi.icon className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">{kpi.label}</span></div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Créditos Activos</CardTitle>
              <p className="text-xs text-muted-foreground">Detalle de tus créditos con la organización</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditos.map((c) => (
                <button key={c.id} onClick={() => setSelectedCredito(c)} className="w-full text-left">
                  <Card className="border border-border hover:border-primary/30 transition-colors">
                    <CardContent className="pt-4 pb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{c.tipo}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Otorgado: {c.otorgado}</p>
                        </div>
                        <Badge variant="default">Activo</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><p className="text-xs text-muted-foreground">Monto otorgado</p><p className="font-bold text-foreground">₡{c.monto.toLocaleString()}</p></div>
                        <div><p className="text-xs text-muted-foreground">Saldo pendiente</p><p className="font-bold text-accent">₡{c.saldo.toLocaleString()}</p></div>
                        <div><p className="text-xs text-muted-foreground">Cuota mensual</p><p className="font-bold text-foreground">₡{c.cuota.toLocaleString()}</p></div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Progreso de pago</span><span>{c.cuotas} cuotas</span></div>
                        <Progress value={((c.monto - c.saldo) / c.monto) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SCORE CREDITICIO NOVA (SCN) ── */}
        <TabsContent value="scn" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Score Crediticio Nova</h2>
              <p className="text-sm text-muted-foreground">Tu calificación crediticia basada en 6 factores de desempeño</p>
            </div>
            <div className="text-center">
              <p className={`text-4xl font-bold ${scnColor}`}>{scnTotal}</p>
              <p className={`text-sm font-medium ${scnColor}`}>{scnLabel}</p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="relative h-4 rounded-full bg-muted overflow-hidden mb-6">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-destructive via-accent to-primary transition-all" style={{ width: `${scnTotal}%` }} />
                <div className="absolute inset-y-0 flex items-center" style={{ left: `${scnTotal}%`, transform: 'translateX(-50%)' }}>
                  <div className="h-6 w-6 rounded-full bg-foreground border-2 border-background shadow-md flex items-center justify-center">
                    <span className="text-[8px] font-bold text-background">{scnTotal}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground -mt-2 mb-4">
                <span>0 — Bajo</span><span>40 — Regular</span><span>60 — Bueno</span><span>80 — Excelente</span><span>100</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {scnFactores.map((f) => {
              const barColor = f.score >= 80 ? 'bg-primary' : f.score >= 60 ? 'bg-accent' : 'bg-destructive';
              return (
                <Card key={f.factor}>
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{f.factor}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{f.score}</p>
                        <p className="text-[10px] text-muted-foreground">Peso: {f.peso}%</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${f.score}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">¿Cómo mejorar tu Score?</p>
              <ul className="space-y-1.5">
                {scnFactores.filter(f => f.score < 80).sort((a, b) => a.score - b.score).map(f => (
                  <li key={f.factor} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span><span className="font-medium text-foreground">{f.factor}:</span> Actualmente {f.score}/100. Incrementar mejoraría tu SCN en ~{Math.round(f.peso * 0.2)} pts.</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CARBONO ── */}
        <TabsContent value="carbono" className="mt-4">
          <CarbonoTab />
        </TabsContent>
      </Tabs>

      {/* ═══ SOLICITAR CRÉDITO DIALOG ═══ */}
      <Dialog open={showSolicitud} onOpenChange={setShowSolicitud}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> Solicitar Crédito</DialogTitle>
            <p className="text-xs text-muted-foreground">Complete el formulario para enviar su solicitud a la organización</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de crédito *</Label>
              <Select value={solicitud.tipo} onValueChange={(v) => setSolicitud(s => ({ ...s, tipo: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {tiposCredito.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto solicitado (₡) *</Label>
              <Input type="number" placeholder="Ej: 100000" value={solicitud.monto}
                onChange={(e) => setSolicitud(s => ({ ...s, monto: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Plazo deseado (meses)</Label>
              <Select value={solicitud.plazo} onValueChange={(v) => setSolicitud(s => ({ ...s, plazo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['3', '6', '9', '12', '18', '24'].map(p => <SelectItem key={p} value={p}>{p} meses</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Justificación *</Label>
              <Textarea placeholder="Describa el propósito del crédito y cómo planea utilizarlo..."
                value={solicitud.justificacion} onChange={(e) => setSolicitud(s => ({ ...s, justificacion: e.target.value }))} />
            </div>

            {solicitud.monto && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs text-muted-foreground">Cuota mensual estimada</p>
                  <p className="text-lg font-bold text-primary">₡{Math.round(Number(solicitud.monto) / Number(solicitud.plazo)).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Tasa referencial. La tasa final la define la organización.</p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSolicitar}><Send className="h-4 w-4 mr-1" /> Enviar Solicitud</Button>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ CREDIT DETAIL DIALOG ═══ */}
      <Dialog open={!!selectedCredito} onOpenChange={() => setSelectedCredito(null)}>
        <DialogContent className="max-w-md">
          {selectedCredito && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {selectedCredito.tipo}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Monto otorgado</p><p className="font-bold text-foreground">₡{selectedCredito.monto.toLocaleString()}</p></div>
                  <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Saldo pendiente</p><p className="font-bold text-accent">₡{selectedCredito.saldo.toLocaleString()}</p></div>
                  <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Cuota mensual</p><p className="font-bold text-foreground">₡{selectedCredito.cuota.toLocaleString()}</p></div>
                  <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Otorgado</p><p className="font-bold text-foreground">{selectedCredito.otorgado}</p></div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1"><span>Progreso de pago</span><span>{selectedCredito.cuotas} cuotas</span></div>
                  <Progress value={((selectedCredito.monto - selectedCredito.saldo) / selectedCredito.monto) * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">{Math.round(((selectedCredito.monto - selectedCredito.saldo) / selectedCredito.monto) * 100)}% pagado</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Historial de pagos</p>
                  {[
                    { fecha: '2026-02-01', monto: selectedCredito.cuota },
                    { fecha: '2026-01-01', monto: selectedCredito.cuota },
                    { fecha: '2025-12-01', monto: selectedCredito.cuota },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm text-muted-foreground">{p.fecha}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">₡{p.monto.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
