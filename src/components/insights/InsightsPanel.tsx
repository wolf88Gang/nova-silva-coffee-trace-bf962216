import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';
import type { ModuleSnapshot } from '@/lib/interModuleEngine';

interface Props {
  snapshot: ModuleSnapshot | null;
}

export default function InsightsPanel({ snapshot }: Props) {
  if (!snapshot) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-muted-foreground text-sm">Seleccione una parcela y campaña para ver el análisis.</p>
      </div>
    );
  }

  // Q1: ¿Qué limita la productividad?
  const factors = [
    { name: 'Nutrición', value: snapshot.nutrientFactor },
    { name: 'Sanidad', value: snapshot.diseaseFactor },
    { name: 'Hídrico', value: snapshot.waterFactor },
  ].sort((a, b) => a.value - b.value);
  const limiting = factors[0];

  // Q2: ¿Qué inversión tiene mayor retorno?
  const gaps = factors.map((f) => ({ name: f.name, gap: 1 - f.value })).sort((a, b) => b.gap - a.gap);
  const bestInvestment = gaps[0];

  // Q3: Risk
  const avgFactor = (snapshot.nutrientFactor + snapshot.diseaseFactor + snapshot.waterFactor) / 3;
  const riskLevel = avgFactor < 0.65 ? 'alto' : avgFactor < 0.8 ? 'medio' : 'bajo';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" /> Nova Silva Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4">
          {/* Q1 */}
          <div>
            <p className="text-sm font-medium">¿Qué limita la productividad?</p>
            <p className="text-sm text-muted-foreground mt-1">
              El factor más bajo es <Badge variant="outline">{limiting.name} ({(limiting.value * 100).toFixed(0)}%)</Badge>
              {snapshot.limitingNutrient && <> — nutriente limitante: <Badge variant="secondary">{snapshot.limitingNutrient}</Badge></>}
            </p>
          </div>

          {/* Q2 */}
          <div>
            <p className="text-sm font-medium">¿Qué inversión tiene mayor retorno?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Mejorar <Badge variant="outline">{bestInvestment.name}</Badge> tiene una brecha de {(bestInvestment.gap * 100).toFixed(0)}% — mayor potencial de ganancia.
            </p>
          </div>

          {/* Q3 */}
          <div>
            <p className="text-sm font-medium">¿Qué nivel de riesgo tiene esta parcela?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Riesgo: <Badge variant={riskLevel === 'alto' ? 'destructive' : riskLevel === 'medio' ? 'outline' : 'default'}>{riskLevel}</Badge>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
