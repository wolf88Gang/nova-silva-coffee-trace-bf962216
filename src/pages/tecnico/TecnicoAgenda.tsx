import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CheckCircle, Plus, Clock, MapPin, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { DEMO_VISITAS, type DemoVisita } from '@/lib/demo-data';

// ── Calendar helpers ──
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Mon=0
}

const estadoBadge = (estado: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    programada: { label: 'Programada', variant: 'secondary' },
    completada: { label: 'Completada', variant: 'default' },
    cancelada: { label: 'Cancelada', variant: 'destructive' },
  };
  const { label, variant } = map[estado] ?? map.programada;
  return <Badge variant={variant}>{label}</Badge>;
};

const tipoBadge = (tipo: string) => {
  if (tipo.includes('VITAL')) return <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">VITAL</Badge>;
  if (tipo.includes('fitosanitario')) return <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">Fitosanitario</Badge>;
  return <Badge variant="outline" className="text-xs">{tipo}</Badge>;
};

export default function TecnicoAgenda() {
  const [visitas, setVisitas] = useState<DemoVisita[]>(DEMO_VISITAS);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1); // Feb = 1
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-02-17');
  const [selectedVisita, setSelectedVisita] = useState<DemoVisita | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ productorNombre: '', tipo: 'Evaluación VITAL', comunidad: 'San Miguel', fecha: '' });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Dates with visits
  const visitDates = new Set(visitas.map(v => v.fecha));
  const visitCountByDate = (date: string) => visitas.filter(v => v.fecha === date).length;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const formatDate = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const filteredVisitas = selectedDate ? visitas.filter(v => v.fecha === selectedDate) : [];

  const handleComplete = (id: string) => {
    setVisitas(prev => prev.map(v => v.id === id ? { ...v, estado: 'completada' as const } : v));
    toast.success('Visita marcada como completada');
  };

  const handleAdd = () => {
    if (!form.productorNombre || !form.fecha) { toast.error('Productor y fecha son requeridos'); return; }
    const newVisita: DemoVisita = {
      id: `new-${Date.now()}`,
      productorNombre: form.productorNombre,
      fecha: form.fecha,
      tipo: form.tipo,
      estado: 'programada',
      comunidad: form.comunidad,
    };
    setVisitas(prev => [...prev, newVisita]);
    toast.success(`Visita programada para ${form.productorNombre}`);
    setShowAdd(false);
    setForm({ productorNombre: '', tipo: 'Evaluación VITAL', comunidad: 'San Miguel', fecha: '' });
  };

  // Stats
  const pendientes = visitas.filter(v => v.estado === 'programada').length;
  const completadas = visitas.filter(v => v.estado === 'completada').length;
  const hoy = visitas.filter(v => v.fecha === '2026-02-17' && v.estado === 'programada').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Visitas Hoy</p>
          <p className="text-2xl font-bold text-foreground">{hoy}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Programadas</p>
          <p className="text-2xl font-bold text-foreground">{pendientes}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Completadas</p>
          <p className="text-2xl font-bold text-foreground">{completadas}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-primary" /> Calendario de Visitas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium text-foreground min-w-[140px] text-center">{MONTHS[month]} {year}</span>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => <div key={d} className="text-xs text-center text-muted-foreground font-medium py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = formatDate(day);
                const hasVisits = visitDates.has(dateStr);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === '2026-02-17';
                const count = visitCountByDate(dateStr);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`relative h-10 rounded-md text-sm transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground font-bold' :
                      isToday ? 'bg-accent text-accent-foreground font-semibold' :
                      hasVisits ? 'bg-primary/10 text-foreground hover:bg-primary/20' :
                      'text-foreground hover:bg-muted'
                    }`}
                  >
                    {day}
                    {hasVisits && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                          <span key={j} className="h-1 w-1 rounded-full bg-primary" />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day detail */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">
              {selectedDate ? `${parseInt(selectedDate.split('-')[2])} ${MONTHS[month]}` : 'Selecciona un día'}
            </CardTitle>
            <Button size="sm" onClick={() => { setShowAdd(true); setForm(f => ({ ...f, fecha: selectedDate || formatDate(17) })); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Nueva
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedDate && <p className="text-sm text-muted-foreground">Haz clic en un día del calendario para ver las visitas.</p>}
            {selectedDate && filteredVisitas.length === 0 && <p className="text-sm text-muted-foreground">Sin visitas programadas para este día.</p>}
            {filteredVisitas.map(v => (
              <div key={v.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground text-sm">{v.productorNombre}</p>
                  {estadoBadge(v.estado)}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.comunidad}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{v.tipo}</span>
                </div>
                <div className="flex gap-2">
                  {v.estado === 'programada' && (
                    <Button size="sm" variant="default" className="flex-1" onClick={() => handleComplete(v.id)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Completar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setSelectedVisita(v)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Add visit dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Programar Visita</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Productor</Label><Input value={form.productorNombre} onChange={e => setForm({ ...form, productorNombre: e.target.value })} placeholder="Nombre del productor" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Evaluación VITAL', 'Diagnóstico fitosanitario', 'Seguimiento', 'Verificación EUDR', 'Capacitación'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Comunidad</Label>
                <Select value={form.comunidad} onValueChange={v => setForm({ ...form, comunidad: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['San Miguel', 'El Progreso', 'Las Flores'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleAdd}>Programar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit detail dialog */}
      <Dialog open={!!selectedVisita} onOpenChange={() => setSelectedVisita(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalle de Visita</DialogTitle></DialogHeader>
          {selectedVisita && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Productor:</span> <span className="font-medium text-foreground">{selectedVisita.productorNombre}</span></div>
                <div><span className="text-muted-foreground">Comunidad:</span> <span className="font-medium text-foreground">{selectedVisita.comunidad}</span></div>
                <div><span className="text-muted-foreground">Tipo:</span> {tipoBadge(selectedVisita.tipo)}</div>
                <div><span className="text-muted-foreground">Estado:</span> {estadoBadge(selectedVisita.estado)}</div>
                <div><span className="text-muted-foreground">Fecha:</span> <span className="font-medium text-foreground">{selectedVisita.fecha}</span></div>
              </div>
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                <p className="text-sm font-medium text-foreground">Notas de campo</p>
                <p className="text-sm text-muted-foreground">
                  {selectedVisita.estado === 'completada'
                    ? 'Visita realizada exitosamente. Se verificaron las condiciones del cultivo y se actualizó el registro VITAL del productor. Se identificaron oportunidades de mejora en manejo de sombra.'
                    : 'Pendiente de ejecución. Llevar kit de muestreo y formulario VITAL actualizado. Verificar acceso vehicular a la finca.'}
                </p>
              </div>
              {selectedVisita.estado === 'programada' && (
                <Button className="w-full" onClick={() => { handleComplete(selectedVisita.id); setSelectedVisita(null); }}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Marcar como completada
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
