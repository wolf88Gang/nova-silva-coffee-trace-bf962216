import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  MapPin, Package, Scissors, Sprout, Plus, FileText, Clock, Users,
  DollarSign, CheckCircle, AlertCircle, Leaf, Target, Camera,
  Calendar as CalIcon, ArrowRight, ArrowLeft, X, Trash2, Edit,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──
interface Parcela {
  nombre: string; area: number; variedad: string; estadoLegal: string;
  ubicacion: string; estadoEUDR: string; gps: boolean; docs: boolean;
}
interface Insumo {
  nombre: string; categoria: string; stock: number; minimo: number; unidad: string; precio: number;
}
interface Equipo {
  nombre: string; tipo: string; marca: string; estado: string;
}
interface Jornal {
  nombre: string; actividad: string; parcela: string; monto: number;
  fecha: string; horas: string; estado: 'pagado' | 'pendiente';
}
interface YieldEstimation {
  parcela: string; variedad: string; arboles: number[];
  resultado?: { cereza: number; pergamino: number; oro: number };
  fecha: string;
}

// ── Initial data ──
const initialParcelas: Parcela[] = [
  { nombre: 'Finca La Esperanza', area: 2.5, variedad: 'Caturra', estadoLegal: 'propio', ubicacion: 'punto', estadoEUDR: 'Revisión pendiente', gps: true, docs: true },
  { nombre: 'Lote El Mirador', area: 1.2, variedad: 'Catuaí', estadoLegal: 'arrendado', ubicacion: 'punto', estadoEUDR: 'Revisión pendiente', gps: true, docs: false },
];

const initialInsumos: Insumo[] = [
  { nombre: 'Fertilizante 18-6-12', categoria: 'Fertilizante', stock: 8, minimo: 5, unidad: 'sacos', precio: 12500 },
  { nombre: 'Cal dolomita', categoria: 'Enmienda', stock: 3, minimo: 4, unidad: 'sacos', precio: 8000 },
  { nombre: 'Beauveria bassiana', categoria: 'Biocontrol', stock: 2, minimo: 2, unidad: 'kg', precio: 15000 },
  { nombre: 'Fungicida cúprico', categoria: 'Fungicida', stock: 5, minimo: 3, unidad: 'litros', precio: 9500 },
];

const initialEquipos: Equipo[] = [
  { nombre: 'Bomba de mochila', tipo: 'Aspersión', marca: 'Solo', estado: 'operativo' },
  { nombre: 'Despulpadora manual', tipo: 'Beneficio', marca: 'JM Estrada', estado: 'operativo' },
  { nombre: 'Secadora solar', tipo: 'Secado', marca: 'Artesanal', estado: 'requiere mantto' },
];

const initialJornales: Jornal[] = [
  { nombre: 'María López', actividad: 'Recolección café', parcela: 'Finca El Mirador', monto: 18000, fecha: '25 feb', horas: '8h', estado: 'pagado' },
  { nombre: 'Carlos Rodríguez', actividad: 'Recolección café', parcela: 'Finca El Mirador', monto: 18000, fecha: '25 feb', horas: '8h', estado: 'pagado' },
  { nombre: 'Ana Martínez', actividad: 'Poda selectiva', parcela: 'Lote Norte', monto: 13500, fecha: '24 feb', horas: '6h', estado: 'pagado' },
  { nombre: 'José Hernández', actividad: 'Aplicación fertilizante', parcela: 'Finca El Mirador', monto: 18000, fecha: '23 feb', horas: '8h', estado: 'pendiente' },
];

const TARIFA_HORA = 2250; // ₡/hora Costa Rica

const stockBadge = (stock: number, minimo: number) => {
  if (stock < minimo * 0.5) return <Badge variant="destructive">Crítico</Badge>;
  if (stock <= minimo) return <Badge variant="secondary" className="text-accent">Bajo</Badge>;
  return <Badge variant="default">OK</Badge>;
};

// ── Sub-components for forms ──

