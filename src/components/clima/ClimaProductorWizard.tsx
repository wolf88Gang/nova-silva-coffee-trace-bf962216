import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CheckCircle, Save } from 'lucide-react';
import { CLIMA_PRODUCTOR_PREGUNTAS, BLOQUES_INFO, BLOQUES_ORDER, getPreguntasPorBloque } from '@/config/climaProductor';
import { calcularResultadoGlobal, type RespuestaClima } from '@/lib/climaScoring';
import VitalResultadoCard from './VitalResultadoCard';

const PREGUNTAS_POR_PAGINA = 5;

export default function ClimaProductorWizard() {
  const [respuestas, setRespuestas] = useState<Map<string, RespuestaClima>>(new Map());
  const [bloqueIdx, setBloqueIdx] = useState(0);
  const [paginaEnBloque, setPaginaEnBloque] = useState(0);
  const [completado, setCompletado] = useState(false);

  const bloqueActual = BLOQUES_ORDER[bloqueIdx];
  const preguntasBloque = useMemo(() => getPreguntasPorBloque(bloqueActual), [bloqueActual]);
  const totalPaginas = Math.ceil(preguntasBloque.length / PREGUNTAS_POR_PAGINA);
  const preguntasPagina = preguntasBloque.slice(
    paginaEnBloque * PREGUNTAS_POR_PAGINA,
    (paginaEnBloque + 1) * PREGUNTAS_POR_PAGINA
  );

  const totalPreguntas = CLIMA_PRODUCTOR_PREGUNTAS.length;
  const respondidas = respuestas.size;
  const progresoGlobal = Math.round((respondidas / totalPreguntas) * 100);

  const handleRespuesta = (codigo: string, clave: string, valor: number) => {
    setRespuestas(prev => {
      const next = new Map(prev);
      next.set(codigo, { codigo, clave, valor });
      return next;
    });
  };

  const puedeAvanzar = preguntasPagina.every(p => respuestas.has(p.codigo));

  const siguiente = () => {
    if (paginaEnBloque < totalPaginas - 1) {
      setPaginaEnBloque(p => p + 1);
    } else if (bloqueIdx < BLOQUES_ORDER.length - 1) {
      setBloqueIdx(b => b + 1);
      setPaginaEnBloque(0);
    } else {
      setCompletado(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const anterior = () => {
    if (paginaEnBloque > 0) {
      setPaginaEnBloque(p => p - 1);
    } else if (bloqueIdx > 0) {
      setBloqueIdx(b => b - 1);
      const prevPregs = getPreguntasPorBloque(BLOQUES_ORDER[bloqueIdx - 1]);
      setPaginaEnBloque(Math.ceil(prevPregs.length / PREGUNTAS_POR_PAGINA) - 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resultado = useMemo(() => {
    if (!completado) return null;
    return calcularResultadoGlobal(respuestas);
  }, [completado, respuestas]);

  if (completado && resultado) {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Evaluación Completada</h2>
          <p className="text-muted-foreground">Se evaluaron {totalPreguntas} indicadores en 6 bloques temáticos</p>
        </div>
        <VitalResultadoCard resultado={resultado} />
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => { setCompletado(false); setBloqueIdx(0); setPaginaEnBloque(0); }}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Revisar respuestas
          </Button>
          <Button onClick={() => { console.log('Guardar evaluación:', { respuestas: Object.fromEntries(respuestas), resultado }); }}>
            <Save className="h-4 w-4 mr-1" /> Guardar evaluación
          </Button>
        </div>
      </div>
    );
  }

  const infoBloque = BLOQUES_INFO[bloqueActual];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Progreso global */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso general</span>
          <span className="font-medium text-foreground">{respondidas}/{totalPreguntas} preguntas</span>
        </div>
        <Progress value={progresoGlobal} className="h-2" />
      </div>

      {/* Stepper de bloques */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {BLOQUES_ORDER.map((b, i) => {
          const info = BLOQUES_INFO[b];
          const pregsB = getPreguntasPorBloque(b);
          const respondB = pregsB.filter(p => respuestas.has(p.codigo)).length;
          const completo = respondB === pregsB.length;
          const activo = i === bloqueIdx;
          return (
            <button
              key={b}
              onClick={() => { setBloqueIdx(i); setPaginaEnBloque(0); }}
              className={`flex-shrink-0 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activo
                  ? 'bg-primary text-primary-foreground'
                  : completo
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {info.titulo.split(' ')[0]}
              {completo && ' ✓'}
            </button>
          );
        })}
      </div>

      {/* Header del bloque */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{infoBloque.titulo}</CardTitle>
            <Badge variant="outline" className="text-xs">
              Bloque {bloqueIdx + 1}/{BLOQUES_ORDER.length} — Pág. {paginaEnBloque + 1}/{totalPaginas}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{infoBloque.descripcion}</p>
        </CardHeader>
      </Card>

      {/* Preguntas */}
      <div className="space-y-4">
        {preguntasPagina.map((p, idx) => {
          const resp = respuestas.get(p.codigo);
          const numGlobal = CLIMA_PRODUCTOR_PREGUNTAS.indexOf(p) + 1;
          return (
            <Card key={p.codigo} className={resp ? 'border-primary/30' : ''}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{numGlobal}</span>
                  <p className="text-sm font-medium text-foreground">{p.texto}</p>
                </div>
                <RadioGroup
                  value={resp?.clave ?? ''}
                  onValueChange={(clave) => {
                    const opcion = p.opciones.find(o => o.clave === clave);
                    if (opcion) handleRespuesta(p.codigo, clave, opcion.valor);
                  }}
                  className="space-y-2"
                >
                  {p.opciones.map(o => (
                    <div key={o.clave} className="flex items-center space-x-2">
                      <RadioGroupItem value={o.clave} id={`${p.codigo}-${o.clave}`} />
                      <Label htmlFor={`${p.codigo}-${o.clave}`} className="text-sm cursor-pointer">{o.etiqueta}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-[10px] text-muted-foreground">
                  {p.dimension === 'exposicion' ? 'Exposición' : p.dimension === 'sensibilidad' ? 'Sensibilidad' : 'Capacidad Adaptativa'}
                  {' · Peso: '}{p.peso}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={anterior} disabled={bloqueIdx === 0 && paginaEnBloque === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <Button onClick={siguiente} disabled={!puedeAvanzar}>
          {bloqueIdx === BLOQUES_ORDER.length - 1 && paginaEnBloque === totalPaginas - 1
            ? <><CheckCircle className="h-4 w-4 mr-1" /> Finalizar</>
            : <><span>Siguiente</span> <ChevronRight className="h-4 w-4 ml-1" /></>
          }
        </Button>
      </div>
    </div>
  );
}
