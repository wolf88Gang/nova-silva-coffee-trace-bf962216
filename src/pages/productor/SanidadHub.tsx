import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Leaf, Bug, TreePine, Eye, ArrowRight, ArrowLeft, CheckCircle,
  AlertTriangle, Calendar, Shield, Droplets, CircleDot,
  Zap, RotateCcw, Sprout, FlaskConical, ShieldAlert, Microscope, Send,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Disease database (biblia fitosanitaria) ──
interface Disease {
  id: string;
  name: string;
  scientificName: string;
  category: 'enfermedad' | 'plaga' | 'deficiencia';
  parts: string[];
  symptoms: { id: string; label: string; description: string; match: number }[];
  riskLevel: 'critico' | 'alto' | 'medio' | 'bajo';
  priority: string;
  description: string;
  immediateAction: string;
  treatment: { regenerativo: { nombre: string; receta: string; dosis: string; frecuencia: string; nota: string }; convencional: { nombre: string; dosis: string; frecuencia: string } };
  prevention: string[];
  earlyWarnings: string[];
}

const diseases: Disease[] = [
  {
    id: 'roya', name: 'Roya del Cafeto', scientificName: 'Hemileia vastatrix',
    category: 'enfermedad', parts: ['hojas'],
    symptoms: [
      { id: 'manchas_amarillas', label: 'Manchas amarillas en el envés de la hoja', description: 'Manchas circulares de 3-10mm de color amarillo-anaranjado en el envés', match: 30 },
      { id: 'polvo_naranja', label: 'Polvo anaranjado al tocar la mancha', description: 'Esporas del hongo que se desprenden al contacto', match: 30 },
      { id: 'defoliacion', label: 'Defoliación prematura', description: 'Caída masiva de hojas, especialmente las más viejas', match: 20 },
      { id: 'hojas_secas', label: 'Hojas secas o marchitas', description: 'Necrosis avanzada que seca toda la hoja', match: 10 },
      { id: 'zona_humeda', label: 'Zona con humedad alta y poca ventilación', description: 'Condiciones ambientales favorables para el hongo', match: 10 },
    ],
    riskLevel: 'critico', priority: 'Prioridad Crítica. Enfermedad sistémica más devastadora del café. Requiere intervención inmediata si la incidencia supera el 5%.',
    description: 'Hongo que afecta hojas causando defoliación severa y pérdida de producción hasta 50%. Es la enfermedad más destructiva del café en América Latina.',
    immediateAction: 'Reportar a la cooperativa para alerta epidemiológica regional',
    treatment: {
      regenerativo: { nombre: 'Caldo Bordelés', receta: 'Mezclar 1kg de sulfato de cobre + 1kg de cal viva en 100L de agua. Primero disolver el sulfato, luego agregar la cal diluida.', dosis: '400-600 L/ha según densidad de siembra', frecuencia: 'Cada 15-21 días durante período de lluvias', nota: 'Aplicar en horas frescas. No mezclar con otros productos. El pH final debe ser neutro (prueba con clavo).' },
      convencional: { nombre: 'Cyproconazole (Triazol)', dosis: '0.5-0.75 L/ha', frecuencia: 'Cada 30-45 días, máximo 3 aplicaciones por ciclo' },
    },
    prevention: ['Mantener sombra regulada entre 40-60%', 'Podar plantas para mejorar circulación de aire', 'Eliminar hojas caídas infectadas', 'Fertilización balanceada (evitar exceso de nitrógeno)', 'Densidad de siembra adecuada'],
    earlyWarnings: ['Pequeños puntos amarillentos en el envés de hojas', 'Polvo anaranjado al frotar las manchas', 'Hojas más viejas afectadas primero', 'Mayor incidencia después de lluvias prolongadas'],
  },
  {
    id: 'broca', name: 'Broca del Café', scientificName: 'Hypothenemus hampei',
    category: 'plaga', parts: ['fruto'],
    symptoms: [
      { id: 'perforacion_fruto', label: 'Perforación circular en la base del fruto', description: 'Orificio de entrada de ~1mm de diámetro en la corona del fruto', match: 35 },
      { id: 'aserrin', label: 'Aserrín o polvo fino en la entrada del agujero', description: 'Residuos de la perforación visible en la base del fruto', match: 25 },
      { id: 'frutos_caidos', label: 'Frutos caídos prematuramente', description: 'Frutos verdes o maduros que caen antes de la cosecha', match: 20 },
      { id: 'granos_danados', label: 'Granos internos dañados o con galerías', description: 'Al abrir el fruto se ven galerías y larvas dentro del grano', match: 20 },
    ],
    riskLevel: 'critico', priority: 'Prioridad Crítica. La plaga más importante del café a nivel mundial. Puede causar pérdidas del 30-80%.',
    description: 'Insecto barrenador que perfora el fruto del café y destruye el grano. Es la plaga más importante del café a nivel mundial.',
    immediateAction: 'Iniciar trampeo y recolección de frutos brocados (Re-Re) de inmediato',
    treatment: {
      regenerativo: { nombre: 'Beauveria bassiana', receta: 'Preparar suspensión de 2×10⁹ conidias/ml. Aplicar con bomba de espalda dirigido a los frutos.', dosis: '2-3 kg/ha de formulado comercial', frecuencia: 'Cada 15-21 días cuando infestación supera 2%', nota: 'Aplicar en horas frescas y con alta humedad. No mezclar con fungicidas.' },
      convencional: { nombre: 'Clorpirifos (restringido)', dosis: '1.5-2 L/ha', frecuencia: 'Máximo 2 aplicaciones por ciclo' },
    },
    prevention: ['Cosecha oportuna y completa (pepena)', 'No dejar frutos en el suelo', 'Instalar trampas con alcohol etílico + metanol (1:1)', 'Registrar trampas cada 15 días', 'Beneficio húmedo de frutos brocados'],
    earlyWarnings: ['Frutos con perforaciones en la corona', 'Presencia de aserrín fino en frutos', 'Trampas con captura mayor a 0.5 brocas/trampa/día', 'Frutos maduros cayendo prematuramente'],
  },
  {
    id: 'ojo_gallo', name: 'Ojo de Gallo', scientificName: 'Mycena citricolor',
    category: 'enfermedad', parts: ['hojas', 'fruto'],
    symptoms: [
      { id: 'lesion_circular', label: 'Lesiones circulares bien definidas en las hojas', description: 'Manchas redondas de 5-15mm con borde oscuro', match: 35 },
      { id: 'centro_gris', label: 'Centro gris con borde oscuro definido', description: 'La lesión madura tiene centro grisáceo con halo oscuro', match: 25 },
      { id: 'caida_hojas', label: 'Caída prematura de hojas afectadas', description: 'Defoliación parcial de ramas bajeras', match: 20 },
      { id: 'humedad_alta', label: 'Zona con humedad alta y poca ventilación', description: 'Microclima húmedo y sombreado', match: 20 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Monitorear evolución y ajustar sombra.',
    description: 'Hongo favorecido por sombra excesiva y alta humedad. Las lesiones circulares dan nombre a la enfermedad.',
    immediateAction: 'Evaluar porcentaje de sombra y planificar poda de regulación',
    treatment: {
      regenerativo: { nombre: 'Caldo Bordelés', receta: 'Misma preparación que para roya. Aplicar de forma preventiva.', dosis: '400-600 L/ha', frecuencia: 'Cada 21-30 días en temporada lluviosa', nota: 'Combinar con regulación de sombra para mayor efectividad.' },
      convencional: { nombre: 'Oxicloruro de cobre', dosis: '2-3 kg/ha', frecuencia: 'Cada 21-30 días' },
    },
    prevention: ['Regular sombra a 40-50%', 'Poda de formación y sanitaria', 'Mejorar circulación de aire', 'Evitar exceso de humedad en el suelo'],
    earlyWarnings: ['Pequeñas lesiones circulares en hojas bajeras', 'Zonas del cafetal con sombra excesiva (>60%)', 'Períodos prolongados de lluvia con neblina'],
  },
  {
    id: 'antracnosis', name: 'Antracnosis', scientificName: 'Colletotrichum spp.',
    category: 'enfermedad', parts: ['hojas', 'fruto', 'tallo'],
    symptoms: [
      { id: 'manchas_oscuras', label: 'Manchas oscuras irregulares en hojas o frutos', description: 'Manchas necróticas de forma irregular', match: 25 },
      { id: 'necrosis', label: 'Necrosis progresiva desde los bordes', description: 'Muerte del tejido que avanza desde las puntas hacia el centro', match: 25 },
      { id: 'frutos_momificados', label: 'Frutos momificados o negros en la rama', description: 'Frutos que se secan y oscurecen sin caer', match: 25 },
      { id: 'muerte_ramas', label: 'Muerte regresiva de ramas jóvenes', description: 'Las puntas de las ramas se secan progresivamente', match: 25 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Asociada a estrés nutricional o hídrico. Corregir causa raíz.',
    description: 'Hongo oportunista que ataca plantas debilitadas por estrés hídrico, nutricional o exceso de producción.',
    immediateAction: 'Realizar análisis foliar y de suelo para identificar deficiencias',
    treatment: {
      regenerativo: { nombre: 'Bacillus subtilis', receta: 'Aplicar formulado comercial en aspersión foliar.', dosis: '2-3 L/ha', frecuencia: 'Cada 15-21 días', nota: 'Complementar con nutrición foliar (K, Ca, B).' },
      convencional: { nombre: 'Clorotalonil', dosis: '1.5-2 L/ha', frecuencia: 'Cada 21-30 días' },
    },
    prevention: ['Nutrición balanceada especialmente K y Ca', 'Evitar estrés hídrico', 'Regular carga productiva', 'Poda sanitaria oportuna'],
    earlyWarnings: ['Manchas oscuras en puntas de ramas nuevas', 'Frutos que empiezan a oscurecerse', 'Plantas con signos de estrés nutricional'],
  },
  {
    id: 'mal_hilachas', name: 'Mal de Hilachas', scientificName: 'Pellicularia koleroga',
    category: 'enfermedad', parts: ['hojas', 'tallo'],
    symptoms: [
      { id: 'micelio_blanco', label: 'Hilos o filamentos blancos entre las hojas', description: 'Red de micelio blanco visible uniendo hojas', match: 40 },
      { id: 'hojas_pegadas', label: 'Hojas pegadas entre sí por micelio', description: 'Grupos de hojas adheridas por hilos fúngicos', match: 25 },
      { id: 'hojas_secas_colgadas', label: 'Hojas secas colgando de hilos fúngicos', description: 'Hojas muertas que no caen por estar sostenidas por el micelio', match: 20 },
      { id: 'sombra_densa', label: 'Zona con sombra densa y muy húmeda', description: 'Exceso de sombra y humedad persistente', match: 15 },
    ],
    riskLevel: 'bajo', priority: 'Prioridad Baja. Manejo cultural con regulación de sombra resuelve la mayoría de los casos.',
    description: 'Hongo que crece en condiciones de sombra excesiva y alta humedad. Se propaga mediante filamentos blancos visibles.',
    immediateAction: 'Programar poda urgente de árboles de sombra en la zona afectada',
    treatment: {
      regenerativo: { nombre: 'Caldo Bordelés + poda', receta: 'Aplicar después de podar ramas afectadas y regular sombra.', dosis: '400 L/ha', frecuencia: 'Una aplicación después de la poda', nota: 'La regulación de sombra es más importante que el producto.' },
      convencional: { nombre: 'Sulfato de cobre', dosis: '2 kg/ha', frecuencia: 'Una aplicación localizada' },
    },
    prevention: ['Mantener sombra regulada (no más de 50%)', 'Poda frecuente del cafetal', 'Buen drenaje del suelo', 'Eliminar material vegetal infectado'],
    earlyWarnings: ['Filamentos blancos tenues en ramas bajeras', 'Hojas que empiezan a adherirse entre sí', 'Zonas del cafetal con sombra >65%'],
  },
];

const riskConfig = {
  critico: { label: 'Severidad CRÍTICA', badge: 'bg-destructive text-destructive-foreground', card: 'border-destructive/50 bg-destructive/5', icon: 'text-destructive' },
  alto: { label: 'Severidad ALTA', badge: 'bg-destructive/80 text-destructive-foreground', card: 'border-destructive/30 bg-destructive/5', icon: 'text-destructive' },
  medio: { label: 'Severidad MEDIA', badge: 'bg-accent text-accent-foreground', card: 'border-accent/30 bg-accent/5', icon: 'text-accent' },
  bajo: { label: 'Severidad BAJA', badge: 'bg-primary text-primary-foreground', card: 'border-primary/30 bg-primary/5', icon: 'text-primary' },
};

const categoryOptions = [
  { id: 'enfermedad', label: 'Enfermedad', desc: 'Manchas, hongos, bacterias, virus', icon: Microscope, color: 'bg-purple-500/10 border-purple-500/30' },
  { id: 'plaga', label: 'Plaga', desc: 'Insectos, ácaros, daños físicos', icon: Bug, color: 'bg-orange-500/10 border-orange-500/30' },
  { id: 'deficiencia', label: 'Deficiencia Nutricional', desc: 'Amarillamiento, deformaciones, necrosis', icon: FlaskConical, color: 'bg-yellow-500/10 border-yellow-500/30' },
];

const bodyParts = [
  { id: 'hojas', label: 'Hojas', icon: Leaf, desc: 'Manchas, decoloración, caída' },
  { id: 'fruto', label: 'Fruto', icon: CircleDot, desc: 'Perforaciones, manchas, caída' },
  { id: 'tallo', label: 'Tallo / Raíz', icon: TreePine, desc: 'Necrosis, micelio, muerte' },
];

type SymptomAppearance = 'manchas' | 'polvillo' | 'quemadura' | null;
const appearanceOptions = [
  { id: 'manchas', label: 'Manchas circulares o irregulares', desc: 'Manchas bien definidas de cualquier color', icon: CircleDot },
  { id: 'polvillo', label: 'Polvillo, moho o sustancia sobre la superficie', desc: 'Polvo, capa o sustancia visible', icon: Sprout },
  { id: 'quemadura', label: 'Quemadura o secado desde los bordes', desc: 'Tejido seco que avanza hacia el centro', icon: AlertTriangle },
];

const historial = [
  { fecha: '2026-02-20', tipo: 'Broca detectada', parcela: 'El Mirador', severidad: 'critico' as const, estado: 'tratamiento' },
  { fecha: '2026-02-15', tipo: 'Roya leve', parcela: 'La Esperanza', severidad: 'medio' as const, estado: 'monitoreo' },
  { fecha: '2026-02-10', tipo: 'Ojo de gallo', parcela: 'Cerro Verde', severidad: 'bajo' as const, estado: 'resuelto' },
  { fecha: '2026-01-28', tipo: 'Antracnosis', parcela: 'El Mirador', severidad: 'medio' as const, estado: 'resuelto' },
];

const steps = ['Triage', 'Análisis', 'Resultado', 'Acción'];

export default function SanidadHub() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAppearance, setSelectedAppearance] = useState<SymptomAppearance>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnosisResult, setDiagnosisResult] = useState<Disease | null>(null);
  const [treatmentTab, setTreatmentTab] = useState<'regenerativo' | 'convencional'>('regenerativo');
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false);
  const [resolved, setResolved] = useState(false);

  const relevantDiseases = diseases.filter(d =>
    (!selectedPart || d.parts.includes(selectedPart)) &&
    (!selectedCategory || d.category === selectedCategory)
  );
  const allSymptoms = relevantDiseases.flatMap(d => d.symptoms);
  const uniqueSymptoms = allSymptoms.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);

  const toggleSymptom = (id: string) => setSelectedSymptoms(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const runDiagnosis = () => {
    const scored = relevantDiseases.map(d => {
      const totalMatch = d.symptoms.filter(s => selectedSymptoms.includes(s.id)).reduce((sum, s) => sum + s.match, 0);
      return { ...d, confidence: Math.min(totalMatch, 95) };
    }).sort((a, b) => b.confidence - a.confidence);
    setDiagnosisResult(scored[0] ? { ...scored[0] } : null);
    setCurrentStep(2);
  };

  const resetWizard = () => {
    setCurrentStep(0); setSelectedPart(null); setSelectedCategory(null);
    setSelectedAppearance(null); setSelectedSymptoms([]); setDiagnosisResult(null);
    setShowTreatmentDialog(false); setResolved(false);
  };

  const confidence = diagnosisResult ? Math.min(
    diagnosisResult.symptoms.filter(s => selectedSymptoms.includes(s.id)).reduce((sum, s) => sum + s.match, 0), 95
  ) : 0;

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

        <TabsContent value="guard" className="space-y-6 mt-4">
          {/* Header */}
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
              {/* Quick report */}
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center"><Eye className="h-5 w-5 text-accent" /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">¿Viste algo raro?</p>
                        <p className="text-xs text-muted-foreground">Reportar sospecha o indicio sin diagnóstico completo</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toast.info('Reporte rápido enviado a tu técnico asignado')}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-foreground">¿Qué problema detectas hoy?</h3>
                <p className="text-sm text-muted-foreground">Selecciona el área donde observas síntomas</p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                {bodyParts.map(part => (
                  <button key={part.id} onClick={() => { setSelectedPart(part.id); setSelectedSymptoms([]); setSelectedCategory(null); setSelectedAppearance(null); }}
                    className={`p-5 rounded-xl border-2 transition-all hover:scale-[1.03] ${selectedPart === part.id ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-card hover:border-primary/50'}`}>
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

          {/* ── STEP 1: ANALYSIS (multi-sub-step) ── */}
          {currentStep === 1 && (
            <>
              {/* Sub-step: Problem type */}
              {!selectedCategory && (
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-foreground">¿Qué tipo de problema sospechas?</h3>
                      <p className="text-sm text-muted-foreground">Esto nos ayuda a orientar mejor el diagnóstico</p>
                    </div>
                    <div className="space-y-3 max-w-lg mx-auto">
                      {categoryOptions.map(cat => (
                        <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:scale-[1.01] ${cat.color} hover:shadow-md`}>
                          <div className="h-12 w-12 rounded-full bg-card flex items-center justify-center shrink-0">
                            <cat.icon className="h-6 w-6 text-foreground" />
                          </div>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-foreground">{cat.label}</p>
                            <p className="text-xs text-muted-foreground">{cat.desc}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                    <div className="text-center">
                      <Button variant="outline" onClick={() => { setCurrentStep(0); setSelectedCategory(null); }}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sub-step: Appearance (for hojas) */}
              {selectedCategory && selectedPart === 'hojas' && !selectedAppearance && (
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-foreground">¿Cuál es la apariencia predominante de la lesión en la hoja?</h3>
                      <p className="text-sm text-muted-foreground">Observe cuidadosamente la hoja afectada</p>
                    </div>
                    <div className="space-y-3 max-w-lg mx-auto">
                      {appearanceOptions.map(opt => (
                        <button key={opt.id} onClick={() => setSelectedAppearance(opt.id as SymptomAppearance)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all">
                          <opt.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="text-left flex-1">
                            <p className="font-semibold text-foreground">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sub-step: Symptom selection */}
              {selectedCategory && (selectedPart !== 'hojas' || selectedAppearance) && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (selectedPart === 'hojas') setSelectedAppearance(null);
                        else setSelectedCategory(null);
                      }}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                      </Button>
                    </div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-accent" />
                      ¿Qué síntomas observas?
                    </h3>
                    <p className="text-xs text-muted-foreground">Selecciona todos los que apliquen — más síntomas = diagnóstico más preciso</p>

                    <div className="space-y-2">
                      {uniqueSymptoms.map(s => (
                        <button key={s.id} onClick={() => toggleSymptom(s.id)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${selectedSymptoms.includes(s.id)
                            ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedSymptoms.includes(s.id) ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                              {selectedSymptoms.includes(s.id) && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">{s.label}</span>
                              <p className="text-xs text-muted-foreground">{s.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <Button disabled={selectedSymptoms.length === 0} onClick={runDiagnosis} size="lg">
                        Analizar síntomas <Zap className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ── STEP 2: RESULT ── */}
          {currentStep === 2 && diagnosisResult && (
            <>
              <Card className={`border-2 ${riskConfig[diagnosisResult.riskLevel].card}`}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={riskConfig[diagnosisResult.riskLevel].badge}>{riskConfig[diagnosisResult.riskLevel].label}</Badge>
                      {diagnosisResult.riskLevel === 'critico' && <Badge variant="destructive">ALERTA</Badge>}
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-foreground">{confidence}%</span>
                      <span className="text-sm text-muted-foreground ml-1">Confianza</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs tracking-widest text-muted-foreground uppercase">Diagnóstico Probable</p>
                    <h3 className="text-2xl font-bold text-foreground">{diagnosisResult.name}</h3>
                    <p className="text-sm italic text-muted-foreground">{diagnosisResult.scientificName}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted border border-border">
                    <p className="text-sm text-muted-foreground">{diagnosisResult.priority}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1" size="lg" onClick={() => { setShowTreatmentDialog(true); setCurrentStep(3); }}>
                  <Sprout className="h-4 w-4 mr-1" /> Guardar y Ver Plan de Tratamiento
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(1)}><ArrowLeft className="h-4 w-4 mr-1" /> Mi Historial</Button>
                <Button variant="outline" onClick={() => toast.info('Función de tienda próximamente')}>Tienda</Button>
              </div>
            </>
          )}

          {/* ── STEP 3: ACTION PLAN (Treatment Dialog) ── */}
          {currentStep === 3 && diagnosisResult && (
            <Dialog open={showTreatmentDialog} onOpenChange={(o) => { if (!o) { setShowTreatmentDialog(false); } }}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-primary" /> Tu Plan de Tratamiento
                  </DialogTitle>
                  <p className="text-sm italic text-muted-foreground">{diagnosisResult.name} ({diagnosisResult.scientificName})</p>
                </DialogHeader>

                <Accordion type="multiple" defaultValue={['accion', 'tratamiento', 'prevencion', 'indicios']} className="space-y-3">
                  {/* Immediate Action */}
                  <AccordionItem value="accion" className="border border-accent/30 rounded-lg bg-accent/5 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-accent" />
                        <span className="font-semibold text-accent">Acción Inmediata</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">{diagnosisResult.immediateAction}</p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Treatment */}
                  <AccordionItem value="tratamiento" className="border border-border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">Tratamiento</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant={treatmentTab === 'regenerativo' ? 'default' : 'outline'}
                          onClick={() => setTreatmentTab('regenerativo')}>
                          <Sprout className="h-3.5 w-3.5 mr-1" /> Regenerativo
                        </Button>
                        <Button size="sm" variant={treatmentTab === 'convencional' ? 'default' : 'outline'}
                          onClick={() => setTreatmentTab('convencional')}>
                          <FlaskConical className="h-3.5 w-3.5 mr-1" /> Convencional
                        </Button>
                      </div>
                      {treatmentTab === 'regenerativo' ? (
                        <div className="space-y-2">
                          <p className="font-semibold text-foreground">{diagnosisResult.treatment.regenerativo.nombre}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Receta:</span> {diagnosisResult.treatment.regenerativo.receta}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Dosis:</span> {diagnosisResult.treatment.regenerativo.dosis}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Frecuencia:</span> {diagnosisResult.treatment.regenerativo.frecuencia}</p>
                          <p className="text-xs text-primary italic">💡 {diagnosisResult.treatment.regenerativo.nota}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-semibold text-foreground">{diagnosisResult.treatment.convencional.nombre}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Dosis:</span> {diagnosisResult.treatment.convencional.dosis}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Frecuencia:</span> {diagnosisResult.treatment.convencional.frecuencia}</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Prevention */}
                  <AccordionItem value="prevencion" className="border border-border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">Prevención</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {diagnosisResult.prevention.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />{p}
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Early Warnings */}
                  <AccordionItem value="indicios" className="border border-primary/20 rounded-lg bg-primary/5 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">Indicios Tempranos</span>
                        <span className="text-xs text-muted-foreground">(qué buscar mañana)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {diagnosisResult.earlyWarnings.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-accent shrink-0" />{w}
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Mark as resolved */}
                <Button className="w-full mt-4" variant={resolved ? 'outline' : 'default'}
                  onClick={() => { setResolved(true); toast.success('Diagnóstico marcado como resuelto. Se notificará a la cooperativa.'); setShowTreatmentDialog(false); resetWizard(); }}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Marcar como Resuelto
                </Button>
                <p className="text-xs text-muted-foreground text-center">Esto notificará a la cooperativa que el foco ha sido controlado</p>
              </DialogContent>
            </Dialog>
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
                    <Badge className={riskConfig[h.severidad]?.badge}>{h.severidad}</Badge>
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
