/**
 * LotesOfrecidos — Gestión de lotes ofrecidos (conectado a Supabase)
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, Plus, Eye, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useLotesOfrecidos, useCreateLoteOfrecido, useUpdateLoteOfrecidoEstado, LoteOfrecido } from '@/hooks/useLotesOfrecidos';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const estadoConfig: Record<string, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: 'bg-muted text-muted-foreground' },
  enviado: { label: 'Enviado', color: 'bg-blue-500 text-white border-0' },
  aprobado: { label: 'Aprobado', color: 'bg-emerald-600 text-white border-0' },
  rechazado: { label: 'Rechazado', color: 'bg-destructive text-destructive-foreground border-0' },
  cerrado: { label: 'Cerrado', color: 'bg-muted text-muted-foreground' },
};

const getEstadoBadge = (estado: string) => {
  const cfg = estadoConfig[estado] || estadoConfig.borrador;
  return cfg;
};

export default function LotesOfrecidos() {
  const { data: ofertas = [], isLoading } = useLotesOfrecidos();
  const createMutation = useCreateLoteOfrecido();
  const updateEstado = useUpdateLoteOfrecidoEstado();
  const [showNueva, setShowNueva] = useState(false);
  const [showDetalle, setShowDetalle] = useState<LoteOfrecido | null>(null);
  const [form, setForm] = useState({ titulo: '', descripcion: '' });

  const handleCrear = () => {
    if (!form.titulo.trim()) { toast.error('El título es obligatorio'); return; }
    createMutation.mutate(
      { titulo: form.titulo, descripcion: form.descripcion },
      {
        onSuccess: () => {
          toast.success('Lote ofrecido creado');
          setShowNueva(false);
          setForm({ titulo: '', descripcion: '' });
        },
        onError: (err: any) => toast.error(err.message || 'Error al crear'),
      }
    );
  };

  const handleEnviar = (o: LoteOfrecido) => {
    updateEstado.mutate(
      { id: o.id, estado: 'enviado' },
      {
        onSuccess: () => toast.success('Lote marcado como enviado'),
        onError: (err: any) => toast.error(err.message || 'Error al actualizar'),
      }
    );
  };

  const formatFecha = (iso: string) => {
    try {
      return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
    } catch {
      return iso.slice(0, 10);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Lotes ofrecidos a compradores</p>
        <Button size="sm" onClick={() => setShowNueva(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo Lote</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ofertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Package className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No hay lotes ofrecidos aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Título</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr></thead>
                <tbody>
                  {ofertas.map(o => {
                    const badge = getEstadoBadge(o.estado);
                    return (
                      <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{o.titulo}</td>
                        <td className="px-4 py-3"><Badge className={badge.color}>{badge.label}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground">{formatFecha(o.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setShowDetalle(o)}><Eye className="h-4 w-4" /></Button>
                            {o.estado === 'borrador' && (
                              <Button size="sm" onClick={() => handleEnviar(o)} disabled={updateEstado.isPending}>
                                <Send className="h-4 w-4 mr-1" /> Enviar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nueva oferta */}
      <Dialog open={showNueva} onOpenChange={setShowNueva}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Nuevo Lote Ofrecido</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: SHB Lavado - Lote Enero" /></div>
            <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} placeholder="Detalles del lote, volumen, calidad, etc." /></div>
            <Button className="w-full" onClick={handleCrear} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creando…' : 'Crear Lote'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalle */}
      <Dialog open={!!showDetalle} onOpenChange={() => setShowDetalle(null)}>
        <DialogContent className="max-w-sm">
          {showDetalle && (
            <>
              <DialogHeader><DialogTitle>{showDetalle.titulo}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <Badge className={getEstadoBadge(showDetalle.estado).color}>{getEstadoBadge(showDetalle.estado).label}</Badge>
                {showDetalle.descripcion && (
                  <p className="text-muted-foreground whitespace-pre-wrap">{showDetalle.descripcion}</p>
                )}
                <p className="text-xs text-muted-foreground/60">Creado {formatFecha(showDetalle.created_at)}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
