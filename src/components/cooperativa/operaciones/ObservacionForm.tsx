import { useState } from 'react';
import { useOrgContext } from '@/hooks/useOrgContext';
import {
  useNsThreats,
  useNsPhenostages,
  useNsSamplePlans,
  useCreateFieldObservation,
  useCreateRiskAssessment,
  computeSimpleRisk,
} from '@/hooks/useNovaGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ObservacionFormProps {
  onSuccess?: () => void;
}

const RISK_COLORS = {
  green: 'bg-green-100 text-green-800',
  amber: 'bg-yellow-100 text-yellow-800',
  red: 'bg-destructive/10 text-destructive',
};

const RISK_LABELS = {
  green: 'Verde — Sin acción inmediata',
  amber: 'Alerta — Monitoreo intensificado',
  red: 'Brote — Intervención requerida',
};

export default function ObservacionForm({ onSuccess }: ObservacionFormProps) {
  const { organizationId } = useOrgContext();
  const { data: threats = [] } = useNsThreats();
  const { data: phenostages = [] } = useNsPhenostages();
  const { data: samplePlans = [] } = useNsSamplePlans();
  const createObs = useCreateFieldObservation();
  const createRisk = useCreateRiskAssessment();

  const [form, setForm] = useState({
    obs_date: format(new Date(), 'yyyy-MM-dd'),
    phenostage_id: '',
    sample_plan_id: '',
    shade_pct: '',
    altitude_m: '',
    n_trees: '',
    notes: '',
  });

  // Métricas por amenaza
  const [metrics, setMetrics] = useState<Record<string, { incidencia: string; severidad: string; trap_count: string; notes: string }>>({
    broca: { incidencia: '', severidad: '', trap_count: '', notes: '' },
    roya:  { incidencia: '', severidad: '', trap_count: '', notes: '' },
    ojo_de_gallo: { incidencia: '', severidad: '', trap_count: '', notes: '' },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  function setMetric(threatCode: string, field: string, value: string) {
    setMetrics((m) => ({
      ...m,
      [threatCode]: { ...m[threatCode], [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) return;
    setIsSubmitting(true);

    try {
      // Build metrics_json — only include threats with data
      const metrics_json: Record<string, { incidencia?: number; severidad?: number; trap_count?: number; notes?: string }> = {};
      for (const [code, m] of Object.entries(metrics)) {
        const hasData = m.incidencia || m.severidad || m.trap_count;
        if (!hasData) continue;
        metrics_json[code] = {
          ...(m.incidencia ? { incidencia: parseFloat(m.incidencia) / 100 } : {}),
          ...(m.severidad  ? { severidad:  parseFloat(m.severidad)  / 100 } : {}),
          ...(m.trap_count ? { trap_count: parseInt(m.trap_count)         } : {}),
          ...(m.notes      ? { notes: m.notes                             } : {}),
        };
      }

      // 1. Save observation
      const obs = await createObs.mutateAsync({
        org_id: organizationId,
        obs_date: form.obs_date,
        phenostage_id: form.phenostage_id || undefined,
        sample_plan_id: form.sample_plan_id || undefined,
        shade_pct: form.shade_pct ? parseFloat(form.shade_pct) : undefined,
        altitude_m: form.altitude_m ? parseFloat(form.altitude_m) : undefined,
        n_trees: form.n_trees ? parseInt(form.n_trees) : undefined,
        notes: form.notes || undefined,
        metrics_json,
      });

      // 2. Compute and save risk assessment for each threat with data
      const env = {
        shade_pct: form.shade_pct ? parseFloat(form.shade_pct) : undefined,
      };

      const threatMap: Record<string, string> = {};
      threats.forEach((t) => { threatMap[t.code] = t.id; });

      for (const [threatCode, m] of Object.entries(metrics_json)) {
        const threatId = threatMap[threatCode];
        if (!threatId) continue;
        const risk = computeSimpleRisk(threatCode, m, env);
        await createRisk.mutateAsync({
          org_id: organizationId,
          observation_id: obs.id,
          threat_id: threatId,
          risk_score: risk.risk_score,
          risk_level: risk.risk_level,
          confidence: risk.confidence,
          action_mode: risk.action_mode,
          explanation_json: { computed_client_side: true, metrics: m, env },
          evidence_gaps: [],
          valid_from: form.obs_date,
          valid_until: null,
        });
      }

      toast({ title: 'Observación registrada', description: `${Object.keys(metrics_json).length} amenaza(s) evaluadas.` });
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al guardar', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeThreats = threats.filter((t) => ['broca', 'roya', 'ojo_de_gallo'].includes(t.code));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Contexto de la observación */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Fecha</Label>
          <Input
            type="date"
            value={form.obs_date}
            onChange={(e) => setForm((f) => ({ ...f, obs_date: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Etapa fenológica</Label>
          <Select value={form.phenostage_id} onValueChange={(v) => setForm((f) => ({ ...f, phenostage_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              {phenostages.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Plan de muestreo</Label>
          <Select value={form.sample_plan_id} onValueChange={(v) => setForm((f) => ({ ...f, sample_plan_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              {samplePlans.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} (≥{p.min_trees} árboles)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Árboles muestreados</Label>
          <Input
            type="number"
            placeholder="ej. 30"
            value={form.n_trees}
            onChange={(e) => setForm((f) => ({ ...f, n_trees: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Sombra estimada (%)</Label>
          <Input
            type="number"
            min="0" max="100"
            placeholder="ej. 40"
            value={form.shade_pct}
            onChange={(e) => setForm((f) => ({ ...f, shade_pct: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Altitud (msnm)</Label>
          <Input
            type="number"
            placeholder="ej. 1200"
            value={form.altitude_m}
            onChange={(e) => setForm((f) => ({ ...f, altitude_m: e.target.value }))}
          />
        </div>
      </div>

      <Separator />

      {/* Métricas por amenaza */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Métricas por amenaza</p>
        <p className="text-xs text-muted-foreground">Ingresar incidencia y severidad como porcentaje (0-100). Dejar vacío si no se evaluó.</p>

        {activeThreats.map((threat) => {
          const m = metrics[threat.code];
          if (!m) return null;
          const incNum = m.incidencia ? parseFloat(m.incidencia) / 100 : 0;
          const sevNum = m.severidad ? parseFloat(m.severidad) / 100 : 0;
          const preview = (m.incidencia || m.severidad) ? computeSimpleRisk(
            threat.code,
            { incidencia: incNum, severidad: sevNum },
            { shade_pct: form.shade_pct ? parseFloat(form.shade_pct) : undefined }
          ) : null;

          return (
            <Card key={threat.code} className="border-muted">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{threat.name}</p>
                  {preview && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[preview.risk_level]}`}>
                      {RISK_LABELS[preview.risk_level].split('—')[0].trim()}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Incidencia %</Label>
                    <Input
                      type="number" min="0" max="100" step="0.1"
                      placeholder="0.0"
                      value={m.incidencia}
                      onChange={(e) => setMetric(threat.code, 'incidencia', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Severidad %</Label>
                    <Input
                      type="number" min="0" max="100" step="0.1"
                      placeholder="0.0"
                      value={m.severidad}
                      onChange={(e) => setMetric(threat.code, 'severidad', e.target.value)}
                    />
                  </div>
                  {threat.code === 'broca' && (
                    <div className="space-y-1">
                      <Label className="text-xs">Trampas (CPD)</Label>
                      <Input
                        type="number" min="0"
                        placeholder="capturas"
                        value={m.trap_count}
                        onChange={(e) => setMetric(threat.code, 'trap_count', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-1">
        <Label>Notas generales</Label>
        <Textarea
          placeholder="Observaciones adicionales, condiciones del lote, etc."
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Registrar observación'}
        </Button>
      </div>
    </form>
  );
}
