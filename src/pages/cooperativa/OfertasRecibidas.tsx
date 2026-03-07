/**
 * OfertasRecibidas — Vista cooperativa para gestionar ofertas de exportadores.
 * Connected to Supabase via useOfertasComerciales + useResponderOferta.
 * Falls back to demo data when empty.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  HandCoins, Eye, CheckCircle, XCircle, Clock, TrendingUp, Package, Loader2,
} from 'lucide-react';
import MarketIntelligenceCard from '@/components/cooperativa/MarketIntelligenceCard';
import { useOfertasComerciales, useResponderOferta, type OfertaComercial } from '@/hooks/useOfertasComerciales';

const PRECIO_MERCADO = 4.25; // NY + diferencial referencia

const riesgoBadge = (r: string | null) => {
  if (r === 'bajo') return <Badge className="bg-emerald-600 text-white border-0 text-xs">Bajo</Badge>;
  if (r === 'medio') return <Badge className="bg-amber-500 text-white border-0 text-xs">Medio</Badge>;
  if (r === 'alto') return <Badge variant="destructive" className="text-xs">Alto</Badge>;
  return <Badge variant="outline" className="text-xs">—</Badge>;
};

const estadoBadge = (e: string) => {
  if (e === 'pendiente') return <Badge className="bg-blue-500 text-white border-0"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
  if (e === 'aceptada') return <Badge className="bg-emerald-600 text-white border-0"><CheckCircle className="h-3 w-3 mr-1" />Aceptada</Badge>;
  if (e === 'rechazada') return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
  return <Badge className="bg-amber-500 text-white border-0">Contraoferta</Badge>;
};

export default function OfertasRecibidas() {
  const { data: ofertas = [], isLoading } = useOfertasComerciales();
  const responder = useResponderOferta();
  const [analisis, setAnalisis] = useState<OfertaComercial | null>(null);

  const pendientes = ofertas.filter(o => o.estado === 'pendiente');
  const respondidas = ofertas.filter(o => o.estado !== 'pendiente');

  const handleResponder = (id: string, estado: 'aceptada' | 'rechazada' | 'contraoferta') => {
    responder.mutate({ id, estado });
    setAnalisis(null);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Ofertas Recibidas</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Pendientes</span></div><p className="text-xl font-bold text-foreground">{pendientes.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><CheckCircle className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Aceptadas</span></div><p className="text-xl font-bold text-foreground">{ofertas.filter(o => o.estado === 'aceptada').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">kg en oferta</span></div><p className="text-xl font-bold text-foreground">{pendientes.reduce((s, o) => s + (o.volumen_kg ?? 0), 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Precio promedio</span></div><p className="text-xl font-bold text-foreground">${pendientes.length > 0 ? (pendientes.reduce((s, o) => s + (o.precio_ofertado ?? 0), 0) / pendientes.length).toFixed(2) : '0.00'}/lb</p></CardContent></Card>
      </div>

      {/* Pending offers table */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><HandCoins className="h-4 w-4 text-primary" /> Ofertas Pendientes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-left">
                <th className="px-4 py-3 font-medium">Lote</th>
                <th className="px-4 py-3 font-medium">Exportador</th>
                <th className="px-4 py-3 font-medium">Volumen</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Riesgo</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr></thead>
              <tbody>
                {pendientes.map(o => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{o.lote_code}</td>
                    <td className="px-4 py-3"><div><span className="text-foreground">{o.exportador_nombre}</span>{o.es_vip && <Badge variant="outline" className="ml-2 text-[10px]">VIP</Badge>}</div></td>
                    <td className="px-4 py-3 text-foreground">{(o.volumen_kg ?? 0).toLocaleString()} kg</td>
                    <td className="px-4 py-3 font-bold text-primary">${(o.precio_ofertado ?? 0).toFixed(2)}/lb</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.fecha_oferta}</td>
                    <td className="px-4 py-3">{riesgoBadge(o.riesgo)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setAnalisis(o)}><Eye className="h-4 w-4 mr-1" /> Analizar</Button>
                        <Button size="sm" onClick={() => handleResponder(o.id, 'aceptada')}><CheckCircle className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => handleResponder(o.id, 'rechazada')}><XCircle className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendientes.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No hay ofertas pendientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {respondidas.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Historial de Ofertas</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Lote</th>
                  <th className="px-4 py-3 font-medium">Exportador</th>
                  <th className="px-4 py-3 font-medium">Volumen</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha respuesta</th>
                </tr></thead>
                <tbody>
                  {respondidas.map(o => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{o.lote_code}</td>
                      <td className="px-4 py-3 text-foreground">{o.exportador_nombre}</td>
                      <td className="px-4 py-3">{(o.volumen_kg ?? 0).toLocaleString()} kg</td>
                      <td className="px-4 py-3 font-medium">${(o.precio_ofertado ?? 0).toFixed(2)}/lb</td>
                      <td className="px-4 py-3">{estadoBadge(o.estado)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{o.fecha_respuesta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Dialog */}
      <Dialog open={!!analisis} onOpenChange={() => setAnalisis(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {analisis && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><HandCoins className="h-5 w-5 text-primary" /> Análisis de Oferta</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground text-xs">Exportador</span><p className="font-medium text-foreground">{analisis.exportador_nombre}{analisis.es_vip && <Badge variant="outline" className="ml-2 text-[10px]">VIP</Badge>}</p></div>
                    <div><span className="text-muted-foreground text-xs">Lote</span><p className="font-medium text-foreground">{analisis.lote_code}</p></div>
                    <div><span className="text-muted-foreground text-xs">Volumen</span><p className="font-medium text-foreground">{(analisis.volumen_kg ?? 0).toLocaleString()} kg</p></div>
                    <div><span className="text-muted-foreground text-xs">Precio</span><p className="font-bold text-primary">${(analisis.precio_ofertado ?? 0).toFixed(2)}/lb</p></div>
                    <div><span className="text-muted-foreground text-xs">Condiciones</span><p className="font-medium text-foreground">{analisis.condiciones_pago}</p></div>
                    <div><span className="text-muted-foreground text-xs">Fecha</span><p className="font-medium text-foreground">{analisis.fecha_oferta}</p></div>
                  </div>
                  {analisis.notas && <p className="text-xs text-muted-foreground italic mt-2">"{analisis.notas}"</p>}
                </div>

                <MarketIntelligenceCard
                  precioOferta={analisis.precio_ofertado ?? 0}
                  precioMercado={PRECIO_MERCADO}
                  exportadorNombre={analisis.exportador_nombre ?? ''}
                  loteCode={analisis.lote_code ?? ''}
                  volumenKg={analisis.volumen_kg ?? 0}
                  esVIP={analisis.es_vip}
                  condicionesPago={analisis.condiciones_pago ?? ''}
                  onAceptar={() => handleResponder(analisis.id, 'aceptada')}
                  onContraofertar={() => handleResponder(analisis.id, 'contraoferta')}
                  onRechazar={() => handleResponder(analisis.id, 'rechazada')}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
