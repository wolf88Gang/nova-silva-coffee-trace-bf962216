import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { getDiseasePressureLevel, getResilienceLevel, getNutritionStrategyByPressure } from '@/lib/interModuleEngine';
import type { ModuleSnapshot } from '@/lib/interModuleEngine';

interface Insight {
  id: string;
  pregunta: string;
  respuesta: string;
  prioridad: 'alta' | 'media' | 'baja';
}

interface InsightsPanelProps {
  parcelaNombre?: string;
  snapshot?: ModuleSnapshot | null;
  limitingFactor?: string;
  suggestedInvestment?: string;
  riskLevel?: 'bajo' | 'medio' | 'alto';
}

function buildInsightsFromSnapshot(snapshot: ModuleSnapshot | null | undefined): Insight[] {
  if (!snapshot) {
    return [
      { id: '1', pregunta: '¿Qué limita la productividad?', respuesta: 'Registrá evaluaciones de Nova Guard y VITAL para ver el análisis.', prioridad: 'media' },
      { id: '2', pregunta: '¿Qué inversión tiene mayor retorno?', respuesta: 'Completá el snapshot integrado para obtener recomendaciones.', prioridad: 'baja' },
      { id: '3', pregunta: '¿Qué nivel de riesgo tiene esta parcela?', respuesta: 'Se calculará según presión fitosanitaria y resiliencia.', prioridad: 'baja' },
    ];
  }
  const diseaseLevel = getDiseasePressureLevel(snapshot.diseasePressureIndex);
  const resilienceLevel = getResilienceLevel(snapshot.resilienceIndex);
  const strategy = getNutritionStrategyByPressure(snapshot.diseasePressureIndex);

  const factors = [
    { name: 'Nutrición', v: snapshot.nutrientFactor },
    { name: 'Sanidad', v: snapshot.diseaseFactor },
    { name: 'Hídrico', v: snapshot.waterFactor },
  ].sort((a, b) => a.v - b.v);
  const lowest = factors[0];
  const limitante = snapshot.limitingNutrient
    ? `Nutriente limitante (${snapshot.limitingNutrient}) y factor ${lowest.name.toLowerCase()} (${lowest.v.toFixed(2)}).`
    : `Factor ${lowest.name} más bajo (${lowest.v.toFixed(2)}).`;

  const invResp = strategy !== 'Plan estándar, sin ajustes'
    ? strategy
    : `Reforzar ${snapshot.limitingNutrient || 'nutrientes'} según análisis de suelo.`;

  const riskResp = diseaseLevel === 'severa' || diseaseLevel === 'alta' || resilienceLevel === 'frágil' || resilienceLevel === 'baja'
    ? `Riesgo ${diseaseLevel === 'severa' ? 'alto' : 'moderado'}: presión ${diseaseLevel}, resiliencia ${resilienceLevel}. Priorizar monitoreo.`
    : `Riesgo bajo: presión ${diseaseLevel}, resiliencia ${resilienceLevel}.`;

  return [
    { id: '1', pregunta: '¿Qué limita la productividad?', respuesta: limitante, prioridad: 'alta' },
    { id: '2', pregunta: '¿Qué inversión tiene mayor retorno?', respuesta: invResp, prioridad: 'media' },
    { id: '3', pregunta: '¿Qué nivel de riesgo tiene esta parcela?', respuesta: riskResp, prioridad: 'baja' },
  ];
}

export function InsightsPanel({
  parcelaNombre,
  snapshot,
  limitingFactor,
  suggestedInvestment,
  riskLevel,
}: InsightsPanelProps) {
  const insights = buildInsightsFromSnapshot(snapshot);
  const priorityIcon = (p: string) => {
    if (p === 'alta') return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (p === 'media') return <Target className="h-4 w-4 text-warning" />;
    return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Nova Silva Insights
          {parcelaNombre && (
            <span className="text-sm font-normal text-muted-foreground">— {parcelaNombre}</span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Análisis estratégico basado en datos de Nova Yield, Nova Guard, Nutrición y VITAL.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {(limitingFactor || suggestedInvestment || riskLevel) && (
          <div className="flex flex-wrap gap-2">
            {limitingFactor && (
              <Badge variant="outline">Limitante: {limitingFactor}</Badge>
            )}
            {suggestedInvestment && (
              <Badge variant="secondary">Inversión: {suggestedInvestment}</Badge>
            )}
            {riskLevel && (
              <Badge variant={riskLevel === 'alto' ? 'destructive' : riskLevel === 'medio' ? 'secondary' : 'outline'}>
                Riesgo: {riskLevel}
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-3">
          {insights.map((i) => (
            <div
              key={i.id}
              className="rounded-lg border border-border p-3 space-y-1"
            >
              <div className="flex items-start gap-2">
                {priorityIcon(i.prioridad)}
                <div>
                  <p className="text-sm font-medium text-foreground">{i.pregunta}</p>
                  <p className="text-sm text-muted-foreground">{i.respuesta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
