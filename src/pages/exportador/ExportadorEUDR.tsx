import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ShieldCheck, AlertTriangle, MapPin, FileText, Users, CheckCircle,
  XCircle, Clock, ChevronRight, Download,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';

const proveedores = [
  { id: 'p1', nombre: 'Coopetarrazú', productores: 120, mapeados: 118, parcelas: 245, verificadas: 232, docs: 95, estado: 'compliant' as const },
  { id: 'p2', nombre: 'CoopeDota', productores: 85, mapeados: 85, parcelas: 170, verificadas: 170, docs: 100, estado: 'compliant' as const },
  { id: 'p3', nombre: 'Coopecafé', productores: 200, mapeados: 160, parcelas: 380, verificadas: 274, docs: 72, estado: 'pending' as const },
  { id: 'p4', nombre: 'Finca El Sol', productores: 1, mapeados: 1, parcelas: 4, verificadas: 4, docs: 100, estado: 'compliant' as const },
  { id: 'p5', nombre: 'Beneficio Central', productores: 45, mapeados: 38, parcelas: 89, verificadas: 65, docs: 68, estado: 'pending' as const },
];

const duesDiligence = [
  { id: 'dd1', lote: 'LOT-EXP-041', proveedor: 'Coopetarrazú', paso: 4, totalPasos: 4, estado: 'aprobado' as const, fecha: '2026-02-28' },
  { id: 'dd2', lote: 'LOT-EXP-039', proveedor: 'CoopeDota', paso: 4, totalPasos: 4, estado: 'aprobado' as const, fecha: '2026-02-25' },
  { id: 'dd3', lote: 'LOT-EXP-038', proveedor: 'Finca El Sol', paso: 2, totalPasos: 4, estado: 'en_revision' as const, fecha: '2026-03-01' },
  { id: 'dd4', lote: 'LOT-EXP-035', proveedor: 'Coopecafé', paso: 3, totalPasos: 4, estado: 'en_revision' as const, fecha: '2026-02-20' },
];

const ddPasos = ['Geolocalización', 'Documentación legal', 'Análisis de riesgo', 'Declaración final'];

const riskMap = [
  { zona: 'Tarrazú', riesgo: 'bajo', parcelas: 245, deforestacion: 0 },
  { zona: 'Dota', riesgo: 'bajo', parcelas: 170, deforestacion: 0 },
  { zona: 'Valle Central', riesgo: 'medio', parcelas: 89, deforestacion: 2 },
  { zona: 'Occidental', riesgo: 'bajo', parcelas: 380, deforestacion: 0 },
];

