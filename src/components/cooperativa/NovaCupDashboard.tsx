import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { FlaskConical, Award, TrendingUp, Star, Plus, Coffee, Eye } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

// ── SCA sensory attributes ──
const SCA_ATTRIBUTES = [
  'Fragancia/Aroma', 'Sabor', 'Post-gusto', 'Acidez', 'Cuerpo', 'Balance', 'Uniformidad', 'Taza Limpia', 'Dulzura'
];
const CVA_ATTRIBUTES = [
  'Floral', 'Frutal', 'Azucarado', 'Cacao/Nuez', 'Especias', 'Cereales', 'Vegetal', 'Amargo', 'Fermentado'
];
const DESCRIPTORES = [
  'Chocolate', 'Panela', 'Mandarina', 'Floral', 'Caramelo', 'Cítrico', 'Frutas rojas', 'Miel',
  'Nuez', 'Vainilla', 'Canela', 'Bergamota', 'Jazmín', 'Durazno', 'Naranja', 'Cereza'
];

interface Catacion {
  id: string; fecha: string; lote: string; productor: string;
  protocolo: 'SCA' | 'CVA'; puntaje: number; cat: string;
  atributos: Record<string, number>; descriptores: string[]; notas: string;
}

const catacionesDemo: Catacion[] = [
  { id: '1', fecha: '2026-02-23', lote: 'LOT-2026-023', productor: 'Carlos A. Muñoz', protocolo: 'SCA', puntaje: 87.2, cat: 'Specialty',
    atributos: { 'Fragancia/Aroma': 8.5, 'Sabor': 8.75, 'Post-gusto': 8.5, 'Acidez': 8.75, 'Cuerpo': 8.25, 'Balance': 8.5, 'Uniformidad': 10, 'Taza Limpia': 10, 'Dulzura': 10 },
    descriptores: ['Mandarina', 'Panela', 'Floral', 'Caramelo'], notas: 'Taza excepcional con acidez brillante' },
  { id: '2', fecha: '2026-02-22', lote: 'LOT-2026-045', productor: 'María del C. Ortiz', protocolo: 'SCA', puntaje: 85.1, cat: 'Specialty',
    atributos: { 'Fragancia/Aroma': 8.25, 'Sabor': 8.5, 'Post-gusto': 8.0, 'Acidez': 8.5, 'Cuerpo': 8.25, 'Balance': 8.25, 'Uniformidad': 10, 'Taza Limpia': 10, 'Dulzura': 10 },
    descriptores: ['Chocolate', 'Nuez', 'Miel'], notas: 'Cuerpo sedoso, final prolongado' },
  { id: '3', fecha: '2026-02-20', lote: 'LOT-2026-018', productor: 'Ana L. Betancourt', protocolo: 'CVA', puntaje: 84.5, cat: 'Specialty',
    atributos: { 'Floral': 7, 'Frutal': 8, 'Azucarado': 7.5, 'Cacao/Nuez': 6, 'Especias': 5, 'Cereales': 4, 'Vegetal': 3, 'Amargo': 4, 'Fermentado': 2 },
    descriptores: ['Frutas rojas', 'Bergamota', 'Jazmín'], notas: 'CVA: perfil frutal dominante' },
  { id: '4', fecha: '2026-02-18', lote: 'LOT-2026-032', productor: 'José Hernández', protocolo: 'SCA', puntaje: 82.3, cat: 'Premium',
    atributos: { 'Fragancia/Aroma': 8.0, 'Sabor': 8.0, 'Post-gusto': 7.75, 'Acidez': 8.0, 'Cuerpo': 8.0, 'Balance': 8.0, 'Uniformidad': 10, 'Taza Limpia': 10, 'Dulzura': 10 },
    descriptores: ['Chocolate', 'Canela', 'Cereza'], notas: 'Balance sólido, acidez media' },
  { id: '5', fecha: '2026-02-15', lote: 'LOT-2026-011', productor: 'Rosa E. Castillo', protocolo: 'SCA', puntaje: 81.0, cat: 'Premium',
    atributos: { 'Fragancia/Aroma': 7.75, 'Sabor': 7.75, 'Post-gusto': 7.5, 'Acidez': 7.75, 'Cuerpo': 8.0, 'Balance': 7.75, 'Uniformidad': 10, 'Taza Limpia': 10, 'Dulzura': 10 },
    descriptores: ['Nuez', 'Vainilla', 'Caramelo'], notas: 'Cuerpo notable, acidez suave' },
  { id: '6', fecha: '2026-02-12', lote: 'LOT-2026-007', productor: 'Fernando Ruiz', protocolo: 'SCA', puntaje: 78.5, cat: 'Comercial',
    atributos: { 'Fragancia/Aroma': 7.25, 'Sabor': 7.5, 'Post-gusto': 7.0, 'Acidez': 7.25, 'Cuerpo': 7.5, 'Balance': 7.5, 'Uniformidad': 10, 'Taza Limpia': 10, 'Dulzura': 10 },
    descriptores: ['Chocolate', 'Panela'], notas: 'Taza limpia pero sin complejidad destacada' },
];

