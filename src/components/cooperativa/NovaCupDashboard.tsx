import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  FlaskConical, Award, TrendingUp, Star, Plus, Coffee, Eye, BarChart3,
  GitCompare, Download, Beaker, Clock, MapPin, FileText, Play,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie,
} from 'recharts';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle, chartCursorStyle } from '@/lib/chartStyles';
import { toast } from 'sonner';

// ── SCA sensory attributes ──
const SCA_ATTRIBUTES = [
  'Fragancia/Aroma', 'Sabor', 'Post-gusto', 'Acidez', 'Cuerpo', 'Balance', 'Uniformidad', 'Taza Limpia', 'Dulzura'
];
const CVA_ATTRIBUTES = [
  'Floral', 'Frutal', 'Azucarado', 'Cacao/Nuez', 'Especias', 'Cereales', 'Vegetal', 'Amargo', 'Fermentado'
];

// Rueda de sabores
const FLAVOR_WHEEL: Record<string, string[]> = {
  'Frutal': ['Cítrico', 'Mandarina', 'Naranja', 'Limón', 'Cereza', 'Durazno', 'Manzana', 'Frutas rojas', 'Uva', 'Maracuyá'],
  'Floral': ['Jazmín', 'Rosa', 'Lavanda', 'Bergamota', 'Hibisco', 'Manzanilla'],
  'Dulce': ['Panela', 'Miel', 'Caramelo', 'Vainilla', 'Chocolate', 'Cacao', 'Melaza', 'Azúcar morena'],
  'Nuez/Cacao': ['Nuez', 'Almendra', 'Avellana', 'Maní', 'Cacao oscuro', 'Chocolate con leche'],
  'Especias': ['Canela', 'Clavo', 'Pimienta negra', 'Cardamomo', 'Jengibre', 'Nuez moscada'],
  'Herbáceo': ['Té negro', 'Té verde', 'Menta', 'Hierbas', 'Tabaco', 'Cedro'],
};

// ── Types ──
type SampleType = 'offer' | 'pss' | 'arrival';
const SAMPLE_LABELS: Record<SampleType, string> = { offer: 'Offer Sample', pss: 'Pre-Shipment (PSS)', arrival: 'Arrival Sample' };
const SAMPLE_COLORS: Record<SampleType, string> = { offer: 'hsl(var(--primary))', pss: 'hsl(var(--accent))', arrival: 'hsl(210, 60%, 50%)' };

type MuestraEstado = 'sin_evaluar' | 'en_proceso' | 'evaluada';

interface Muestra {
  id: string;
  codigo: string;
  tipoMuestra: SampleType;
  loteId: string;
  fechaToma: string;
  tomadaPor: string;
  metodoMuestreo: string;
  pesoGramos: number;
  ubicacionAlmacenamiento: string;
  notasInternas: string;
  estado: MuestraEstado;
  catacionId?: string;
}

interface Catacion {
  id: string; fecha: string; lote: string; productor: string;
  protocolo: 'SCA' | 'CVA'; puntaje: number; cat: string;
  atributos: Record<string, number>; descriptores: string[]; notas: string;
  sampleType: SampleType; muestraId?: string;
  defectos?: number; humedad?: number;
}

// ── Demo data: Muestras ──
const muestrasDemo: Muestra[] = [
  { id: 'm1', codigo: 'MQ-2026-001', tipoMuestra: 'offer', loteId: 'LOT-2026-023', fechaToma: '2026-02-22', tomadaPor: 'María García', metodoMuestreo: 'Aleatorio', pesoGramos: 250, ubicacionAlmacenamiento: 'Almacén A, Estante 3', notasInternas: 'Muestra representativa del lote completo', estado: 'evaluada', catacionId: '1' },
  { id: 'm2', codigo: 'MQ-2026-002', tipoMuestra: 'pss', loteId: 'LOT-2026-023', fechaToma: '2026-02-24', tomadaPor: 'María García', metodoMuestreo: 'Sistemático', pesoGramos: 300, ubicacionAlmacenamiento: 'Almacén A, Estante 3', notasInternas: 'Muestra pre-embarque para verificación', estado: 'evaluada', catacionId: '1b' },
  { id: 'm3', codigo: 'MQ-2026-003', tipoMuestra: 'offer', loteId: 'LOT-2026-045', fechaToma: '2026-02-21', tomadaPor: 'Carlos Pérez', metodoMuestreo: 'Aleatorio', pesoGramos: 250, ubicacionAlmacenamiento: 'Almacén B, Estante 1', notasInternas: '', estado: 'evaluada', catacionId: '2' },
  { id: 'm4', codigo: 'MQ-2026-004', tipoMuestra: 'offer', loteId: 'LOT-2026-018', fechaToma: '2026-02-19', tomadaPor: 'María García', metodoMuestreo: 'Aleatorio', pesoGramos: 200, ubicacionAlmacenamiento: 'Almacén A, Estante 5', notasInternas: 'Evaluar con protocolo CVA', estado: 'evaluada', catacionId: '3' },
  { id: 'm5', codigo: 'MQ-2026-005', tipoMuestra: 'offer', loteId: 'LOT-2026-032', fechaToma: '2026-02-17', tomadaPor: 'Carlos Pérez', metodoMuestreo: 'Aleatorio', pesoGramos: 250, ubicacionAlmacenamiento: 'Almacén B, Estante 2', notasInternas: '', estado: 'evaluada', catacionId: '4' },
  { id: 'm6', codigo: 'MQ-2026-006', tipoMuestra: 'offer', loteId: 'LOT-2026-055', fechaToma: '2026-03-01', tomadaPor: 'María García', metodoMuestreo: 'Aleatorio', pesoGramos: 300, ubicacionAlmacenamiento: 'Almacén A, Estante 1', notasInternas: 'Lote nuevo, prioridad alta', estado: 'sin_evaluar' },
  { id: 'm7', codigo: 'MQ-2026-007', tipoMuestra: 'pss', loteId: 'LOT-2026-045', fechaToma: '2026-03-02', tomadaPor: 'Carlos Pérez', metodoMuestreo: 'Sistemático', pesoGramos: 250, ubicacionAlmacenamiento: 'Almacén B, Estante 1', notasInternas: 'Pre-embarque lote Ortiz', estado: 'sin_evaluar' },
  { id: 'm8', codigo: 'MQ-2026-008', tipoMuestra: 'arrival', loteId: 'LOT-2026-011', fechaToma: '2026-03-03', tomadaPor: 'María García', metodoMuestreo: 'Aleatorio', pesoGramos: 200, ubicacionAlmacenamiento: 'Almacén C', notasInternas: 'Muestra de llegada a destino', estado: 'sin_evaluar' },
];

