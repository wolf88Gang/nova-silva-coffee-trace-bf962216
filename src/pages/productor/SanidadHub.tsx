import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Leaf, Bug, TreePine, Eye, Camera, ArrowRight, ArrowLeft, CheckCircle,
  AlertTriangle, Calendar, Shield, Droplets, ThermometerSun, CircleDot,
  Zap, RotateCcw, FileText, Sprout,
} from 'lucide-react';

// ── Disease database ──
interface Disease {
  id: string;
  name: string;
  scientificName: string;
  parts: string[];
  symptoms: { id: string; label: string; match: number }[];
  confidence: number;
  riskLevel: 'alto' | 'medio' | 'bajo';
  description: string;
  treatment: string[];
  products: { name: string; type: 'orgánico' | 'químico' }[];
  prevention: string[];
}

const diseases: Disease[] = [
  {
    id: 'roya', name: 'Roya del café', scientificName: 'Hemileia vastatrix',
    parts: ['hojas'],
    symptoms: [
      { id: 'manchas_amarillas', label: 'Manchas amarillas en el envés de la hoja', match: 35 },
      { id: 'polvo_naranja', label: 'Polvo anaranjado al tocar la mancha', match: 30 },
      { id: 'defoliacion', label: 'Defoliación prematura', match: 20 },
      { id: 'hojas_secas', label: 'Hojas secas o marchitas', match: 15 },
    ],
    confidence: 0, riskLevel: 'alto',
    description: 'Hongo que afecta las hojas causando defoliación severa y pérdida de producción hasta 50%. Es la enfermedad más destructiva del café en América Latina.',
    treatment: ['Aplicar fungicida cúprico preventivo cada 30 días durante la temporada lluviosa', 'Remover hojas severamente afectadas y destruirlas fuera de la finca', 'Mejorar la aireación con poda selectiva'],
    products: [{ name: 'Oxicloruro de cobre', type: 'químico' }, { name: 'Caldo bordelés', type: 'orgánico' }, { name: 'Triazoles (Cyproconazole)', type: 'químico' }],
    prevention: ['Variedades resistentes (Catimor, Marsellesa)', 'Sombra regulada 40-60%', 'Nutrición balanceada (K, Ca, B)'],
  },
  {
    id: 'broca', name: 'Broca del café', scientificName: 'Hypothenemus hampei',
    parts: ['fruto'],
    symptoms: [
      { id: 'perforacion_fruto', label: 'Perforación circular en la base del fruto', match: 40 },
      { id: 'aserrin', label: 'Aserrín o polvo fino en la entrada del agujero', match: 25 },
      { id: 'frutos_caidos', label: 'Frutos caídos prematuramente', match: 20 },
      { id: 'granos_danados', label: 'Granos internos dañados o con galerías', match: 15 },
    ],
    confidence: 0, riskLevel: 'alto',
    description: 'Insecto barrenador que perfora el fruto del café y destruye el grano. Puede causar pérdidas del 30-80% si no se controla. Es la plaga más importante del café a nivel mundial.',
    treatment: ['Recolectar frutos brocados caídos (Re-Re)', 'Trampas con alcohol etílico + metanol (1:1)', 'Aplicar Beauveria bassiana cuando la infestación supere 2%'],
    products: [{ name: 'Beauveria bassiana', type: 'orgánico' }, { name: 'Trampas artesanales (alcohol)', type: 'orgánico' }, { name: 'Endosulfán (restringido)', type: 'químico' }],
    prevention: ['Cosecha oportuna y completa (pepena)', 'No dejar frutos en el suelo', 'Registrar trampas cada 15 días', 'Beneficio húmedo de frutos brocados'],
  },
  {
    id: 'ojo_gallo', name: 'Ojo de gallo', scientificName: 'Mycena citricolor',
    parts: ['hojas', 'fruto'],
    symptoms: [
      { id: 'lesion_circular', label: 'Lesiones circulares bien definidas en las hojas', match: 35 },
      { id: 'centro_gris', label: 'Centro gris con borde oscuro definido', match: 30 },
      { id: 'caida_hojas', label: 'Caída prematura de hojas afectadas', match: 20 },
      { id: 'humedad_alta', label: 'Zona con humedad alta y poca ventilación', match: 15 },
    ],
    confidence: 0, riskLevel: 'medio',
    description: 'Hongo favorecido por sombra excesiva y alta humedad. Las lesiones circulares características dan nombre a la enfermedad. Puede reducir la fotosíntesis y debilitar la planta.',
    treatment: ['Reducir sombra excesiva (podar árboles de sombra)', 'Aplicar fungicida preventivo en temporada lluviosa', 'Mejorar drenaje y ventilación del cafetal'],
    products: [{ name: 'Caldo bordelés', type: 'orgánico' }, { name: 'Oxicloruro de cobre', type: 'químico' }],
    prevention: ['Regular sombra a 40-50%', 'Poda de formación y sanitaria', 'Mejorar circulación de aire'],
  },
  {
    id: 'antracnosis', name: 'Antracnosis', scientificName: 'Colletotrichum spp.',
    parts: ['hojas', 'fruto', 'tallo'],
    symptoms: [
      { id: 'manchas_oscuras', label: 'Manchas oscuras irregulares en hojas o frutos', match: 30 },
      { id: 'necrosis', label: 'Necrosis progresiva desde los bordes', match: 25 },
      { id: 'frutos_momificados', label: 'Frutos momificados o negros en la rama', match: 25 },
      { id: 'muerte_ramas', label: 'Muerte regresiva de ramas jóvenes', match: 20 },
    ],
    confidence: 0, riskLevel: 'medio',
    description: 'Hongo oportunista que ataca plantas debilitadas por estrés hídrico, nutricional o exceso de producción. Afecta hojas, frutos, ramas y puede causar muerte regresiva.',
    treatment: ['Poda sanitaria de ramas afectadas', 'Mejorar nutrición (especialmente potasio y calcio)', 'Aplicar fungicida sistémico si la severidad es alta'],
    products: [{ name: 'Clorotalonil', type: 'químico' }, { name: 'Bacillus subtilis', type: 'orgánico' }],
    prevention: ['Nutrición balanceada', 'Evitar estrés hídrico', 'Regular carga productiva'],
  },
  {
    id: 'mal_hilachas', name: 'Mal de hilachas', scientificName: 'Pellicularia koleroga',
    parts: ['hojas', 'tallo'],
    symptoms: [
      { id: 'micelio_blanco', label: 'Hilos o filamentos blancos entre las hojas', match: 40 },
      { id: 'hojas_pegadas', label: 'Hojas pegadas entre sí por micelio', match: 25 },
      { id: 'hojas_secas_colgadas', label: 'Hojas secas colgando de hilos fúngicos', match: 20 },
      { id: 'sombra_densa', label: 'Zona con sombra densa y muy húmeda', match: 15 },
    ],
    confidence: 0, riskLevel: 'bajo',
    description: 'Hongo que crece en condiciones de sombra excesiva y alta humedad. Se propaga mediante filamentos blancos visibles que unen las hojas. Generalmente no causa pérdidas severas si se maneja la sombra.',
    treatment: ['Podar urgentemente los árboles de sombra para aumentar ventilación', 'Remover ramas afectadas y destruir fuera de la parcela', 'Aplicar fungicida cúprico de forma localizada'],
    products: [{ name: 'Caldo bordelés', type: 'orgánico' }, { name: 'Sulfato de cobre', type: 'químico' }],
    prevention: ['Mantener sombra regulada (no más de 50%)', 'Poda frecuente del cafetal', 'Buen drenaje del suelo'],
  },
];

