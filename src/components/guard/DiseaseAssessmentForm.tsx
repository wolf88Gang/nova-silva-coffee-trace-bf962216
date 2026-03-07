import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Shield, AlertTriangle } from 'lucide-react';
import {
  calcDiseasePressure,
  calcDiseaseFactor,
  getDiseasePressureLevel,
  calcYieldAdjusted,
} from '@/lib/interModuleEngine';

interface DiseaseAssessmentFormProps {
  parcelaId: string;
  ciclo: string;
  yieldEstimated?: number;
  onSave?: (data: {
    roya: number;
    broca: number;
    defoliation: number;
    stress: number;
    diseasePressureIndex: number;
    diseaseFactor: number;
  }) => void;
}

export function DiseaseAssessmentForm({
  parcelaId,
  ciclo,
  yieldEstimated = 2500,
  onSave,
}: DiseaseAssessmentFormProps) {
  const [roya, setRoya] = useState(0);
  const [broca, setBroca] = useState(0);
  const [defoliation, setDefoliation] = useState(0);
  const [stress, setStress] = useState(0);

  const pressure = calcDiseasePressure(roya, broca, defoliation, stress);
  const diseaseFactor = calcDiseaseFactor(pressure, 0.6);
  const level = getDiseasePressureLevel(pressure);
  const yieldImpact = calcYieldAdjusted(yieldEstimated, 1, diseaseFactor, 1);

  const handleSave = () => {
    onSave?.({
      roya,
      broca,
      defoliation,
      stress,
      diseasePressureIndex: pressure,
      diseaseFactor,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Evaluación fitosanitaria (Nova Guard)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Incidencia y síntomas observados. El sistema calcula el impacto en el rendimiento esperado.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Roya (%) — {(roya * 100).toFixed(0)}%</Label>
            <Slider value={[roya * 100]} onValueChange={([v]) => setRoya(v / 100)} max={100} step={1} />
          </div>
          <div>
            <Label>Broca (%) — {(broca * 100).toFixed(0)}%</Label>
            <Slider value={[broca * 100]} onValueChange={([v]) => setBroca(v / 100)} max={100} step={1} />
          </div>
          <div>
            <Label>Defoliación (%) — {(defoliation * 100).toFixed(0)}%</Label>
            <Slider value={[defoliation * 100]} onValueChange={([v]) => setDefoliation(v / 100)} max={100} step={1} />
          </div>
          <div>
            <Label>Estrés / otros síntomas (%) — {(stress * 100).toFixed(0)}%</Label>
            <Slider value={[stress * 100]} onValueChange={([v]) => setStress(v / 100)} max={100} step={1} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Resumen</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Presión fitosanitaria:</span>
            <span className="capitalize font-medium">{level}</span>
            <span className="text-muted-foreground">Factor de ajuste:</span>
            <span>{diseaseFactor.toFixed(2)}</span>
            <span className="text-muted-foreground">Rendimiento ajustado:</span>
            <span>{yieldImpact.toFixed(0)} kg/ha</span>
          </div>
        </div>

        {onSave && (
          <Button onClick={handleSave} className="w-full">
            Guardar evaluación
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
