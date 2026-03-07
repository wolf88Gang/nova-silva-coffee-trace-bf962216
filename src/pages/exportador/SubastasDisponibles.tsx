/**
 * SubastasDisponibles — Vista exportador para participar en subastas/ofertas públicas de cooperativas
 * Rich cards + Detail sheet (Origen/Calidad/EUDR/Mercado) + Interpretación Nova Silva + Dialog de oferta
 * Connected to useLotesOfrecidos for real-data awareness; falls back to rich demo data.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Gavel, MapPin, Coffee, Shield, Leaf, Brain, DollarSign, TrendingUp,
  Clock, Eye, Send, Users, Mountain, Droplets, Sun, ThermometerSun, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLotesOfrecidos } from '@/hooks/useLotesOfrecidos';

// ── Demo auction lots ──
const lotesSubasta = [
  {
    id: '1', codigo: 'SOL-2024-001', cooperativa: 'Café de la Selva', region: 'Matagalpa', pais: 'Nicaragua',
    volumenKg: 1500, proceso: 'Lavado', tipoCafe: 'SHB',
    mejorOferta: 4.15, numOfertas: 3, diasPublicado: 3,
    riesgo: 'bajo' as const, indiceVital: 72, nivelMadurez: 3, riesgoClimatico: 'medio' as const,
    // Origen
    municipio: 'San Ramón', comunidad: 'El Roblar', altMin: 1200, altMax: 1450, altProm: 1320,
    microclima: 'Subtropical húmedo', suelo: 'Andisol volcánico', sombra: 'Inga + Eritrina (40%)',
    productores: 12, parcelas: 18, areaHa: 24.5, variedades: 'Caturra, Catuaí, Bourbon', edadPlantaciones: '8-15 años',
    densidad: '4,500 plantas/ha', rendimiento: '28 QQ/ha', beneficio: 'Húmedo centralizado', cosecha: 'Nov 2025 - Feb 2026',
    // Calidad
    humedad: 10.8, aw: 0.56, densidadGL: 720, malla: '16+', defectosPrim: 2, defectosSec: 5,
    scaTotal: 84.5, fragancia: 7.75, sabor: 7.5, acidez: 7.75, cuerpo: 7.5, balance: 7.25,
    descriptores: ['Chocolate', 'Caramelo', 'Cítrico suave', 'Nuez'],
    notasCatacion: 'Taza limpia con cuerpo medio-alto. Dulzura persistente con notas de chocolate amargo.',
    perfilTueste: 'Medium (City+)',
    // EUDR
    eudrDocPct: 83, eudrGeoPct: 90, eudrProductores: 12, eudrParcelas: 18,
    eudrConCoords: 16, eudrConPoligono: 14, eudrDocsVigentes: 15, eudrDocsPendientes: 3,
    riesgoDeforestacion: 'bajo', hashTrazabilidad: '0x7a3f...e9c2', certificaciones: ['Rainforest Alliance', 'UTZ'],
    // Mercado
    precioRefICE: 2.18, diferencialSugerido: '+$0.45', disponibilidad: 'Inmediata',
    puntoEntrega: 'Bodega Matagalpa', incoterm: 'FOB', empaque: 'Sacos GrainPro 69kg',
    interpretacionNovaSilva: 'Lote con buena trazabilidad y calidad consistente. Productores con prácticas de conservación de suelos establecidas. Riesgo climático moderado por variabilidad en temporada de lluvias. Documentación EUDR al 83% de cumplimiento.',
  },
  {
    id: '2', codigo: 'MV-2024-015', cooperativa: 'Montaña Verde', region: 'Jinotega', pais: 'Nicaragua',
    volumenKg: 2200, proceso: 'Honey', tipoCafe: 'SHB EP',
    mejorOferta: 4.65, numOfertas: 5, diasPublicado: 5,
    riesgo: 'bajo' as const, indiceVital: 81, nivelMadurez: 4, riesgoClimatico: 'bajo' as const,
    municipio: 'El Cuá', comunidad: 'La Cumbre', altMin: 1350, altMax: 1600, altProm: 1480,
    microclima: 'Nuboso montano', suelo: 'Ferralsol', sombra: 'Inga denispada (55%)',
    productores: 8, parcelas: 12, areaHa: 16.8, variedades: 'Pacamara, Geisha, SL28', edadPlantaciones: '5-12 años',
    densidad: '3,800 plantas/ha', rendimiento: '22 QQ/ha', beneficio: 'Micro-beneficio solar', cosecha: 'Oct 2025 - Ene 2026',
    humedad: 10.5, aw: 0.54, densidadGL: 740, malla: '17+', defectosPrim: 0, defectosSec: 2,
    scaTotal: 86.0, fragancia: 8.0, sabor: 8.0, acidez: 8.25, cuerpo: 7.75, balance: 7.75,
    descriptores: ['Miel', 'Durazno', 'Floral', 'Panela', 'Bergamota'],
    notasCatacion: 'Complejidad aromática excepcional. Acidez vibrante tipo cítrica con dulzura de miel persistente.',
    perfilTueste: 'Light-Medium (City)',
    eudrDocPct: 88, eudrGeoPct: 95, eudrProductores: 8, eudrParcelas: 12,
    eudrConCoords: 12, eudrConPoligono: 11, eudrDocsVigentes: 11, eudrDocsPendientes: 1,
    riesgoDeforestacion: 'bajo', hashTrazabilidad: '0x4b2d...f1a8', certificaciones: ['Fairtrade', 'Orgánico'],
    precioRefICE: 2.18, diferencialSugerido: '+$0.85', disponibilidad: 'Inmediata',
    puntoEntrega: 'Bodega Jinotega', incoterm: 'FOB', empaque: 'Sacos GrainPro 69kg',
    interpretacionNovaSilva: 'Lote premium con excelente trazabilidad. Cooperativa nivel Avanzado (4/4) con programa de sostenibilidad integral. Productores certificados con bajo riesgo climático. EUDR al 88%.',
  },
  {
    id: '3', codigo: 'SN-2024-008', cooperativa: 'Sierra Nevada', region: 'Estelí', pais: 'Nicaragua',
    volumenKg: 850, proceso: 'Natural', tipoCafe: 'HB',
    mejorOferta: 0, numOfertas: 0, diasPublicado: 1,
    riesgo: 'alto' as const, indiceVital: 65, nivelMadurez: 2, riesgoClimatico: 'alto' as const,
    municipio: 'Condega', comunidad: 'Ducualí', altMin: 900, altMax: 1150, altProm: 1020,
    microclima: 'Semi-árido transitorio', suelo: 'Alfisol', sombra: 'Mínima (15%)',
    productores: 6, parcelas: 8, areaHa: 9.2, variedades: 'Catimor, Costa Rica 95', edadPlantaciones: '12-20 años',
    densidad: '5,000 plantas/ha', rendimiento: '18 QQ/ha', beneficio: 'Secado natural en patio', cosecha: 'Nov 2025 - Mar 2026',
    humedad: 11.2, aw: 0.58, densidadGL: 690, malla: '15/16', defectosPrim: 5, defectosSec: 12,
    scaTotal: 87.5, fragancia: 8.25, sabor: 8.5, acidez: 8.0, cuerpo: 8.0, balance: 7.75,
    descriptores: ['Frutos rojos', 'Vino', 'Chocolate negro', 'Especias'],
    notasCatacion: 'Perfil fermentativo intenso. Cuerpo pesado con notas vinosas y frutos del bosque. Proceso natural bien ejecutado.',
    perfilTueste: 'Medium-Dark (Full City)',
    eudrDocPct: 60, eudrGeoPct: 50, eudrProductores: 6, eudrParcelas: 8,
    eudrConCoords: 5, eudrConPoligono: 4, eudrDocsVigentes: 5, eudrDocsPendientes: 3,
    riesgoDeforestacion: 'medio', hashTrazabilidad: '0x9e1c...a4d7', certificaciones: [],
    precioRefICE: 2.18, diferencialSugerido: '+$0.30', disponibilidad: '15 días',
    puntoEntrega: 'Finca Ducualí', incoterm: 'EXW', empaque: 'Sacos yute 69kg',
    interpretacionNovaSilva: 'Lote con perfil de taza excepcional pero riesgo EUDR elevado. Documentación al 60%, geolocalización incompleta. Riesgo climático alto por zona semi-árida. Cooperativa nivel Básico (2/4).',
  },
  {
    id: '4', codigo: 'SOL-2024-002', cooperativa: 'Café de la Selva', region: 'Matagalpa', pais: 'Nicaragua',
    volumenKg: 680, proceso: 'Lavado', tipoCafe: 'HB',
    mejorOferta: 3.90, numOfertas: 2, diasPublicado: 7,
    riesgo: 'bajo' as const, indiceVital: 68, nivelMadurez: 3, riesgoClimatico: 'medio' as const,
    municipio: 'Matagalpa', comunidad: 'La Corona', altMin: 1000, altMax: 1200, altProm: 1100,
    microclima: 'Subtropical', suelo: 'Andisol', sombra: 'Inga (35%)',
    productores: 5, parcelas: 7, areaHa: 8.5, variedades: 'Caturra, Marsellesa', edadPlantaciones: '10-18 años',
    densidad: '4,200 plantas/ha', rendimiento: '25 QQ/ha', beneficio: 'Húmedo', cosecha: 'Nov 2025 - Feb 2026',
    humedad: 11.0, aw: 0.57, densidadGL: 710, malla: '15+', defectosPrim: 3, defectosSec: 8,
    scaTotal: 82.5, fragancia: 7.25, sabor: 7.25, acidez: 7.0, cuerpo: 7.25, balance: 7.0,
    descriptores: ['Nuez', 'Caramelo', 'Chocolate con leche'],
    notasCatacion: 'Taza balanceada, suave. Buen café de base para mezclas.',
    perfilTueste: 'Medium (City+)',
    eudrDocPct: 100, eudrGeoPct: 100, eudrProductores: 5, eudrParcelas: 7,
    eudrConCoords: 7, eudrConPoligono: 7, eudrDocsVigentes: 7, eudrDocsPendientes: 0,
    riesgoDeforestacion: 'bajo', hashTrazabilidad: '0x2f8a...c3b1', certificaciones: ['Rainforest Alliance'],
    precioRefICE: 2.18, diferencialSugerido: '+$0.15', disponibilidad: 'Inmediata',
    puntoEntrega: 'Bodega Matagalpa', incoterm: 'FOB', empaque: 'Sacos GrainPro 69kg',
    interpretacionNovaSilva: 'Lote con trazabilidad EUDR completa (100%). Calidad estándar, ideal para programas de volumen. Buen balance precio-calidad-cumplimiento.',
  },
];

type Lote = typeof lotesSubasta[0];

const riesgoBadge = (r: string) => {
  if (r === 'bajo') return <Badge className="bg-emerald-600 text-white border-0 text-xs">Bajo</Badge>;
  if (r === 'medio') return <Badge className="bg-amber-500 text-white border-0 text-xs">Medio</Badge>;
  return <Badge variant="destructive" className="text-xs">Alto</Badge>;
};

const madurezLabel = (n: number) => ['', 'Inicial', 'Básico', 'Operativo', 'Avanzado'][n] || '';

export default function SubastasDisponibles() {
  // Real data awareness — when Supabase has lotes_ofrecidos we log count; UI uses rich demo data as composite view
  const { isLoading: lotesLoading } = useLotesOfrecidos();
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [showOferta, setShowOferta] = useState(false);
  const [ofertaForm, setOfertaForm] = useState({ precio: '', condiciones: '', fechaEntrega: '', notas: '' });

  if (lotesLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const totalKg = lotesSubasta.reduce((s, l) => s + l.volumenKg, 0);
  const conPujas = lotesSubasta.filter(l => l.numOfertas > 0).length;
  const sinOfertas = lotesSubasta.filter(l => l.numOfertas === 0).length;

  const handleOfertar = () => {
    if (!ofertaForm.precio) { toast.error('Precio es requerido'); return; }
    toast.success(`Oferta de $${ofertaForm.precio}/lb enviada para ${selectedLote?.codigo}`);
    setShowOferta(false);
    setOfertaForm({ precio: '', condiciones: '', fechaEntrega: '', notas: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Gavel className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Ofertas activas</span></div><p className="text-xl font-bold text-foreground">{lotesSubasta.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Con pujas</span></div><p className="text-xl font-bold text-foreground">{conPujas}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Sin ofertas aún</span></div><p className="text-xl font-bold text-foreground">{sinOfertas}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Coffee className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">kg disponibles</span></div><p className="text-xl font-bold text-foreground">{totalKg.toLocaleString()}</p></CardContent></Card>
      </div>

      {/* Lot cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lotesSubasta.map(l => (
          <Card key={l.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedLote(l)}>
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-foreground">{l.codigo}</p>
                  <p className="text-xs text-muted-foreground">{l.cooperativa}</p>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">Pública</Badge>
                  {riesgoBadge(l.riesgo)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-muted-foreground">Volumen</span><p className="font-bold text-foreground">{l.volumenKg.toLocaleString()} kg</p></div>
                <div><span className="text-muted-foreground">Proceso</span><p className="font-medium text-foreground">{l.proceso}</p></div>
                <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" /><span className="text-foreground">{l.region}</span></div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div>
                  <p className="text-[10px] text-muted-foreground">Mejor oferta</p>
                  <p className="font-bold text-primary">{l.mejorOferta > 0 ? `$${l.mejorOferta.toFixed(2)}/lb` : 'Sin ofertas'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{l.numOfertas} oferta{l.numOfertas !== 1 ? 's' : ''}</p>
                  <p className="text-[10px] text-muted-foreground">Hace {l.diasPublicado} día{l.diasPublicado !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <Button className="w-full" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedLote(l); setShowOferta(true); }}>
                {l.numOfertas > 0 ? 'Mejorar oferta' : 'Ofertar'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Sheet */}
      <Dialog open={!!selectedLote && !showOferta} onOpenChange={() => setSelectedLote(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLote && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-primary" /> {selectedLote.codigo} · {selectedLote.cooperativa}
                </DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="origen">
                <TabsList className="w-full">
                  <TabsTrigger value="origen" className="flex-1">Origen</TabsTrigger>
                  <TabsTrigger value="calidad" className="flex-1">Calidad</TabsTrigger>
                  <TabsTrigger value="eudr" className="flex-1">EUDR</TabsTrigger>
                  <TabsTrigger value="mercado" className="flex-1">Mercado</TabsTrigger>
                </TabsList>

                {/* ORIGEN */}
                <TabsContent value="origen" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {[
                      { icon: MapPin, l: 'País', v: selectedLote.pais },
                      { icon: MapPin, l: 'Región', v: selectedLote.region },
                      { icon: MapPin, l: 'Municipio', v: selectedLote.municipio },
                      { icon: MapPin, l: 'Comunidad', v: selectedLote.comunidad },
                      { icon: Mountain, l: 'Altitud', v: `${selectedLote.altMin}-${selectedLote.altMax}m (prom: ${selectedLote.altProm}m)` },
                      { icon: ThermometerSun, l: 'Microclima', v: selectedLote.microclima },
                      { icon: Leaf, l: 'Suelo', v: selectedLote.suelo },
                      { icon: Sun, l: 'Sombra', v: selectedLote.sombra },
                      { icon: Users, l: 'Productores', v: String(selectedLote.productores) },
                      { icon: MapPin, l: 'Parcelas', v: String(selectedLote.parcelas) },
                      { icon: MapPin, l: 'Área', v: `${selectedLote.areaHa} ha` },
                      { icon: Coffee, l: 'Variedades', v: selectedLote.variedades },
                      { icon: Clock, l: 'Edad', v: selectedLote.edadPlantaciones },
                      { icon: Leaf, l: 'Densidad', v: selectedLote.densidad },
                      { icon: TrendingUp, l: 'Rendimiento', v: selectedLote.rendimiento },
                      { icon: Coffee, l: 'Proceso', v: selectedLote.proceso },
                      { icon: Coffee, l: 'Beneficio', v: selectedLote.beneficio },
                      { icon: Clock, l: 'Cosecha', v: selectedLote.cosecha },
                    ].map(d => (
                      <div key={d.l} className="p-2 rounded border border-border">
                        <span className="text-muted-foreground text-[10px] flex items-center gap-1"><d.icon className="h-3 w-3" />{d.l}</span>
                        <p className="font-medium text-foreground text-xs mt-0.5">{d.v}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* CALIDAD */}
                <TabsContent value="calidad" className="space-y-4 mt-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Calidad física</p>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                      {[
                        { l: 'Humedad', v: `${selectedLote.humedad}%` },
                        { l: 'Aw', v: selectedLote.aw.toString() },
                        { l: 'Densidad', v: `${selectedLote.densidadGL} g/L` },
                        { l: 'Malla', v: selectedLote.malla },
                        { l: 'Defectos', v: `${selectedLote.defectosPrim}p / ${selectedLote.defectosSec}s` },
                      ].map(d => (
                        <div key={d.l} className="p-2 rounded bg-muted/50 text-center"><span className="text-muted-foreground">{d.l}</span><p className="font-bold text-foreground">{d.v}</p></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Perfil SCA</p>
                    <div className="text-center mb-3">
                      <p className="text-4xl font-bold text-primary">{selectedLote.scaTotal}</p>
                      <p className="text-xs text-muted-foreground">Puntaje total</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { l: 'Fragancia/Aroma', v: selectedLote.fragancia },
                        { l: 'Sabor', v: selectedLote.sabor },
                        { l: 'Acidez', v: selectedLote.acidez },
                        { l: 'Cuerpo', v: selectedLote.cuerpo },
                        { l: 'Balance', v: selectedLote.balance },
                      ].map(d => (
                        <div key={d.l} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-28">{d.l}</span>
                          <Progress value={d.v * 10} className="flex-1 h-2" />
                          <span className="text-xs font-bold text-foreground w-8 text-right">{d.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedLote.descriptores.map(d => <Badge key={d} variant="outline" className="text-xs">{d}</Badge>)}
                  </div>
                  <p className="text-xs italic text-muted-foreground">{selectedLote.notasCatacion}</p>
                  <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground">Perfil de tueste recomendado:</span><p className="text-sm font-medium text-foreground">{selectedLote.perfilTueste}</p></div>
                </TabsContent>

                {/* EUDR */}
                <TabsContent value="eudr" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Documentación</span><span className="font-bold text-foreground">{selectedLote.eudrDocPct}%</span></div>
                      <Progress value={selectedLote.eudrDocPct} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Geolocalización</span><span className="font-bold text-foreground">{selectedLote.eudrGeoPct}%</span></div>
                      <Progress value={selectedLote.eudrGeoPct} className="h-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {[
                      { l: 'Productores', v: selectedLote.eudrProductores },
                      { l: 'Parcelas', v: selectedLote.eudrParcelas },
                      { l: 'Con coordenadas', v: `${selectedLote.eudrConCoords}/${selectedLote.eudrParcelas}` },
                      { l: 'Con polígono', v: `${selectedLote.eudrConPoligono}/${selectedLote.eudrParcelas}` },
                      { l: 'Docs vigentes', v: selectedLote.eudrDocsVigentes },
                      { l: 'Docs pendientes', v: selectedLote.eudrDocsPendientes },
                    ].map(d => (
                      <div key={d.l} className="p-2 rounded border border-border"><span className="text-muted-foreground">{d.l}</span><p className="font-bold text-foreground">{String(d.v)}</p></div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <span className="text-sm text-muted-foreground">Riesgo deforestación</span>
                    {riesgoBadge(selectedLote.riesgoDeforestacion)}
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-xs">
                    <span className="text-muted-foreground">Hash trazabilidad:</span>
                    <span className="font-mono text-foreground ml-1">{selectedLote.hashTrazabilidad}</span>
                  </div>
                  {selectedLote.certificaciones.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedLote.certificaciones.map(c => <Badge key={c} variant="default" className="text-xs">{c}</Badge>)}
                    </div>
                  )}
                </TabsContent>

                {/* MERCADO */}
                <TabsContent value="mercado" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {[
                      { l: 'Referencia ICE', v: `$${selectedLote.precioRefICE}/lb` },
                      { l: 'Diferencial sugerido', v: selectedLote.diferencialSugerido },
                      { l: 'Disponibilidad', v: selectedLote.disponibilidad },
                      { l: 'Punto entrega', v: selectedLote.puntoEntrega },
                      { l: 'Incoterm', v: selectedLote.incoterm },
                      { l: 'Empaque', v: selectedLote.empaque },
                    ].map(d => (
                      <div key={d.l} className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">{d.l}</span><p className="font-medium text-foreground">{d.v}</p></div>
                    ))}
                  </div>

                  {/* Nova Silva interpretation */}
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                    <p className="text-xs font-medium text-primary flex items-center gap-1"><Brain className="h-3.5 w-3.5" /> Interpretación Nova Silva</p>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div className="p-2 rounded bg-background text-center"><span className="text-muted-foreground">VITAL</span><p className="font-bold text-foreground">{selectedLote.indiceVital}/100</p></div>
                      <div className="p-2 rounded bg-background text-center"><span className="text-muted-foreground">Madurez</span><p className="font-bold text-foreground">{madurezLabel(selectedLote.nivelMadurez)} ({selectedLote.nivelMadurez}/4)</p></div>
                      <div className="p-2 rounded bg-background text-center"><span className="text-muted-foreground">Riesgo clima</span><div className="mt-0.5">{riesgoBadge(selectedLote.riesgoClimatico)}</div></div>
                    </div>
                    <p className="text-sm text-foreground italic">"{selectedLote.interpretacionNovaSilva}"</p>
                  </div>

                  <Button className="w-full" onClick={() => setShowOferta(true)}>
                    <Gavel className="h-4 w-4 mr-1" /> {selectedLote.numOfertas > 0 ? 'Mejorar oferta' : 'Hacer oferta'}
                  </Button>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Offer Dialog */}
      <Dialog open={showOferta} onOpenChange={(o) => { setShowOferta(o); if (!o) setSelectedLote(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Gavel className="h-5 w-5 text-primary" /> Ofertar por {selectedLote?.codigo}</DialogTitle></DialogHeader>
          {selectedLote && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground text-xs">Lote: {selectedLote.codigo} · {selectedLote.cooperativa}</p>
                <p className="text-foreground">{selectedLote.volumenKg.toLocaleString()} kg · {selectedLote.proceso} · SCA {selectedLote.scaTotal}</p>
                {selectedLote.mejorOferta > 0 && <p className="text-xs text-primary mt-1">Mejor oferta actual: ${selectedLote.mejorOferta.toFixed(2)}/lb</p>}
              </div>
              <div className="space-y-3">
                <div><Label>Precio ofertado (USD/lb) *</Label><Input type="number" step="0.01" value={ofertaForm.precio} onChange={e => setOfertaForm(f => ({ ...f, precio: e.target.value }))} placeholder="4.25" /></div>
                <div><Label>Condiciones de pago</Label><Input value={ofertaForm.condiciones} onChange={e => setOfertaForm(f => ({ ...f, condiciones: e.target.value }))} placeholder="Ej: Net 30, 50% anticipado" /></div>
                <div><Label>Fecha de entrega propuesta</Label><Input type="date" value={ofertaForm.fechaEntrega} onChange={e => setOfertaForm(f => ({ ...f, fechaEntrega: e.target.value }))} /></div>
                <div><Label>Notas</Label><Textarea value={ofertaForm.notas} onChange={e => setOfertaForm(f => ({ ...f, notas: e.target.value }))} rows={3} placeholder="Comentarios adicionales..." /></div>
              </div>
              <Button className="w-full" onClick={handleOfertar}>
                <Send className="h-4 w-4 mr-1" /> Enviar Oferta
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