// ── Demo data: Cataciones ──
const catacionesDemo: Catacion[] = [
  { id: '1', fecha: '2026-02-23', lote: 'LOT-2026-023', productor: 'Carlos A. Muñoz', protocolo: 'SCA', puntaje: 87.25, cat: 'Specialty',
    atributos: { 'Fragancia/Aroma': 8.0, 'Sabor': 8.25, 'Post-gusto': 8.0, 'Acidez': 8.25, 'Cuerpo': 7.75, 'Balance': 7.0, 'Uniformidad': 10, 'Taza Limpia': 10, 'Dulzura': 10 },
    descriptores: ['Mandarina', 'Panela', 'Jazmín', 'Caramelo'], notas: 'Taza excepcional con acidez brillante', sampleType: 'offer', muestraId: 'm1', defectos: 0, humedad: 10.5 },
  { id: '1b', fecha: '2026-02-25', lote: 'LOT-2026-023', productor: 'Carlos A. Muñoz', protocolo: 'SCA', puntaje: 86.75, cat: 'Specialty',
    atributos: { 'Fragancia/Aroma': 8.0, 'Sabor': 8.0, 'Post-gusto': 7.75, 'Acidez': 8.25, 'Cuerpo': 7.75, 'Balance': 7.0, 'Uniformidad': 10, 'Taza Limpia': 10, 'Dulzura': 10 },
    descriptores: ['Mandarina', 'Panela', 'Caramelo'], notas: 'PSS consistente con oferta', sampleType: 'pss', muestraId: 'm2', defectos: 0, humedad: 10.8 },
  { id: '2', fecha: '2026-02-22', lote: 'LOT-2026-045', productor: 'María del C. Ortiz', protocolo: 'SCA', puntaje: 85.0, cat: 'Specialty',
    atributos: { 'Fragancia/Aroma': 7.75, 'Sabor': 8.0, 'Post-gusto': 7.5, 'Acidez': 8.0, 'Cuerpo': 7.75, 'Balance': 6.0, 'Uniformidad': 10, 'Taza Limpia': 10, 'Dulzura': 10 },
    descriptores: ['Chocolate', 'Nuez', 'Miel'], notas: 'Cuerpo sedoso, final prolongado', sampleType: 'offer', muestraId: 'm3', defectos: 1, humedad: 11.0 },
  { id: '3', fecha: '2026-02-20', lote: 'LOT-2026-018', productor: 'Ana L. Betancourt', protocolo: 'CVA', puntaje: 84.5, cat: 'Specialty',
    atributos: { 'Floral': 7, 'Frutal': 8, 'Azucarado': 7.5, 'Cacao/Nuez': 6, 'Especias': 5, 'Cereales': 4, 'Vegetal': 3, 'Amargo': 4, 'Fermentado': 2 },
    descriptores: ['Frutas rojas', 'Bergamota', 'Jazmín'], notas: 'CVA: perfil frutal dominante', sampleType: 'offer', muestraId: 'm4', defectos: 0, humedad: 10.2 },
  { id: '4', fecha: '2026-02-18', lote: 'LOT-2026-032', productor: 'José Hernández', protocolo: 'SCA', puntaje: 82.25, cat: 'Premium',
    atributos: { 'Fragancia/Aroma': 7.5, 'Sabor': 7.5, 'Post-gusto': 7.25, 'Acidez': 7.5, 'Cuerpo': 7.25, 'Balance': 5.25, 'Uniformidad': 10, 'Taza Limpia': 10, 'Dulzura': 10 },
    descriptores: ['Chocolate', 'Canela', 'Cereza'], notas: 'Balance sólido, acidez media', sampleType: 'offer', muestraId: 'm5', defectos: 2, humedad: 11.2 },
  { id: '5', fecha: '2026-02-15', lote: 'LOT-2026-011', productor: 'Rosa E. Castillo', protocolo: 'SCA', puntaje: 81.0, cat: 'Premium',
    atributos: { 'Fragancia/Aroma': 7.25, 'Sabor': 7.25, 'Post-gusto': 7.0, 'Acidez': 7.25, 'Cuerpo': 7.25, 'Balance': 5.0, 'Uniformidad': 10, 'Taza Limpia': 10, 'Dulzura': 10 },
    descriptores: ['Nuez', 'Vainilla', 'Caramelo'], notas: 'Cuerpo notable, acidez suave', sampleType: 'offer', defectos: 1, humedad: 11.5 },
  { id: '6', fecha: '2026-02-12', lote: 'LOT-2026-007', productor: 'Fernando Ruiz', protocolo: 'SCA', puntaje: 78.5, cat: 'Comercial',
    atributos: { 'Fragancia/Aroma': 7.0, 'Sabor': 7.0, 'Post-gusto': 6.75, 'Acidez': 7.0, 'Cuerpo': 6.75, 'Balance': 4.0, 'Uniformidad': 10, 'Taza Limpia': 10, 'Dulzura': 10 },
    descriptores: ['Chocolate', 'Panela'], notas: 'Taza limpia pero sin complejidad destacada', sampleType: 'offer', defectos: 3, humedad: 12.0 },
];

