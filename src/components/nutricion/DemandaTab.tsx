import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator, Leaf, TrendingUp, Info } from 'lucide-react';
import {
  calcFullNutrientDemand,
  type DemandInput,
  type DemandResult,
  type NutrientDemand,
  VARIETY_FACTORS,
} from '@/lib/nutritionDemandEngine';

const VARIEDADES = Object.keys(VARIETY_FACTORS);

export default function DemandaTab() {
  const [input, setInput] = useState<Partial<DemandInput>>({
    yieldEstimadoKgHa: 2500,
    areaHa: 1,
    variedad: 'Caturra',
    altitudMsnm: 1400,
    edadAnios: 6,
    estresFitosanitario: 'bajo',
    organicos: {},
  });
  const [result, setResult] = useState<DemandResult | null>(null);

  const handleCalculate = () => {
    const full: DemandInput = {
      yieldEstimadoKgHa: input.yieldEstimadoKgHa ?? 2500,
      areaHa: input.areaHa ?? 1,
      variedad: input.variedad ?? 'Caturra',
      altitudMsnm: input.altitudMsnm ?? 1400,
      edadAnios: input.edadAnios ?? 6,
      estresFitosanitario: input.estresFitosanitario ?? 'bajo',
      organicos: input.organicos ?? {},
    };
    setResult(calcFullNutrientDemand(full));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Demanda Nutricional
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Motor CENICAFE: extracción por tonelada, eficiencias de absorción, Ley de Liebig, calendario fenológico.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Rendimiento estimado (kg/ha)</Label>
              <Input
                type="number"
                value={input.yieldEstimadoKgHa ?? ''}
                onChange={(e) => setInput({ ...input, yieldEstimadoKgHa: Number(e.target.value) || undefined })}
                placeholder="2500"
              />
            </div>
            <div>
              <Label>Área (ha)</Label>
              <Input
                type="number"
                step="0.1"
                value={input.areaHa ?? ''}
                onChange={(e) => setInput({ ...input, areaHa: Number(e.target.value) || undefined })}
                placeholder="1"
              />
            </div>
            <div>
              <Label>Variedad</Label>
              <Select value={input.variedad} onValueChange={(v) => setInput({ ...input, variedad: v })}>
                <SelectTrigger><SelectValue placeholder="Caturra" /></SelectTrigger>
                <SelectContent>
                  {VARIEDADES.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Altitud (msnm)</Label>
              <Input
                type="number"
                value={input.altitudMsnm ?? ''}
                onChange={(e) => setInput({ ...input, altitudMsnm: Number(e.target.value) || undefined })}
                placeholder="1400"
              />
            </div>
            <div>
              <Label>Edad del cafetal (años)</Label>
              <Input
                type="number"
                value={input.edadAnios ?? ''}
                onChange={(e) => setInput({ ...input, edadAnios: Number(e.target.value) || undefined })}
                placeholder="6"
              />
            </div>
            <div>
              <Label>Estrés fitosanitario</Label>
              <Select value={input.estresFitosanitario} onValueChange={(v: 'bajo'|'medio'|'alto') => setInput({ ...input, estresFitosanitario: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bajo">Bajo</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCalculate} className="w-full sm:w-auto">
            <Calculator className="h-4 w-4 mr-2" />
            Calcular demanda
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Demanda por nutriente
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Nutriente limitante (Ley de Liebig): <Badge variant="secondary">{result.nutrienteLimitante}</Badge>
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Nutriente</th>
                      <th className="pb-2 pr-4">Demanda fertilizante (kg/ha)</th>
                      <th className="pb-2 pr-4">Aporte orgánico</th>
                      <th className="pb-2">Limitante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.demandaTotal.map((d: NutrientDemand) => (
                      <tr key={d.nutriente} className="border-b border-border/50">
                        <td className="py-3 pr-4 font-medium">{d.nutriente}</td>
                        <td className="py-3 pr-4">{d.demandaFertilizante.toFixed(1)}</td>
                        <td className="py-3 pr-4">{d.aporteOrganico.toFixed(1)}</td>
                        <td className="py-3">{d.esLimitante ? <Badge>Limitante</Badge> : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Fertilizantes recomendados
              </CardTitle>
              {result.costoEstimadoUsd != null && (
                <p className="text-sm text-muted-foreground">
                  Costo estimado: USD {result.costoEstimadoUsd.toFixed(0)} · ROI: {result.roiEstimado?.toFixed(1)}x
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.fertilizantes.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">{f.producto}</p>
                      <p className="text-xs text-muted-foreground">{f.formula}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{f.kgHa} kg/ha</p>
                      {f.costoTotalUsd != null && (
                        <p className="text-xs text-muted-foreground">USD {f.costoTotalUsd.toFixed(0)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Calendario fenológico (4 aplicaciones)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.fases.map((f, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border">
                    <div className="flex justify-between items-start">
                      <p className="font-medium capitalize">{f.fase.replace(/_/g, ' ')}</p>
                      <Badge variant="outline">{f.proporcionPct}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Días post-floración: {f.diasPostFloracion[0]}–{f.diasPostFloracion[1]}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(f.dosisNutrientes).map(([nut, kg]) => (
                        <Badge key={nut} variant="secondary">{nut}: {kg.toFixed(0)} kg/ha</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
