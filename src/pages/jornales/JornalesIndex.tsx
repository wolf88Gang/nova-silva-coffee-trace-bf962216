import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Users, DollarSign, Clock, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';
import { useJornalesOverview } from '@/hooks/useViewData';
import { getJornalesKPIs, getDemoRegistrosJornales, getJornalesMensuales, getCuadrillas } from '@/lib/demoSeedData';

const ACTIVIDADES = ['Cosecha', 'Poda', 'Fertilización', 'Desyerba', 'Resiembra', 'Muestreo', 'Fumigación', 'Regulación de sombra'];
const PARCELAS = ['El Mirador', 'La Esperanza', 'Cerro Verde', 'Los Naranjos', 'San Rafael'];

export default function JornalesIndex() {
  const { data, isLoading } = useJornalesOverview();
  const overview = data?.[0] ?? null;
  const demoKPIs = getJornalesKPIs();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ actividad: '', parcela: '', personas: '', horas: '', fecha: new Date().toISOString().split('T')[0] });
  const tarifa = 2250;

  const handleAdd = () => {
    if (!form.actividad || !form.parcela || !form.personas || !form.horas) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }
    const costo = Number(form.personas) * Number(form.horas) * tarifa;
    toast.success(`Jornal registrado: ${form.actividad} en ${form.parcela} — ₡${costo.toLocaleString()}. Se reflejará en Finanzas → Costos finca.`);
    setShowAdd(false);
    setForm({ actividad: '', parcela: '', personas: '', horas: '', fecha: new Date().toISOString().split('T')[0] });
  };
  const registros = getDemoRegistrosJornales();
  const mensuales = getJornalesMensuales();
  const cuadrillas = getCuadrillas();

  const kpis = [
    { label: 'Cuadrillas activas', value: overview?.cuadrillas_activas ?? demoKPIs.cuadrillas_activas, icon: Users },
    { label: 'Jornales (semana)', value: overview?.jornales_semana ?? demoKPIs.jornales_semana, icon: Briefcase },
    { label: 'Costo semanal', value: overview?.costo_semanal ?? demoKPIs.costo_semanal, icon: DollarSign },
    { label: 'Pagos pendientes', value: overview?.pagos_pendientes ?? demoKPIs.pagos_pendientes, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Jornales" description="Registro laboral, cuadrillas, costos y pagos de campaña" />
        <div className="flex items-center gap-3">
          <DemoBadge />
          <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4" /> Registrar jornal</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <k.icon className="h-5 w-5 text-primary" />
                <div>
                  {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{String(k.value)}</p>}
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly chart */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Jornales mensuales (últimos 12 meses)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mensuales}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="jornales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="registros">
        <TabsList>
          <TabsTrigger value="registros">Registros recientes</TabsTrigger>
          <TabsTrigger value="cuadrillas">Cuadrillas</TabsTrigger>
          <TabsTrigger value="costos">Costos laborales</TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="mt-4 space-y-3">
          {registros.slice(0, 15).map((r, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{r.actividad} · {r.parcela}</p>
                    <p className="text-xs text-muted-foreground">{r.cuadrilla} · {r.fecha}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{r.jornales} jornales</Badge>
                    <span className="text-sm font-medium">{r.costo}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="cuadrillas" className="mt-4 space-y-3">
          {cuadrillas.map((c, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{c.miembros} miembros · Última: {c.ultimaActividad}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{c.costoPeriodo}</span>
                    <Badge variant={c.activa ? 'default' : 'secondary'}>{c.activa ? 'Activa' : 'Inactiva'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="costos" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Actividad</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Parcela</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Jornales</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium">{r.actividad}</td>
                        <td className="py-2 px-3 text-muted-foreground">{r.parcela}</td>
                        <td className="py-2 px-3 text-center">{r.jornales}</td>
                        <td className="py-2 px-3 text-right font-medium">{r.costo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add jornal dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Registrar Jornal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Actividad *</Label>
              <Select value={form.actividad} onValueChange={v => setForm(f => ({ ...f, actividad: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar actividad" /></SelectTrigger>
                <SelectContent>{ACTIVIDADES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Parcela *</Label>
              <Select value={form.parcela} onValueChange={v => setForm(f => ({ ...f, parcela: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar parcela" /></SelectTrigger>
                <SelectContent>{PARCELAS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Personas *</Label>
                <Input type="number" placeholder="Ej: 4" value={form.personas} onChange={e => setForm(f => ({ ...f, personas: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Horas *</Label>
                <Input type="number" placeholder="Ej: 8" value={form.horas} onChange={e => setForm(f => ({ ...f, horas: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
            {form.personas && form.horas && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm text-foreground">Costo estimado: <span className="font-bold text-primary">₡{(Number(form.personas) * Number(form.horas) * tarifa).toLocaleString()}</span></p>
                <p className="text-xs text-muted-foreground">Tarifa base: ₡{tarifa.toLocaleString()}/hr por persona</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button onClick={handleAdd}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}