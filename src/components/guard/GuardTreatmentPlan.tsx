import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Shield, Sprout, Calendar, FlaskConical, CheckCircle2, Clock,
  AlertTriangle, FileText, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';

interface TratamientoItem {
  producto: string;
  tipo: 'biológico' | 'químico' | 'cultural';
  dosis: string;
  frecuencia: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'Pendiente' | 'En curso' | 'Completado';
  notas: string;
}

interface PlanTratamiento {
  id: string;
  parcela: string;
  enfermedad: string;
  severidad: string;
  fechaCreacion: string;
  estado: 'Generado' | 'Aprobado' | 'En ejecución' | 'Completado';
  estrategia: 'regenerativo' | 'convencional' | 'integrado';
  duracionDias: number;
  ejecucion: number;
  tratamientos: TratamientoItem[];
  interpretacion: string;
  precauciones: string[];
}

const DEMO_PLANES: PlanTratamiento[] = [
  {
    id: 'PT-2026-001',
    parcela: 'El Cedro',
    enfermedad: 'Roya del café (Hemileia vastatrix)',
    severidad: 'Alta',
    fechaCreacion: '2026-03-10',
    estado: 'En ejecución',
    estrategia: 'integrado',
    duracionDias: 45,
    ejecucion: 55,
    tratamientos: [
      { producto: 'Caldo bordelés 1%', tipo: 'químico', dosis: '400 L/ha', frecuencia: 'Cada 15 días', fechaInicio: '2026-03-12', fechaFin: '2026-04-26', estado: 'En curso', notas: 'Aplicar temprano en la mañana, evitar lluvia 4h post-aplicación' },
      { producto: 'Trichoderma harzianum', tipo: 'biológico', dosis: '2 kg/ha', frecuencia: 'Cada 21 días', fechaInicio: '2026-03-15', fechaFin: '2026-04-26', estado: 'En curso', notas: 'Compatibilizar con caldo bordelés (aplicar 7 días después)' },
      { producto: 'Regulación de sombra', tipo: 'cultural', dosis: '—', frecuencia: 'Única', fechaInicio: '2026-03-10', fechaFin: '2026-03-14', estado: 'Completado', notas: 'Raleo selectivo para mejorar circulación de aire (objetivo: 40-50% sombra)' },
      { producto: 'Poda sanitaria', tipo: 'cultural', dosis: '—', frecuencia: 'Única', fechaInicio: '2026-03-11', fechaFin: '2026-03-13', estado: 'Completado', notas: 'Eliminar ramas bajas y material enfermo. Desinfectar herramientas entre plantas' },
    ],
    interpretacion: 'El plan de manejo integrado combina control químico (caldo bordelés como fungicida cúprico protectante), control biológico (Trichoderma como antagonista) y prácticas culturales (regulación de sombra y poda sanitaria) para un enfoque sostenible. La reducción de sombra al 40-50% disminuye la humedad relativa foliar, condición crítica para la germinación de uredosporas de H. vastatrix. El protocolo VITAL de la parcela indica un IGRN de 65 ("En Construcción"), lo que sugiere reforzar la capacidad adaptativa mediante prácticas de conservación de suelo.',
    precauciones: [
      'No aplicar caldo bordelés con temperaturas >30°C',
      'Respetar período de carencia de 21 días antes de cosecha',
      'Verificar compatibilidad con certificación orgánica si aplica',
      'Monitorear eficacia a los 7 y 15 días post-aplicación',
    ],
  },
  {
    id: 'PT-2026-002',
    parcela: 'La Esperanza',
    enfermedad: 'Broca del café (Hypothenemus hampei)',
    severidad: 'Media',
    fechaCreacion: '2026-03-08',
    estado: 'Aprobado',
    estrategia: 'regenerativo',
    duracionDias: 60,
    ejecucion: 0,
    tratamientos: [
      { producto: 'Beauveria bassiana', tipo: 'biológico', dosis: '2×10¹² conidios/ha', frecuencia: 'Cada 10 días', fechaInicio: '2026-03-15', fechaFin: '2026-05-15', estado: 'Pendiente', notas: 'Aplicar en horas de baja insolación (antes 8am o después 4pm)' },
      { producto: 'Trampas etanol-metanol', tipo: 'cultural', dosis: '20 trampas/ha', frecuencia: 'Revisión semanal', fechaInicio: '2026-03-12', fechaFin: '2026-05-15', estado: 'Pendiente', notas: 'Mezcla 1:1 etanol-metanol. Renovar cebo cada 15 días' },
      { producto: 'Cosecha sanitaria (Re-Re)', tipo: 'cultural', dosis: '—', frecuencia: 'Semanal', fechaInicio: '2026-03-12', fechaFin: '2026-05-15', estado: 'Pendiente', notas: 'Recoger todos los frutos del suelo y maduros no cosechados' },
    ],
    interpretacion: 'Plan de manejo regenerativo enfocado en biocontrol y prácticas culturales, sin uso de químicos sintéticos. La Beauveria bassiana coloniza el exoesqueleto del insecto causando mortalidad en 48-72h con eficacia del 60-80% en condiciones de HR>70%. Las trampas de monitoreo permiten evaluar la dinámica poblacional. La cosecha sanitaria rompe el ciclo reproductivo al eliminar frutos hospederos.',
    precauciones: [
      'No mezclar Beauveria con fungicidas cúpricos (incompatible)',
      'Mantener cadena de frío del producto biológico',
      'Las trampas solo son de monitoreo, no de control masivo',
      'Registrar capturas semanalmente para tendencia',
    ],
  },
  {
    id: 'PT-2026-003',
    parcela: 'Monte Verde',
    enfermedad: 'Ojo de gallo (Mycena citricolor)',
    severidad: 'Baja',
    fechaCreacion: '2026-02-28',
    estado: 'Completado',
    duracionDias: 30,
    estrategia: 'integrado',
    ejecucion: 100,
    tratamientos: [
      { producto: 'Caldo bordelés 0.5%', tipo: 'químico', dosis: '300 L/ha', frecuencia: 'Cada 21 días', fechaInicio: '2026-02-28', fechaFin: '2026-03-28', estado: 'Completado', notas: 'Aplicación completada sin contratiempos' },
      { producto: 'Regulación de sombra', tipo: 'cultural', dosis: '—', frecuencia: 'Única', fechaInicio: '2026-03-01', fechaFin: '2026-03-03', estado: 'Completado', notas: 'Sombra reducida de 65% a 45%' },
    ],
    interpretacion: 'Plan completado exitosamente. La combinación de fungicida cúprico preventivo y regulación de sombra controló el brote de ojo de gallo. La reducción de sombra del 65% al 45% fue el factor más determinante al disminuir la humedad foliar persistente que favorece a Mycena citricolor.',
    precauciones: [],
  },
];

