import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, DollarSign, Calendar, Package, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useContratos, type Contrato } from '@/hooks/useContratos';

const estadoConfig = {
  activo: { label: 'Activo', variant: 'default' as const },
  en_ejecucion: { label: 'En ejecución', variant: 'outline' as const },
  cerrado: { label: 'Cerrado', variant: 'secondary' as const },
};

export default function ExportadorContratos() {
  const { data: contratos = [], isLoading } = useContratos();
  const [selected, setSelected] = useState<Contrato | null>(null);

  const activos = contratos.filter(c => c.estado !== 'cerrado').length;
  const totalVolumen = contratos.reduce((s, c) => s + (c.volumen ?? 0), 0);
  const totalValor = contratos.reduce((s, c) => s + ((c.volumen ?? 0) * 69 * (c.precio_lb ?? 0)), 0);
  const avgPrice = activos > 0 ? contratos.filter(c => c.estado !== 'cerrado').reduce((s, c) => s + (c.precio_lb ?? 0), 0) / activos : 0;

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos Comerciales</h1>
          <p className="text-sm text-muted-foreground">Gestión de contratos de venta con compradores internacionales</p>
        </div>
        <Button onClick={() => toast.info('Formulario de nuevo contrato próximamente')}><Plus className="h-4 w-4 mr-1" /> Nuevo Contrato</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 mb-1"><FileText className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Contratos activos</span></div><p className="text-2xl font-bold text-foreground">{activos}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Vol. comprometido</span></div><p className="text-2xl font-bold text-foreground">{totalVolumen.toLocaleString()} sacos</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Valor total</span></div><p className="text-2xl font-bold text-foreground">${(totalValor / 1000).toFixed(0)}K</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2 mb-1"><Calendar className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Precio prom.</span></div><p className="text-2xl font-bold text-foreground">${avgPriceent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-left">
                <th className="px-4 py-3 font-medium">Contrato</th><th className="px-4 py-3 font-medium">Cliente</th><th className="px-4 py-3 font-medium">Vol.</th><th className="px-4 py-3 font-medium">Precio</th><th className="px-4 py-3 font-medium">Incoterm</th><th className="px-4 py-3 font-medium">Ventana</th><th className="px-4 py-3 font-medium">Ejecución</th><th className="px-4 py-3 font-medium">Estado</th>
              </tr></thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setSelected(c)}>
                    <td className="px-4 py-3 font-medium text-foreground">{c.numero}</td>
                    <td className="px-4 py-3"><div><p className="text-foreground">{c.cliente}</p><p className="text-xs text-muted-foreground">{c.pais}</p></div></td>
                    <td className="px-4 py-3 text-foreground">{c.volumen} sacos</td>
                    <td className="px-4 py-3 font-medium text-foreground">${c.precioLb}/lb</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.in_loterm}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.ventana}</td>
                    <td className="px-4 py-3"><Progress value={c.ejecutado} className="h-1.5 w-16" /></td>
                    <td className="px-4 py-3"><Badge variant={estadoConfig[c.estado].variant}>{estadoConfig[c.estado].label}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {selected?.numero}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <Badge variant={estadoConfig[selected.estado].variant}>{estadoConfig[selected.estado].label}</Badge>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'Cliente', v: `${selected.cliente} (${selected.pais})` },
                  { l: 'Volumen', v: `${selected.volumen} ${selected.unidad}` },
                  { l: 'Precio', v: `USD ${selected.precioLb}/lb` },
                  { l: 'Incoterm', v: selected.incoterm },
                  { l: 'Ventana', v: selected.ventana },
                  { l: 'Valor total', v: `$${(selected.volumen * 69 * selected.precioLb).toLocaleString()}` },
                ].map(i => (
                  <div key={i.l} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">{i.l}</p>
                    <p className="text-sm font-medium text-foreground">{i.v}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Ejecución</span><span>{selected.ejecutado}%</span></div>
                <Progress value={selected.ejecutado} className="h-2.5" />
              </div>
              {selected.lotes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Lotes asignados</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.lotes.map(l => <Badge key={l} variant="outline">{l}</Badge>)}
                  </div>
                </div>
              )}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-medium text-foreground mb-1">Notas</p>
                <p className="text-xs text-muted-foreground">{selected.notas}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
