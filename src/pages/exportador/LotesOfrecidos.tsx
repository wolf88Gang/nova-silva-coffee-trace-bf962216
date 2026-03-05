/**
 * LotesOfrecidos — Gestión de ofertas comerciales del exportador a sus clientes compradores
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Eye, Send, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface OfertaComercial {
  id: string; cliente: string; tipoCafe: string; volumenKg: number;
  precioBase: number; estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'cerrada';
  fechaCreacion: string; notas: string;
}

const ofertasIniciales: OfertaComercial[] = [
  { id: '1', cliente: 'European Coffee Trading GmbH', tipoCafe: 'SHB EP Lavado', volumenKg: 17250, precioBase: 4.20, estado: 'aprobada', fechaCreacion: '2026-01-20', notas: 'Contrato anual. Preparación europea.' },
  { id: '2', cliente: 'Nordic Roasters AB', tipoCafe: 'Honey SHB Pacamara', volumenKg: 12420, precioBase: 4.50, estado: 'enviada', fechaCreacion: '2026-02-10', notas: 'Micro-lot para programa specialty.' },
  { id: '3', cliente: 'Melbourne Roast Co.', tipoCafe: 'Natural HB', volumenKg: 6210, precioBase: 4.75, estado: 'borrador', fechaCreacion: '2026-02-28', notas: 'Pendiente muestra de catación.' },
  { id: '4', cliente: 'Tokyo Beans Co.', tipoCafe: 'Geisha Lavado', volumenKg: 8280, precioBase: 5.10, estado: 'enviada', fechaCreacion: '2026-02-15', notas: 'Score >88. CIF Yokohama.' },
];

const estadoConfig: Record<string, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: 'bg-muted text-muted-foreground' },
  enviada: { label: 'Enviada', color: 'bg-blue-500 text-white border-0' },
  aprobada: { label: 'Aprobada', color: 'bg-emerald-600 text-white border-0' },
  rechazada: { label: 'Rechazada', color: 'bg-destructive text-destructive-foreground border-0' },
  cerrada: { label: 'Cerrada', color: 'bg-muted text-muted-foreground' },
};

// Pre-loaded messages
const MENSAJES_OFERTA = {
  enviar: (o: OfertaComercial) => `Estimado equipo de ${o.cliente},\n\nNos complace ofrecerle ${o.volumenKg.toLocaleString()} kg de ${o.tipoCafe} a un precio base de $${o.precioBase.toFixed(2)}/lb.\n\n${o.notas ? `Notas: ${o.notas}\n\n` : ''}Quedamos atentos a su respuesta para proceder con el envío de muestras y documentación.\n\nSaludos cordiales,\nDepartamento Comercial`,
};

export default function LotesOfrecidos() {
  const [ofertas, setOfertas] = useState(ofertasIniciales);
  const [showNueva, setShowNueva] = useState(false);
  const [showDetalle, setShowDetalle] = useState<OfertaComercial | null>(null);
  const [showMensaje, setShowMensaje] = useState<OfertaComercial | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [form, setForm] = useState({ cliente: '', tipoCafe: 'SHB Lavado', volumenKg: '', precioBase: '', notas: '' });

  const handleCrear = () => {
    if (!form.cliente || !form.volumenKg || !form.precioBase) { toast.error('Complete campos obligatorios'); return; }
    const nueva: OfertaComercial = {
      id: String(Date.now()), cliente: form.cliente, tipoCafe: form.tipoCafe,
      volumenKg: Number(form.volumenKg), precioBase: Number(form.precioBase),
      estado: 'borrador', fechaCreacion: new Date().toISOString().slice(0, 10), notas: form.notas,
    };
    setOfertas(prev => [nueva, ...prev]);
    toast.success('Oferta comercial creada');
    setShowNueva(false);
    setForm({ cliente: '', tipoCafe: 'SHB Lavado', volumenKg: '', precioBase: '', notas: '' });
  };

  const handleEnviar = (o: OfertaComercial) => {
    setShowMensaje(o);
    setMensaje(MENSAJES_OFERTA.enviar(o));
  };

  const confirmarEnvio = () => {
    if (!showMensaje) return;
    setOfertas(prev => prev.map(o => o.id === showMensaje.id ? { ...o, estado: 'enviada' as const } : o));
    toast.success(`Oferta enviada a ${showMensaje.cliente}`);
    setShowMensaje(null);
    setMensaje('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Ofertas comerciales a clientes compradores</p>
        <Button size="sm" onClick={() => setShowNueva(true)}><Plus className="h-4 w-4 mr-1" /> Nueva Oferta</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-left">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Tipo café</th>
                <th className="px-4 py-3 font-medium">Volumen</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr></thead>
              <tbody>
                {ofertas.map(o => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{o.cliente}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.tipoCafe}</td>
                    <td className="px-4 py-3 text-foreground">{o.volumenKg.toLocaleString()} kg</td>
                    <td className="px-4 py-3 font-bold text-primary">${o.precioBase.toFixed(2)}/lb</td>
                    <td className="px-4 py-3"><Badge className={estadoConfig[o.estado].color}>{estadoConfig[o.estado].label}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{o.fechaCreacion}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setShowDetalle(o)}><Eye className="h-4 w-4" /></Button>
                        {o.estado === 'borrador' && <Button size="sm" onClick={() => handleEnviar(o)}><Send className="h-4 w-4 mr-1" /> Enviar</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Nueva oferta */}
      <Dialog open={showNueva} onOpenChange={setShowNueva}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Nueva Oferta Comercial</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Cliente *</Label><Input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} placeholder="Nombre del comprador" /></div>
            <div><Label>Tipo de café</Label>
              <Select value={form.tipoCafe} onValueChange={v => setForm(f => ({ ...f, tipoCafe: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['SHB Lavado', 'SHB EP', 'HB Lavado', 'Honey SHB', 'Natural HB', 'Geisha Lavado', 'Geisha Natural'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Volumen (kg) *</Label><Input type="number" value={form.volumenKg} onChange={e => setForm(f => ({ ...f, volumenKg: e.target.value }))} /></div>
              <div><Label>Precio base (USD/lb) *</Label><Input type="number" step="0.01" value={form.precioBase} onChange={e => setForm(f => ({ ...f, precioBase: e.target.value }))} /></div>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} /></div>
            <Button className="w-full" onClick={handleCrear}>Crear Oferta</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalle */}
      <Dialog open={!!showDetalle} onOpenChange={() => setShowDetalle(null)}>
        <DialogContent className="max-w-sm">
          {showDetalle && (
            <>
              <DialogHeader><DialogTitle>{showDetalle.cliente}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <Badge className={estadoConfig[showDetalle.estado].color}>{estadoConfig[showDetalle.estado].label}</Badge>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground">Tipo</span><p className="font-medium text-foreground">{showDetalle.tipoCafe}</p></div>
                  <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground">Volumen</span><p className="font-medium text-foreground">{showDetalle.volumenKg.toLocaleString()} kg</p></div>
                  <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground">Precio</span><p className="font-bold text-primary">${showDetalle.precioBase.toFixed(2)}/lb</p></div>
                  <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground">Valor est.</span><p className="font-medium text-foreground">${((showDetalle.volumenKg / 0.4536) * showDetalle.precioBase).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                </div>
                {showDetalle.notas && <p className="text-xs text-muted-foreground italic">{showDetalle.notas}</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Mensaje pre-cargado */}
      <Dialog open={!!showMensaje} onOpenChange={() => { setShowMensaje(null); setMensaje(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Enviar Oferta a {showMensaje?.cliente}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Badge variant="outline" className="text-[10px]">Mensaje pre-cargado · Editable</Badge>
            <Textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={8} className="text-xs" />
            <Button className="w-full" onClick={confirmarEnvio}><Send className="h-4 w-4 mr-1" /> Confirmar envío</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
