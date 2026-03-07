import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity } from 'lucide-react';
import type { ModuleSnapshot } from '@/lib/interModuleEngine';
import { getResilienceLevel, getDiseasePressureLevel } from '@/lib/interModuleEngine';

interface Props {
  snapshot: ModuleSnapshot | null;
}

function factorColor(factor: number) {
  if (factor > 0.85) return 'bg-primary/10 text-primary';
  if (factor >= 0.7) return 'bg-accent/10 text-accent-foreground';
  return 'bg-destructive/10 text-destructive';
}

export default function ModuleIntegrationCard({ snapshot }: Props) {
  if (!snapshot) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Snapshot Inter-modular</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">No hay snapshot disponible para esta parcela/campaña.</p></CardContent>
      </Card>
    );
  }

  const yieldPct = snapshot.yieldExpected > 0
    ? Math.round((snapshot.yieldAdjusted / snapshot.yieldExpected) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" /> Snapshot Inter-modular
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Yield */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rendimiento esperado → ajustado</span>
            <span className="font-medium">{snapshot.yieldAdjusted.toFixed(1)} / {snapshot.yieldExpected.toFixed(1)} qq/ha</span>
          </div>
          <Progress value={yieldPct} className="h-2" />
        </div>

        {/* Factor chips */}
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${factorColor(snapshot.nutrientFactor)}`}>
            Nutrición: {(snapshot.nutrientFactor * 100).toFixed(0)}%
          </span>
          <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${factorColor(snapshot.diseaseFactor)}`}>
            Sanidad: {(snapshot.diseaseFactor * 100).toFixed(0)}%
          </span>
          <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${factorColor(snapshot.waterFactor)}`}>
            Hídrico: {(snapshot.waterFactor * 100).toFixed(0)}%
          </span>
        </div>

        {/* Limiting nutrient */}
        {snapshot.limitingNutrient && (
          <Badge variant="outline">Nutriente limitante: {snapshot.limitingNutrient}</Badge>
        )}

        {/* Resilience */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Resiliencia</span>
            <span className="font-medium capitalize">{getResilienceLevel(snapshot.resilienceIndex)}</span>
          </div>
          <Progress value={snapshot.resilienceIndex * 100} className="h-2" />
        </div>

        {/* Disease pressure */}
        <div className="text-sm text-muted-foreground">
          Presión fitosanitaria: <span className="font-medium capitalize">{getDiseasePressureLevel(snapshot.diseasePressureIndex)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