export default function ExportadorEUDR() {
  const [selectedProv, setSelectedProv] = useState<typeof proveedores[0] | null>(null);
  const [selectedDD, setSelectedDD] = useState<typeof duesDiligence[0] | null>(null);

  const totalCompliant = proveedores.filter(p => p.estado === 'compliant').length;
  const totalParcelas = proveedores.reduce((s, p) => s + p.parcelas, 0);
  const totalVerificadas = proveedores.reduce((s, p) => s + p.verificadas, 0);
  const pctParcelas = Math.round((totalVerificadas / totalParcelas) * 100);

  const pieData = [
    { name: 'Compliant', value: totalCompliant, color: 'hsl(var(--primary))' },
    { name: 'Pendiente', value: proveedores.length - totalCompliant, color: 'hsl(var(--accent))' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">EUDR Compliance</h1>
        <p className="text-sm text-muted-foreground">Due Diligence, geolocalización y análisis de riesgo de deforestación</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><ShieldCheck className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Proveedores Compliant</span></div>
          <p className="text-2xl font-bold text-foreground">{totalCompliant}/{proveedores.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><MapPin className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Parcelas verificadas</span></div>
          <p className="text-2xl font-bold text-foreground">{pctParcelas}%</p>
          <p className="text-[10px] text-muted-foreground">{totalVerificadas}/{totalParcelas}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><FileText className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Due Diligence</span></div>
          <p className="text-2xl font-bold text-foreground">{duesDiligence.filter(d => d.estado === 'aprobado').length}/{duesDiligence.length}</p>
          <p className="text-[10px] text-muted-foreground">Aprobados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Alertas deforestación</span></div>
          <p className="text-2xl font-bold text-foreground">{riskMap.reduce((s, z) => s + z.deforestacion, 0)}</p>
          <p className="text-[10px] text-muted-foreground">Parcelas en riesgo</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="proveedores">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="proveedores"><Users className="h-3.5 w-3.5 mr-1" /> Proveedores</TabsTrigger>
          <TabsTrigger value="due_diligence"><FileText className="h-3.5 w-3.5 mr-1" /> Due Diligence</TabsTrigger>
          <TabsTrigger value="riesgo"><MapPin className="h-3.5 w-3.5 mr-1" /> Mapa de Riesgo</TabsTrigger>
        </TabsList>

        {/* Proveedores */}
        <TabsContent value="proveedores" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {proveedores.map((p) => (
                <Card key={p.id} className="cursor-pointer hover:border-primary/30 transition-all" onClick={() => setSelectedProv(p)}>
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{p.nombre}</p>
                        <Badge variant={p.estado === 'compliant' ? 'default' : 'secondary'}>
                          {p.estado === 'compliant' ? '✓ Compliant' : '⏳ Pendiente'}
                        </Badge>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Productores</p>
                        <p className="font-medium text-foreground">{p.mapeados}/{p.productores}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Parcelas verif.</p>
                        <p className="font-medium text-foreground">{p.verificadas}/{p.parcelas}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Docs</p>
                        <p className="font-medium text-foreground">{p.docs}%</p>
                      </div>
                    </div>
                    <Progress value={(p.verificadas / p.parcelas) * 100} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Estado General</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Due Diligence */}
        <TabsContent value="due_diligence" className="mt-4 space-y-4">
          {duesDiligence.map((dd) => (
            <Card key={dd.id} className="cursor-pointer hover:border-primary/30 transition-all" onClick={() => setSelectedDD(dd)}>
              <CardContent className="py-4 px-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{dd.lote}</p>
                    <p className="text-xs text-muted-foreground">{dd.proveedor} · {dd.fecha}</p>
                  </div>
                  <Badge variant={dd.estado === 'aprobado' ? 'default' : 'secondary'}>
                    {dd.estado === 'aprobado' ? '✓ Aprobado' : '⏳ En revisión'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {ddPasos.map((paso, i) => (
                    <div key={paso} className="flex-1 space-y-1">
                      <div className={`h-2 rounded-full ${i < dd.paso ? 'bg-primary' : 'bg-muted'}`} />
                      <p className={`text-[9px] text-center ${i < dd.paso ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{paso}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Mapa de Riesgo */}
        <TabsContent value="riesgo" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Análisis de Riesgo por Zona</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {riskMap.map((z) => (
                <div key={z.zona} className={`p-4 rounded-lg border ${z.riesgo === 'medio' ? 'border-accent/30 bg-accent/5' : 'border-border'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{z.zona}</p>
                      <Badge variant={z.riesgo === 'bajo' ? 'default' : 'secondary'} className={z.riesgo === 'medio' ? 'bg-accent text-accent-foreground' : ''}>
                        Riesgo {z.riesgo}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{z.parcelas} parcelas</span>
                  </div>
                  {z.deforestacion > 0 && (
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{z.deforestacion} parcela(s) con alerta de deforestación — requiere verificación de campo</span>
                    </div>
                  )}
                  {z.deforestacion === 0 && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="h-4 w-4" />
                      <span>Sin alertas de deforestación detectadas</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-foreground font-medium mb-1">Fuentes de datos</p>
              <p className="text-xs text-muted-foreground">
                Análisis basado en imágenes satelitales Hansen/GFC (Global Forest Change), JAXA PALSAR y datos de GPS de parcelas registradas.
                Última actualización: 1 marzo 2026.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Proveedor detail */}
      <Dialog open={!!selectedProv} onOpenChange={(o) => !o && setSelectedProv(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{selectedProv?.nombre}</DialogTitle></DialogHeader>
          {selectedProv && (
            <div className="space-y-4">
              <Badge variant={selectedProv.estado === 'compliant' ? 'default' : 'secondary'} className="text-sm">
                {selectedProv.estado === 'compliant' ? '✓ EUDR Compliant' : '⏳ Pendiente'}
              </Badge>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'Productores mapeados', v: `${selectedProv.mapeados}/${selectedProv.productores}` },
                  { l: 'Parcelas verificadas', v: `${selectedProv.verificadas}/${selectedProv.parcelas}` },
                  { l: 'Documentación', v: `${selectedProv.docs}%` },
                  { l: 'GPS Coverage', v: `${Math.round((selectedProv.mapeados / selectedProv.productores) * 100)}%` },
                ].map(i => (
                  <div key={i.l} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">{i.l}</p>
                    <p className="text-sm font-medium text-foreground">{i.v}</p>
                  </div>
                ))}
              </div>
              {selectedProv.estado !== 'compliant' && (
                <div className="p-3 rounded-lg border border-accent/20 bg-accent/5">
                  <p className="text-xs font-medium text-foreground mb-1">Acciones pendientes</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {selectedProv.mapeados < selectedProv.productores && <li className="flex items-center gap-1"><XCircle className="h-3 w-3 text-accent" /> Mapear {selectedProv.productores - selectedProv.mapeados} productores faltantes</li>}
                    {selectedProv.verificadas < selectedProv.parcelas && <li className="flex items-center gap-1"><XCircle className="h-3 w-3 text-accent" /> Verificar {selectedProv.parcelas - selectedProv.verificadas} parcelas faltantes</li>}
                    {selectedProv.docs < 100 && <li className="flex items-center gap-1"><XCircle className="h-3 w-3 text-accent" /> Completar documentación al 100%</li>}
                  </ul>
                </div>
              )}
              <Button variant="outline" className="w-full"><Download className="h-4 w-4 mr-1" /> Exportar Reporte EUDR</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DD detail */}
      <Dialog open={!!selectedDD} onOpenChange={(o) => !o && setSelectedDD(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Due Diligence — {selectedDD?.lote}</DialogTitle></DialogHeader>
          {selectedDD && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Proveedor</p><p className="text-sm font-medium text-foreground">{selectedDD.proveedor}</p></div>
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Fecha</p><p className="text-sm font-medium text-foreground">{selectedDD.fecha}</p></div>
              </div>
              <div className="space-y-3">
                {ddPasos.map((paso, i) => (
                  <div key={paso} className={`flex items-center gap-3 p-3 rounded-lg border ${i < selectedDD.paso ? 'border-primary/20 bg-primary/5' : 'border-border'}`}>
                    {i < selectedDD.paso ? <CheckCircle className="h-5 w-5 text-primary" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                    <div>
                      <p className={`text-sm font-medium ${i < selectedDD.paso ? 'text-foreground' : 'text-muted-foreground'}`}>Paso {i + 1}: {paso}</p>
                      <p className="text-xs text-muted-foreground">{i < selectedDD.paso ? 'Completado' : 'Pendiente'}</p>
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
