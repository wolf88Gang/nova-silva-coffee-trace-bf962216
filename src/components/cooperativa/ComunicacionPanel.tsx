import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, Send, Eye, Edit2, Trash2, Users, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle, chartCursorStyle } from '@/lib/chartStyles';
import { toast } from 'sonner';

interface Aviso {
  id: number;
  titulo: string;
  fecha: string;
  destinatarios: string;
  preview: string;
  estado: 'Enviado' | 'Borrador' | 'Programado';
  leidos: number;
  total: number;
}

const avisosIniciales: Aviso[] = [
  { id: 1, titulo: 'Inicio de temporada de cosecha 2026', fecha: '2026-02-20', destinatarios: 'Todos los productores', preview: 'Estimados productores, les informamos que la temporada de cosecha 2026 inicia oficialmente el 1 de marzo. Recuerden preparar sus beneficiaderos y coordinar con su cuadrilla asignada.', estado: 'Enviado', leidos: 58, total: 67 },
  { id: 2, titulo: 'Alerta fitosanitaria: Broca en Zona Norte', fecha: '2026-02-18', destinatarios: 'Zona Norte', preview: 'Se ha detectado un incremento significativo en la incidencia de broca del café en las veredas El Progreso y La Unión. Se recomienda revisión inmediata de trampas.', estado: 'Enviado', leidos: 23, total: 24 },
  { id: 3, titulo: 'Convocatoria: Taller de catación básica', fecha: '2026-02-15', destinatarios: 'Todos los productores', preview: 'Los invitamos al taller de catación básica SCA. Cupos limitados a 20 participantes.', estado: 'Enviado', leidos: 45, total: 67 },
  { id: 4, titulo: 'Recordatorio: Entrega documentos Protocolo VITAL', fecha: '2026-02-12', destinatarios: 'Productores certificados', preview: 'Recordamos a los productores que participan en el Protocolo VITAL entregar documentación antes del 28 de febrero.', estado: 'Enviado', leidos: 30, total: 42 },
  { id: 5, titulo: 'Borrador: Nuevo programa de incentivos', fecha: '2026-02-25', destinatarios: 'Junta directiva', preview: 'Propuesta para implementar un programa de incentivos económicos vinculado al puntaje del Protocolo VITAL.', estado: 'Borrador', leidos: 0, total: 5 },
];

const DESTINATARIOS = ['Todos los productores', 'Zona Norte', 'Zona Sur', 'Zona Central', 'Productores certificados', 'Junta directiva', 'Técnicos'];

const lecturasData = [
  { mes: 'Oct', enviados: 4, leidos: 65 },
  { mes: 'Nov', enviados: 6, leidos: 78 },
  { mes: 'Dic', enviados: 3, leidos: 55 },
  { mes: 'Ene', enviados: 5, leidos: 82 },
  { mes: 'Feb', enviados: 5, leidos: 76 },
];

const canalData = [
  { name: 'WhatsApp', value: 45, color: 'hsl(142, 60%, 45%)' },
  { name: 'App', value: 30, color: 'hsl(var(--primary))' },
  { name: 'SMS', value: 15, color: 'hsl(var(--accent))' },
  { name: 'Email', value: 10, color: 'hsl(var(--muted-foreground))' },
];

