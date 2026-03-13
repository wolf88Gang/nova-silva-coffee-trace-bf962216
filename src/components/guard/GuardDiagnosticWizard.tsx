import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Bug, Leaf, Cherry, TreeDeciduous, Flower2, ChevronRight, ChevronLeft, Camera, CheckCircle2, AlertTriangle } from 'lucide-react';
import { calcDiseasePressure, getDiseasePressureLevel } from '@/lib/interModuleEngine';
import { toast } from 'sonner';

interface DiagnosticoResult {
  parcela: string;
  organo: string;
  enfermedad: string;
  severidad: string;
  incidencia: number;
  roya: number;
  broca: number;
  defoliacion: number;
  estres: number;
  notas: string;
  fecha: string;
  presion: number;
  nivel: string;
}

interface Props {
  parcelaName?: string;
  onSaved?: (result: DiagnosticoResult) => void;
  onCancel?: () => void;
}

const ORGANOS = [
  { id: 'hoja', label: 'Hoja', icon: Leaf, desc: 'Manchas, decoloración, necrosis, defoliación' },
  { id: 'fruto', label: 'Fruto', icon: Cherry, desc: 'Perforaciones, pudrición, caída prematura' },
  { id: 'tallo', label: 'Tallo', icon: TreeDeciduous, desc: 'Lesiones, cancros, marchitez vascular' },
  { id: 'raiz', label: 'Raíz', icon: Flower2, desc: 'Pudrición, nematodos, mal desarrollo' },
];

const ENFERMEDADES: Record<string, { id: string; label: string; severidadTipica: string }[]> = {
  hoja: [
    { id: 'roya', label: 'Roya del café (Hemileia vastatrix)', severidadTipica: 'Alta' },
    { id: 'ojo_gallo', label: 'Ojo de gallo (Mycena citricolor)', severidadTipica: 'Media' },
    { id: 'mancha_hierro', label: 'Mancha de hierro (Cercospora coffeicola)', severidadTipica: 'Media' },
    { id: 'antracnosis', label: 'Antracnosis (Colletotrichum spp.)', severidadTipica: 'Alta' },
    { id: 'hilachas', label: 'Mal de hilachas (Pellicularia koleroga)', severidadTipica: 'Baja' },
  ],
  fruto: [
    { id: 'broca', label: 'Broca del café (Hypothenemus hampei)', severidadTipica: 'Alta' },
    { id: 'antracnosis_fruto', label: 'Antracnosis de fruto', severidadTipica: 'Media' },
    { id: 'cbd', label: 'CBD (Colletotrichum kahawae)', severidadTipica: 'Alta' },
  ],
  tallo: [
    { id: 'llaga_negra', label: 'Llaga negra (Rosellinia bunodes)', severidadTipica: 'Alta' },
    { id: 'mal_machete', label: 'Mal del machete (Ceratocystis fimbriata)', severidadTipica: 'Alta' },
    { id: 'muerte_descendente', label: 'Muerte descendente (Phoma spp.)', severidadTipica: 'Media' },
  ],
  raiz: [
    { id: 'nematodos', label: 'Nematodos (Meloidogyne spp.)', severidadTipica: 'Media' },
    { id: 'llaga_raiz', label: 'Llaga estrellada (Rosellinia pepo)', severidadTipica: 'Alta' },
    { id: 'pudricion', label: 'Pudrición radicular (Fusarium spp.)', severidadTipica: 'Media' },
  ],
};

const PARCELAS_DEMO = ['El Cedro', 'La Esperanza', 'Los Naranjos', 'Monte Verde', 'San Rafael', 'La Cumbre', 'El Porvenir', 'Finca Alta'];

