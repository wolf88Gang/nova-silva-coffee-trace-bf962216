import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { calcDiseasePressure, calcDiseaseFactor, getDiseasePressureLevel } from '@/lib/interModuleEngine';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { TABLE, ORG_KEY } from '@/lib/keys';
import { toast } from 'sonner';

interface Props {
  parcelaId: string;
  ciclo: string;
  onSaved?: () => void;
}

export default function DiseaseAssessmentForm({ parcelaId, ciclo, onSaved }: Props) {
  const { organizationId } = useOrgContext();
  const [roya, setRoya] = useState(0);
  const [broca, setBroca] = useState(0);
  const [defoliation, setDefoliation] = useState(0);
  const [stress, setStress] = useState(0);
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const pressure = calcDiseasePressure(roya / 100, broca / 100, defoliation / 100, stress / 100);
  const factor = calcDiseaseFactor(pressure);
  const level = getDiseasePressureLevel(pressure);
  const reduction = ((1 - factor) * 100).toFixed(1);

  const levelColor = level === 'baja' ? 'bg-primary/10 text-primary'
    : level === 'moderada' ? 'bg-accent/10 text-accent-foreground'
    : 'bg-destructive/10 text-destructive';

  async function handleSave() {
    if (!organizationId) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from(TABLE.DISEASE_ASSESSMENTS).insert({
        [ORG_KEY]: organizationId,
        parcela_id: parcelaId,
        ciclo,
        evaluador_id: user?.id ?? null,
        fecha_evaluacion: new Date().toISOString().split('T')[0],
        roya_incidence: roya / 100,
        broca_incidence: broca / 100,
        defoliation_level: defoliation / 100,
        stress_symptoms: stress / 100,
        sensitivity: 0.6,
        notas: notas || null,
      });
      if (error) throw error;

      // Update snapshot
      await supabase.from(TABLE.PLOT_MODULE_SNAPSHOT).upsert({
        [ORG_KEY]: organizationId,
        parcela_id: parcelaId,
        ciclo,
        version: 1,
        disease_pressure_index: pressure,
        disease_factor: factor,
      }, { onConflict: 'organization_id,parcela_id,ciclo,version' });

      toast.success('Evaluación fitosanitaria guardada');
      onSaved?.();
    } catch (e: unknown) {
      toast.error('Error al guardar: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4" /> Evaluación Fitosanitaria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { label: 'Roya', value: roya, set: setRoya },
          { label: 'Broca', value: broca, set: setBroca },
          { label: 'Defoliación', value: defoliation, set: setDefoliation },
          { label: 'Estrés', value: stress, set: setStress },
        ].map(({ label, value, set }) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{label}</span>
              <span className="text-muted-foreground">{value}%</span>
            </div>
            <Slider value={[value]} onValueChange={([v]) => set(v)} max={100} step={1} />
          </div>
        ))}

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${levelColor}`}>
            Presión: {level}
          </span>
          <Badge variant="outline">Reducción estimada del rendimiento: {reduction}%</Badge>
        </div>

        <Textarea placeholder="Notas..." value={notas} onChange={(e) => setNotas(e.target.value)} />

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Guardando...' : 'Guardar evaluación'}
        </Button>
      </CardContent>
    </Card>
  );
}
