import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Shield, Save, ChevronLeft, Wifi, WifiOff } from 'lucide-react';
import { WizardProgress, WizardStepNav, WizardNavButtons, WizardQuestionCard } from '@/components/wizard';
import { useWizardState, type WizardStepDef } from '@/hooks/useWizardState';
import { enqueue, getPending } from '@/lib/offlineQueue';
import { useToast } from '@/hooks/use-toast';
import {
  DIMENSIONES_DIAGNOSTICO, OPCIONES_DIAGNOSTICO,
  getSemaforo, getRecomendacion, getTotalPreguntas,
  type NivelSemaforo,
} from '@/config/diagnosticoCooperativa';

interface ResultadoDimension {
  id: string;
  nombre: string;
  critica: boolean;
  promedio: number;
  semaforo: ReturnType<typeof getSemaforo>;
  recomendacion: string;
}

const HISTORIAL_MOCK = [
  { id: '1', fecha: '2025-09-15', evaluador: 'Carlos Mendoza', promedioGlobal: 2.4, nivel: 'ambar' as NivelSemaforo },
  { id: '2', fecha: '2025-03-20', evaluador: 'Ana Ramírez', promedioGlobal: 1.9, nivel: 'rojo' as NivelSemaforo },
];

const steps: WizardStepDef[] = DIMENSIONES_DIAGNOSTICO.map(d => ({
  id: d.id,
  label: d.nombre.split(' ')[0],
  questionCount: d.preguntas.length,
}));

const allCodes = DIMENSIONES_DIAGNOSTICO.flatMap(d => d.preguntas.map(p => p.codigo));

const REC_LABELS: Record<string, string> = {
  fortalecimiento_previo: 'Fortalecimiento previo requerido antes de implementación tecnológica',
  piloto_parcial: 'Piloto parcial recomendado con acompañamiento técnico',
  implementacion_completa: 'Implementación completa viable',
};