// ── Helpers ──
const catBadge = (cat: string) => {
  if (cat === 'Specialty') return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0">Specialty</Badge>;
  if (cat === 'Premium') return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">Premium</Badge>;
  return <Badge variant="secondary">Comercial</Badge>;
};

const sampleBadge = (s: SampleType) => {
  const cls: Record<SampleType, string> = {
    offer: 'bg-primary/10 text-primary border-primary/30',
    pss: 'bg-accent/10 text-accent border-accent/30',
    arrival: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300',
  };
  return <Badge variant="outline" className={cls[s]}>{SAMPLE_LABELS[s]}</Badge>;
};

const estadoMuestraBadge = (estado: MuestraEstado) => {
  if (estado === 'evaluada') return <Badge variant="default">Evaluada</Badge>;
  if (estado === 'en_proceso') return <Badge variant="secondary">En proceso</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Sin evaluar</Badge>;
};

// ── Chart data ──
const catDistribution = [
  { name: 'Specialty (>84)', value: 35, color: 'hsl(45, 90%, 50%)' },
  { name: 'Premium (80-84)', value: 40, color: 'hsl(210, 60%, 50%)' },
  { name: 'Comercial (<80)', value: 25, color: 'hsl(var(--muted-foreground))' },
];
const scoresByProducer = [
  { productor: 'C. Muñoz', puntaje: 87.25 },
  { productor: 'M. Ortiz', puntaje: 85.0 },
  { productor: 'A. Betancourt', puntaje: 84.5 },
  { productor: 'J. Hernández', puntaje: 82.25 },
  { productor: 'R. Castillo', puntaje: 81.0 },
  { productor: 'F. Ruiz', puntaje: 78.5 },
];
const descriptorFrequency = [
  { descriptor: 'Chocolate', count: 4 },
  { descriptor: 'Panela', count: 3 },
  { descriptor: 'Caramelo', count: 3 },
  { descriptor: 'Nuez', count: 2 },
  { descriptor: 'Mandarina', count: 2 },
  { descriptor: 'Jazmín', count: 2 },
  { descriptor: 'Cereza', count: 2 },
  { descriptor: 'Miel', count: 1 },
];

const kpis = [
  { label: 'Promedio SCA', value: '83.1', badge: 'Premium', icon: FlaskConical },
  { label: 'Muestras Pendientes', value: '3', badge: '', icon: Beaker },
  { label: 'Mejor Lote', value: 'LOT-023 — 87.25 pts', badge: '', icon: Award },
  { label: 'Specialty (>84)', value: '12 muestras (35%)', badge: '', icon: Star },
];

// ── Auto-generate muestra code ──
let codeCounter = 9;
const generateCode = () => `MQ-2026-${String(codeCounter++).padStart(3, '0')}`;

