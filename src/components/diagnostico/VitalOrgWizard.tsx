import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, AlertTriangle, Shield, Save } from 'lucide-react';
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

// Mock historial
const HISTORIAL_MOCK = [
  { id: '1', fecha: '2025-09-15', evaluador: 'Carlos Mendoza', promedioGlobal: 2.4, nivel: 'ambar' as NivelSemaforo },
  { id: '2', fecha: '2025-03-20', evaluador: 'Ana Ramírez', promedioGlobal: 1.9, nivel: 'rojo' as NivelSemaforo },
];

export default function VitalOrgWizard() {
  const [iniciado, setIniciado] = useState(false);
  const [dimIdx, setDimIdx] = useState(0);
  const [respuestas, setRespuestas] = useState<Map<string, number>>(new Map());
  const [completado, setCompletado] = useState(false);

  const totalPreguntas = getTotalPreguntas();
  const respondidas = respuestas.size;
  const dimActual = DIMENSIONES_DIAGNOSTICO[dimIdx];

  const handleRespuesta = (codigo: string, valor: number) => {
    setRespuestas(prev => { const n = new Map(prev); n.set(codigo, valor); return n; });
  };

  const dimCompleta = dimActual?.preguntas.every(p => respuestas.has(p.codigo));

  const siguiente = () => {
    if (dimIdx < DIMENSIONES_DIAGNOSTICO.length - 1) {
      setDimIdx(i => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCompletado(true);
    }
  };

  const resultados: ResultadoDimension[] = useMemo(() => {
    return DIMENSIONES_DIAGNOSTICO.map(dim => {
      const vals = dim.preguntas.map(p => respuestas.get(p.codigo) ?? 0).filter(v => v > 0);
      const promedio = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return {
        id: dim.id,
        nombre: dim.nombre,
        critica: dim.critica,
        promedio: Math.round(promedio * 100) / 100,
        semaforo: getSemaforo(promedio),
        recomendacion: getRecomendacion(promedio),
      };
    });
  }, [respuestas]);

  const promedioGlobal = useMemo(() => {
    const vals = resultados.filter(r => r.promedio > 0);
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((s, r) => s + r.promedio, 0) / vals.length) * 100) / 100;
  }, [resultados]);

  // Pantalla de bienvenida
  if (!iniciado) {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <Shield className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Diagnóstico Organizacional</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Esta herramienta evalúa 12 dimensiones clave de su organización a través de {totalPreguntas} preguntas.
              El resultado le ayudará a identificar fortalezas y áreas de mejora para implementar la plataforma Nova Silva.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> 2-3 horas estimadas</div>
              <div className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> {totalPreguntas} preguntas</div>
              <div className="flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> 3 dimensiones críticas</div>
            </div>
            <Button size="lg" onClick={() => setIniciado(true)}>Iniciar Diagnóstico</Button>
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

  // Pantalla de resultados
   if (completado) {
    const semaforoGlobal = getSemaforo(promedioGlobal);
    const criticas = resultados.filter(r => r.critica && r.semaforo.nivel === 'rojo');
    const recMap: Record<string, string> = {
      fortalecimiento_previo: 'Fortalecimiento previo requerido antes de implementación tecnológica. Se recomienda un plan de 6-12 meses para cerrar brechas críticas en gobernanza, equipo técnico y gestión de datos antes de adoptar herramientas digitales avanzadas.',
      piloto_parcial: 'Piloto parcial recomendado con acompañamiento técnico. La organización tiene bases sólidas en algunas dimensiones pero necesita fortalecer áreas específicas. Un piloto controlado permitirá validar la adopción tecnológica.',
      implementacion_completa: 'Implementación completa viable. La organización demuestra capacidades sólidas en las dimensiones evaluadas y está lista para adoptar la plataforma Nova Silva de forma integral.',
    };
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
              <p className="text-sm font-medium text-primary">Recomendación: {recMap[recGlobal]}</p>
            </div>

            {/* Interpretación Nova Silva */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <p className="text-xs font-semibold text-primary">Interpretación Nova Silva</p>
              <p className="text-sm text-muted-foreground">
                La organización obtiene un puntaje global de <span className="font-bold text-foreground">{promedioGlobal}/4.0</span>, clasificándose como <span className="font-bold text-foreground">{semaforoGlobal.label}</span>.
                {criticas.length > 0
                  ? ` Se identifican ${criticas.length} dimensión(es) crítica(s) que requieren atención inmediata: ${criticas.map(c => c.nombre).join(', ')}.`
                  : ' No se detectan dimensiones críticas en estado de alerta.'}
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Fortalezas identificadas</p>
                {resultados.filter(r => r.semaforo.nivel === 'verde').length > 0
                  ? resultados.filter(r => r.semaforo.nivel === 'verde').map(r => (
                      <p key={r.id} className="text-xs text-muted-foreground">• {r.nombre}: {r.promedio}/4.0 — Sólido</p>
                    ))
                  : <p className="text-xs text-muted-foreground">Ninguna dimensión alcanza nivel sólido aún.</p>
                }
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Áreas de mejora prioritarias</p>
                {resultados.filter(r => r.semaforo.nivel === 'rojo').length > 0
                  ? resultados.filter(r => r.semaforo.nivel === 'rojo').map(r => (
                      <p key={r.id} className="text-xs text-muted-foreground">• {r.nombre}: {r.promedio}/4.0 — Requiere fortalecimiento{r.critica ? ' (dimensión crítica)' : ''}</p>
                    ))
                  : <p className="text-xs text-muted-foreground">No hay dimensiones en estado crítico.</p>
                }
              </div>
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
          <Button variant="outline" onClick={() => { setCompletado(false); setDimIdx(0); }}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Revisar
          </Button>
          <Button onClick={() => console.log('Guardar diagnóstico:', { respuestas: Object.fromEntries(respuestas), resultados, promedioGlobal })}>
            <Save className="h-4 w-4 mr-1" /> Guardar diagnóstico
          </Button>
        </div>
      </div>
    );
  }

  // Wizard de preguntas
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso general</span>
          <span className="font-medium text-foreground">{respondidas}/{totalPreguntas}</span>
        </div>
        <Progress value={(respondidas / totalPreguntas) * 100} className="h-2" />
      </div>

      {/* Navigator de dimensiones */}
      <ScrollArea className="w-full">
        <div className="flex gap-1 pb-2">
          {DIMENSIONES_DIAGNOSTICO.map((d, i) => {
            const done = d.preguntas.every(p => respuestas.has(p.codigo));
            const activo = i === dimIdx;
            return (
              <button
                key={d.id}
                onClick={() => setDimIdx(i)}
                className={`flex-shrink-0 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activo ? 'bg-primary text-primary-foreground'
                    : done ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {d.nombre.split(' ')[0]}{done && ' ✓'}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {dimActual.nombre}
              {dimActual.critica && <Badge variant="destructive" className="text-[10px]">Crítica</Badge>}
            </CardTitle>
            <Badge variant="outline" className="text-xs">{dimIdx + 1}/{DIMENSIONES_DIAGNOSTICO.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {dimActual.preguntas.map((p, idx) => (
            <div key={p.codigo} className={`p-4 rounded-lg border ${respuestas.has(p.codigo) ? 'border-primary/30' : 'border-border'}`}>
              <p className="text-sm font-medium text-foreground mb-3">{idx + 1}. {p.texto}</p>
              <RadioGroup
                value={respuestas.get(p.codigo)?.toString() ?? ''}
                onValueChange={(v) => handleRespuesta(p.codigo, parseInt(v))}
                className="space-y-2"
              >
                {OPCIONES_DIAGNOSTICO.map(o => (
                  <div key={o.valor} className="flex items-center space-x-2">
                    <RadioGroupItem value={o.valor.toString()} id={`${p.codigo}-${o.valor}`} />
                    <Label htmlFor={`${p.codigo}-${o.valor}`} className="text-sm cursor-pointer">{o.etiqueta}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => { setDimIdx(i => i - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={dimIdx === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <Button onClick={siguiente} disabled={!dimCompleta}>
          {dimIdx === DIMENSIONES_DIAGNOSTICO.length - 1
            ? <><CheckCircle className="h-4 w-4 mr-1" /> Finalizar</>
            : <><span>Siguiente</span><ChevronRight className="h-4 w-4 ml-1" /></>
          }
        </Button>
      </div>
    </div>
  );
}
