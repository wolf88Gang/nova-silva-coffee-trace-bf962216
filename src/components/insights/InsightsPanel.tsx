import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertCircle, Target } from 'lucide-react';

interface Insight {
  id: string;
  pregunta: string;
  respuesta: string;
  prioridad: 'alta' | 'media' | 'baja';
}

interface InsightsPanelProps {
  parcelaNombre?: string;
  insights?: Insight[];
  limitingFactor?: string;
  suggestedInvestment?: string;
  riskLevel?: 'bajo' | 'medio' | 'alto';
}

const DEMO_INSIGHTS: Insight[] = [
  {
    id: '1',
    pregunta: 'Qué limita la productividad de esta parcela',
    respuesta: 'La presión fitosanitaria moderada y el nutriente limitante (K) sugieren reforzar potasio y calcio.',
    prioridad: 'alta',
  },
  {
    id: '2',
    pregunta: 'Qué inversión tiene mayor retorno',
    respuesta: 'Fertilización con énfasis en K y manejo de sombra para reducir estrés hídrico.',
    prioridad: 'media',
  },
  {
    id: '3',
    pregunta: 'Qué lotes tienen mayor riesgo',
    respuesta: 'Parcelas con resiliencia baja y presión fitosanitaria alta requieren prioridad en monitoreo.',
    prioridad: 'baja',
  },
];

export function InsightsPanel({
  parcelaNombre,
  insights = DEMO_INSIGHTS,
  limitingFactor,
  suggestedInvestment,
  riskLevel,
}: InsightsPanelProps) {
  const priorityIcon = (p: string) => {
    if (p === 'alta') return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (p === 'media') return <Target className="h-4 w-4 text-amber-500" />;
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