function AddInsumoDialog({ onAdd }: { onAdd: (i: Insumo) => void }) {
  const [form, setForm] = useState({ nombre: '', categoria: 'Fertilizante', stock: '', minimo: '', unidad: 'sacos', precio: '' });
  const handleSubmit = () => {
    if (!form.nombre || !form.stock) { toast.error('Nombre y stock son requeridos'); return; }
    onAdd({ nombre: form.nombre, categoria: form.categoria, stock: Number(form.stock), minimo: Number(form.minimo) || 0, unidad: form.unidad, precio: Number(form.precio) || 0 });
    toast.success(`Insumo "${form.nombre}" agregado`);
    setForm({ nombre: '', categoria: 'Fertilizante', stock: '', minimo: '', unidad: 'sacos', precio: '' });
  };
  return (
    <Dialog>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Agregar insumo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nuevo Insumo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Fertilizante 20-20-20" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Categoría</Label>
              <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Fertilizante', 'Enmienda', 'Biocontrol', 'Fungicida', 'Herbicida', 'Semilla', 'Otro'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Unidad</Label>
              <Select value={form.unidad} onValueChange={v => setForm({ ...form, unidad: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['sacos', 'kg', 'litros', 'unidades', 'galones'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Stock actual</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
            <div><Label>Mínimo</Label><Input type="number" value={form.minimo} onChange={e => setForm({ ...form, minimo: e.target.value })} /></div>
            <div><Label>Precio unit.</Label><Input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <DialogClose asChild><Button onClick={handleSubmit}>Guardar</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddEquipoDialog({ onAdd }: { onAdd: (e: Equipo) => void }) {
  const [form, setForm] = useState({ nombre: '', tipo: 'Aspersión', marca: '' });
  const handleSubmit = () => {
    if (!form.nombre) { toast.error('Nombre requerido'); return; }
    onAdd({ nombre: form.nombre, tipo: form.tipo, marca: form.marca, estado: 'operativo' });
    toast.success(`Equipo "${form.nombre}" agregado`);
    setForm({ nombre: '', tipo: 'Aspersión', marca: '' });
  };
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Agregar equipo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nuevo Equipo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Motobomba" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Aspersión', 'Beneficio', 'Secado', 'Transporte', 'Herramienta', 'Otro'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Marca</Label><Input value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <DialogClose asChild><Button onClick={handleSubmit}>Guardar</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddJornalDialog({ onAdd, parcelas }: { onAdd: (j: Jornal) => void; parcelas: string[] }) {
  const [form, setForm] = useState({ nombre: '', actividad: 'Recolección café', parcela: parcelas[0] || '', horas: '' });
  const handleSubmit = () => {
    if (!form.nombre || !form.horas) { toast.error('Nombre y horas son requeridos'); return; }
    const h = Number(form.horas);
    const monto = h * TARIFA_HORA;
    const today = new Date();
    const fecha = `${today.getDate()} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][today.getMonth()]}`;
    onAdd({ nombre: form.nombre, actividad: form.actividad, parcela: form.parcela, monto, fecha, horas: `${h}h`, estado: 'pendiente' });
    toast.success(`Jornal de ${form.nombre} registrado — ₡${monto.toLocaleString()}`);
    setForm({ nombre: '', actividad: 'Recolección café', parcela: parcelas[0] || '', horas: '' });
  };
  return (
    <Dialog>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Registrar Jornal</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar Jornal</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nombre del trabajador</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Pérez" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Actividad</Label>
              <Select value={form.actividad} onValueChange={v => setForm({ ...form, actividad: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Recolección café', 'Poda selectiva', 'Aplicación fertilizante', 'Limpieza', 'Fumigación', 'Siembra', 'Otro'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Parcela</Label>
              <Select value={form.parcela} onValueChange={v => setForm({ ...form, parcela: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {parcelas.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Horas trabajadas</Label><Input type="number" value={form.horas} onChange={e => setForm({ ...form, horas: e.target.value })} placeholder="8" /></div>
          {form.horas && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-foreground">Costo estimado: <span className="font-bold text-primary">₡{(Number(form.horas) * TARIFA_HORA).toLocaleString()}</span></p>
              <p className="text-xs text-muted-foreground">Tarifa: ₡{TARIFA_HORA.toLocaleString()}/hora</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <DialogClose asChild><Button onClick={handleSubmit}>Registrar</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Nova Yield Wizard ──
function NovaYieldWizard() {
  const [step, setStep] = useState(0); // 0=intro, 1=select, 2=count, 3=result
  const [parcela, setParcela] = useState('Finca La Esperanza');
  const [variedad, setVariedad] = useState('Caturra');
  const [counts, setCounts] = useState<number[]>(Array(30).fill(0));
  const [currentTree, setCurrentTree] = useState(0);
  const [result, setResult] = useState<{ cereza: number; pergamino: number; oro: number } | null>(null);
  const [estimations, setEstimations] = useState<YieldEstimation[]>([]);

  const TREES_PER_HA = 5000;
  const FACTOR: Record<string, number> = { 'Caturra': 0.20, 'Catuaí': 0.18, 'Bourbon': 0.17, 'Geisha': 0.15, 'Catimor': 0.22 };
  const area = parcela === 'Finca La Esperanza' ? 2.5 : 1.2;

  const calculate = () => {
    const filled = counts.filter(c => c > 0);
    if (filled.length < 5) { toast.error('Registra al menos 5 árboles'); return; }
    const avg = filled.reduce((s, c) => s + c, 0) / filled.length;
    const totalCereza = avg * TREES_PER_HA * area / 1000; // kg
    const factor = FACTOR[variedad] || 0.20;
    const pergamino = totalCereza * factor;
    const oro = pergamino * 0.80;
    const r = { cereza: Math.round(totalCereza), pergamino: Math.round(pergamino), oro: Math.round(oro) };
    setResult(r);
    setEstimations(prev => [...prev, { parcela, variedad, arboles: [...counts], resultado: r, fecha: new Date().toISOString().slice(0, 10) }]);
    setStep(3);
    toast.success('Estimación de cosecha completada');
  };

  const resetWizard = () => {
    setStep(0); setCounts(Array(30).fill(0)); setCurrentTree(0); setResult(null);
  };

  if (step === 0) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Sprout className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Nova Yield</h2>
              <p className="text-sm text-muted-foreground">Estimación de Cosecha con Conteo Asistido</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Nova Yield utiliza el <span className="font-bold text-foreground">Método de Componentes</span> para estimar tu producción. Muestrearás 30 árboles siguiendo un patrón de zigzag.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Target, title: 'Precisión <10%', desc: 'Error reducido vs métodos tradicionales' },
              { icon: Camera, title: 'Conteo Asistido', desc: 'Registro guiado árbol por árbol' },
              { icon: CalIcon, title: 'Curva de Maduración', desc: 'Predice el timing óptimo de cosecha' },
            ].map(f => (
              <div key={f.title} className="p-4 rounded-lg border border-border space-y-2">
                <f.icon className="h-6 w-6 text-primary" />
                <p className="font-semibold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
          <Button className="w-full" size="lg" onClick={() => setStep(1)}>
            Comenzar Estimación <ArrowRight className="h-4 w-4 ml-1" />
          </Button>

          {estimations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Estimaciones anteriores</h3>
              {estimations.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.parcela} — {e.variedad}</p>
                    <p className="text-xs text-muted-foreground">{e.fecha}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{e.resultado?.oro} kg oro</p>
                    <p className="text-xs text-muted-foreground">{e.resultado?.pergamino} kg pergamino</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === 1) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Configurar Estimación</h3>
          <div className="space-y-3">
            <div><Label>Parcela</Label>
              <Select value={parcela} onValueChange={setParcela}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Finca La Esperanza">Finca La Esperanza (2.5 ha)</SelectItem>
                  <SelectItem value="Lote El Mirador">Lote El Mirador (1.2 ha)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Variedad</Label>
              <Select value={variedad} onValueChange={setVariedad}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(FACTOR).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
            <Button className="flex-1" onClick={() => setStep(2)}>Iniciar Conteo <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 2) {
    const filledCount = counts.filter(c => c > 0).length;
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Conteo de Cerezas</h3>
            <Badge variant="outline">{filledCount}/30 árboles</Badge>
          </div>
          <Progress value={(filledCount / 30) * 100} className="h-2" />

          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
            <p className="text-sm font-semibold text-foreground">Árbol #{currentTree + 1} de 30</p>
            <p className="text-xs text-muted-foreground">Cuenta las cerezas visibles en una rama representativa y multiplica por el número de ramas productivas.</p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={counts[currentTree] || ''}
                onChange={e => {
                  const newCounts = [...counts];
                  newCounts[currentTree] = Number(e.target.value);
                  setCounts(newCounts);
                }}
                placeholder="Cerezas"
                className="text-lg font-bold"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">cerezas</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentTree === 0} onClick={() => setCurrentTree(c => c - 1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {currentTree < 29 ? (
                <Button size="sm" className="flex-1" onClick={() => setCurrentTree(c => c + 1)}>
                  Siguiente árbol <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" className="flex-1" onClick={calculate}>
                  Calcular estimación <CheckCircle className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-10 gap-1">
            {counts.map((c, i) => (
              <button
                key={i}
                onClick={() => setCurrentTree(i)}
                className={`h-8 w-full rounded text-xs font-mono transition-colors ${
                  i === currentTree ? 'bg-primary text-primary-foreground' :
                  c > 0 ? 'bg-primary/20 text-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {c > 0 ? c : i + 1}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={resetWizard}>Cancelar</Button>
            <Button variant="secondary" onClick={calculate} disabled={filledCount < 5}>
              Calcular con {filledCount} árboles
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // step === 3: results
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-xl font-bold text-foreground">Estimación Completada</h3>
          <p className="text-sm text-muted-foreground">{parcela} — {variedad} — {area} ha</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Café Cereza', value: `${result?.cereza.toLocaleString()} kg`, sub: 'Peso fresco estimado' },
            { label: 'Café Pergamino', value: `${result?.pergamino.toLocaleString()} kg`, sub: `Factor ${(FACTOR[variedad] || 0.20) * 100}%` },
            { label: 'Café Oro', value: `${result?.oro.toLocaleString()} kg`, sub: `≈ ${Math.round((result?.oro || 0) / 46)} qq` },
          ].map(r => (
            <Card key={r.label} className="border border-border">
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className="text-2xl font-bold text-primary">{r.value}</p>
                <p className="text-[10px] text-muted-foreground">{r.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-primary mb-1">Interpretación Nova Silva</p>
            <p className="text-sm text-muted-foreground">
              Con un promedio de {Math.round(counts.filter(c => c > 0).reduce((s, c) => s + c, 0) / Math.max(counts.filter(c => c > 0).length, 1))} cerezas/árbol,
              tu rendimiento estimado es de <span className="font-bold text-foreground">{Math.round((result?.oro || 0) / area)} kg oro/ha</span>.
              {(result?.oro || 0) / area > 800 ? ' Esto está por encima del promedio regional.' : ' Considera optimizar la fertilización para mejorar el rendimiento.'}
            </p>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={resetWizard}>Nueva Estimación</Button>
      </CardContent>
    </Card>
  );
}

// ── Main Component ──
export default function ProduccionHub() {
  const [parcelas] = useState<Parcela[]>(initialParcelas);
  const [insumos, setInsumos] = useState<Insumo[]>(initialInsumos);
  const [equipos, setEquipos] = useState<Equipo[]>(initialEquipos);
  const [jornales, setJornales] = useState<Jornal[]>(initialJornales);
  const [jornalFilter, setJornalFilter] = useState('Todos');

  const parcelaNames = parcelas.map(p => p.nombre);
  const filteredJornales = jornalFilter === 'Todos' ? jornales :
    jornalFilter === 'Pagados' ? jornales.filter(j => j.estado === 'pagado') :
    jornales.filter(j => j.estado === 'pendiente');

  const totalPagado = jornales.filter(j => j.estado === 'pagado').reduce((s, j) => s + j.monto, 0);
  const totalPendiente = jornales.filter(j => j.estado === 'pendiente').reduce((s, j) => s + j.monto, 0);
  const totalHoras = jornales.reduce((s, j) => s + parseInt(j.horas), 0);

  const actIcons: Record<string, typeof Sprout> = { 'Recolección café': Sprout, 'Poda selectiva': Scissors, 'Aplicación fertilizante': Leaf };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Producción</h1>
        <p className="text-sm text-muted-foreground">Gestiona tus parcelas, inventario, jornales y estimaciones de cosecha</p>
      </div>

      <Tabs defaultValue="parcelas">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="parcelas" className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Mis parcelas</TabsTrigger>
          <TabsTrigger value="inventario" className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Inventario</TabsTrigger>
          <TabsTrigger value="jornales" className="flex items-center gap-1.5"><Scissors className="h-3.5 w-3.5" /> Jornales</TabsTrigger>
          <TabsTrigger value="yield" className="flex items-center gap-1.5"><Sprout className="h-3.5 w-3.5" /> Nova Yield</TabsTrigger>
        </TabsList>

        {/* ── PARCELAS ── */}
        <TabsContent value="parcelas" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Listado de parcelas</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Nombre</th><th className="pb-2 pr-4">Área</th><th className="pb-2 pr-4">Variedad</th>
                      <th className="pb-2 pr-4">Estado Legal</th><th className="pb-2 pr-4">Estado EUDR</th><th className="pb-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelas.map((p) => (
                      <tr key={p.nombre} className="border-b border-border/50">
                        <td className="py-3 pr-4 font-medium text-foreground">{p.nombre}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.area} ha</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.variedad}</td>
                        <td className="py-3 pr-4"><Badge variant="outline">{p.estadoLegal}</Badge></td>
                        <td className="py-3 pr-4"><Badge variant="destructive">{p.estadoEUDR}</Badge></td>
                        <td className="py-3"><Button variant="ghost" size="sm"><Edit className="h-3.5 w-3.5 mr-1" /> Editar</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── INVENTARIO ── */}
        <TabsContent value="inventario" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Insumos</CardTitle>
                <AddInsumoDialog onAdd={(i) => setInsumos(prev => [...prev, i])} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Insumo</th><th className="pb-2 pr-4">Categoría</th><th className="pb-2 pr-4">Stock</th><th className="pb-2 pr-4">Mínimo</th><th className="pb-2 pr-4">Unidad</th><th className="pb-2">Estado</th>
                  </tr></thead>
                  <tbody>
                    {insumos.map((ins) => (
                      <tr key={ins.nombre} className="border-b border-border/50">
                        <td className="py-3 pr-4 font-medium text-foreground">{ins.nombre}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{ins.categoria}</td>
                        <td className="py-3 pr-4 text-foreground">{ins.stock}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{ins.minimo}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{ins.unidad}</td>
                        <td className="py-3">{stockBadge(ins.stock, ins.minimo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Equipos</CardTitle>
                <AddEquipoDialog onAdd={(e) => setEquipos(prev => [...prev, e])} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {equipos.map((eq) => (
                <div key={eq.nombre} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{eq.nombre}</p>
                    <p className="text-xs text-muted-foreground">{eq.tipo} — {eq.marca}</p>
                  </div>
                  <Badge variant={eq.estado === 'operativo' ? 'default' : 'secondary'}>{eq.estado}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── JORNALES ── */}
        <TabsContent value="jornales" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Gestión de Jornales</h2>
              <p className="text-sm text-muted-foreground">Control de trabajo y pagos a jornaleros</p>
            </div>
            <AddJornalDialog onAdd={j => setJornales(prev => [j, ...prev])} parcelas={parcelaNames} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Trabajadores', value: new Set(jornales.map(j => j.nombre)).size.toString(), sub: 'activos', icon: Users },
              { label: 'Horas Totales', value: `${totalHoras}h`, sub: `${jornales.length} jornales`, icon: Clock },
              { label: 'Pagado', value: `₡${totalPagado.toLocaleString()}`, sub: 'liquidado', icon: CheckCircle, accent: true },
              { label: 'Pendiente', value: `₡${totalPendiente.toLocaleString()}`, sub: 'por pagar', icon: DollarSign, warning: true },
            ].map(kpi => (
              <Card key={kpi.label}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={`h-4 w-4 ${kpi.warning ? 'text-accent' : kpi.accent ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${kpi.warning ? 'text-accent' : kpi.accent ? 'text-primary' : 'text-foreground'}`}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Jornales Recientes</CardTitle>
                <div className="flex gap-1">
                  {['Todos', 'Pagados', 'Pendientes'].map(f => (
                    <Badge key={f} variant={f === jornalFilter ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setJornalFilter(f)}>{f}</Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredJornales.map((j, i) => {
                const Icon = actIcons[j.actividad] || Sprout;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{j.nombre}</p>
                        <p className="text-xs text-muted-foreground">{j.actividad} • {j.parcela}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">₡{j.monto.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{j.fecha} • {j.horas}</p>
                      </div>
                      <Badge variant={j.estado === 'pagado' ? 'default' : 'secondary'}>
                        {j.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── NOVA YIELD ── */}
        <TabsContent value="yield" className="space-y-6 mt-4">
          <NovaYieldWizard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