export default function GuardDiagnosticWizard({ parcelaName, onSaved, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [parcela, setParcela] = useState(parcelaName || '');
  const [organo, setOrgano] = useState('');
  const [enfermedad, setEnfermedad] = useState('');
  const [roya, setRoya] = useState(0);
  const [broca, setBroca] = useState(0);
  const [defoliacion, setDefoliacion] = useState(0);
  const [estres, setEstres] = useState(0);
  const [notas, setNotas] = useState('');

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const enfermedadesDisponibles = organo ? ENFERMEDADES[organo] || [] : [];
  const enfermedadObj = enfermedadesDisponibles.find(e => e.id === enfermedad);

  const pressure = calcDiseasePressure(roya / 100, broca / 100, defoliacion / 100, estres / 100);
  const nivel = getDiseasePressureLevel(pressure);
  const nivelColor = nivel === 'baja' ? 'text-primary' : nivel === 'moderada' ? 'text-accent-foreground' : 'text-destructive';

  const canNext = () => {
    if (step === 0) return !!parcela;
    if (step === 1) return !!organo;
    if (step === 2) return !!enfermedad;
    return true;
  };

  const handleSubmit = () => {
    const result: DiagnosticoResult = {
      parcela,
      organo,
      enfermedad: enfermedadObj?.label || enfermedad,
      severidad: enfermedadObj?.severidadTipica || 'Media',
      incidencia: Math.max(roya, broca, defoliacion, estres),
      roya, broca, defoliacion, estres,
      notas,
      fecha: new Date().toISOString().split('T')[0],
      presion: pressure,
      nivel,
    };
    toast.success('Diagnóstico fitosanitario registrado exitosamente');
    onSaved?.(result);
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" /> Nuevo Diagnóstico Fitosanitario
          </CardTitle>
          <Badge variant="outline" className="text-xs">Paso {step + 1} de {totalSteps}</Badge>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 0: Select parcela */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">¿En qué parcela observas el problema?</p>
            {parcelaName ? (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="font-medium">{parcelaName}</p>
                <p className="text-xs text-muted-foreground">Parcela seleccionada</p>
              </div>
            ) : (
              <Select value={parcela} onValueChange={setParcela}>
                <SelectTrigger><SelectValue placeholder="Selecciona una parcela" /></SelectTrigger>
                <SelectContent>
                  {PARCELAS_DEMO.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Step 1: Triage - organ */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">¿En qué parte de la planta observas los síntomas?</p>
            <div className="grid grid-cols-2 gap-3">
              {ORGANOS.map(o => (
                <button
                  key={o.id}
                  onClick={() => { setOrgano(o.id); setEnfermedad(''); }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    organo === o.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  <o.icon className={`h-6 w-6 mb-2 ${organo === o.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="font-medium text-sm">{o.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Disease selection */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">¿Qué enfermedad o plaga sospechas?</p>
            <p className="text-xs text-muted-foreground">
              Basado en síntomas en: <Badge variant="outline" className="text-xs">{ORGANOS.find(o => o.id === organo)?.label}</Badge>
            </p>
            <div className="space-y-2">
              {enfermedadesDisponibles.map(e => (
                <button
                  key={e.id}
                  onClick={() => setEnfermedad(e.id)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                    enfermedad === e.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{e.label}</p>
                    <p className="text-xs text-muted-foreground">Severidad típica: {e.severidadTipica}</p>
                  </div>
                  {enfermedad === e.id && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Severity assessment */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Evaluación de severidad e incidencia</p>
            
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`h-4 w-4 ${nivelColor}`} />
                <span className="text-sm font-medium">Presión fitosanitaria: <span className={nivelColor}>{nivel}</span></span>
              </div>
              <p className="text-xs text-muted-foreground">Índice: {(pressure * 100).toFixed(1)}%</p>
            </div>

            {[
              { label: 'Incidencia de roya (%)', value: roya, set: setRoya, desc: 'Porcentaje de hojas afectadas' },
              { label: 'Incidencia de broca (%)', value: broca, set: setBroca, desc: 'Porcentaje de frutos perforados' },
              { label: 'Defoliación (%)', value: defoliacion, set: setDefoliacion, desc: 'Pérdida de área foliar' },
              { label: 'Síntomas de estrés (%)', value: estres, set: setEstres, desc: 'Marchitez, clorosis general' },
            ].map(s => (
              <div key={s.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{s.label}</span>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  <span className="text-muted-foreground font-mono">{s.value}%</span>
                </div>
                <Slider value={[s.value]} onValueChange={([v]) => s.set(v)} max={100} step={1} />
              </div>
            ))}

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Evidencia fotográfica</p>
                <p className="text-xs text-muted-foreground">Tome fotos de los síntomas para registro</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" disabled>
                <Camera className="h-3.5 w-3.5 mr-1" /> Capturar
              </Button>
            </div>

            <Textarea
              placeholder="Notas adicionales: condiciones climáticas, parcelas vecinas afectadas, historial..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
            )}
            {onCancel && step === 0 && (
              <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
            )}
          </div>
          {step < totalSteps - 1 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              Siguiente <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} className="gap-1">
              <CheckCircle2 className="h-4 w-4" /> Registrar diagnóstico
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