const steps = ['Triage', 'Síntomas', 'Resultado', 'Plan de acción'];

const bodyParts = [
  { id: 'hojas', label: 'Hojas', icon: Leaf, desc: 'Manchas, decoloración, caída' },
  { id: 'fruto', label: 'Fruto', icon: CircleDot, desc: 'Perforaciones, manchas, caída' },
  { id: 'tallo', label: 'Tallo / Raíz', icon: TreePine, desc: 'Necrosis, micelio, muerte' },
];

const historial = [
  { fecha: '2026-02-20', tipo: 'Broca detectada', parcela: 'El Mirador', severidad: 'alta' as const, estado: 'tratamiento' },
  { fecha: '2026-02-15', tipo: 'Roya leve', parcela: 'La Esperanza', severidad: 'media' as const, estado: 'monitoreo' },
  { fecha: '2026-02-10', tipo: 'Ojo de gallo', parcela: 'Cerro Verde', severidad: 'baja' as const, estado: 'resuelto' },
  { fecha: '2026-01-28', tipo: 'Antracnosis', parcela: 'El Mirador', severidad: 'media' as const, estado: 'resuelto' },
];

const sevStyles: Record<string, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-accent/10 text-accent border-accent/20',
  baja: 'bg-primary/10 text-primary border-primary/20',
  alto: 'bg-destructive/10 text-destructive border-destructive/20',
  medio: 'bg-accent/10 text-accent border-accent/20',
  bajo: 'bg-primary/10 text-primary border-primary/20',
};