export default function VitalOrgWizard() {
  const { toast } = useToast();
  const wizard = useWizardState<number>({
    steps,
    questionCodes: allCodes,
    persistence: { storageKey: 'novasilva_diag_org', debounceMs: 300 },
  });

  const dimActual = DIMENSIONES_DIAGNOSTICO[wizard.stepIndex];

  const resultados: ResultadoDimension[] = useMemo(() => {
    return DIMENSIONES_DIAGNOSTICO.map(dim => {
      const vals = dim.preguntas.map(p => wizard.responses.get(p.codigo) ?? 0).filter(v => v > 0);
      const promedio = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return {
        id: dim.id, nombre: dim.nombre, critica: dim.critica,
        promedio: Math.round(promedio * 100) / 100,
        semaforo: getSemaforo(promedio),
        recomendacion: getRecomendacion(promedio),
      };
    });
  }, [wizard.responses]);

  const promedioGlobal = useMemo(() => {
    const vals = resultados.filter(r => r.promedio > 0);
    return vals.length === 0 ? 0 : Math.round((vals.reduce((s, r) => s + r.promedio, 0) / vals.length) * 100) / 100;
  }, [resultados]);

  const handleSave = () => {
    const payload = {
      respuestas: Object.fromEntries(wizard.responses),
      resultados,
      promedioGlobal,
      timestamp: new Date().toISOString(),
    };

    if (!navigator.onLine) {
      enqueue('diagnostico_org', payload);
      toast({ title: 'Guardado en cola offline', description: 'Se enviará cuando haya conexión.' });
      return;
    }

    enqueue('diagnostico_org', payload);
    toast({ title: 'Diagnóstico guardado', description: `Promedio global: ${promedioGlobal}/4.0` });
    wizard.clearSaved();
  };

  if (!wizard.isStarted) {
    const pendingOps = getPending().filter(op => op.type === 'diagnostico_org').length;
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <Shield className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Diagnóstico Organizacional</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Esta herramienta evalúa 12 dimensiones clave de su organización a través de {getTotalPreguntas()} preguntas.
              El resultado le ayudará a identificar fortalezas y áreas de mejora para implementar la plataforma Nova Silva.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> 2-3 horas estimadas</div>
              <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> {getTotalPreguntas()} preguntas</div>
              <div className="flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> 3 dimensiones críticas</div>
            </div>
            {wizard.validation.respondedCount > 0 && (
              <p className="text-sm text-primary font-medium">
                Tienes {wizard.validation.respondedCount} respuestas guardadas — puedes continuar donde lo dejaste.
              </p>
            )}
            {pendingOps > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                <WifiOff className="h-4 w-4" />
                <span>{pendingOps} diagnóstico(s) pendiente(s) de envío</span>
              </div>
            )}
            <Button size="lg" onClick={wizard.start}>
              {wizard.validation.respondedCount > 0 ? 'Continuar Diagnóstico' : 'Iniciar Diagnóstico'}
            </Button>
          </CardContent>
        </Card>

        {HISTORIAL_MOCK.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Diagnósticos Anteriores</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {HISTORIAL_MOCK.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.fecha}</p>
                    <p className="text-xs text-muted-foreground">Evaluador: {h.evaluador}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{h.promedioGlobal}/4.0</p>
                    <Badge className={getSemaforo(h.promedioGlobal).color}>{getSemaforo(h.promedioGlobal).label}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (wizard.isCompleted) {
    const semaforoGlobal = getSemaforo(promedioGlobal);
    const criticas = resultados.filter(r => r.critica && r.semaforo.nivel === 'rojo');
    const recGlobal = getRecomendacion(promedioGlobal);

    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Diagnóstico Completado</h2>
        </div>

        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <Badge className={semaforoGlobal.color + ' text-lg px-4 py-1'}>{semaforoGlobal.label}</Badge>
            <p className="text-4xl font-bold text-foreground">{promedioGlobal}/4.0</p>
            <p className="text-sm text-muted-foreground">Promedio global de las 12 dimensiones</p>
            <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-primary">Recomendación: {REC_LABELS[recGlobal]}</p>
            </div>
          </CardContent>
        </Card>

        {criticas.length > 0 && (
          <Card className="border-destructive/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-sm font-semibold text-destructive">Dimensiones críticas que requieren atención inmediata</p>
              </div>
              {criticas.map(c => (
                <p key={c.id} className="text-sm text-muted-foreground">• {c.nombre}: {c.promedio}/4.0</p>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Semáforo por Dimensión</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {resultados.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{r.nombre}</span>
                  {r.critica && <Badge variant="outline" className="text-[10px]">Crítica</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">{r.promedio}/4.0</span>
                  <Badge className={r.semaforo.color}>{r.semaforo.label}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={wizard.reviewFromResults}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Revisar
          </Button>
          <Button onClick={handleSave}>
            {navigator.onLine
              ? <><Save className="h-4 w-4 mr-1" /> Guardar diagnóstico</>
              : <><WifiOff className="h-4 w-4 mr-1" /> Guardar offline</>
            }
          </Button>
        </div>
      </div>
    );
  }

  const stepNavInfo = wizard.validation.stepProgress.map((sp, i) => ({
    id: sp.stepId,
    label: steps[i].label,
    complete: sp.complete,
  }));

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <WizardProgress responded={wizard.validation.respondedCount} total={wizard.validation.totalCount} />

      <WizardStepNav steps={stepNavInfo} activeIndex={wizard.stepIndex} onSelect={wizard.setStepIndex} />

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {dimActual.nombre}
              {dimActual.critica && <Badge variant="destructive" className="text-[10px]">Crítica</Badge>}
            </CardTitle>
            <Badge variant="outline" className="text-xs">{wizard.stepIndex + 1}/{steps.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {dimActual.preguntas.map((p, idx) => (
            <WizardQuestionCard
              key={p.codigo}
              questionNumber={idx + 1}
              text={p.texto}
              options={OPCIONES_DIAGNOSTICO.map(o => ({ value: o.valor.toString(), label: o.etiqueta }))}
              selectedValue={wizard.responses.get(p.codigo)?.toString()}
              onSelect={(v) => wizard.setResponse(p.codigo, parseInt(v))}
            />
          ))}
        </CardContent>
      </Card>

      <WizardNavButtons
        onPrev={wizard.goPrev}
        onNext={wizard.goNext}
        canPrev={wizard.canGoPrev}
        canNext={wizard.canGoNext}
        isLast={wizard.isLastStep}
      />
    </div>
  );
}
