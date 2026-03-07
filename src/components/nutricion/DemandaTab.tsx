import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Calculator, AlertTriangle, TrendingUp, Sprout, DollarSign,
  Calendar, Beaker, Mountain, TreePine, Loader2, Info, Leaf, Wheat
} from 'lucide-react';
import {
  generateNutritionPlan,
  VARIETY_COEFFICIENTS,
  type YieldTarget,
  type PlotContext,
  type SoilSupply,
  type Ruleset,
  type NutritionPlanResult,
} from '@/lib/nutritionDemandEngine';

const TEXTURAS = ['Arenoso', 'Franco-arenoso', 'Franco', 'Franco-arcilloso', 'Arcilloso'];

const SEVERITY_COLORS: Record<string, string> = {
  macro_primario: 'bg-primary/10 text-primary border-primary/20',
  macro_secundario: 'bg-accent/10 text-accent-foreground border-accent/20',
  micro: 'bg-muted text-muted-foreground border-border',
};

export default function DemandaTab() {
  // Plot context
  const [areaHa, setAreaHa] = useState(2);
  const [altitud, setAltitud] = useState(1350);
  const [edad, setEdad] = useState(5);
  const [densidad, setDensidad] = useState(5000);
  const [variedad, setVariedad] = useState('Caturra');
  const [textura, setTextura] = useState('Franco');
  const [moPct, setMoPct] = useState<number | null>(5.2);
  const [cobertura, setCobertura] = useState<number | null>(70);
  const [residuosPoda, setResiduosPoda] = useState(false);
  const [compost, setCompost] = useState(false);
  const [royaPct, setRoyaPct] = useState<number | null>(null);
  const [sequiaProlongada, setSequiaProlongada] = useState(false);

  // Yield
  const [yieldTon, setYieldTon] = useState(1.5);
  const [yieldConfianza, setYieldConfianza] = useState<'alta' | 'media' | 'baja'>('media');

  // Soil supply (simplified)
  const [soilN, setSoilN] = useState(0);
  const [soilP, setSoilP] = useState(0);
  const [soilK, setSoilK] = useState(0);

  // Result
  const [result, setResult] = useState<NutritionPlanResult | null>(null);

  const handleCalculate = () => {
    const yieldTarget: YieldTarget = {
      yieldTonHa: yieldTon,
      intervalError: yieldTon * 0.15,
      confianza: yieldConfianza,
      fuente: 'manual',
    };

    const plot: PlotContext = {
      areaHa,
      altitudMsnm: altitud,
      edadAnios: edad,
      plantasPorHa: densidad,
      variedad,
      textura,
      pendiente: null,
      materiaOrganicaPct: moPct,
      coberturaVegetalPct: cobertura,
      residuosPoda,
      compost,
      royaPct,
      brocaPct: null,
      sequiaProlongada,
      lluviaExcesiva: false,
    };

    const soilSupply: SoilSupply = {
      N: soilN, P: soilP, K: soilK,
      Ca: null, Mg: null, S: null,
    };

    const ruleset: Ruleset = {
      region: 'Central', pais: 'Costa Rica', version: 1,
      maxNKgHa: 250, maxPKgHa: 80,
    };

    const plan = generateNutritionPlan(yieldTarget, plot, soilSupply, ruleset);
    setResult(plan);
  };

  const limitingColor = useMemo(() => {
    if (!result?.nutrienteLimitante) return '';
    const idx = result.nutrienteLimitante.indiceLimitacion;
    if (idx > 0.5) return 'text-destructive';
    if (idx > 0.3) return 'text-warning';
    return 'text-yellow-600';
  }, [result]);

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plot Context */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mountain className="h-4 w-4 text-primary" /> Contexto de Parcela
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Área (ha)</Label>
                <Input type="number" value={areaHa} onChange={e => setAreaHa(+e.target.value)} min={0.1} step={0.1} />
              </div>
              <div>
                <Label className="text-xs">Altitud (msnm)</Label>
                <Input type="number" value={altitud} onChange={e => setAltitud(+e.target.value)} min={0} />
              </div>
              <div>
                <Label className="text-xs">Edad (años)</Label>
                <Input type="number" value={edad} onChange={e => setEdad(+e.target.value)} min={0} />
              </div>
              <div>
                <Label className="text-xs">Plantas/ha</Label>
                <Input type="number" value={densidad} onChange={e => setDensidad(+e.target.value)} min={1000} step={100} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Variedad</Label>
                <Select value={variedad} onValueChange={setVariedad}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(VARIETY_COEFFICIENTS).map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Textura suelo</Label>
                <Select value={textura} onValueChange={setTextura}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEXTURAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Leaf className="h-3 w-3" /> Aportes orgánicos</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">MO (%)</Label>
                <Input type="number" value={moPct ?? ''} onChange={e => setMoPct(e.target.value ? +e.target.value : null)} step={0.1} />
              </div>
              <div>
                <Label className="text-xs">Cobertura (%)</Label>
                <Input type="number" value={cobertura ?? ''} onChange={e => setCobertura(e.target.value ? +e.target.value : null)} />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-xs"><Switch checked={residuosPoda} onCheckedChange={setResiduosPoda} /> Residuos poda</label>
              <label className="flex items-center gap-2 text-xs"><Switch checked={compost} onCheckedChange={setCompost} /> Compost</label>
            </div>
          </CardContent>
        </Card>

        {/* Yield & Stress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wheat className="h-4 w-4 text-primary" /> Rendimiento y Estrés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Rendimiento objetivo (ton/ha)</Label>
                <Input type="number" value={yieldTon} onChange={e => setYieldTon(+e.target.value)} min={0.1} step={0.1} />
              </div>
              <div>
                <Label className="text-xs">Confianza</Label>
                <Select value={yieldConfianza} onValueChange={v => setYieldConfianza(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <p className="text-xs font-medium text-muted-foreground">Aporte del suelo (kg/ha disponibles)</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">N</Label><Input type="number" value={soilN} onChange={e => setSoilN(+e.target.value)} min={0} /></div>
              <div><Label className="text-xs">P</Label><Input type="number" value={soilP} onChange={e => setSoilP(+e.target.value)} min={0} /></div>
              <div><Label className="text-xs">K</Label><Input type="number" value={soilK} onChange={e => setSoilK(+e.target.value)} min={0} /></div>
            </div>

            <Separator />
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Factores de estrés</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Roya (%)</Label>
                <Input type="number" value={royaPct ?? ''} onChange={e => setRoyaPct(e.target.value ? +e.target.value : null)} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-xs pb-2"><Switch checked={sequiaProlongada} onCheckedChange={setSequiaProlongada} /> Sequía prolongada</label>
              </div>
            </div>

            <Button onClick={handleCalculate} className="w-full mt-3">
              <Calculator className="h-4 w-4 mr-2" /> Calcular Demanda Nutricional
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Limiting Nutrient Alert */}
          {result.nutrienteLimitante && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${limitingColor}`} />
                  <div>
                    <p className="font-semibold text-sm">Nutriente Limitante: {result.nutrienteLimitante.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-1">{result.nutrienteLimitante.explicacion}</p>
                    <p className="text-xs font-medium mt-1">{result.nutrienteLimitante.impactoRendimiento}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Demand Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Beaker className="h-4 w-4 text-primary" /> Demanda Nutricional por Nutriente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.demandas.map(d => (
                  <div key={d.nutrient} className={`p-3 rounded-lg border ${SEVERITY_COLORS[d.tipo]}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{d.nombre} ({d.nutrient})</span>
                        <Badge variant="outline" className="text-[10px]">{d.tipo.replace('_', ' ')}</Badge>
                        {d.limitadoPorRuleset && <Badge variant="destructive" className="text-[10px]">Limitado</Badge>}
                      </div>
                      <span className="font-bold text-sm">{d.dosisFinalKgHa} kg/ha</span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span>Extracción: {d.extractionKgPerTon} kg/ton</span>
                      <span>Base: {d.demandaBaseKgHa}</span>
                      <span>Ajustada: {d.demandaAjustadaKgHa}</span>
                      <span>Efic: {(d.eficienciaAbsorcion * 100).toFixed(0)}%</span>
                      {d.aportesSueloKgHa > 0 && <span>Suelo: -{d.aportesSueloKgHa}</span>}
                      {d.aporteOrganicoKgHa > 0 && <span className="text-green-600">Orgánico: -{d.aporteOrganicoKgHa}</span>}
                    </div>
                    <div className="mt-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-16">Suficiencia</span>
                        <Progress
                          value={Math.min(100, d.indiceSuficiencia * 100)}
                          className="h-1.5 flex-1"
                        />
                        <span className="text-[10px] font-medium w-8 text-right">{(d.indiceSuficiencia * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fertilizers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sprout className="h-4 w-4 text-primary" /> Fertilizantes Recomendados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.fertilizantes.map((f, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{f.nombre}</p>
                      <p className="text-xs text-muted-foreground">{f.cantidadKgHa} kg/ha × {areaHa} ha = {f.cantidadTotal} kg total</p>
                    </div>
                    {f.costoEstimadoUsd != null && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />{f.costoEstimadoUsd.toFixed(0)}
                      </Badge>
                    )}
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Costo total estimado</span>
                  <span className="font-bold text-primary">${result.costoTotalEstimadoUsd.toFixed(2)}</span>
                </div>
                {result.roiEstimado != null && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> ROI estimado</span>
                    <span className={`font-bold ${result.roiEstimado > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {(result.roiEstimado * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Calendario de Aplicaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.calendario.map((evt, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">#{evt.numero}</Badge>
                        <span className="font-medium text-sm capitalize">{evt.fase.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{evt.fechaEstimada}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap text-[11px]">
                      {Object.entries(evt.nutrientes).map(([k, v]) => (
                        <Badge key={k} variant="secondary" className="text-[10px]">{k}: {(v as number).toFixed(1)} kg/ha</Badge>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {evt.manoDeObraJornales} jornales · {evt.duracionEstimadaHoras}h · {evt.tipoAplicacion}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Explain Trace */}
          <Accordion type="single" collapsible>
            <AccordionItem value="trace">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2"><Info className="h-4 w-4" /> Trazabilidad del cálculo ({result.engineVersion})</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-0.5">
                  {result.explainTrace.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  {result.restriccionesAplicadas.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <p className="font-semibold">Restricciones aplicadas:</p>
                      {result.restriccionesAplicadas.map((r, i) => <p key={i} className="text-destructive">⚠ {r}</p>)}
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}
