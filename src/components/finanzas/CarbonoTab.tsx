import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Leaf, TreePine, Plus, Clock, DollarSign, Target,
  TreeDeciduous, Banana, Coffee, Settings, BarChart3, CheckCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

// ── Forest inventory data (3 strata per manual) ──
interface ArbolRegistro {
  id: string;
  especie: string;
  especieCientifica: string;
  dap_cm: number;
  altura_m: number;
  biomasa_kg: number;
  carbono_tco2: number;
  estado: 'vivo' | 'podado';
}

interface Estrato {
  id: string;
  nombre: string;
  tipo: 'dosel_alto' | 'dosel_medio' | 'sotobosque';
  descripcion: string;
  icon: typeof TreeDeciduous;
  color: string;
  unidades: number;
  carbono_tco2: number;
  arboles: ArbolRegistro[];
}

const estratos: Estrato[] = [
  {
    id: 'dosel_alto', nombre: 'Dosel Alto', tipo: 'dosel_alto',
    descripcion: 'Sombra Perenne', icon: TreeDeciduous,
    color: 'bg-emerald-500/10 border-emerald-500/30',
    unidades: 7, carbono_tco2: 7.04,
    arboles: [
      { id: '1', especie: 'Guamo / Cujinicuil', especieCientifica: 'Inga edulis', dap_cm: 35, altura_m: 12, biomasa_kg: 850, carbono_tco2: 2.48, estado: 'vivo' },
      { id: '2', especie: 'Laurel', especieCientifica: 'Cordia alliodora', dap_cm: 28, altura_m: 15, biomasa_kg: 1100, carbono_tco2: 3.19, estado: 'vivo' },
      { id: '3', especie: 'Poró / Bucayo', especieCientifica: 'Erythrina poeppigiana', dap_cm: 40, altura_m: 8, biomasa_kg: 470, carbono_tco2: 1.36, estado: 'podado' },
    ],
  },
  {
    id: 'dosel_medio', nombre: 'Dosel Medio', tipo: 'dosel_medio',
    descripcion: 'Productivo', icon: Banana,
    color: 'bg-amber-500/10 border-amber-500/30',
    unidades: 3, carbono_tco2: 0.04,
    arboles: [
      { id: '4', especie: 'Banano / Plátano', especieCientifica: 'Musa spp.', dap_cm: 18, altura_m: 3, biomasa_kg: 14, carbono_tco2: 0.04, estado: 'vivo' },
    ],
  },
  {
    id: 'sotobosque', nombre: 'Sotobosque', tipo: 'sotobosque',
    descripcion: 'Cultivo Principal', icon: Coffee,
    color: 'bg-rose-500/10 border-rose-500/30',
    unidades: 52, carbono_tco2: 0.15,
    arboles: [
      { id: '5', especie: 'Café', especieCientifica: 'Coffea arabica', dap_cm: 4, altura_m: 2.1, biomasa_kg: 0.29, carbono_tco2: 0.15, estado: 'vivo' },
    ],
  },
];

const totalCarbono = estratos.reduce((s, e) => s + e.carbono_tco2, 0);
const totalArboles = estratos.reduce((s, e) => s + e.unidades, 0);
const valorConservador = totalCarbono * 10; // $10/t
const valorPremium = totalCarbono * 35; // $35/t insetting

// MRV timeline
const mrvEvents = [
  { fecha: '2024-12-15', evento: 'Inventario inicial completado', estado: 'completado' },
  { fecha: '2025-03-20', evento: 'Verificación satelital Sentinel-2', estado: 'completado' },
  { fecha: '2025-06-10', evento: 'Auditoría campo — técnico certificado', estado: 'completado' },
  { fecha: '2025-12-15', evento: 'Última verificación MRV', estado: 'completado' },
  { fecha: '2026-03-15', evento: 'Próxima auditoría programada', estado: 'pendiente' },
];

// Meta de neutralidad
const emisionesAnuales = 35; // tCO2e estimadas
const metaNeutralidad = { horizonte: 10, progreso: totalCarbono / emisionesAnuales };
const tco2Faltantes = emisionesAnuales - totalCarbono;
const arbolesNecesarios = Math.round(tco2Faltantes / 0.05);

