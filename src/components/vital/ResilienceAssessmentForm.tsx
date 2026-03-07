import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Leaf } from 'lucide-react';
import { calcResilienceIndex, getResilienceLevel } from '@/lib/interModuleEngine';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { TABLE, ORG_KEY } from '@/lib/keys';
import { toast } from 'sonner';

interface Props {
  parcelaId: string;
  ciclo: string;
  onSaved?: () => void;
}

export default function ResilienceAssessmentForm({ parcelaId, ciclo, onSaved }: Props) {
  const { organizationId } = useOrgContext();
  const [soilHealth, setSoilHealth] = useState(50);
  const [organicMatter, setOrganicMatter] = useState(50);
  const [biodiversity, setBiodiversity] = useState(50);
  const [waterMgmt, setWaterMgmt] = useState(50);
  const [erosionCtrl, setErosionCtrl] = useState(50);
  const [shadeCoverage, setShadeCoverage] = useState(50);
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const index = calcResilienceIndex({
    soilHealth: soilHealth / 100,
    organicMatter: organicMatter / 100,
    biodiversity: biodiversity / 100,
    waterManagement: waterMgmt / 100,
    erosionControl: erosionCtrl / 100,
  });
  const level = getResilienceLevel(index);

  const levelColor = level === 'alta' ? 'bg-primary/10 text-primary'
    : level === 'moderada' ? 'bg-accent/10 text-accent-foreground'
    : 'bg-destructive/10 text-destructive';

  async function handleSave() {
    if (!organizationId) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from(TABLE.RESILIENCE_ASSESSMENTS).insert({
        [ORG_KEY]: organizationId,
        parcela_id: parcelaId,
        ciclo,
        evaluador_id: user?.id ?? null,
        fecha_evaluacion: new Date().toISOString().split('T')[0],
        soil_health: soilHealth / 100,
        organic_matter_score: organicMatter / 100,
        biodiversity: biodiversity / 100,
        water_management: waterMgmt / 100,
        erosion_control: erosionCtrl / 100,
        shade_coverage: shadeCoverage / 100,
        notas: notas || null,
      });
      if (error) throw error;

      // Update snapshot
      await supabase.from(TABLE.PLOT_MODULE_SNAPSHOT).upsert({
        [ORG_KEY]: organizationId,
        parcela_id: parcelaId,
        ciclo,
        version: 1,
        resilience_index: index,
      }, { onConflict: 'organization_id,parcela_id,ciclo,version' });

      toast.success('Evaluación de resiliencia guardada');
      onSaved?.();
    } catch (e: unknown) {
      toast.error('Error al guardar: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  }

  const sliders = [
    { label: 'Salud del suelo', value: soilHealth, set: setSoilHealth },
    { label: 'Materia orgánica', value: organicMatter, set: setOrganicMatter },
    { label: 'Biodiversidad', value: biodiversity, set: setBiodiversity },
    { label: 'Manejo hídrico', value: waterMgmt, set: setWaterMgmt },
    { label: 'Control de erosión', value: erosionCtrl, set: setErosionCtrl },
    { label: 'Cobertura de sombra', value: shadeCoverage, set: setShadeCoverage },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Leaf className="h-4 w-4" /> Evaluación de Resiliencia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sliders.map(({ label, value, set }) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{label}</span>
              <span className="text-muted-foreground">{value}%</span>
            </div>
            <Slider value={[value]} onValueChange={([v]) => set(v)} max={100} step={1} />
          </div>
        ))}

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${levelColor}`}>
            Resiliencia: {level}
          </span>
          <Badge variant="outline">Índice: {(index * 100).toFixed(0)}%</Badge>
        </div>

        <Textarea placeholder="Notas..." value={notas} onChange={(e) => setNotas(e.target.value)} />

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Guardando...' : 'Guardar evaluación'}
        </Button>
      </CardContent>
    </Card>
  );
}
