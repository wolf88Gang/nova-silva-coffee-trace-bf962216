import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Save, ChevronLeft, WifiOff } from 'lucide-react';
import { WizardProgress, WizardStepNav, WizardNavButtons, WizardQuestionCard } from '@/components/wizard';
import { useWizardState, type WizardStepDef } from '@/hooks/useWizardState';
import { enqueue } from '@/lib/offlineQueue';
import { useToast } from '@/hooks/use-toast';
import {
  CLIMA_PRODUCTOR_PREGUNTAS, BLOQUES_INFO, BLOQUES_ORDER,
  getPreguntasPorBloque, type PreguntaClima,
} from '@/config/climaProductor';
import { calcularResultadoGlobal, type RespuestaClima } from '@/lib/climaScoring';
import VitalResultadoCard from './VitalResultadoCard';

const PREGUNTAS_POR_PAGINA = 5;

const steps: WizardStepDef[] = BLOQUES_ORDER.map(b => ({
  id: b,
  label: BLOQUES_INFO[b].titulo.split(' ')[0],
  questionCount: getPreguntasPorBloque(b).length,
}));

const allCodes = CLIMA_PRODUCTOR_PREGUNTAS.map(p => p.codigo);

export default function ClimaProductorWizard() {
  const { toast } = useToast();
  const [paginaEnBloque, setPaginaEnBloque] = useState(0);

  const wizard = useWizardState<RespuestaClima>({
    steps,
    questionCodes: allCodes,
    persistence: { storageKey: 'novasilva_vital_productor', debounceMs: 300 },
  });

  const bloqueActual = BLOQUES_ORDER[wizard.stepIndex];
  const preguntasBloque = useMemo(() => getPreguntasPorBloque(bloqueActual), [bloqueActual]);
  const totalPaginas = Math.ceil(preguntasBloque.length / PREGUNTAS_POR_PAGINA);
  const preguntasPagina = preguntasBloque.slice(
    paginaEnBloque * PREGUNTAS_POR_PAGINA,
    (paginaEnBloque + 1) * PREGUNTAS_POR_PAGINA,
  );

  const puedeAvanzar = preguntasPagina.every(p => wizard.responses.has(p.codigo));

  const siguiente = () => {
    if (paginaEnBloque < totalPaginas - 1) {
      setPaginaEnBloque(p => p + 1);
    } else if (wizard.isLastStep) {
      wizard.complete();
    } else {
      wizard.setStepIndex(wizard.stepIndex + 1);
      setPaginaEnBloque(0);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const anterior = () => {
    if (paginaEnBloque > 0) {
      setPaginaEnBloque(p => p - 1);
    } else if (wizard.stepIndex > 0) {
      const prevPregs = getPreguntasPorBloque(BLOQUES_ORDER[wizard.stepIndex - 1]);
      wizard.setStepIndex(wizard.stepIndex - 1);
      setPaginaEnBloque(Math.ceil(prevPregs.length / PREGUNTAS_POR_PAGINA) - 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resultado = useMemo(() => {
    if (!wizard.isCompleted) return null;
    return calcularResultadoGlobal(wizard.responses);
  }, [wizard.isCompleted, wizard.responses]);

  const handleSave = () => {
    const payload = {
      respuestas: Object.fromEntries(wizard.responses),
      resultado,
      timestamp: new Date().toISOString(),
    };

    enqueue('vital_productor', payload);

    if (!navigator.onLine) {
      toast({ title: 'Guardado en cola offline', description: 'Se enviará cuando haya conexión.' });
    } else {
      toast({ title: 'Evaluación guardada', description: `Índice global: ${resultado?.indiceGlobal}/100` });
      wizard.clearSaved();
    }
  };

  if (wizard.isCompleted && resultado) {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Evaluación Completada</h2>
          <p className="text-muted-foreground">
            Se evaluaron {CLIMA_PRODUCTOR_PREGUNTAS.length} indicadores en {BLOQUES_ORDER.length} bloques temáticos
          </p>
        </div>
        <VitalResultadoCard resultado={resultado} />
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => { wizard.reviewFromResults(); setPaginaEnBloque(0); }}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Revisar respuestas
          </Button>
          <Button onClick={handleSave}>
            {navigator.onLine
              ? <><Save className="h-4 w-4 mr-1" /> Guardar evaluación</>
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

  const infoBloque = BLOQUES_INFO[bloqueActual];
  const isLastPage = wizard.isLastStep && paginaEnBloque === totalPaginas - 1;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <WizardProgress
        responded={wizard.validation.respondedCount}
        total={wizard.validation.totalCount}
        label="Progreso general"
      />

      <WizardStepNav steps={stepNavInfo} activeIndex={wizard.stepIndex} onSelect={(i) => { wizard.setStepIndex(i); setPaginaEnBloque(0); }} />

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{infoBloque.titulo}</CardTitle>
            <Badge variant="outline" className="text-xs">
              Bloque {wizard.stepIndex + 1}/{BLOQUES_ORDER.length} — Pág. {paginaEnBloque + 1}/{totalPaginas}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{infoBloque.descripcion}</p>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {preguntasPagina.map((p: PreguntaClima) => {
          const resp = wizard.responses.get(p.codigo);
          const numGlobal = CLIMA_PRODUCTOR_PREGUNTAS.indexOf(p) + 1;
          const dimLabel = p.dimension === 'exposicion' ? 'Exposición'
            : p.dimension === 'sensibilidad' ? 'Sensibilidad' : 'Capacidad Adaptativa';

          return (
            <WizardQuestionCard
              key={p.codigo}
              questionNumber={numGlobal}
              text={p.texto}
              options={p.opciones.map(o => ({ value: o.clave, label: o.etiqueta }))}
              selectedValue={resp?.clave}
              onSelect={(clave) => {
                const opcion = p.opciones.find(o => o.clave === clave);
                if (opcion) wizard.setResponse(p.codigo, { codigo: p.codigo, clave, valor: opcion.valor });
              }}
              footer={
                <p className="text-[10px] text-muted-foreground">{dimLabel} · Peso: {p.peso}</p>
              }
            />
          );
        })}
      </div>

      <WizardNavButtons
        onPrev={anterior}
        onNext={siguiente}
        canPrev={wizard.stepIndex > 0 || paginaEnBloque > 0}
        canNext={puedeAvanzar}
        isLast={isLastPage}
      />
    </div>
  );
}
