import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, Wallet, ClipboardList, Plus, Edit2, MapPin, Calendar, Eye, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle, chartCursorStyle } from '@/lib/chartStyles';
import { toast } from 'sonner';

const TARIFA_BASE = 2250;

interface Cuadrilla {
  id: string; nombre: string; capataz: string; zona: string; trabajadores: number;
  estado: 'Activa' | 'Asignada' | 'En descanso'; ultimaActividad: string;
}

interface RegistroJornal {
  id: string; fecha: string; cuadrillaId: string; finca: string; actividad: string;
  trabajadores: number; horas: number; tarifaHr: number; totalPago: number; observaciones: string;
}

interface Campana {
  id: string; nombre: string; tipo: string; fechaInicio: string; fechaFin: string;
  fincas: string[]; estado: 'activa' | 'planificada' | 'finalizada'; cuadrillasAsignadas: string[]; avance: number;
}

const FINCAS = ['Finca El Progreso - Vereda Norte', 'Finca La Union - Vereda Sur', 'Finca San Jose - Vereda Central', 'Finca Las Flores - Vereda Este'];
const ACTIVIDADES = ['Corte selectivo', 'Fertilizacion', 'Control fitosanitario', 'Podas', 'Deshierba', 'Aplicacion de enmiendas', 'Resiembra', 'Mantenimiento de caminos', 'Secado y beneficio', 'Transporte interno'];

const cuadrillasIniciales: Cuadrilla[] = [
  { id: '1', nombre: 'Cuadrilla Norte', capataz: 'Miguel Angel Flores', zona: 'Vereda El Progreso', trabajadores: 10, estado: 'Activa', ultimaActividad: 'Corte selectivo - 2026-02-24' },
  { id: '2', nombre: 'Cuadrilla Sur', capataz: 'Roberto Paz Montoya', zona: 'Vereda La Union', trabajadores: 8, estado: 'Activa', ultimaActividad: 'Fertilizacion - 2026-02-24' },
  { id: '3', nombre: 'Cuadrilla Central', capataz: 'Sandra Lopez Rivera', zona: 'Vereda San Jose', trabajadores: 9, estado: 'Asignada', ultimaActividad: 'Control fitosanitario - 2026-02-23' },
  { id: '4', nombre: 'Cuadrilla Apoyo', capataz: 'Fernando Ruiz Castro', zona: 'Zona variable', trabajadores: 5, estado: 'En descanso', ultimaActividad: 'Podas - 2026-02-20' },
];

const jornalesIniciales: RegistroJornal[] = [
  { id: '1', fecha: '2026-02-24', cuadrillaId: '1', finca: 'Finca El Progreso - Vereda Norte', actividad: 'Corte selectivo', trabajadores: 10, horas: 8, tarifaHr: TARIFA_BASE, totalPago: 10 * 8 * TARIFA_BASE, observaciones: 'Sector A completado' },
  { id: '2', fecha: '2026-02-24', cuadrillaId: '2', finca: 'Finca La Union - Vereda Sur', actividad: 'Fertilizacion', trabajadores: 8, horas: 6, tarifaHr: TARIFA_BASE, totalPago: 8 * 6 * TARIFA_BASE, observaciones: 'Formula 18-5-15' },
  { id: '3', fecha: '2026-02-23', cuadrillaId: '3', finca: 'Finca San Jose - Vereda Central', actividad: 'Control fitosanitario', trabajadores: 9, horas: 7, tarifaHr: TARIFA_BASE, totalPago: 9 * 7 * TARIFA_BASE, observaciones: 'Aplicacion Beauveria contra broca' },
  { id: '4', fecha: '2026-02-23', cuadrillaId: '1', finca: 'Finca El Progreso - Vereda Norte', actividad: 'Corte selectivo', trabajadores: 10, horas: 8, tarifaHr: TARIFA_BASE, totalPago: 10 * 8 * TARIFA_BASE, observaciones: '' },
  { id: '5', fecha: '2026-02-22', cuadrillaId: '2', finca: 'Finca Las Flores - Vereda Este', actividad: 'Deshierba', trabajadores: 8, horas: 6, tarifaHr: TARIFA_BASE, totalPago: 8 * 6 * TARIFA_BASE, observaciones: 'Lotes 3 y 4' },
];