const kpis = [
  { label: 'Promedio SCA', value: '83.5', badge: 'Premium', icon: FlaskConical },
  { label: 'Total Cataciones', value: '34 este periodo', badge: '', icon: TrendingUp },
  { label: 'Mejor Lote', value: 'LOT-023 — 87.2 pts', badge: '', icon: Award },
  { label: 'Specialty (>84)', value: '12 muestras (35%)', badge: '', icon: Star },
];

const catBadge = (cat: string) => {
  if (cat === 'Specialty') return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0">Specialty</Badge>;
  if (cat === 'Premium') return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">Premium</Badge>;
  return <Badge variant="secondary">Comercial</Badge>;
};

export default function NovaCupDashboard() {
  const [showNuevaCata, setShowNuevaCata] = useState(false);
  const [selectedCata, setSelectedCata] = useState<Catacion | null>(null);
  const [protocolo, setProtocolo] = useState<'SCA' | 'CVA'>('SCA');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [descriptoresSeleccionados, setDescriptoresSeleccionados] = useState<string[]>([]);
  const [cataForm, setCataForm] = useState({ lote: '', productor: '', notas: '' });
  const [step, setStep] = useState(0); // 0=config, 1=scoring, 2=descriptors, 3=result

  const attrs = protocolo === 'SCA' ? SCA_ATTRIBUTES : CVA_ATTRIBUTES;
  const totalScore = protocolo === 'SCA'
    ? Object.values(scores).reduce((s, v) => s + v, 0) + 36 // 36 = base defects
    : Object.values(scores).reduce((s, v) => s + v, 0);

  const handleStartCata = () => {
    if (!cataForm.lote) { toast.error('Ingrese un ID de lote'); return; }
    setScores(Object.fromEntries(attrs.map(a => [a, protocolo === 'SCA' ? 7.5 : 5])));
    setStep(1);
  };

  const handleFinish = () => {
    const cat = totalScore >= 84 ? 'Specialty' : totalScore >= 80 ? 'Premium' : 'Comercial';
    toast.success(`Catación registrada: ${cataForm.lote} — ${totalScore.toFixed(1)} pts (${cat})`);
    setShowNuevaCata(false);
    setStep(0);
    setCataForm({ lote: '', productor: '', notas: '' });
    setScores({});
    setDescriptoresSeleccionados([]);
  };

  const toggleDescriptor = (d: string) => {
    setDescriptoresSeleccionados(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const radarData = selectedCata
    ? Object.entries(selectedCata.atributos).map(([key, val]) => ({ attr: key.length > 12 ? key.slice(0, 12) + '…' : key, value: val, fullMark: 10 }))
    : attrs.map(a => ({ attr: a.length > 12 ? a.slice(0, 12) + '…' : a, value: scores[a] || 0, fullMark: 10 }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova Cup</h1>
          <p className="text-sm text-muted-foreground">Evaluación sensorial y perfiles de taza</p>
        </div>
        <Button onClick={() => { setShowNuevaCata(true); setStep(0); }}>
          <Plus className="h-4 w-4 mr-1" /> Nueva Catación
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
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

      {/* Cataciones Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" /> Cataciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Lote</th>
                  <th className="px-4 py-3 font-medium">Productor</th>
                  <th className="px-4 py-3 font-medium">Protocolo</th>
                  <th className="px-4 py-3 font-medium">Puntaje</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {catacionesDemo.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{c.fecha}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{c.lote}</td>
                    <td className="px-4 py-3">{c.productor}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{c.protocolo}</Badge></td>
                    <td className="px-4 py-3 font-bold">{c.puntaje}</td>
                    <td className="px-4 py-3">{catBadge(c.cat)}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCata(c)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ═══ NUEVA CATACIÓN WIZARD ═══ */}
      <Dialog open={showNuevaCata} onOpenChange={setShowNuevaCata}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              {step === 0 ? 'Configurar Catación' : step === 1 ? 'Evaluación Sensorial' : step === 2 ? 'Descriptores de Sabor' : 'Resultado'}
            </DialogTitle>
          </DialogHeader>

          {/* Step 0: Config */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Protocolo</Label>
                <Select value={protocolo} onValueChange={(v) => setProtocolo(v as 'SCA' | 'CVA')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCA">SCA Traditional (100 pts)</SelectItem>
                    <SelectItem value="CVA">CVA — Coffee Value Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID de Lote *</Label>
                <Input placeholder="Ej: LOT-2026-050" value={cataForm.lote}
                  onChange={(e) => setCataForm(s => ({ ...s, lote: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Productor</Label>
                <Input placeholder="Nombre del productor" value={cataForm.productor}
                  onChange={(e) => setCataForm(s => ({ ...s, productor: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleStartCata}>Comenzar Evaluación →</Button>
            </div>
          )}

          {/* Step 1: Scoring */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {protocolo === 'SCA' ? 'Califique cada atributo de 6.00 a 10.00' : 'Califique intensidad de 0 a 10'}
              </p>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {attrs.map((attr) => (
                  <div key={attr} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium">{attr}</span>
                      <span className="font-bold text-primary">{(scores[attr] || 0).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[scores[attr] || (protocolo === 'SCA' ? 7.5 : 5)]}
                      onValueChange={([v]) => setScores(s => ({ ...s, [attr]: Number(v.toFixed(2)) }))}
                      min={protocolo === 'SCA' ? 6 : 0} max={10} step={0.25}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              {/* Live radar */}
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

          {/* Step 2: Descriptors (flavor wheel) */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Seleccione los descriptores de sabor identificados (rueda de sabores)</p>
              <div className="flex flex-wrap gap-2">
                {DESCRIPTORES.map((d) => (
                  <button key={d} onClick={() => toggleDescriptor(d)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      descriptoresSeleccionados.includes(d)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-foreground border-border hover:border-primary/50'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Notas del catador</Label>
                <Textarea placeholder="Observaciones adicionales..." value={cataForm.notas}
                  onChange={(e) => setCataForm(s => ({ ...s, notas: e.target.value }))} />
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
                  <div className="flex flex-wrap gap-1.5">
                    {descriptoresSeleccionados.map(d => (
                      <Badge key={d} variant="outline">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Card className="bg-muted/50">
                <CardContent className="pt-3 pb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Lote:</span> <span className="font-medium text-foreground">{cataForm.lote}</span></div>
                    <div><span className="text-muted-foreground">Protocolo:</span> <span className="font-medium text-foreground">{protocolo}</span></div>
                    <div><span className="text-muted-foreground">Productor:</span> <span className="font-medium text-foreground">{cataForm.productor || '—'}</span></div>
                    <div><span className="text-muted-foreground">Fecha:</span> <span className="font-medium text-foreground">{new Date().toISOString().slice(0, 10)}</span></div>
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full" onClick={handleFinish}>
                <Coffee className="h-4 w-4 mr-1" /> Guardar Catación
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ DETAIL DIALOG ═══ */}
      <Dialog open={!!selectedCata} onOpenChange={() => setSelectedCata(null)}>
        <DialogContent className="max-w-lg">
          {selectedCata && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-primary" /> {selectedCata.lote}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-foreground">{selectedCata.puntaje}</p>
                  <div className="mt-1">{catBadge(selectedCata.cat)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{selectedCata.protocolo} • {selectedCata.fecha}</p>
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
                    <span className="text-muted-foreground">Protocolo:</span>
                    <p className="font-medium text-foreground">{selectedCata.protocolo}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