export default function ComunicacionPanel() {
  const [avisos, setAvisos] = useState(avisosIniciales);
  const [showNuevo, setShowNuevo] = useState(false);
  const [showDetalle, setShowDetalle] = useState<Aviso | null>(null);
  const [showEdit, setShowEdit] = useState<Aviso | null>(null);
  const [form, setForm] = useState({ titulo: '', destinatarios: 'Todos los productores', contenido: '', accion: 'enviar' as 'enviar' | 'borrador' });

  const sinLeer = avisos.filter(a => a.estado === 'Enviado' && a.leidos < a.total).length;
  const totalEnviados = avisos.filter(a => a.estado === 'Enviado').length;
  const totalBorradores = avisos.filter(a => a.estado === 'Borrador').length;
  const tasaLectura = avisos.filter(a => a.estado === 'Enviado').length > 0
    ? Math.round(avisos.filter(a => a.estado === 'Enviado').reduce((s, a) => s + (a.leidos / a.total) * 100, 0) / avisos.filter(a => a.estado === 'Enviado').length)
    : 0;

  const handleCrear = () => {
    if (!form.titulo || !form.contenido) { toast.error('Complete título y contenido'); return; }
    const dest = DESTINATARIOS.find(d => d === form.destinatarios) || 'Todos los productores';
    const total = dest === 'Todos los productores' ? 67 : dest === 'Zona Norte' ? 24 : dest === 'Zona Sur' ? 18 : 42;
    const nuevo: Aviso = {
      id: Date.now(), titulo: form.titulo, fecha: new Date().toISOString().slice(0, 10),
      destinatarios: form.destinatarios, preview: form.contenido,
      estado: form.accion === 'enviar' ? 'Enviado' : 'Borrador',
      leidos: 0, total,
    };
    setAvisos(prev => [nuevo, ...prev]);
    toast.success(form.accion === 'enviar' ? `Aviso enviado a ${total} destinatarios` : 'Borrador guardado');
    setShowNuevo(false);
    setForm({ titulo: '', destinatarios: 'Todos los productores', contenido: '', accion: 'enviar' });
  };

  const handleEnviarBorrador = (aviso: Aviso) => {
    setAvisos(prev => prev.map(a => a.id === aviso.id ? { ...a, estado: 'Enviado' as const } : a));
    toast.success(`Aviso "${aviso.titulo}" enviado`);
    setShowDetalle(null);
  };

  const handleEliminar = (id: number) => {
    setAvisos(prev => prev.filter(a => a.id !== id));
    toast.success('Aviso eliminado');
    setShowDetalle(null);
  };

  const handleEditSave = () => {
    if (!showEdit) return;
    setAvisos(prev => prev.map(a => a.id === showEdit.id ? showEdit : a));
    toast.success('Aviso actualizado');
    setShowEdit(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Centro de Comunicación</h1>
          <Badge variant="secondary">{sinLeer} pendientes</Badge>
        </div>
        <Button size="sm" onClick={() => setShowNuevo(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo Aviso</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1"><Send className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Enviados</span></div>
          <p className="text-xl font-bold text-foreground">{totalEnviados}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1"><Edit2 className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Borradores</span></div>
          <p className="text-xl font-bold text-foreground">{totalBorradores}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Destinatarios</span></div>
          <p className="text-xl font-bold text-foreground">67</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1"><BarChart3 className="h-4 w-4 text-emerald-600" /><span className="text-xs text-muted-foreground">Tasa lectura</span></div>
          <p className="text-xl font-bold text-emerald-600">{tasaLectura}%</p>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Avisos y Tasa de Lectura</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lecturasData}>
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={chartCursorStyle} />
                <Bar dataKey="enviados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Enviados" />
                <Bar dataKey="leidos" fill="hsl(142, 60%, 45%)" radius={[4, 4, 0, 0]} name="% Lectura" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Canal de Entrega</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={canalData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {canalData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Avisos list */}
      <div className="space-y-4">
        {avisos.map((a) => (
          <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowDetalle(a)}>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                    <p className="font-semibold text-foreground truncate">{a.titulo}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{a.fecha}</span><span>·</span><span>{a.destinatarios}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{a.preview}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={a.estado === 'Enviado' ? 'bg-emerald-500 text-white border-0' : 'bg-muted text-muted-foreground border-0'}>{a.estado}</Badge>
                  {a.estado === 'Enviado' && (
                    <span className="text-xs text-muted-foreground">Leído por {a.leidos}/{a.total}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ NUEVO AVISO DIALOG ═══ */}
      <Dialog open={showNuevo} onOpenChange={setShowNuevo}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Nuevo Aviso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(s => ({ ...s, titulo: e.target.value }))} placeholder="Asunto del aviso" />
            </div>
            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <Select value={form.destinatarios} onValueChange={v => setForm(s => ({ ...s, destinatarios: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DESTINATARIOS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contenido *</Label>
              <Textarea value={form.contenido} onChange={e => setForm(s => ({ ...s, contenido: e.target.value }))} rows={5} placeholder="Redacte el aviso..." />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => { setForm(s => ({ ...s, accion: 'enviar' })); handleCrear(); }}>
                <Send className="h-4 w-4 mr-1" /> Enviar Ahora
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setForm(s => ({ ...s, accion: 'borrador' })); handleCrear(); }}>
                Guardar Borrador
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ DETALLE AVISO DIALOG ═══ */}
      <Dialog open={!!showDetalle} onOpenChange={() => setShowDetalle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {showDetalle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> {showDetalle.titulo}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={showDetalle.estado === 'Enviado' ? 'bg-emerald-500 text-white border-0' : 'bg-muted text-muted-foreground border-0'}>{showDetalle.estado}</Badge>
                  <Badge variant="outline">{showDetalle.destinatarios}</Badge>
                  <span className="text-xs text-muted-foreground">{showDetalle.fecha}</span>
                </div>
                <p className="text-sm text-foreground">{showDetalle.preview}</p>
                {showDetalle.estado === 'Enviado' && (
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Tasa de lectura</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(showDetalle.leidos / showDetalle.total) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-foreground">{showDetalle.leidos}/{showDetalle.total}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {showDetalle.estado === 'Borrador' && (
                    <Button className="flex-1" onClick={() => handleEnviarBorrador(showDetalle)}>
                      <Send className="h-4 w-4 mr-1" /> Enviar
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { setShowEdit({ ...showDetalle }); setShowDetalle(null); }}>
                    <Edit2 className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleEliminar(showDetalle.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ EDITAR AVISO DIALOG ═══ */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit2 className="h-5 w-5 text-primary" /> Editar Aviso</DialogTitle>
          </DialogHeader>
          {showEdit && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={showEdit.titulo} onChange={e => setShowEdit(s => s ? { ...s, titulo: e.target.value } : s)} />
              </div>
              <div className="space-y-2">
                <Label>Destinatarios</Label>
                <Select value={showEdit.destinatarios} onValueChange={v => setShowEdit(s => s ? { ...s, destinatarios: v } : s)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DESTINATARIOS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contenido</Label>
                <Textarea value={showEdit.preview} onChange={e => setShowEdit(s => s ? { ...s, preview: e.target.value } : s)} rows={4} />
              </div>
              <Button className="w-full" onClick={handleEditSave}>Guardar Cambios</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