const campanasIniciales: Campana[] = [
  { id: '1', nombre: 'Cosecha Principal 2025-2026', tipo: 'Cosecha', fechaInicio: '2025-11-01', fechaFin: '2026-03-31', fincas: FINCAS, estado: 'activa', cuadrillasAsignadas: ['1', '2', '3'], avance: 72 },
  { id: '2', nombre: 'Fertilizacion Post-cosecha', tipo: 'Fertilizacion', fechaInicio: '2026-04-01', fechaFin: '2026-05-15', fincas: FINCAS.slice(0, 2), estado: 'planificada', cuadrillasAsignadas: ['2'], avance: 0 },
];

// Chart data
const costoSemanal = [
  { semana: 'S1', costo: 850000 },
  { semana: 'S2', costo: 920000 },
  { semana: 'S3', costo: 780000 },
  { semana: 'S4', costo: 1050000 },
];

const actividadDist = [
  { name: 'Corte selectivo', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Fertilizacion', value: 20, color: 'hsl(142, 60%, 45%)' },
  { name: 'Control fitosanitario', value: 15, color: 'hsl(0, 65%, 50%)' },
  { name: 'Deshierba', value: 12, color: 'hsl(var(--accent))' },
  { name: 'Otros', value: 8, color: 'hsl(var(--muted-foreground))' },
];

const rendimientoFinca = [
  { finca: 'El Progreso', horas: 120, costo: 270000 },
  { finca: 'La Union', horas: 85, costo: 191250 },
  { finca: 'San Jose', horas: 63, costo: 141750 },
  { finca: 'Las Flores', horas: 48, costo: 108000 },
];

const estadoCuadrillaBadge = (e: string) => {
  if (e === 'Activa') return <Badge className="bg-emerald-500 text-white border-0">Activa</Badge>;
  if (e === 'Asignada') return <Badge className="bg-blue-500 text-white border-0">Asignada</Badge>;
  return <Badge variant="secondary">En descanso</Badge>;
};

const estadoCampanaBadge = (e: string) => {
  if (e === 'activa') return <Badge className="bg-emerald-500 text-white border-0">Activa</Badge>;
  if (e === 'planificada') return <Badge className="bg-blue-500 text-white border-0">Planificada</Badge>;
  return <Badge variant="secondary">Finalizada</Badge>;
};

const fmtCRC = (n: number) => `₡${n.toLocaleString()}`;

export default function JornalesTab() {
  const [cuadrillas, setCuadrillas] = useState(cuadrillasIniciales);
  const [jornales, setJornales] = useState(jornalesIniciales);
  const [campanas] = useState(campanasIniciales);
  const [showNuevoJornal, setShowNuevoJornal] = useState(false);
  const [showNuevaCuadrilla, setShowNuevaCuadrilla] = useState(false);
  const [showEditCuadrilla, setShowEditCuadrilla] = useState<Cuadrilla | null>(null);
  const [showDetalleJornal, setShowDetalleJornal] = useState<RegistroJornal | null>(null);
  const [jornalForm, setJornalForm] = useState({ cuadrillaId: '', finca: '', actividad: '', trabajadores: '', horas: '', tarifaHr: String(TARIFA_BASE), observaciones: '' });
  const [cuadrillaForm, setCuadrillaForm] = useState({ nombre: '', capataz: '', zona: '', trabajadores: '' });

  const costoMes = jornales.reduce((s, j) => s + j.totalPago, 0);
  const totalJornalesRegistrados = jornales.length;
  const trabajadoresHoy = cuadrillas.filter(c => c.estado === 'Activa').reduce((s, c) => s + c.trabajadores, 0);

  const calcTotalPago = () => {
    const t = Number(jornalForm.trabajadores) || 0;
    const h = Number(jornalForm.horas) || 0;
    const tarifa = Number(jornalForm.tarifaHr) || TARIFA_BASE;
    return t * h * tarifa;
  };

  const handleRegistrarJornal = () => {
    if (!jornalForm.cuadrillaId || !jornalForm.finca || !jornalForm.actividad) { toast.error('Complete cuadrilla, finca y actividad'); return; }
    const t = Number(jornalForm.trabajadores);
    const h = Number(jornalForm.horas);
    if (!t || !h || t <= 0 || h <= 0) { toast.error('Ingrese trabajadores y horas validas'); return; }
    const jornal: RegistroJornal = {
      id: String(Date.now()), fecha: new Date().toISOString().slice(0, 10),
      cuadrillaId: jornalForm.cuadrillaId, finca: jornalForm.finca, actividad: jornalForm.actividad,
      trabajadores: t, horas: h, tarifaHr: Number(jornalForm.tarifaHr) || TARIFA_BASE,
      totalPago: calcTotalPago(), observaciones: jornalForm.observaciones,
    };
    setJornales(prev => [jornal, ...prev]);
    toast.success(`Jornal registrado: ${jornal.actividad} - ${fmtCRC(jornal.totalPago)}`);
    setShowNuevoJornal(false);
    setJornalForm({ cuadrillaId: '', finca: '', actividad: '', trabajadores: '', horas: '', tarifaHr: String(TARIFA_BASE), observaciones: '' });
  };

  const handleAddCuadrilla = () => {
    if (!cuadrillaForm.nombre || !cuadrillaForm.capataz) { toast.error('Ingrese nombre y capataz'); return; }
    const nueva: Cuadrilla = {
      id: String(Date.now()), nombre: cuadrillaForm.nombre, capataz: cuadrillaForm.capataz,
      zona: cuadrillaForm.zona || 'Sin asignar', trabajadores: Number(cuadrillaForm.trabajadores) || 0,
      estado: 'En descanso', ultimaActividad: 'Sin actividad registrada',
    };
    setCuadrillas(prev => [...prev, nueva]);
    toast.success(`Cuadrilla "${nueva.nombre}" creada`);
    setShowNuevaCuadrilla(false);
    setCuadrillaForm({ nombre: '', capataz: '', zona: '', trabajadores: '' });
  };

  const handleEditCuadrillaSave = () => {
    if (!showEditCuadrilla) return;
    setCuadrillas(prev => prev.map(c => c.id === showEditCuadrilla.id ? showEditCuadrilla : c));
    toast.success('Cuadrilla actualizada');
    setShowEditCuadrilla(null);
  };

  const kpis = [
    { label: 'Cuadrillas Activas', value: String(cuadrillas.filter(c => c.estado === 'Activa').length), icon: Users },
    { label: 'Trabajadores Hoy', value: String(trabajadoresHoy), icon: Clock },
    { label: 'Costo Acumulado', value: fmtCRC(costoMes), icon: Wallet },
    { label: 'Jornales Registrados', value: String(totalJornalesRegistrados), icon: ClipboardList },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">Gestion de cuadrillas, jornales y campanas</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNuevaCuadrilla(true)}><Users className="h-4 w-4 mr-1" /> Nueva Cuadrilla</Button>
          <Button size="sm" onClick={() => setShowNuevoJornal(true)}><Plus className="h-4 w-4 mr-1" /> Registrar Jornal</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><k.icon className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">{k.label}</span></div>
            <p className="text-xl font-bold text-foreground">{k.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Costo Semanal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={costoSemanal}>
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₡${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={chartCursorStyle} formatter={(v: number) => [fmtCRC(v)]} />
                <Bar dataKey="costo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Costo" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Distribución por Actividad</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={actividadDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${value}%`} labelLine={false}>
                  {actividadDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Horas por Finca</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rendimientoFinca} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="finca" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={70} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={chartCursorStyle} formatter={(v: number) => [`${v}h`]} />
                <Bar dataKey="horas" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} name="Horas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cuadrillas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cuadrillas">Cuadrillas</TabsTrigger>
          <TabsTrigger value="registros">Registros de Jornales</TabsTrigger>
          <TabsTrigger value="campanas">Campanas</TabsTrigger>
        </TabsList>

        <TabsContent value="cuadrillas">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Cuadrillas</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">Cuadrilla</th><th className="px-4 py-3 font-medium">Capataz</th>
                    <th className="px-4 py-3 font-medium">Zona</th><th className="px-4 py-3 font-medium">Trabajadores</th>
                    <th className="px-4 py-3 font-medium">Estado</th><th className="px-4 py-3 font-medium">Ultima actividad</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr></thead>
                  <tbody>
                    {cuadrillas.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{c.nombre}</td>
                        <td className="px-4 py-3">{c.capataz}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.zona}</td>
                        <td className="px-4 py-3">{c.trabajadores}</td>
                        <td className="px-4 py-3">{estadoCuadrillaBadge(c.estado)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{c.ultimaActividad}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => setShowEditCuadrilla({ ...c })}><Edit2 className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registros">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Registros de Jornales</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">Fecha</th><th className="px-4 py-3 font-medium">Cuadrilla</th>
                    <th className="px-4 py-3 font-medium">Finca</th><th className="px-4 py-3 font-medium">Actividad</th>
                    <th className="px-4 py-3 font-medium">Trab.</th><th className="px-4 py-3 font-medium">Horas</th>
                    <th className="px-4 py-3 font-medium">Total</th><th className="px-4 py-3 font-medium"></th>
                  </tr></thead>
                  <tbody>
                    {jornales.map((j) => {
                      const cuadrilla = cuadrillas.find(c => c.id === j.cuadrillaId);
                      return (
                        <tr key={j.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">{j.fecha}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{cuadrilla?.nombre || '-'}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{j.finca}</td>
                          <td className="px-4 py-3">{j.actividad}</td>
                          <td className="px-4 py-3">{j.trabajadores}</td>
                          <td className="px-4 py-3">{j.horas}h</td>
                          <td className="px-4 py-3 font-bold">{fmtCRC(j.totalPago)}</td>
                          <td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => setShowDetalleJornal(j)}><Eye className="h-3.5 w-3.5" /></Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campanas">
          <div className="space-y-4">
            {campanas.map(c => (
              <Card key={c.id}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div><h3 className="font-medium text-foreground">{c.nombre}</h3><p className="text-xs text-muted-foreground">{c.tipo} | {c.fechaInicio} a {c.fechaFin}</p></div>
                    {estadoCampanaBadge(c.estado)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div><span className="text-muted-foreground text-xs">Fincas</span><p className="font-medium text-foreground">{c.fincas.length}</p></div>
                    <div><span className="text-muted-foreground text-xs">Cuadrillas</span><p className="font-medium text-foreground">{c.cuadrillasAsignadas.length}</p></div>
                    <div><span className="text-muted-foreground text-xs">Avance</span><p className="font-medium text-foreground">{c.avance}%</p></div>
                    <div><span className="text-muted-foreground text-xs">Estado</span><p className="font-medium text-foreground">{c.estado}</p></div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${c.avance}%` }} />
                  </div>
                  <div className="mt-3"><p className="text-xs text-muted-foreground mb-1">Fincas asignadas:</p>
                    <div className="flex flex-wrap gap-1">
                      {c.fincas.map(f => <Badge key={f} variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" />{f.split(' - ')[0]}</Badge>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ REGISTRAR JORNAL DIALOG ═══ */}
      <Dialog open={showNuevoJornal} onOpenChange={setShowNuevoJornal}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Registrar Jornal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cuadrilla *</Label>
              <Select value={jornalForm.cuadrillaId} onValueChange={v => { const cuad = cuadrillas.find(c => c.id === v); setJornalForm(s => ({ ...s, cuadrillaId: v, trabajadores: cuad ? String(cuad.trabajadores) : s.trabajadores })); }}>
                <SelectTrigger><SelectValue placeholder="Seleccione cuadrilla..." /></SelectTrigger>
                <SelectContent>{cuadrillas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.trabajadores} trab.)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Finca / Destino *</Label>
              <Select value={jornalForm.finca} onValueChange={v => setJornalForm(s => ({ ...s, finca: v }))}><SelectTrigger><SelectValue placeholder="Seleccione finca..." /></SelectTrigger>
                <SelectContent>{FINCAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Actividad *</Label>
              <Select value={jornalForm.actividad} onValueChange={v => setJornalForm(s => ({ ...s, actividad: v }))}><SelectTrigger><SelectValue placeholder="Seleccione actividad..." /></SelectTrigger>
                <SelectContent>{ACTIVIDADES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Trabajadores</Label><Input type="number" min="1" value={jornalForm.trabajadores} onChange={e => setJornalForm(s => ({ ...s, trabajadores: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Horas</Label><Input type="number" min="0.5" step="0.5" value={jornalForm.horas} onChange={e => setJornalForm(s => ({ ...s, horas: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tarifa (₡/hr)</Label><Input type="number" value={jornalForm.tarifaHr} onChange={e => setJornalForm(s => ({ ...s, tarifaHr: e.target.value }))} /></div>
            </div>
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Calculo: {jornalForm.trabajadores || 0} trab. x {jornalForm.horas || 0}h x ₡{Number(jornalForm.tarifaHr || 0).toLocaleString()}/hr</span></div>
              <p className="text-xl font-bold text-foreground mt-1">{fmtCRC(calcTotalPago())}</p>
            </div>
            <div className="space-y-2"><Label>Observaciones</Label><Textarea value={jornalForm.observaciones} onChange={e => setJornalForm(s => ({ ...s, observaciones: e.target.value }))} placeholder="Sector trabajado, notas de rendimiento, etc." rows={2} /></div>
            <Button className="w-full" onClick={handleRegistrarJornal}>Registrar Jornal</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ NUEVA CUADRILLA DIALOG ═══ */}
      <Dialog open={showNuevaCuadrilla} onOpenChange={setShowNuevaCuadrilla}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Nueva Cuadrilla</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nombre *</Label><Input value={cuadrillaForm.nombre} onChange={e => setCuadrillaForm(s => ({ ...s, nombre: e.target.value }))} placeholder="Ej: Cuadrilla Oeste" /></div>
            <div className="space-y-1"><Label>Capataz *</Label><Input value={cuadrillaForm.capataz} onChange={e => setCuadrillaForm(s => ({ ...s, capataz: e.target.value }))} placeholder="Nombre completo" /></div>
            <div className="space-y-1"><Label>Zona asignada</Label><Input value={cuadrillaForm.zona} onChange={e => setCuadrillaForm(s => ({ ...s, zona: e.target.value }))} placeholder="Ej: Vereda Oeste" /></div>
            <div className="space-y-1"><Label>Trabajadores</Label><Input type="number" min="1" value={cuadrillaForm.trabajadores} onChange={e => setCuadrillaForm(s => ({ ...s, trabajadores: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleAddCuadrilla}>Crear Cuadrilla</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ EDITAR CUADRILLA DIALOG ═══ */}
      <Dialog open={!!showEditCuadrilla} onOpenChange={() => setShowEditCuadrilla(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit2 className="h-5 w-5 text-primary" /> Editar Cuadrilla</DialogTitle></DialogHeader>
          {showEditCuadrilla && (
            <div className="space-y-3">
              <div className="space-y-1"><Label>Nombre</Label><Input value={showEditCuadrilla.nombre} onChange={e => setShowEditCuadrilla(s => s ? { ...s, nombre: e.target.value } : s)} /></div>
              <div className="space-y-1"><Label>Capataz</Label><Input value={showEditCuadrilla.capataz} onChange={e => setShowEditCuadrilla(s => s ? { ...s, capataz: e.target.value } : s)} /></div>
              <div className="space-y-1"><Label>Zona</Label><Input value={showEditCuadrilla.zona} onChange={e => setShowEditCuadrilla(s => s ? { ...s, zona: e.target.value } : s)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Trabajadores</Label><Input type="number" value={showEditCuadrilla.trabajadores} onChange={e => setShowEditCuadrilla(s => s ? { ...s, trabajadores: Number(e.target.value) } : s)} /></div>
                <div className="space-y-1"><Label>Estado</Label>
                  <Select value={showEditCuadrilla.estado} onValueChange={v => setShowEditCuadrilla(s => s ? { ...s, estado: v as Cuadrilla['estado'] } : s)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Activa">Activa</SelectItem><SelectItem value="Asignada">Asignada</SelectItem><SelectItem value="En descanso">En descanso</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleEditCuadrillaSave}>Guardar Cambios</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ DETALLE JORNAL DIALOG ═══ */}
      <Dialog open={!!showDetalleJornal} onOpenChange={() => setShowDetalleJornal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Detalle del Jornal</DialogTitle></DialogHeader>
          {showDetalleJornal && (
            <div className="space-y-3">
              <div className="text-center p-3"><p className="text-3xl font-bold text-foreground">{fmtCRC(showDetalleJornal.totalPago)}</p><p className="text-xs text-muted-foreground mt-1">{showDetalleJornal.fecha}</p></div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Cuadrilla</span><p className="font-medium text-foreground">{cuadrillas.find(c => c.id === showDetalleJornal.cuadrillaId)?.nombre || '-'}</p></div>
                <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Actividad</span><p className="font-medium text-foreground">{showDetalleJornal.actividad}</p></div>
                <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Trabajadores</span><p className="font-medium text-foreground">{showDetalleJornal.trabajadores}</p></div>
                <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Horas</span><p className="font-medium text-foreground">{showDetalleJornal.horas}h</p></div>
                <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Tarifa</span><p className="font-medium text-foreground">{fmtCRC(showDetalleJornal.tarifaHr)}/hr</p></div>
                <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Finca</span><p className="font-medium text-foreground text-xs">{showDetalleJornal.finca.split(' - ')[0]}</p></div>
              </div>
              {showDetalleJornal.observaciones && (
                <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Observaciones</span><p className="text-sm text-foreground">{showDetalleJornal.observaciones}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