const riskColors: Record<string, string> = {
  alto: 'text-destructive',
  medio: 'text-accent',
  bajo: 'text-primary',
};

export default function SanidadHub() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnosisResult, setDiagnosisResult] = useState<Disease | null>(null);

  // Get symptoms relevant to selected body part
  const relevantDiseases = diseases.filter((d) => selectedPart && d.parts.includes(selectedPart));
  const allSymptoms = relevantDiseases.flatMap((d) => d.symptoms);
  const uniqueSymptoms = allSymptoms.filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const runDiagnosis = () => {
    // Score each disease based on matched symptoms
    const scored = relevantDiseases.map((d) => {
      const totalMatch = d.symptoms
        .filter((s) => selectedSymptoms.includes(s.id))
        .reduce((sum, s) => sum + s.match, 0);
      return { ...d, confidence: Math.min(totalMatch, 95) };
    }).sort((a, b) => b.confidence - a.confidence);

    setDiagnosisResult(scored[0] || null);
    setCurrentStep(2);
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setSelectedPart(null);
    setSelectedSymptoms([]);
    setDiagnosisResult(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sanidad Vegetal</h1>
        <p className="text-sm text-muted-foreground">Diagnóstico y seguimiento de la salud de tus cultivos</p>
      </div>

      <Tabs defaultValue="guard">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="guard" className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Nova Guard</TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Historial</TabsTrigger>
        </TabsList>

        {/* ── NOVA GUARD ── */}
        <TabsContent value="guard" className="space-y-6 mt-4">
          {/* Header + stepper */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Nova Guard</h2>
                  <p className="text-sm text-muted-foreground">Diagnóstico Inteligente de Sanidad Vegetal</p>
                </div>
              </div>
              <div className="flex items-center gap-1 max-w-lg mx-auto">
                {steps.map((step, i) => (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`h-2 w-full rounded-full transition-colors ${i <= currentStep ? 'bg-primary' : 'bg-muted'}`} />
                    <span className={`text-[10px] ${i <= currentStep ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── STEP 0: TRIAGE ── */}
          {currentStep === 0 && (
            <>
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">¿Qué problema detectas hoy?</p>
                      <p className="text-xs text-muted-foreground">Selecciona la parte de la planta donde observas síntomas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                {bodyParts.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => { setSelectedPart(part.id); setSelectedSymptoms([]); }}
                    className={`p-5 rounded-xl border-2 transition-all hover:scale-[1.03] ${
                      selectedPart === part.id
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center ${selectedPart === part.id ? 'bg-primary/20' : 'bg-muted'}`}>
                        <part.icon className={`h-7 w-7 ${selectedPart === part.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{part.label}</span>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">{part.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedPart && (
                <div className="text-center">
                  <Button size="lg" onClick={() => setCurrentStep(1)}>
                    Continuar <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ── STEP 1: SYMPTOMS ── */}
          {currentStep === 1 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bug className="h-4 w-4 text-accent" />
                    ¿Qué síntomas observas en {selectedPart === 'hojas' ? 'las hojas' : selectedPart === 'fruto' ? 'los frutos' : 'el tallo/raíz'}?
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Selecciona todos los que apliquen</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {uniqueSymptoms.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => toggleSymptom(s.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedSymptoms.includes(s.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedSymptoms.includes(s.id) ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}>
                          {selectedSymptoms.includes(s.id) && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm text-foreground">{s.label}</span>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                </Button>
                <Button disabled={selectedSymptoms.length === 0} onClick={runDiagnosis}>
                  Analizar síntomas <Zap className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* ── STEP 2: RESULT ── */}
          {currentStep === 2 && diagnosisResult && (
            <>
              <Card className={`border-2 ${diagnosisResult.riskLevel === 'alto' ? 'border-destructive/30' : diagnosisResult.riskLevel === 'medio' ? 'border-accent/30' : 'border-primary/30'}`}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${sevStyles[diagnosisResult.riskLevel]}`}>
                        <AlertTriangle className={`h-6 w-6 ${riskColors[diagnosisResult.riskLevel]}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{diagnosisResult.name}</h3>
                        <p className="text-xs text-muted-foreground italic">{diagnosisResult.scientificName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{diagnosisResult.confidence}%</p>
                      <p className="text-xs text-muted-foreground">confianza</p>
                    </div>
                  </div>

                  <Progress value={diagnosisResult.confidence} className="h-2" />

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Nivel de riesgo:</span>
                    <Badge className={sevStyles[diagnosisResult.riskLevel]}>
                      {diagnosisResult.riskLevel.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{diagnosisResult.description}</p>
                </CardContent>
              </Card>

              {/* Interpretation box */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader><CardTitle className="text-base text-foreground">Interpretación Nova Silva</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Basado en los {selectedSymptoms.length} síntomas reportados en {selectedPart === 'hojas' ? 'las hojas' : selectedPart === 'fruto' ? 'los frutos' : 'el tallo/raíz'},
                    el motor de diagnóstico identifica <span className="font-bold text-foreground">{diagnosisResult.name}</span> como
                    la causa más probable con un nivel de confianza del <span className="font-bold text-foreground">{diagnosisResult.confidence}%</span>.
                  </p>
                  {diagnosisResult.riskLevel === 'alto' && (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                      <p className="text-xs font-semibold text-destructive">⚠ Acción inmediata requerida</p>
                      <p className="text-xs text-muted-foreground mt-1">Este problema puede causar pérdidas significativas si no se trata dentro de las próximas 48-72 horas.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Revisar síntomas
                </Button>
                <Button onClick={() => setCurrentStep(3)}>
                  Ver plan de acción <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* ── STEP 3: ACTION PLAN ── */}
          {currentStep === 3 && diagnosisResult && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" /> Tratamiento recomendado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {diagnosisResult.treatment.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <p className="text-sm text-foreground">{t}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-primary" /> Productos recomendados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {diagnosisResult.products.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      <Badge variant={p.type === 'orgánico' ? 'default' : 'secondary'}>{p.type}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-primary" /> Prevención
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {diagnosisResult.prevention.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                      {p}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Volver al resultado
                </Button>
                <Button onClick={resetWizard}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Nuevo diagnóstico
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── HISTORIAL ── */}
        <TabsContent value="historial" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><Bug className="h-4 w-4 text-destructive" /><span className="text-xs text-muted-foreground">Alertas Activas</span></div>
              <p className="text-2xl font-bold text-foreground">2</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><Shield className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Parcelas Monitoreadas</span></div>
              <p className="text-2xl font-bold text-foreground">3/3</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><Calendar className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Próximo Monitoreo</span></div>
              <p className="text-2xl font-bold text-foreground">1 Mar</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-accent" /> Historial de Diagnósticos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {historial.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.tipo} — {h.parcela}</p>
                    <p className="text-xs text-muted-foreground">{h.fecha}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={sevStyles[h.severidad]}>{h.severidad}</Badge>
                    <Badge variant={h.estado === 'resuelto' ? 'default' : 'secondary'}>{h.estado}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