export default function NovaCupDashboard() {
  // ── State ──
  const [muestras, setMuestras] = useState<Muestra[]>(muestrasDemo);
  const [showNuevaMuestra, setShowNuevaMuestra] = useState(false);
  const [selectedMuestra, setSelectedMuestra] = useState<Muestra | null>(null);
  const [muestraForm, setMuestraForm] = useState({
    tipoMuestra: 'offer' as SampleType,
    codigo: '',
    fechaToma: new Date().toISOString().slice(0, 10),
    tomadaPor: '',
    metodoMuestreo: '',
    pesoGramos: '',
    ubicacionAlmacenamiento: '',
    notasInternas: '',
    loteId: '',
  });

  // Catación wizard
  const [showCataWizard, setShowCataWizard] = useState(false);
  const [cataTargetMuestra, setCataTargetMuestra] = useState<Muestra | null>(null);
  const [protocolo, setProtocolo] = useState<'SCA' | 'CVA'>('SCA');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [descriptoresSeleccionados, setDescriptoresSeleccionados] = useState<string[]>([]);
  const [cataForm, setCataForm] = useState({ productor: '', notas: '', defectos: 0, humedad: 0 });
  const [step, setStep] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Detail & compare
  const [selectedCata, setSelectedCata] = useState<Catacion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSamples, setCompareSamples] = useState<Catacion[]>([]);
  const [filterProtocolo, setFilterProtocolo] = useState<string>('all');
  const [filterCat, setFilterCat] = useState<string>('all');

  const attrs = protocolo === 'SCA' ? SCA_ATTRIBUTES : CVA_ATTRIBUTES;
  const totalScore = Object.values(scores).reduce((s, v) => s + v, 0);

  const filteredCataciones = useMemo(() =>
    catacionesDemo.filter(c => {
      if (filterProtocolo !== 'all' && c.protocolo !== filterProtocolo) return false;
      if (filterCat !== 'all' && c.cat !== filterCat) return false;
      return true;
    }), [filterProtocolo, filterCat]);

  const loteSamples = useMemo(() => {
    const map = new Map<string, Catacion[]>();
    catacionesDemo.forEach(c => {
      const arr = map.get(c.lote) || [];
      arr.push(c);
      map.set(c.lote, arr);
    });
    return map;
  }, []);

  // ── Muestra handlers ──
  const handleCrearMuestra = () => {
    const codigo = muestraForm.codigo || generateCode();
    if (!muestraForm.loteId.trim()) { toast.error('El ID de lote es requerido'); return; }
    if (!muestraForm.fechaToma) { toast.error('La fecha de toma es requerida'); return; }
    const nueva: Muestra = {
      id: `m-${Date.now()}`,
      codigo,
      tipoMuestra: muestraForm.tipoMuestra,
      loteId: muestraForm.loteId.trim(),
      fechaToma: muestraForm.fechaToma,
      tomadaPor: muestraForm.tomadaPor.trim() || 'Sin asignar',
      metodoMuestreo: muestraForm.metodoMuestreo.trim(),
      pesoGramos: Number(muestraForm.pesoGramos) || 0,
      ubicacionAlmacenamiento: muestraForm.ubicacionAlmacenamiento.trim(),
      notasInternas: muestraForm.notasInternas.trim(),
      estado: 'sin_evaluar',
    };
    setMuestras(prev => [nueva, ...prev]);
    toast.success(`Muestra ${codigo} creada exitosamente`);
    setShowNuevaMuestra(false);
    setMuestraForm({ tipoMuestra: 'offer', codigo: '', fechaToma: new Date().toISOString().slice(0, 10), tomadaPor: '', metodoMuestreo: '', pesoGramos: '', ubicacionAlmacenamiento: '', notasInternas: '', loteId: '' });
  };

  const startCatacion = (muestra: Muestra) => {
    setCataTargetMuestra(muestra);
    setProtocolo('SCA');
    setScores(Object.fromEntries(SCA_ATTRIBUTES.map(a => [a, 7.5])));
    setDescriptoresSeleccionados([]);
    setCataForm({ productor: '', notas: '', defectos: 0, humedad: 0 });
    setStep(0);
    setShowCataWizard(true);
  };

  const handleFinishCata = () => {
    if (!cataTargetMuestra) return;
    const cat = totalScore >= 84 ? 'Specialty' : totalScore >= 80 ? 'Premium' : 'Comercial';
    setMuestras(prev => prev.map(m => m.id === cataTargetMuestra.id ? { ...m, estado: 'evaluada' as MuestraEstado } : m));
    toast.success(`Catación completada: ${cataTargetMuestra.codigo} — ${totalScore.toFixed(1)} pts (${cat})`);
    setShowCataWizard(false);
    setCataTargetMuestra(null);
  };

  const toggleDescriptor = (d: string) => {
    setDescriptoresSeleccionados(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const toggleCompare = (c: Catacion) => {
    setCompareSamples(prev => {
      if (prev.find(x => x.id === c.id)) return prev.filter(x => x.id !== c.id);
      if (prev.length >= 3) { toast.error('Máximo 3 muestras para comparar'); return prev; }
      return [...prev, c];
    });
  };

  const radarData = selectedCata
    ? Object.entries(selectedCata.atributos).map(([key, val]) => ({ attr: key.length > 12 ? key.slice(0, 12) + '…' : key, value: val, fullMark: 10 }))
    : attrs.map(a => ({ attr: a.length > 10 ? a.slice(0, 10) + '…' : a, value: scores[a] || 0, fullMark: 10 }));

  const compareRadarData = useMemo(() => {
    if (compareSamples.length === 0) return [];
    const allKeys = Object.keys(compareSamples[0].atributos);
    return allKeys.map(key => {
      const entry: Record<string, any> = { attr: key.length > 10 ? key.slice(0, 10) + '…' : key, fullMark: 10 };
      compareSamples.forEach((s, i) => { entry[`sample${i}`] = s.atributos[key] || 0; });
      return entry;
    });
  }, [compareSamples]);

  // Muestras stats
  const muestrasPendientes = muestras.filter(m => m.estado === 'sin_evaluar').length;
  const muestrasEvaluadas = muestras.filter(m => m.estado === 'evaluada').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova Cup</h1>
          <p className="text-sm text-muted-foreground">Gestión de muestras, cataciones y parámetros físicos</p>
        </div>
        <div className="flex gap-2">
          <Button variant={compareMode ? 'default' : 'outline'} size="sm"
            title="Compara los perfiles sensoriales (radar) de 2–3 cataciones lado a lado"
            onClick={() => { setCompareMode(!compareMode); setCompareSamples([]); }}>
            <GitCompare className="h-4 w-4 mr-1" /> {compareMode ? 'Cancelar' : 'Comparar Cataciones'}
          </Button>
          <Button onClick={() => setShowNuevaMuestra(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nueva Muestra
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{k.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-foreground">{k.value}</p>
                {k.badge && <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">{k.badge}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="muestras" className="space-y-4">
        <TabsList>
          <TabsTrigger value="muestras"><Beaker className="h-4 w-4 mr-1" /> Muestras</TabsTrigger>
          <TabsTrigger value="cataciones"><FlaskConical className="h-4 w-4 mr-1" /> Cataciones</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1" /> Analítica</TabsTrigger>
          <TabsTrigger value="descriptores"><Coffee className="h-4 w-4 mr-1" /> Sabores</TabsTrigger>
          {compareMode && compareSamples.length >= 2 && (
            <TabsTrigger value="compare">Comparación ({compareSamples.length})</TabsTrigger>
          )}
        </TabsList>

        {/* Tab descriptions */}

        {/* ═══ TAB: MUESTRAS ═══ */}
        <TabsContent value="muestras" className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Registro físico de muestras tomadas del inventario. Cada muestra se puede evaluar sensorialmente para generar una catación.</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{muestrasPendientes}</span> pendientes de evaluación ·{' '}
              <span className="font-medium text-foreground">{muestrasEvaluadas}</span> evaluadas
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="px-4 py-3 font-medium">Código</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Lote</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Tomada Por</th>
                      <th className="px-4 py-3 font-medium">Peso</th>
                      <th className="px-4 py-3 font-medium">Ubicación</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Calidad</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {muestras.map(m => {
                      const cata = catacionesDemo.find(c => c.id === m.catacionId);
                      return (
                        <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-foreground">{m.codigo}</td>
                          <td className="px-4 py-3">{sampleBadge(m.tipoMuestra)}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{m.loteId}</td>
                          <td className="px-4 py-3 text-muted-foreground">{m.fechaToma}</td>
                          <td className="px-4 py-3 text-muted-foreground">{m.tomadaPor}</td>
                          <td className="px-4 py-3 text-muted-foreground">{m.pesoGramos}g</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{m.ubicacionAlmacenamiento || '—'}</td>
                          <td className="px-4 py-3">{estadoMuestraBadge(m.estado)}</td>
                          <td className="px-4 py-3">
                            {cata ? (
                              <span className="font-bold text-foreground">{cata.puntaje} pts</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin evaluar</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {m.estado === 'sin_evaluar' && (
                                <Button size="sm" variant="default" onClick={() => startCatacion(m)}>
                                  <Play className="h-3 w-3 mr-1" /> Evaluar
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => cata ? setSelectedCata(cata) : setSelectedMuestra(m)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: CATACIONES ═══ */}
        <TabsContent value="cataciones" className="space-y-4">
          <p className="text-xs text-muted-foreground">Evaluaciones sensoriales completadas. Cada catación contiene puntaje SCA/CVA, descriptores de sabor y notas del catador.</p>
          <div className="flex flex-wrap gap-3">
            <Select value={filterProtocolo} onValueChange={setFilterProtocolo}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Protocolo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="SCA">SCA</SelectItem>
                <SelectItem value="CVA">CVA</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Specialty">Specialty</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => toast.success('CSV exportado')}>
              <Download className="h-4 w-4 mr-1" /> Exportar
            </Button>
          </div>

          {compareMode && (
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
              <p className="text-sm text-foreground">Seleccione 2–3 muestras para comparar perfiles sensoriales.</p>
              {compareSamples.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {compareSamples.map(s => (
                    <Badge key={s.id} variant="outline" className="gap-1">
                      {s.lote} ({s.puntaje}) - {SAMPLE_LABELS[s.sampleType]}
                      <button onClick={() => toggleCompare(s)} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      {compareMode && <th className="px-3 py-3 w-10"></th>}
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Lote</th>
                      <th className="px-4 py-3 font-medium">Productor</th>
                      <th className="px-4 py-3 font-medium">Muestra</th>
                      <th className="px-4 py-3 font-medium">Protocolo</th>
                      <th className="px-4 py-3 font-medium">Puntaje</th>
                      <th className="px-4 py-3 font-medium">Categoría</th>
                      <th className="px-4 py-3 font-medium">Defectos</th>
                      <th className="px-4 py-3 font-medium">Humedad</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCataciones.map(c => (
                      <tr key={c.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${compareSamples.find(x => x.id === c.id) ? 'bg-primary/5' : ''}`}>
                        {compareMode && (
                          <td className="px-3 py-3">
                            <input type="checkbox" checked={!!compareSamples.find(x => x.id === c.id)} onChange={() => toggleCompare(c)} className="h-4 w-4 rounded border-border" />
                          </td>
                        )}
                        <td className="px-4 py-3 text-muted-foreground">{c.fecha}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{c.lote}</td>
                        <td className="px-4 py-3">{c.productor}</td>
                        <td className="px-4 py-3">{sampleBadge(c.sampleType)}</td>
                        <td className="px-4 py-3"><Badge variant="outline">{c.protocolo}</Badge></td>
                        <td className="px-4 py-3 font-bold">{c.puntaje}</td>
                        <td className="px-4 py-3">{catBadge(c.cat)}</td>
                        <td className="px-4 py-3 text-center">{c.defectos ?? '—'}</td>
                        <td className="px-4 py-3">{c.humedad ? `${c.humedad}%` : '—'}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCata(c)}><Eye className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Lote tracking */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary" /> Seguimiento por Lote (Oferta → PSS → Llegada)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(loteSamples.entries()).filter(([, s]) => s.length > 1).map(([lote, samples]) => {
                  const sorted = [...samples].sort((a, b) => {
                    const order: Record<SampleType, number> = { offer: 0, pss: 1, arrival: 2 };
                    return order[a.sampleType] - order[b.sampleType];
                  });
                  const delta = sorted[sorted.length - 1].puntaje - sorted[0].puntaje;
                  return (
                    <div key={lote} className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{lote}</span>
                        <Badge variant={delta >= 0 ? 'default' : 'destructive'} className="text-xs">
                          {delta >= 0 ? '+' : ''}{delta.toFixed(1)} pts
                        </Badge>
                      </div>
                      <div className="flex gap-3">
                        {sorted.map(s => (
                          <div key={s.id} className="flex items-center gap-2 text-sm">
                            {sampleBadge(s.sampleType)}
                            <span className="font-bold text-foreground">{s.puntaje}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: ANALYTICS ═══ */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Puntaje por Productor</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={scoresByProducer} layout="vertical">
                    <XAxis type="number" domain={[70, 90]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="category" dataKey="productor" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={90} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={chartCursorStyle} formatter={(v: number) => [`${v} pts`]} />
                    <Bar dataKey="puntaje" radius={[0, 4, 4, 0]}>
                      {scoresByProducer.map((d, i) => (
                        <Cell key={i} fill={d.puntaje >= 84 ? 'hsl(45, 90%, 50%)' : d.puntaje >= 80 ? 'hsl(210, 60%, 50%)' : 'hsl(var(--muted-foreground))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Distribución de Calidad</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={catDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                      {catDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => [`${v}%`]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" /> Frecuencia de Descriptores</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={descriptorFrequency}>
                  <XAxis dataKey="descriptor" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={chartCursorStyle} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Frecuencia" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: DESCRIPTORES ═══ */}
        <TabsContent value="descriptores" className="space-y-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Perfil de Sabores por Productor</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">Descriptores identificados en cataciones recientes, agrupados por categoría con los productores asociados.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(FLAVOR_WHEEL).map(([category, items]) => {
                  // Find descriptors that appear in cataciones and map to producers
                  const descriptorData = items
                    .map(d => ({
                      name: d,
                      producers: catacionesDemo
                        .filter(c => c.descriptores.includes(d))
                        .map(c => ({ nombre: c.productor, puntaje: c.puntaje, lote: c.lote })),
                    }))
                    .filter(d => d.producers.length > 0);

                  const isExpanded = expandedCategory === category;

                  return (
                    <div key={category}
                      className={`rounded-lg border transition-all cursor-pointer ${isExpanded ? 'border-primary bg-primary/5 col-span-1 md:col-span-2 lg:col-span-3' : 'border-border hover:border-primary/30'}`}
                      onClick={() => setExpandedCategory(isExpanded ? null : category)}>
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm text-foreground">{category}</span>
                          <p className="text-xs text-muted-foreground">
                            {descriptorData.length > 0
                              ? `${descriptorData.length} descriptores · ${new Set(descriptorData.flatMap(d => d.producers.map(p => p.nombre))).size} productores`
                              : 'Sin registros recientes'}
                          </p>
                        </div>
                        {descriptorData.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">{descriptorData.length}</Badge>
                        )}
                      </div>
                      {isExpanded && descriptorData.length > 0 && (
                        <div className="px-3 pb-3 space-y-2" onClick={e => e.stopPropagation()}>
                          {descriptorData.map(d => (
                            <div key={d.name} className="p-2.5 rounded-md border border-border bg-background">
                              <p className="text-sm font-medium text-foreground mb-1.5">{d.name}</p>
                              <div className="space-y-1">
                                {d.producers.map((p, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-foreground">{p.nombre}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">{p.lote}</span>
                                      <Badge variant="outline" className="text-[10px]">{p.puntaje} pts</Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {items.filter(d => !descriptorData.find(dd => dd.name === d)).length > 0 && (
                            <p className="text-xs text-muted-foreground pt-1">
                              Sin registros: {items.filter(d => !descriptorData.find(dd => dd.name === d)).join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                      {isExpanded && descriptorData.length === 0 && (
                        <div className="px-3 pb-3">
                          <p className="text-xs text-muted-foreground">Ningún descriptor de esta categoría ha sido registrado en cataciones recientes.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: COMPARE ═══ */}
        {compareMode && compareSamples.length >= 2 && (
          <TabsContent value="compare" className="space-y-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><GitCompare className="h-4 w-4 text-primary" /> Comparación de Perfiles Sensoriales</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={compareRadarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="attr" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <PolarRadiusAxis domain={[0, 10]} tick={false} />
                      {compareSamples.map((s, i) => (
                        <Radar key={s.id} dataKey={`sample${i}`} stroke={SAMPLE_COLORS[s.sampleType]}
                          fill={SAMPLE_COLORS[s.sampleType]} fillOpacity={0.1} strokeWidth={2}
                          name={`${s.lote} (${SAMPLE_LABELS[s.sampleType]})`} />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-3">
                  {compareSamples.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SAMPLE_COLORS[s.sampleType] }} />
                      <span className="text-foreground">{s.lote} ({SAMPLE_LABELS[s.sampleType]}) — {s.puntaje} pts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* ═══ NUEVA MUESTRA DIALOG ═══ */}
      <Dialog open={showNuevaMuestra} onOpenChange={setShowNuevaMuestra}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Muestra de Calidad</DialogTitle>
            <DialogDescription>Registra una nueva muestra para evaluación de calidad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Muestra <span className="text-destructive">*</span></Label>
                <Select value={muestraForm.tipoMuestra} onValueChange={(v) => setMuestraForm(s => ({ ...s, tipoMuestra: v as SampleType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offer">Offer Sample</SelectItem>
                    <SelectItem value="pss">Pre-Shipment (PSS)</SelectItem>
                    <SelectItem value="arrival">Arrival Sample</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Código de Muestra</Label>
                <Input placeholder="Auto-generado si se deja vacío" value={muestraForm.codigo}
                  onChange={e => setMuestraForm(s => ({ ...s, codigo: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>ID de Lote <span className="text-destructive">*</span></Label>
              <Input placeholder="Ej: LOT-2026-050" value={muestraForm.loteId}
                onChange={e => setMuestraForm(s => ({ ...s, loteId: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Toma <span className="text-destructive">*</span></Label>
                <Input type="date" value={muestraForm.fechaToma}
                  onChange={e => setMuestraForm(s => ({ ...s, fechaToma: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tomada Por</Label>
                <Input placeholder="María García" value={muestraForm.tomadaPor}
                  onChange={e => setMuestraForm(s => ({ ...s, tomadaPor: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Método de Muestreo</Label>
                <Input placeholder="Ej: Aleatorio, Sistemático" value={muestraForm.metodoMuestreo}
                  onChange={e => setMuestraForm(s => ({ ...s, metodoMuestreo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Peso (gramos)</Label>
                <Input type="number" placeholder="Ej: 250" value={muestraForm.pesoGramos}
                  onChange={e => setMuestraForm(s => ({ ...s, pesoGramos: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ubicación de Almacenamiento</Label>
              <Input placeholder="Ej: Almacén A, Estante 3" value={muestraForm.ubicacionAlmacenamiento}
                onChange={e => setMuestraForm(s => ({ ...s, ubicacionAlmacenamiento: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Notas Internas</Label>
              <Textarea placeholder="Observaciones o notas adicionales" value={muestraForm.notasInternas}
                onChange={e => setMuestraForm(s => ({ ...s, notasInternas: e.target.value }))} className="resize-y" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCrearMuestra}>Crear Muestra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CATACIÓN WIZARD ═══ */}
      <Dialog open={showCataWizard} onOpenChange={setShowCataWizard}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              {step === 0 ? 'Configurar Catación' : step === 1 ? 'Evaluación Sensorial' : step === 2 ? 'Rueda de Sabores' : 'Resultado Final'}
            </DialogTitle>
            {cataTargetMuestra && (
              <p className="text-xs text-muted-foreground">Muestra: {cataTargetMuestra.codigo} · Lote: {cataTargetMuestra.loteId}</p>
            )}
            <div className="flex gap-1 mt-2">
              {[0, 1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>
          </DialogHeader>

          {/* Step 0: Config */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Protocolo</Label>
                <Select value={protocolo} onValueChange={(v) => {
                  setProtocolo(v as 'SCA' | 'CVA');
                  const a = v === 'SCA' ? SCA_ATTRIBUTES : CVA_ATTRIBUTES;
                  setScores(Object.fromEntries(a.map(attr => [attr, v === 'SCA' ? 7.5 : 5])));
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCA">SCA Traditional (100 pts)</SelectItem>
                    <SelectItem value="CVA">CVA — Coffee Value Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Productor</Label>
                  <Input placeholder="Nombre" value={cataForm.productor}
                    onChange={e => setCataForm(s => ({ ...s, productor: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Humedad (%)</Label>
                  <Input type="number" min={0} step={0.1} value={cataForm.humedad}
                    onChange={e => setCataForm(s => ({ ...s, humedad: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Defectos (count)</Label>
                <Input type="number" min={0} value={cataForm.defectos}
                  onChange={e => setCataForm(s => ({ ...s, defectos: Number(e.target.value) }))} />
              </div>
              <Button className="w-full" onClick={() => setStep(1)}>Comenzar Evaluación →</Button>
            </div>
          )}

          {/* Step 1: Score inputs */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {protocolo === 'SCA' ? 'Ingrese cada atributo de 6.00 a 10.00. Uniformidad, Taza Limpia y Dulzura se califican sobre 10.' : 'Califique intensidad de 0 a 10'}
              </p>
              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-2">
                {attrs.map(attr => {
                  const isBooleanAttr = protocolo === 'SCA' && ['Uniformidad', 'Taza Limpia', 'Dulzura'].includes(attr);
                  const min = protocolo === 'SCA' ? (isBooleanAttr ? 0 : 6) : 0;
                  const max = 10;
                  const stepVal = protocolo === 'SCA' ? 0.25 : 0.5;
                  return (
                    <div key={attr} className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-0">
                      <span className="text-sm font-medium text-foreground min-w-0 flex-1">{attr}</span>
                      <Input
                        type="number"
                        min={min} max={max} step={stepVal}
                        value={scores[attr] ?? ''}
                        onChange={e => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v) && v >= min && v <= max) {
                            setScores(s => ({ ...s, [attr]: Number(v.toFixed(2)) }));
                          }
                        }}
                        className="w-20 text-center font-bold text-primary h-9"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={attrs.map(a => ({ attr: a.length > 10 ? a.slice(0, 10) + '…' : a, value: scores[a] || 0, fullMark: 10 }))}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="attr" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} />
                    <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Puntaje parcial</p>
                <p className="text-2xl font-bold text-foreground">{totalScore.toFixed(1)} pts</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)}>← Atrás</Button>
                <Button className="flex-1" onClick={() => setStep(2)}>Descriptores →</Button>
              </div>
            </div>
          )}

          {/* Step 2: Flavor wheel */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Seleccione los descriptores de sabor identificados.</p>
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2">
                {Object.entries(FLAVOR_WHEEL).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map(d => (
                        <button key={d} onClick={() => toggleDescriptor(d)}
                          className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                            descriptoresSeleccionados.includes(d) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-foreground border-border hover:border-primary/50'
                          }`}>{d}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {descriptoresSeleccionados.length > 0 && (
                <div className="p-2 rounded border border-primary/20 bg-primary/5">
                  <p className="text-xs text-muted-foreground mb-1">Seleccionados ({descriptoresSeleccionados.length}):</p>
                  <div className="flex flex-wrap gap-1">{descriptoresSeleccionados.map(d => <Badge key={d} className="text-xs">{d}</Badge>)}</div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Notas del catador</Label>
                <Textarea placeholder="Observaciones adicionales..." value={cataForm.notas}
                  onChange={e => setCataForm(s => ({ ...s, notas: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>← Atrás</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Ver Resultado →</Button>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center p-4">
                <p className="text-xs text-muted-foreground mb-1">Puntaje Final — {protocolo}</p>
                <p className="text-5xl font-bold text-foreground">{totalScore.toFixed(1)}</p>
                <div className="mt-2">{catBadge(totalScore >= 84 ? 'Specialty' : totalScore >= 80 ? 'Premium' : 'Comercial')}</div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={attrs.map(a => ({ attr: a.length > 10 ? a.slice(0, 10) + '…' : a, value: scores[a] || 0, fullMark: 10 }))}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="attr" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} />
                    <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {descriptoresSeleccionados.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Descriptores identificados</p>
                  <div className="flex flex-wrap gap-1.5">{descriptoresSeleccionados.map(d => <Badge key={d} variant="outline">{d}</Badge>)}</div>
                </div>
              )}
              <Card className="bg-muted/50">
                <CardContent className="pt-3 pb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Muestra:</span> <span className="font-medium text-foreground">{cataTargetMuestra?.codigo}</span></div>
                    <div><span className="text-muted-foreground">Lote:</span> <span className="font-medium text-foreground">{cataTargetMuestra?.loteId}</span></div>
                    <div><span className="text-muted-foreground">Protocolo:</span> <span className="font-medium text-foreground">{protocolo}</span></div>
                    <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium text-foreground">{cataTargetMuestra && SAMPLE_LABELS[cataTargetMuestra.tipoMuestra]}</span></div>
                    <div><span className="text-muted-foreground">Defectos:</span> <span className="font-medium text-foreground">{cataForm.defectos}</span></div>
                    <div><span className="text-muted-foreground">Humedad:</span> <span className="font-medium text-foreground">{cataForm.humedad}%</span></div>
                  </div>
                </CardContent>
              </Card>
              <Button className="w-full" onClick={handleFinishCata}>
                <Coffee className="h-4 w-4 mr-1" /> Guardar Catación
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ MUESTRA DETAIL DIALOG ═══ */}
      <Dialog open={!!selectedMuestra} onOpenChange={() => setSelectedMuestra(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalle de Muestra</DialogTitle></DialogHeader>
          {selectedMuestra && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Código:</span> <span className="font-mono font-medium text-foreground">{selectedMuestra.codigo}</span></div>
                <div><span className="text-muted-foreground">Tipo:</span> {sampleBadge(selectedMuestra.tipoMuestra)}</div>
                <div><span className="text-muted-foreground">Lote:</span> <span className="font-medium text-foreground">{selectedMuestra.loteId}</span></div>
                <div><span className="text-muted-foreground">Fecha:</span> <span className="text-foreground">{selectedMuestra.fechaToma}</span></div>
                <div><span className="text-muted-foreground">Tomada por:</span> <span className="text-foreground">{selectedMuestra.tomadaPor}</span></div>
                <div><span className="text-muted-foreground">Peso:</span> <span className="text-foreground">{selectedMuestra.pesoGramos}g</span></div>
                <div><span className="text-muted-foreground">Método:</span> <span className="text-foreground">{selectedMuestra.metodoMuestreo || '—'}</span></div>
                <div><span className="text-muted-foreground">Ubicación:</span> <span className="text-foreground">{selectedMuestra.ubicacionAlmacenamiento || '—'}</span></div>
              </div>
              {selectedMuestra.notasInternas && (
                <div className="p-3 rounded-lg border border-border bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Notas internas</p>
                  <p className="text-sm text-foreground">{selectedMuestra.notasInternas}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado:</span>
                {estadoMuestraBadge(selectedMuestra.estado)}
              </div>
              {selectedMuestra.estado === 'sin_evaluar' && (
                <Button className="w-full" onClick={() => { setSelectedMuestra(null); startCatacion(selectedMuestra); }}>
                  <Play className="h-4 w-4 mr-1" /> Iniciar Evaluación Sensorial
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ CATACIÓN DETAIL DIALOG ═══ */}
      <Dialog open={!!selectedCata} onOpenChange={() => setSelectedCata(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedCata && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-primary" /> {selectedCata.lote}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Otras muestras del mismo lote — ARRIBA para navegación rápida */}
                {(() => {
                  const siblings = catacionesDemo.filter(c => c.lote === selectedCata.lote && c.id !== selectedCata.id);
                  if (!siblings.length) return null;
                  return (
                    <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Otras muestras de este lote</p>
                      <div className="space-y-1.5">
                        {siblings.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-2 rounded border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedCata(s)}>
                            <div className="flex items-center gap-2">
                              {sampleBadge(s.sampleType)}
                              <span className="text-sm font-bold text-foreground">{s.puntaje} pts</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{s.fecha}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="text-center">
                  <p className="text-4xl font-bold text-foreground">{selectedCata.puntaje}</p>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    {catBadge(selectedCata.cat)}
                    {sampleBadge(selectedCata.sampleType)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{selectedCata.protocolo} | {selectedCata.fecha}</p>
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="attr" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <PolarRadiusAxis domain={[0, 10]} tick={false} />
                      <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Atributos</p>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    {Object.entries(selectedCata.atributos).map(([k, v]) => (
                      <div key={k} className="flex justify-between p-1.5 rounded border border-border">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-bold text-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Descriptores</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCata.descriptores.map(d => <Badge key={d} variant="outline">{d}</Badge>)}
                  </div>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="pt-3 pb-3">
                    <p className="text-xs text-muted-foreground">Notas del catador</p>
                    <p className="text-sm text-foreground">{selectedCata.notas}</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded border border-border">
                    <span className="text-muted-foreground">Productor:</span>
                    <p className="font-medium text-foreground">{selectedCata.productor}</p>
                  </div>
                  <div className="p-2 rounded border border-border">
                    <span className="text-muted-foreground">Defectos:</span>
                    <p className="font-medium text-foreground">{selectedCata.defectos ?? '—'}</p>
                  </div>
                </div>

                {/* Siblings moved to top of dialog */}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
