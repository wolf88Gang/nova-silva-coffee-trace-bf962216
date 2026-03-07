import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Leaf } from 'lucide-react';
import {
  calcResilienceIndex,
  getResilienceLevel,
  type ResilienceComponents,
} from '@/lib/interModuleEngine';

interface ResilienceAssessmentFormProps {
  parcelaId: string;
  ciclo: string;
  onSave?: (data: ResilienceComponents & { resilienceIndex: number; resilienceLevel: string }) => void;
}

export function ResilienceAssessmentForm({ parcelaId, ciclo, onSave }: ResilienceAssessmentFormProps) {
  const [soilHealth, setSoilHealth] = useState(0.5);
  const [organicMatter, setOrganicMatter] = useState(0.5);
  const [biodiversity, setBiodiversity] = useState(0.5);
  const [waterManagement, setWaterManagement] = useState(0.5);
  const [erosionControl, setErosionControl] = useState(0.5);

  const components: ResilienceComponents = {
    soilHealth,
    organicMatter,
    biodiversity,
    waterManagement,
    erosionControl,
  };
  const resilienceIndex = calcResilienceIndex(components);
  const level = getResilienceLevel(resilienceIndex);

  const handleSave = () => {
    onSave?.({ ...components, resilienceIndex, resilienceLevel: level });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          Evaluación de resiliencia (Protocolo VITAL)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Componentes de resiliencia del sistema. Valores 0-100%.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Salud del suelo — {(soilHealth * 100).toFixed(0)}%</Label>
            <Slider value={[soilHealth * 100]} onValueChange={([v]) => setSoilHealth(v / 100)} max={100} step={1} />
          </div>
          <div>
            <Label>Materia orgánica — {(organicMatter * 100).toFixed(0)}%</Label>
            <Slider value={[organicMatter * 100]} onValueChange={([v]) => setOrganicMatter(v / 100)} max={100} step={1} />
          </div>
          <div>
            <Label>Biodiversidad — {(biodiversity * 100).toFixed(0)}%</Label>
            <Slider value={[biodiversity * 100]} onValueChange={([v]) => setBiodiversity(v / 100)} max={100} step={1} />
          </div>
          <div>
            <Label>Manejo del agua — {(waterManagement * 100).toFixed(0)}%</Label>
            <Slider value={[waterManagement * 100]} onValueChange={([v]) => setWaterManagement(v / 100)} max={100} step={1} />
          </div>
          <div>
            <Label>Control de erosión — {(erosionControl * 100).toFixed(0)}%</Label>
            <Slider value={[erosionControl * 100]} onValueChange={([v]) => setErosionControl(v / 100)} max={100} step={1} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Índice de resiliencia</span>
            <span className="capitalize font-medium">{level}</span>
          </div>
          <Progress value={resilienceIndex * 100} className="h-2" />
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
