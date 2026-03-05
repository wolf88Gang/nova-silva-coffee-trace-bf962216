/**
 * OfertasRecibidas — Vista cooperativa para gestionar ofertas de exportadores
 * Incluye tabla de ofertas pendientes, sheet de análisis con MarketIntelligenceCard,
 * e historial de ofertas respondidas.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  HandCoins, Eye, CheckCircle, XCircle, Clock, TrendingUp, Package,
} from 'lucide-react';
import { toast } from 'sonner';
import MarketIntelligenceCard from '@/components/cooperativa/MarketIntelligenceCard';

interface Oferta {
  id: string; loteCode: string; exportadorNombre: string; volumenKg: number;
  precioOfertado: number; condicionesPago: string; fechaOferta: string; notas: string;
  riesgo: 'bajo' | 'medio' | 'alto'; estado: 'pendiente' | 'aceptada' | 'rechazada' | 'contraoferta';
  esVIP: boolean; fechaRespuesta?: string;
}

const ofertasIniciales: Oferta[] = [
  { id: '1', loteCode: 'SOL-2024-001', exportadorNombre: 'Volcafe S.A.', volumenKg: 1500, precioOfertado: 4.15, condicionesPago: 'Net 30', fechaOferta: '2026-02-20', notas: 'Interesados en volumen completo. Posibilidad de contrato anual.', riesgo: 'bajo', estado: 'pendiente', esVIP: true },
  { id: '2', loteCode: 'MV-2024-015', exportadorNombre: 'Nordic Approach', volumenKg: 2200, precioOfertado: 4.65, condicionesPago: 'Net 0 (pago inmediato)', fechaOferta: '2026-02-18', notas: 'Specialty buyer. Interés en trazabilidad completa y perfil de tueste.', riesgo: 'bajo', estado: 'pendiente', esVIP: false },
  { id: '3', loteCode: 'SN-2024-008', exportadorNombre: 'Mercon Coffee', volumenKg: 850, precioOfertado: 3.80, condicionesPago: 'Net 90', fechaOferta: '2026-02-15', notas: 'Oferta condicional a certificación completa EUDR.', riesgo: 'medio', estado: 'pendiente', esVIP: false },
  { id: '4', loteCode: 'SOL-2024-002', exportadorNombre: 'CECA Trading', volumenKg: 680, precioOfertado: 3.95, condicionesPago: 'Net 60', fechaOferta: '2026-02-10', notas: '', riesgo: 'bajo', estado: 'aceptada', esVIP: true, fechaRespuesta: '2026-02-12' },
  { id: '5', loteCode: 'MV-2024-015', exportadorNombre: 'Specialty Imports LLC', volumenKg: 2200, precioOfertado: 4.30, condicionesPago: 'Net 45', fechaOferta: '2026-02-08', notas: 'Para programa de microroasters US', riesgo: 'bajo', estado: 'rechazada', esVIP: false, fechaRespuesta: '2026-02-14' },
];

const PRECIO_MERCADO = 4.25; // NY + diferencial referencia

const riesgoBadge = (r: string) => {
  if (r === 'bajo') return <Badge className="bg-emerald-600 text-white border-0 text-xs">Bajo</Badge>;
  if (r === 'medio') return <Badge className="bg-amber-500 text-white border-0 text-xs">Medio</Badge>;
  return <Badge variant="destructive" className="text-xs">Alto</Badge>;
};

const estadoBadge = (e: string) => {
  if (e === 'pendiente') return <Badge className="bg-blue-500 text-white border-0"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
  if (e === 'aceptada') return <Badge className="bg-emerald-600 text-white border-0"><CheckCircle className="h-3 w-3 mr-1" />Aceptada</Badge>;
  if (e === 'rechazada') return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
  return <Badge className="bg-amber-500 text-white border-0">Contraoferta</Badge>;
};

export default function OfertasRecibidas() {
  const [ofertas, setOfertas] = useState(ofertasIniciales);
  const [analisis, setAnalisis] = useState<Oferta | null>(null);

  const pendientes = ofertas.filter(o => o.estado === 'pendiente');
  const respondidas = ofertas.filter(o => o.estado !== 'pendiente');

  const handleResponder = (id: string, estado: 'aceptada' | 'rechazada' | 'contraoferta') => {
    setOfertas(prev => prev.map(o => o.id === id ? { ...o, estado, fechaRespuesta: new Date().toISOString().slice(0, 10) } : o));
    setAnalisis(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Ofertas Recibidas</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Pendientes</span></div><p className="text-xl font-bold text-foreground">{pendientes.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><CheckCircle className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Aceptadas</span></div><p className="text-xl font-bold text-foreground">{ofertas.filter(o => o.estado === 'aceptada').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">kg en oferta</span></div><p className="text-xl font-bold text-foreground">{pendientes.reduce((s, o) => s + o.volumenKg, 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Precio promedio</span></div><p className="text-xl font-bold text-foreground">${pendientes.length > 0 ? (pendientes.reduce((s, o) => s + o.precioOfertado, 0) / pendientes.length).toFixed(2) : '0.00'}/lb</p></CardContent></Card>
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
                    <td className="px-4 py-3 font-medium text-foreground">{o.loteCode}</td>
                    <td className="px-4 py-3"><div><span className="text-foreground">{o.exportadorNombre}</span>{o.esVIP && <Badge variant="outline" className="ml-2 text-[10px]">VIP</Badge>}</div></td>
                    <td className="px-4 py-3 text-foreground">{o.volumenKg.toLocaleString()} kg</td>
                    <td className="px-4 py-3 font-bold text-primary">${o.precioOfertado.toFixed(2)}/lb</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.fechaOferta}</td>
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
                      <td className="px-4 py-3 font-medium text-foreground">{o.loteCode}</td>
                      <td className="px-4 py-3 text-foreground">{o.exportadorNombre}</td>
                      <td className="px-4 py-3">{o.volumenKg.toLocaleString()} kg</td>
                      <td className="px-4 py-3 font-medium">${o.precioOfertado.toFixed(2)}/lb</td>
                      <td className="px-4 py-3">{estadoBadge(o.estado)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{o.fechaRespuesta}</td>
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
                {/* Offer data */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground text-xs">Exportador</span><p className="font-medium text-foreground">{analisis.exportadorNombre}{analisis.esVIP && <Badge variant="outline" className="ml-2 text-[10px]">VIP</Badge>}</p></div>
                    <div><span className="text-muted-foreground text-xs">Lote</span><p className="font-medium text-foreground">{analisis.loteCode}</p></div>
                    <div><span className="text-muted-foreground text-xs">Volumen</span><p className="font-medium text-foreground">{analisis.volumenKg.toLocaleString()} kg</p></div>
                    <div><span className="text-muted-foreground text-xs">Precio</span><p className="font-bold text-primary">${analisis.precioOfertado.toFixed(2)}/lb</p></div>
                    <div><span className="text-muted-foreground text-xs">Condiciones</span><p className="font-medium text-foreground">{analisis.condicionesPago}</p></div>
                    <div><span className="text-muted-foreground text-xs">Fecha</span><p className="font-medium text-foreground">{analisis.fechaOferta}</p></div>
                  </div>
                  {analisis.notas && <p className="text-xs text-muted-foreground italic mt-2">"{analisis.notas}"</p>}
                </div>

                {/* MarketIntelligenceCard */}
                <MarketIntelligenceCard
                  precioOferta={analisis.precioOfertado}
                  precioMercado={PRECIO_MERCADO}
                  exportadorNombre={analisis.exportadorNombre}
                  loteCode={analisis.loteCode}
                  volumenKg={analisis.volumenKg}
                  esVIP={analisis.esVIP}
                  condicionesPago={analisis.condicionesPago}
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
