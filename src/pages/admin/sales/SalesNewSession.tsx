/**
 * Sales Intelligence — New Session Wizard
 * Collects org info + diagnostic answers, creates a session via sales_sessions insert.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, ArrowRight, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const ORG_TYPES = ['cooperativa', 'exportador', 'beneficio_privado', 'productor_empresarial', 'aggregator'];

interface ScoreInput {
  label: string;
  key: string;
  description: string;
}

const SCORES: ScoreInput[] = [
  { key: 'pain', label: 'Pain', description: '¿Qué tan agudo es el problema que buscan resolver?' },
  { key: 'maturity', label: 'Maturity', description: '¿Qué tan maduro es el prospecto digitalmente?' },
  { key: 'urgency', label: 'Urgency', description: '¿Qué tan urgente es la necesidad?' },
  { key: 'fit', label: 'Fit', description: '¿Qué tan bien encaja con la oferta de Nova Silva?' },
  { key: 'budget_readiness', label: 'Budget Readiness', description: '¿Hay presupuesto disponible?' },
];

type Step = 'org' | 'scores' | 'confirm';

export default function SalesNewSession() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('org');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [contactName, setContactName] = useState('');
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(SCORES.map(s => [s.key, 5]))
  );

  const totalScore = Math.round(
    Object.values(scores).reduce((sum, v) => sum + v, 0) / SCORES.length * 10
  ) / 10;

  const canAdvance = step === 'org' ? orgName.trim().length > 0 && orgType.length > 0 : true;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('sales_sessions' as any)
        .insert({
          org_name: orgName.trim(),
          org_type: orgType,
          contact_name: contactName.trim() || null,
          pain_score: scores.pain,
          maturity_score: scores.maturity,
          urgency_score: scores.urgency,
          fit_score: scores.fit,
          budget_readiness_score: scores.budget_readiness,
          total_score: totalScore,
        } as any)
        .select('id')
        .single();

      if (insertError) {
        if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
          setError('La tabla sales_sessions no existe. Ejecuta las migraciones de Sales Intelligence primero.');
          return;
        }
        throw insertError;
      }

      toast.success('Sesión creada');
      navigate(`/admin/sales/sessions/${(data as any).id}`);
    } catch (err: any) {
      setError(err.message || 'Error al crear sesión');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/sales')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nueva sesión</h1>
          <p className="text-sm text-muted-foreground">Diagnóstico comercial</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {(['org', 'scores', 'confirm'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-6 h-px bg-border" />}
            <span className={step === s ? 'text-foreground font-medium' : ''}>
              {i + 1}. {s === 'org' ? 'Organización' : s === 'scores' ? 'Scoring' : 'Confirmar'}
            </span>
          </div>
        ))}
      </div>

      {step === 'org' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos de la organización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre de la organización *</Label>
              <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Ej: Cooperativa El Roble" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de organización *</Label>
              <Select value={orgType} onValueChange={setOrgType}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre del contacto</Label>
              <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="flex justify-end">
              <Button size="sm" disabled={!canAdvance} onClick={() => setStep('scores')} className="gap-1.5">
                Siguiente <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'scores' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Scoring de diagnóstico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {SCORES.map(s => (
              <div key={s.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">{s.label}</Label>
                  <span className="text-sm font-mono font-semibold text-foreground">{scores[s.key]}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{s.description}</p>
                <Slider
                  min={1} max={10} step={1}
                  value={[scores[s.key]]}
                  onValueChange={([v]) => setScores(prev => ({ ...prev, [s.key]: v }))}
                />
              </div>
            ))}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Score total</span>
                <p className="text-lg font-bold font-mono text-foreground">{totalScore}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep('org')}>Atrás</Button>
                <Button size="sm" onClick={() => setStep('confirm')} className="gap-1.5">
                  Siguiente <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Confirmar sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground text-xs">Organización</span><p className="font-medium">{orgName}</p></div>
              <div><span className="text-muted-foreground text-xs">Tipo</span><p className="font-medium">{orgType}</p></div>
              {contactName && <div><span className="text-muted-foreground text-xs">Contacto</span><p className="font-medium">{contactName}</p></div>}
              <div><span className="text-muted-foreground text-xs">Score total</span><p className="font-bold font-mono text-lg">{totalScore}</p></div>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {SCORES.map(s => (
                <div key={s.key} className="bg-muted/50 rounded-md py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-sm font-mono font-bold text-foreground">{scores[s.key]}</p>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('scores')}>Atrás</Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1.5">
                <Send className="h-3.5 w-3.5" /> {submitting ? 'Creando…' : 'Crear sesión'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
