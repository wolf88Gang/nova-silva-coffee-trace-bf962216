import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Leaf, Shield, Droplets } from 'lucide-react';
import {
  getDiseasePressureLevel,
  getResilienceLevel,
  type ModuleSnapshot,
} from '@/lib/interModuleEngine';

interface ModuleIntegrationCardProps {
  snapshot: ModuleSnapshot | null;
  parcelaNombre?: string;
  ciclo?: string;
}

function factorBadge(value: number): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string } {
  if (value >= 0.9) return { variant: 'default', label: 'Óptimo' };
  if (value >= 0.7) return { variant: 'secondary', label: 'Adecuado' };
  if (value >= 0.5) return { variant: 'outline', label: 'Limitante' };
  return { variant: 'destructive', label: 'Crítico' };
}

export function ModuleIntegrationCard({ snapshot, parcelaNombre, ciclo }: ModuleIntegrationCardProps) {
  if (!snapshot) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Integración inter-modular
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sin datos para esta parcela y campaña. Registrá evaluaciones de Nova Guard y VITAL para ver el análisis integrado.
          </p>
        </CardContent>
      </Card>
    );
  }

  const diseaseLevel = getDiseasePressureLevel(snapshot.diseasePressureIndex);
  const resilienceLevel = getResilienceLevel(snapshot.resilienceIndex);
  const nutrientBadge = factorBadge(snapshot.nutrientFactor);
  const diseaseBadge = factorBadge(snapshot.diseaseFactor);
  const waterBadge = factorBadge(snapshot.waterFactor);

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          Integración inter-modular
          {parcelaNombre && (
            <span className="text-sm font-normal text-muted-foreground">
              {parcelaNombre} {ciclo && `· ${ciclo}`}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Rendimiento estimado</span>
          <span className="font-medium">{snapshot.yieldExpected?.toFixed(0) ?? '-'} kg/ha</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Rendimiento ajustado</span>
          <span className="font-medium">{snapshot.yieldAdjusted?.toFixed(0) ?? '-'} kg/ha</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${Math.min(100, (snapshot.yieldAdjusted ?? 0) / Math.max(1, snapshot.yieldExpected ?? 1) * 100)}%`,
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant={nutrientBadge.variant} className="gap-1">
            <Leaf className="h-3 w-3" /> Nutrición {(snapshot.nutrientFactor ?? 0).toFixed(2)}
          </Badge>
          <Badge variant={diseaseBadge.variant} className="gap-1">
            <Shield className="h-3 w-3" /> Sanidad {(snapshot.diseaseFactor ?? 0).toFixed(2)}
          </Badge>
          <Badge variant={waterBadge.variant} className="gap-1">
            <Droplets className="h-3 w-3" /> Hídrico {(snapshot.waterFactor ?? 0).toFixed(2)}
          </Badge>
        </div>

        {snapshot.limitingNutrient && (
          <p className="text-sm text-muted-foreground">
            Nutriente limitante: <Badge variant="outline">{snapshot.limitingNutrient}</Badge>
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Presión fitosanitaria:</span>{' '}
            <span className="capitalize">{diseaseLevel}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Resiliencia:</span>{' '}
            <span className="capitalize">{resilienceLevel}</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Resiliencia</p>
          <Progress value={(snapshot.resilienceIndex ?? 0) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