const estadoColor: Record<string, string> = {
  Generado: 'secondary',
  Aprobado: 'default',
  'En ejecución': 'default',
  Completado: 'outline',
};

const tipoColor: Record<string, string> = {
  biológico: 'bg-primary/10 text-primary',
  químico: 'bg-amber-500/10 text-amber-600',
  cultural: 'bg-accent/10 text-accent-foreground',
};

const tratEstadoIcon = (estado: string) => {
  if (estado === 'Completado') return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (estado === 'En curso') return <Clock className="h-4 w-4 text-accent-foreground" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

interface Props {
  parcelaFilter?: string;
  onGeneratePlan?: () => void;
}

export default function GuardTreatmentPlan({ parcelaFilter, onGeneratePlan }: Props) {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const planes = parcelaFilter
    ? DEMO_PLANES.filter(p => p.parcela === parcelaFilter)
    : DEMO_PLANES;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Planes de tratamiento fitosanitario generados a partir de diagnósticos</p>
        {onGeneratePlan && (
          <Button size="sm" className="gap-1" onClick={onGeneratePlan}>
            <Sparkles className="h-4 w-4" /> Generar plan
          </Button>
        )}
      </div>

      {planes.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No hay planes de tratamiento para esta parcela</p>
            {onGeneratePlan && (
              <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={onGeneratePlan}>
                <Sparkles className="h-4 w-4" /> Crear primer diagnóstico
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {planes.map(plan => {
        const isExpanded = expandedPlan === plan.id;
        return (
          <Card key={plan.id} className="overflow-hidden">
            <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{plan.id}</CardTitle>
                    <Badge variant={(estadoColor[plan.estado] as any) || 'secondary'}>{plan.estado}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{plan.estrategia}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.parcela} · {plan.enfermedad}</p>
                  <p className="text-xs text-muted-foreground">Severidad: {plan.severidad} · Duración: {plan.duracionDias} días · Creado: {plan.fechaCreacion}</p>
                </div>
                <div className="flex items-center gap-2">
                  {plan.ejecucion > 0 && plan.ejecucion < 100 && (
                    <div className="flex items-center gap-2 w-24">
                      <Progress value={plan.ejecucion} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">{plan.ejecucion}%</span>
                    </div>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0 space-y-4">
                <Separator />

                {/* Treatments */}
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1.5"><FlaskConical className="h-4 w-4" /> Tratamientos ({plan.tratamientos.length})</p>
                  {plan.tratamientos.map((t, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {tratEstadoIcon(t.estado)}
                          <span className="text-sm font-medium">{t.producto}</span>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tipoColor[t.tipo]}`}>{t.tipo}</span>
                        </div>
                        <Badge variant={t.estado === 'Completado' ? 'outline' : t.estado === 'En curso' ? 'default' : 'secondary'} className="text-xs">{t.estado}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2">
                        <div><span className="font-medium text-foreground">Dosis:</span> {t.dosis}</div>
                        <div><span className="font-medium text-foreground">Frecuencia:</span> {t.frecuencia}</div>
                        <div><span className="font-medium text-foreground">Inicio:</span> {t.fechaInicio}</div>
                        <div><span className="font-medium text-foreground">Fin:</span> {t.fechaFin}</div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 italic">{t.notas}</p>
                    </div>
                  ))}
                </div>

                {/* Interpretation */}
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                  <p className="text-sm font-medium flex items-center gap-1.5 text-accent-foreground mb-1"><Sprout className="h-4 w-4" /> Interpretación Nova Silva</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{plan.interpretacion}</p>
                </div>

                {/* Precautions */}
                {plan.precauciones.length > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <p className="text-sm font-medium flex items-center gap-1.5 text-destructive mb-1.5"><AlertTriangle className="h-4 w-4" /> Precauciones</p>
                    <ul className="space-y-1">
                      {plan.precauciones.map((p, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-destructive mt-0.5">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {plan.estado === 'Aprobado' && (
                    <Button size="sm" className="gap-1"><Calendar className="h-3.5 w-3.5" /> Iniciar ejecución</Button>
                  )}
                  {plan.estado === 'Generado' && (
                    <Button size="sm" className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Aprobar plan</Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-1"><FileText className="h-3.5 w-3.5" /> Exportar PDF</Button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