export default function CarbonoTab() {
  const [showRegistro, setShowRegistro] = useState(false);
  const [selectedEstrato, setSelectedEstrato] = useState<Estrato | null>(null);
  const [nuevoArbol, setNuevoArbol] = useState({ especie: '', dap: '', altura: '', estrato: '' });

  const handleRegistrar = () => {
    if (!nuevoArbol.especie || !nuevoArbol.dap || !nuevoArbol.estrato) {
      toast.error('Complete especie, DAP y estrato');
      return;
    }
    const dap = Number(nuevoArbol.dap);
    // Simplified allometric: ln(AGB) = -2.26 + 2.30*ln(DAP) → AGB in kg
    const biomasa = Math.exp(-2.26 + 2.30 * Math.log(dap));
    const carbono = (biomasa * 0.47 * 44 / 12) / 1000; // tCO2e
    toast.success(
      `Árbol registrado: ${nuevoArbol.especie} — DAP ${dap}cm → ${carbono.toFixed(3)} tCO₂e estimado`
    );
    setShowRegistro(false);
    setNuevoArbol({ especie: '', dap: '', altura: '', estrato: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" /> Activos de Carbono
          </h2>
          <p className="text-sm text-muted-foreground">Tu portafolio de capital natural y créditos de carbono</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-1" /> Verificación MRV</Button>
          <Button size="sm" onClick={() => setShowRegistro(true)}><Plus className="h-4 w-4 mr-1" /> Registrar Árbol</Button>
        </div>
      </div>

      {/* KPIs row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Stock Total Estimado</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalCarbono.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-primary border-primary/30">Confianza: alto</Badge>
              <span className="text-xs text-muted-foreground">{totalArboles} árboles registrados</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Valor Potencial</span>
            </div>
            <p className="text-3xl font-bold text-foreground">${Math.round(valorPremium)} <span className="text-sm font-normal text-muted-foreground">USD</span></p>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Conservador ($10/t)</span>
              <span className="font-medium text-foreground">${Math.round(valorConservador)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Premium Insetting ($35/t)</span>
              <span className="font-medium text-primary">${Math.round(valorPremium)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Estado de Verificación</span>
            </div>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0 mt-1">En Proceso MRV</Badge>
            <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Última verificación:</span><span className="text-foreground">2024-12-15</span></div>
              <div className="flex justify-between"><span>Próxima auditoría:</span><span className="text-foreground">2025-03-15</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meta de Carbono Neutralidad */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Meta de Carbono Neutralidad</h3>
            </div>
            <Badge variant="outline">Horizonte: 10 años</Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progreso hacia neutralidad</span>
            <span>{Math.round(metaNeutralidad.progreso * 100)}%</span>
          </div>
          <Progress value={metaNeutralidad.progreso * 100} className="h-3 mb-4" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{tco2Faltantes.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">tCO₂e faltantes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{arbolesNecesarios}</p>
              <p className="text-xs text-muted-foreground">Árboles necesarios</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">~2</p>
              <p className="text-xs text-muted-foreground">Años estimados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-tabs: Inventario Forestal / Análisis / MRV Digital */}
      <Tabs defaultValue="inventario">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="inventario" className="flex items-center gap-1.5"><TreePine className="h-3.5 w-3.5" /> Inventario Forestal</TabsTrigger>
          <TabsTrigger value="analisis" className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Análisis</TabsTrigger>
          <TabsTrigger value="mrv" className="flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" /> MRV Digital</TabsTrigger>
        </TabsList>

        {/* INVENTARIO FORESTAL */}
        <TabsContent value="inventario" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {estratos.map((e) => (
              <Card key={e.id} className={`border ${e.color} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => setSelectedEstrato(e)}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <e.icon className="h-5 w-5 text-foreground" />
                      <div>
                        <p className="font-semibold text-foreground">{e.nombre}</p>
                        <p className="text-xs text-muted-foreground">{e.descripcion}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{e.unidades} unidades</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 mb-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="h-3 w-3" /> Carbono almacenado</p>
                    <p className="text-2xl font-bold text-foreground">{e.carbono_tco2.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Composición</p>
                    {e.arboles.map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-foreground">{a.especie}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">{a.carbono_tco2.toFixed(2)} t</p>
                          {e.tipo === 'dosel_alto' && (
                            <p className="text-[10px] text-muted-foreground">
                              {e.arboles.filter(x => x.especie === a.especie).length > 1 ? e.unidades : Math.ceil(e.unidades / e.arboles.length)} ud.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Oportunidades de Financiamiento */}
          <Card className="mt-4">
            <CardContent className="py-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Oportunidades de Financiamiento</h3>
                  <p className="text-sm text-muted-foreground">Tus activos de carbono pueden servir como garantía para créditos verdes o generar ingresos adicionales mediante la venta de créditos verificados.</p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => toast.info('Módulo de certificación en proceso. Su técnico será notificado.')}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Solicitar Certificación
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.info('Opciones de crédito verde disponibles: contacte a su organización.')}>
                      <DollarSign className="h-4 w-4 mr-1" /> Ver Opciones de Crédito
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANÁLISIS */}
        <TabsContent value="analisis" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Distribución de Carbono por Estrato</CardTitle></CardHeader>
            <CardContent>
              {estratos.map((e) => {
                const pct = (e.carbono_tco2 / totalCarbono) * 100;
                return (
                  <div key={e.id} className="mb-4 last:mb-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">{e.nombre}</span>
                      <span className="text-muted-foreground">{e.carbono_tco2.toFixed(2)} tCO₂e ({pct.toFixed(1)}%)</span>
                    </div>
                    <Progress value={pct} className="h-3" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Ecuaciones Alométricas Aplicadas</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 rounded-lg border border-border">
                  <p className="font-medium text-foreground">Cafeto (Coffea arabica)</p>
                  <p className="text-xs text-muted-foreground font-mono">log(AGB) = -1.113 + 1.578·log(d₁₅) + 0.581·log(h)</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Segura et al. (2006) — Tier 3</p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="font-medium text-foreground">Guamo (Inga spp.)</p>
                  <p className="text-xs text-muted-foreground font-mono">ln(AGB) = -2.26 + 2.30·ln(DAP)</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Segura et al. (2006) — Tier 3</p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="font-medium text-foreground">Laurel (Cordia alliodora)</p>
                  <p className="text-xs text-muted-foreground font-mono">ln(AGB) = -2.15 + 2.35·ln(DAP)</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Segura et al. (2006) — Tier 3</p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="font-medium text-foreground">Banano (Musa spp.)</p>
                  <p className="text-xs text-muted-foreground font-mono">AGB = -0.0927 + 0.0203·(DAP)²</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Alcudia-Aguilar (2019) — Tier 2</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Factores de Conversión</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between p-2 border-b border-border">
                  <span className="text-muted-foreground">Fracción de carbono (CF)</span>
                  <span className="font-medium text-foreground">0.47</span>
                </div>
                <div className="flex justify-between p-2 border-b border-border">
                  <span className="text-muted-foreground">CO₂ / C ratio</span>
                  <span className="font-medium text-foreground">44/12 = 3.667</span>
                </div>
                <div className="flex justify-between p-2 border-b border-border">
                  <span className="text-muted-foreground">Descuento permanencia (buffer)</span>
                  <span className="font-medium text-foreground">20%</span>
                </div>
                <div className="flex justify-between p-2 border-b border-border">
                  <span className="text-muted-foreground">Descuento fuga (leakage)</span>
                  <span className="font-medium text-foreground">10%</span>
                </div>
                <div className="flex justify-between p-2">
                  <span className="text-muted-foreground">Precio conservador VCM</span>
                  <span className="font-medium text-primary">$10 USD/tCO₂e</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MRV DIGITAL */}
        <TabsContent value="mrv" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Línea de Tiempo MRV</CardTitle>
              <p className="text-xs text-muted-foreground">Monitoreo, Reporte y Verificación digital de tus activos de carbono</p>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
                {mrvEvents.map((ev, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className={`absolute -left-3.5 mt-1.5 h-3 w-3 rounded-full border-2 ${
                      ev.estado === 'completado' ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'
                    }`} />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-foreground">{ev.evento}</p>
                      <p className="text-xs text-muted-foreground">{ev.fecha}</p>
                    </div>
                    <Badge variant={ev.estado === 'completado' ? 'default' : 'outline'} className="ml-auto shrink-0">
                      {ev.estado === 'completado' ? 'Completado' : 'Pendiente'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Paquetes de Evidencia</CardTitle></CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="inv">
                  <AccordionTrigger className="text-sm">Inventario Forestal Inicial (Dic 2024)</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-1">
                    <p>• {totalArboles} árboles censados en 2 parcelas</p>
                    <p>• Método: censo total (&lt;2 ha) + muestreo circular (400 m²)</p>
                    <p>• Evidencia fotográfica: 62 registros con GPS y timestamp</p>
                    <p>• Hash SHA-256: <span className="font-mono text-xs">a3f8c1...d92b</span></p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="sat">
                  <AccordionTrigger className="text-sm">Verificación Satelital Sentinel-2 (Mar 2025)</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-1">
                    <p>• Análisis NDVI series temporales: cobertura estable</p>
                    <p>• Sin señales de deforestación post-2020 (EUDR compliant)</p>
                    <p>• Resolución: 10m/px — Revisita: 5 días</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="audit">
                  <AccordionTrigger className="text-sm">Auditoría de Campo (Jun 2025)</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-1">
                    <p>• Técnico certificado VCS/Gold Standard</p>
                    <p>• Re-medición de 15% de árboles (muestreo control)</p>
                    <p>• Desviación media: ±3.2% (dentro del umbral 5%)</p>
                    <p>• Resultado: APROBADO</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* REGISTRAR ÁRBOL DIALOG */}
      <Dialog open={showRegistro} onOpenChange={setShowRegistro}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><TreePine className="h-5 w-5 text-primary" /> Registrar Árbol</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estrato *</Label>
              <Select value={nuevoArbol.estrato} onValueChange={(v) => setNuevoArbol(s => ({ ...s, estrato: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar estrato" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dosel_alto">Dosel Alto — Sombra Perenne</SelectItem>
                  <SelectItem value="dosel_medio">Dosel Medio — Productivo</SelectItem>
                  <SelectItem value="sotobosque">Sotobosque — Cultivo Principal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Especie *</Label>
              <Select value={nuevoArbol.especie} onValueChange={(v) => setNuevoArbol(s => ({ ...s, especie: v }))}>
                <SelectTrigger><SelectValue placeholder="Identificar especie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inga edulis">Guamo / Cujinicuil (Inga edulis)</SelectItem>
                  <SelectItem value="Cordia alliodora">Laurel (Cordia alliodora)</SelectItem>
                  <SelectItem value="Erythrina poeppigiana">Poró / Bucayo (Erythrina poeppigiana)</SelectItem>
                  <SelectItem value="Gliricidia sepium">Madero Negro (Gliricidia sepium)</SelectItem>
                  <SelectItem value="Musa spp.">Banano / Plátano (Musa spp.)</SelectItem>
                  <SelectItem value="Coffea arabica">Café (Coffea arabica)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>DAP (cm) *</Label>
                <Input type="number" placeholder="Ej: 35" value={nuevoArbol.dap}
                  onChange={(e) => setNuevoArbol(s => ({ ...s, dap: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Altura (m)</Label>
                <Input type="number" placeholder="Ej: 12" value={nuevoArbol.altura}
                  onChange={(e) => setNuevoArbol(s => ({ ...s, altura: e.target.value }))} />
              </div>
            </div>
            {nuevoArbol.dap && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs text-muted-foreground">Estimación biomasa (ecuación Inga/pantropical)</p>
                  <p className="text-lg font-bold text-primary">
                    {(Math.exp(-2.26 + 2.30 * Math.log(Number(nuevoArbol.dap))) * 0.47 * 3.667 / 1000).toFixed(3)} tCO₂e
                  </p>
                </CardContent>
              </Card>
            )}
            <Button className="w-full" onClick={handleRegistrar}>
              <Plus className="h-4 w-4 mr-1" /> Registrar y Calcular Carbono
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ESTRATO DETAIL DIALOG */}
      <Dialog open={!!selectedEstrato} onOpenChange={() => setSelectedEstrato(null)}>
        <DialogContent className="max-w-lg">
          {selectedEstrato && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <selectedEstrato.icon className="h-5 w-5 text-primary" />
                  {selectedEstrato.nombre} — {selectedEstrato.descripcion}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground">Unidades</p>
                    <p className="text-xl font-bold text-foreground">{selectedEstrato.unidades}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground">Carbono</p>
                    <p className="text-xl font-bold text-primary">{selectedEstrato.carbono_tco2.toFixed(2)} t</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-xl font-bold text-foreground">${(selectedEstrato.carbono_tco2 * 35).toFixed(0)}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground">Detalle de Individuos</p>
                {selectedEstrato.arboles.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg border border-border space-y-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-foreground">{a.especie}</p>
                        <p className="text-xs text-muted-foreground italic">{a.especieCientifica}</p>
                      </div>
                      <Badge variant={a.estado === 'vivo' ? 'default' : 'secondary'}>{a.estado}</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div><span>DAP:</span> <span className="font-medium text-foreground">{a.dap_cm} cm</span></div>
                      <div><span>Altura:</span> <span className="font-medium text-foreground">{a.altura_m} m</span></div>
                      <div><span>Biomasa:</span> <span className="font-medium text-foreground">{a.biomasa_kg} kg</span></div>
                      <div><span>CO₂:</span> <span className="font-medium text-primary">{a.carbono_tco2} t</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
