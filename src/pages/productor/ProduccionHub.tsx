import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin, Package, Scissors, Sprout, Plus, FileText, Clock, Users,
  DollarSign, CheckCircle, AlertCircle, Leaf, Target, Camera,
  Calendar as CalIcon, ArrowRight, ArrowLeft, X, Trash2, Edit,
  Upload, Eye, Wrench, TrendingDown, BarChart3, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──
interface Parcela {
  nombre: string; area: number; variedad: string; estadoLegal: string;
  ubicacion: string; estadoEUDR: string; gps: boolean; docs: boolean;
}
interface Insumo {
  nombre: string; nombreComercial: string; ingredienteActivo: string;
  indicaciones: string; dosisRecomendada: string;
  categoria: string; stock: number; minimo: number; unidad: string; precio: number;
}
interface EquipoUso {
  fecha: string; usuario: string; parcela: string; actividad: string; horas: number;
}
interface Equipo {
  nombre: string; tipo: string; marca: string; estado: string;
  fechaCompra: string; valorCompra: number; vidaUtilAnios: number;
  ubicacion: string; financiado: boolean; cuotaMensual: number; cuotasRestantes: number;
  historialUso: EquipoUso[];
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
  { nombre: 'Fertilizante 18-6-12', nombreComercial: 'NovaCrop Plus 18-6-12', ingredienteActivo: 'NPK 18-6-12 + microelementos (Zn, B, Fe)', indicaciones: 'Aplicar al suelo alrededor de la planta en corona. Evitar contacto directo con el tallo. Aplicar preferiblemente en época húmeda.', dosisRecomendada: '150g/planta cada 3 meses', categoria: 'Fertilizante', stock: 8, minimo: 5, unidad: 'sacos', precio: 12500 },
  { nombre: 'Cal dolomita', nombreComercial: 'Calite Premium', ingredienteActivo: 'CaCO₃ (54%) + MgCO₃ (43%)', indicaciones: 'Incorporar al suelo 30 días antes de la fertilización. Corrige acidez y aporta calcio y magnesio.', dosisRecomendada: '2 ton/ha cada 2 años', categoria: 'Enmienda', stock: 3, minimo: 4, unidad: 'sacos', precio: 8000 },
  { nombre: 'Beauveria bassiana', nombreComercial: 'BioGuard BB-1', ingredienteActivo: 'Beauveria bassiana cepa GHA (1×10⁹ conidias/g)', indicaciones: 'Control biológico de broca del café. Aplicar en aspersión directa sobre frutos. Almacenar en lugar fresco y seco.', dosisRecomendada: '0.5 kg/ha en 200L agua', categoria: 'Biocontrol', stock: 2, minimo: 2, unidad: 'kg', precio: 15000 },
  { nombre: 'Fungicida cúprico', nombreComercial: 'CuproNova 50 WP', ingredienteActivo: 'Oxicloruro de cobre (50%)', indicaciones: 'Prevención y control de roya (Hemileia vastatrix). Aplicar preventivamente en época de lluvias. Período de carencia: 15 días.', dosisRecomendada: '3g/L de agua', categoria: 'Fungicida', stock: 5, minimo: 3, unidad: 'litros', precio: 9500 },
];

const initialEquipos: Equipo[] = [
  { nombre: 'Bomba de mochila', tipo: 'Aspersión', marca: 'Solo 425', estado: 'operativo', fechaCompra: '2024-03-15', valorCompra: 185000, vidaUtilAnios: 5, ubicacion: 'Bodega principal', financiado: false, cuotaMensual: 0, cuotasRestantes: 0, historialUso: [
    { fecha: '2026-02-20', usuario: 'José H.', parcela: 'Finca La Esperanza', actividad: 'Fumigación roya', horas: 4 },
    { fecha: '2026-02-10', usuario: 'Carlos R.', parcela: 'Lote El Mirador', actividad: 'Aplicación biocontrol', horas: 3 },
    { fecha: '2026-01-28', usuario: 'José H.', parcela: 'Finca La Esperanza', actividad: 'Fumigación preventiva', horas: 5 },
  ]},
  { nombre: 'Despulpadora manual', tipo: 'Beneficio', marca: 'JM Estrada No.3', estado: 'operativo', fechaCompra: '2023-08-10', valorCompra: 420000, vidaUtilAnios: 10, ubicacion: 'Beneficiadero', financiado: false, cuotaMensual: 0, cuotasRestantes: 0, historialUso: [
    { fecha: '2026-01-15', usuario: 'María L.', parcela: 'Finca La Esperanza', actividad: 'Despulpado cosecha', horas: 8 },
  ]},
  { nombre: 'Secadora solar', tipo: 'Secado', marca: 'Artesanal', estado: 'requiere mantto', fechaCompra: '2022-11-01', valorCompra: 150000, vidaUtilAnios: 8, ubicacion: 'Patio de secado', financiado: false, cuotaMensual: 0, cuotasRestantes: 0, historialUso: [] },
  { nombre: 'Motobomba de riego', tipo: 'Riego', marca: 'Honda WB20', estado: 'operativo', fechaCompra: '2025-06-01', valorCompra: 650000, vidaUtilAnios: 8, ubicacion: 'Bodega principal', financiado: true, cuotaMensual: 32500, cuotasRestantes: 14, historialUso: [
    { fecha: '2026-02-18', usuario: 'Carlos R.', parcela: 'Lote El Mirador', actividad: 'Riego de emergencia', horas: 3 },
  ]},
];

const initialJornales: Jornal[] = [
  { nombre: 'María López', actividad: 'Recolección café', parcela: 'Finca El Mirador', monto: 18000, fecha: '25 feb', horas: '8h', estado: 'pagado' },
  { nombre: 'Carlos Rodríguez', actividad: 'Recolección café', parcela: 'Finca El Mirador', monto: 18000, fecha: '25 feb', horas: '8h', estado: 'pagado' },
  { nombre: 'Ana Martínez', actividad: 'Poda selectiva', parcela: 'Lote Norte', monto: 13500, fecha: '24 feb', horas: '6h', estado: 'pagado' },
  { nombre: 'José Hernández', actividad: 'Aplicación fertilizante', parcela: 'Finca El Mirador', monto: 18000, fecha: '23 feb', horas: '8h', estado: 'pendiente' },
];

const TARIFA_HORA = 2250;

const stockBadge = (stock: number, minimo: number) => {
  if (stock < minimo * 0.5) return <Badge variant="destructive">Crítico</Badge>;
  if (stock <= minimo) return <Badge variant="secondary" className="text-accent">Bajo</Badge>;
  return <Badge variant="default">OK</Badge>;
};

// ── Depreciation helper ──
function calcDepreciation(equipo: Equipo) {
  const purchaseDate = new Date(equipo.fechaCompra);
  const now = new Date();
  const yearsUsed = (now.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const depAnual = equipo.valorCompra / equipo.vidaUtilAnios;
  const depAcumulada = Math.min(depAnual * yearsUsed, equipo.valorCompra);
  const valorActual = Math.max(equipo.valorCompra - depAcumulada, 0);
  const pctDepreciado = (depAcumulada / equipo.valorCompra) * 100;
  return { valorActual: Math.round(valorActual), depAcumulada: Math.round(depAcumulada), pctDepreciado: Math.round(pctDepreciado), yearsUsed: Math.round(yearsUsed * 10) / 10 };
}

// ── Sub-components ──

function AddInsumoDialog({ onAdd }: { onAdd: (i: Insumo) => void }) {
  const [form, setForm] = useState({ nombre: '', nombreComercial: '', ingredienteActivo: '', indicaciones: '', dosisRecomendada: '', categoria: 'Fertilizante', stock: '', minimo: '', unidad: 'sacos', precio: '' });
  const handleSubmit = () => {
    if (!form.nombre || !form.stock) { toast.error('Nombre y stock son requeridos'); return; }
    onAdd({ nombre: form.nombre, nombreComercial: form.nombreComercial, ingredienteActivo: form.ingredienteActivo, indicaciones: form.indicaciones, dosisRecomendada: form.dosisRecomendada, categoria: form.categoria, stock: Number(form.stock), minimo: Number(form.minimo) || 0, unidad: form.unidad, precio: Number(form.precio) || 0 });
    toast.success(`Insumo "${form.nombre}" agregado`);
    setForm({ nombre: '', nombreComercial: '', ingredienteActivo: '', indicaciones: '', dosisRecomendada: '', categoria: 'Fertilizante', stock: '', minimo: '', unidad: 'sacos', precio: '' });
  };
  return (
    <Dialog>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Agregar insumo</Button></DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nuevo Insumo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nombre genérico</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Fertilizante 20-20-20" /></div>
          <div><Label>Nombre comercial</Label><Input value={form.nombreComercial} onChange={e => setForm({ ...form, nombreComercial: e.target.value })} placeholder="Ej: NovaCrop Plus" /></div>
          <div><Label>Ingrediente activo / Composición</Label><Input value={form.ingredienteActivo} onChange={e => setForm({ ...form, ingredienteActivo: e.target.value })} placeholder="Ej: NPK 18-6-12 + Zn, B" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Categoría</Label>
              <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Fertilizante', 'Enmienda', 'Biocontrol', 'Fungicida', 'Herbicida', 'Insecticida', 'Semilla', 'Otro'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
          <div><Label>Dosis recomendada</Label><Input value={form.dosisRecomendada} onChange={e => setForm({ ...form, dosisRecomendada: e.target.value })} placeholder="Ej: 150g/planta cada 3 meses" /></div>
          <div><Label>Indicaciones de uso</Label><Textarea value={form.indicaciones} onChange={e => setForm({ ...form, indicaciones: e.target.value })} rows={3} placeholder="Instrucciones de aplicación, precauciones, período de carencia..." /></div>
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

function ImportXLSDialog({ onImport }: { onImport: (insumos: Insumo[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<Insumo[]>([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    // Simulate parsing XLS — in production this would use a library like SheetJS
    toast.info('Analizando documento…');
    setTimeout(() => {
      const simulated: Insumo[] = [
        { nombre: 'Urea 46-0-0', nombreComercial: 'FertiMax Urea', ingredienteActivo: 'Nitrógeno (46%)', indicaciones: 'Aplicar en suelo húmedo. No mezclar con cal.', dosisRecomendada: '100g/planta', categoria: 'Fertilizante', stock: 15, minimo: 8, unidad: 'sacos', precio: 9800 },
        { nombre: 'Clorpirifos', nombreComercial: 'Lorsban 4E', ingredienteActivo: 'Clorpirifos (44.4%)', indicaciones: 'Insecticida organofosforado. Aplicar con equipo de protección. Período de carencia: 21 días.', dosisRecomendada: '2.5 ml/L de agua', categoria: 'Insecticida', stock: 4, minimo: 2, unidad: 'litros', precio: 18500 },
      ];
      setPreview(simulated);
      toast.success(`${simulated.length} insumos encontrados en "${file.name}"`);
    }, 1200);
  };

  const handleImport = () => {
    if (preview.length === 0) return;
    onImport(preview);
    toast.success(`${preview.length} insumos importados exitosamente`);
    setFileName('');
    setPreview([]);
  };

  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Upload className="h-3.5 w-3.5 mr-1" /> Importar XLS</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Importar desde archivo</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors text-center cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-foreground font-medium">{fileName || 'Seleccionar archivo XLS/XLSX'}</p>
            <p className="text-xs text-muted-foreground mt-1">El sistema buscará nombres comerciales, ingredientes activos, dosis e indicaciones</p>
            <input ref={fileRef} type="file" accept=".xls,.xlsx,.csv" className="hidden" onChange={handleFile} />
          </div>

          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">{preview.length} insumos detectados</p>
              </div>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {preview.map((ins, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{ins.nombre}</p>
                        <Badge variant="outline" className="text-[10px]">{ins.categoria}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{ins.nombreComercial} — {ins.ingredienteActivo}</p>
                      <p className="text-xs text-muted-foreground mt-1">Stock: {ins.stock} {ins.unidad} | Dosis: {ins.dosisRecomendada}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleImport} disabled={preview.length === 0}>Importar {preview.length} insumos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InsumoDetailDialog({ insumo }: { insumo: Insumo }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> {insumo.nombre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock label="Nombre comercial" value={insumo.nombreComercial || '—'} />
            <InfoBlock label="Categoría" value={insumo.categoria} />
          </div>
          <InfoBlock label="Ingrediente activo / Composición" value={insumo.ingredienteActivo || '—'} />
          <InfoBlock label="Dosis recomendada" value={insumo.dosisRecomendada || '—'} />
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1"><Info className="h-3 w-3" /> Indicaciones de uso</p>
            <p className="text-sm text-foreground leading-relaxed">{insumo.indicaciones || 'Sin indicaciones registradas.'}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <InfoBlock label="Stock actual" value={`${insumo.stock} ${insumo.unidad}`} />
            <InfoBlock label="Stock mínimo" value={`${insumo.minimo} ${insumo.unidad}`} />
            <InfoBlock label="Precio unitario" value={`₡${insumo.precio.toLocaleString()}`} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Estado:</span>
            {stockBadge(insumo.stock, insumo.minimo)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg border border-border">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function EquipoDetailDialog({ equipo }: { equipo: Equipo }) {
  const dep = calcDepreciation(equipo);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full text-left p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{equipo.nombre}</p>
              <p className="text-xs text-muted-foreground">{equipo.tipo} — {equipo.marca}</p>
            </div>
            <div className="flex items-center gap-2">
              {equipo.financiado && <Badge variant="outline" className="text-[10px] border-accent text-accent">Financiado</Badge>}
              <Badge variant={equipo.estado === 'operativo' ? 'default' : 'secondary'}>{equipo.estado}</Badge>
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> {equipo.nombre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Info principal */}
          <div className="grid grid-cols-2 gap-3">
            <InfoBlock label="Marca / Modelo" value={equipo.marca} />
            <InfoBlock label="Tipo" value={equipo.tipo} />
            <InfoBlock label="Fecha de compra" value={new Date(equipo.fechaCompra).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })} />
            <InfoBlock label="Ubicación actual" value={equipo.ubicacion} />
          </div>

          {/* Depreciación */}
          <div className="p-4 rounded-lg border border-border space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-accent" />
              <p className="text-sm font-semibold text-foreground">Depreciación</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Valor compra</p>
                <p className="text-sm font-bold text-foreground">₡{equipo.valorCompra.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Valor actual</p>
                <p className="text-sm font-bold text-primary">₡{dep.valorActual.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Dep. acumulada</p>
                <p className="text-sm font-bold text-accent">₡{dep.depAcumulada.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{dep.yearsUsed} años de {equipo.vidaUtilAnios} años</span>
                <span>{dep.pctDepreciado}% depreciado</span>
              </div>
              <Progress value={dep.pctDepreciado} className="h-2" />
            </div>
          </div>

          {/* Financiamiento */}
          {equipo.financiado && (
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-foreground">Financiamiento activo</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Cuota mensual</p>
                  <p className="text-sm font-bold text-foreground">₡{equipo.cuotaMensual.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Cuotas restantes</p>
                  <p className="text-sm font-bold text-foreground">{equipo.cuotasRestantes} meses</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Saldo pendiente: ₡{(equipo.cuotaMensual * equipo.cuotasRestantes).toLocaleString()}</p>
            </div>
          )}

          {/* Historial de uso */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Historial de uso</p>
            {equipo.historialUso.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin registros de uso</p>
            ) : (
              <ScrollArea className="max-h-[180px]">
                <div className="space-y-2">
                  {equipo.historialUso.map((u, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{u.usuario}</p>
                          <p className="text-xs text-muted-foreground">{u.fecha}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{u.actividad} · {u.parcela} · {u.horas}h</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddEquipoDialog({ onAdd }: { onAdd: (e: Equipo) => void }) {
  const [form, setForm] = useState({ nombre: '', tipo: 'Aspersión', marca: '', fechaCompra: '', valorCompra: '', vidaUtilAnios: '5', ubicacion: '', financiado: false, cuotaMensual: '', cuotasRestantes: '' });
  const handleSubmit = () => {
    if (!form.nombre) { toast.error('Nombre requerido'); return; }
    onAdd({ nombre: form.nombre, tipo: form.tipo, marca: form.marca, estado: 'operativo', fechaCompra: form.fechaCompra || new Date().toISOString().slice(0, 10), valorCompra: Number(form.valorCompra) || 0, vidaUtilAnios: Number(form.vidaUtilAnios) || 5, ubicacion: form.ubicacion || 'Sin asignar', financiado: form.financiado, cuotaMensual: Number(form.cuotaMensual) || 0, cuotasRestantes: Number(form.cuotasRestantes) || 0, historialUso: [] });
    toast.success(`Equipo "${form.nombre}" agregado`);
    setForm({ nombre: '', tipo: 'Aspersión', marca: '', fechaCompra: '', valorCompra: '', vidaUtilAnios: '5', ubicacion: '', financiado: false, cuotaMensual: '', cuotasRestantes: '' });
  };
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Agregar equipo</Button></DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nuevo Equipo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Motobomba" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Aspersión', 'Beneficio', 'Secado', 'Riego', 'Transporte', 'Herramienta', 'Vehículo', 'Otro'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Marca / Modelo</Label><Input value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Fecha de compra</Label><Input type="date" value={form.fechaCompra} onChange={e => setForm({ ...form, fechaCompra: e.target.value })} /></div>
            <div><Label>Ubicación</Label><Input value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} placeholder="Ej: Bodega principal" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor de compra (₡)</Label><Input type="number" value={form.valorCompra} onChange={e => setForm({ ...form, valorCompra: e.target.value })} /></div>
            <div><Label>Vida útil (años)</Label><Input type="number" value={form.vidaUtilAnios} onChange={e => setForm({ ...form, vidaUtilAnios: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
            <input type="checkbox" id="financiado" checked={form.financiado} onChange={e => setForm({ ...form, financiado: e.target.checked })} className="rounded" />
            <Label htmlFor="financiado" className="cursor-pointer">¿Equipo financiado?</Label>
          </div>
          {form.financiado && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cuota mensual (₡)</Label><Input type="number" value={form.cuotaMensual} onChange={e => setForm({ ...form, cuotaMensual: e.target.value })} /></div>
              <div><Label>Cuotas restantes</Label><Input type="number" value={form.cuotasRestantes} onChange={e => setForm({ ...form, cuotasRestantes: e.target.value })} /></div>
            </div>
          )}
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
  const [step, setStep] = useState(0);
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
    const totalCereza = avg * TREES_PER_HA * area / 1000;
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
          <div className="p-4 rounded-lg border border-border text-center space-y-3">
            <p className="text-lg font-bold text-foreground">Árbol #{currentTree + 1}</p>
            <Input type="number" className="text-center text-2xl h-14 max-w-[200px] mx-auto" placeholder="0" value={counts[currentTree] || ''} onChange={e => { const nc = [...counts]; nc[currentTree] = Number(e.target.value) || 0; setCounts(nc); }} />
            <p className="text-xs text-muted-foreground">cerezas contadas</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={currentTree === 0} onClick={() => setCurrentTree(c => c - 1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground">{currentTree + 1}/30</span>
              <Button variant="outline" size="sm" disabled={currentTree === 29} onClick={() => setCurrentTree(c => c + 1)}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Volver</Button>
            <Button className="flex-1" onClick={calculate} disabled={filledCount < 5}>Calcular Estimación</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // step 3 — result
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
          <h3 className="text-xl font-bold text-foreground">Estimación Completa</h3>
          <p className="text-sm text-muted-foreground">{parcela} — {variedad} — {area} ha</p>
        </div>
        {result && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cereza', value: `${result.cereza} kg`, color: 'text-destructive' },
              { label: 'Pergamino', value: `${result.pergamino} kg`, color: 'text-accent' },
              { label: 'Oro verde', value: `${result.oro} kg`, color: 'text-primary' },
            ].map(r => (
              <div key={r.label} className="text-center p-4 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className={`text-2xl font-bold ${r.color}`}>{r.value}</p>
              </div>
            ))}
          </div>
        )}
        <Button className="w-full" onClick={resetWizard}>Nueva Estimación</Button>
      </CardContent>
    </Card>
  );
}

// ── Asset Dashboard ──
function AssetDashboard({ equipos }: { equipos: Equipo[] }) {
  const totalValorCompra = equipos.reduce((s, e) => s + e.valorCompra, 0);
  const totalValorActual = equipos.reduce((s, e) => s + calcDepreciation(e).valorActual, 0);
  const totalDepreciacion = totalValorCompra - totalValorActual;
  const financiados = equipos.filter(e => e.financiado);
  const saldoFinanciado = financiados.reduce((s, e) => s + (e.cuotaMensual * e.cuotasRestantes), 0);
  const cuotaMensualTotal = financiados.reduce((s, e) => s + e.cuotaMensual, 0);
  const enMantenimiento = equipos.filter(e => e.estado !== 'operativo').length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Valor total activos', value: `₡${totalValorCompra.toLocaleString()}`, sub: `${equipos.length} equipos`, icon: Package, color: '' },
          { label: 'Valor actual (neto)', value: `₡${totalValorActual.toLocaleString()}`, sub: `Dep: ₡${totalDepreciacion.toLocaleString()}`, icon: TrendingDown, color: 'text-primary' },
          { label: 'Deuda financiada', value: `₡${saldoFinanciado.toLocaleString()}`, sub: `₡${cuotaMensualTotal.toLocaleString()}/mes`, icon: DollarSign, color: 'text-accent' },
          { label: 'En mantenimiento', value: enMantenimiento.toString(), sub: `de ${equipos.length} equipos`, icon: Wrench, color: enMantenimiento > 0 ? 'text-destructive' : '' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color || 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className={`text-xl font-bold ${kpi.color || 'text-foreground'}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Depreciation table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Depreciación por activo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-3">Activo</th>
                <th className="pb-2 pr-3">Compra</th>
                <th className="pb-2 pr-3">Valor compra</th>
                <th className="pb-2 pr-3">Valor actual</th>
                <th className="pb-2 pr-3">Depreciación</th>
                <th className="pb-2">Estado</th>
              </tr></thead>
              <tbody>
                {equipos.map((eq) => {
                  const dep = calcDepreciation(eq);
                  return (
                    <tr key={eq.nombre} className="border-b border-border/50">
                      <td className="py-3 pr-3">
                        <p className="font-medium text-foreground">{eq.nombre}</p>
                        <p className="text-xs text-muted-foreground">{eq.marca}</p>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground text-xs">{eq.fechaCompra}</td>
                      <td className="py-3 pr-3 text-foreground">₡{eq.valorCompra.toLocaleString()}</td>
                      <td className="py-3 pr-3 font-medium text-primary">₡{dep.valorActual.toLocaleString()}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <Progress value={dep.pctDepreciado} className="h-1.5 w-16" />
                          <span className="text-xs text-muted-foreground">{dep.pctDepreciado}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Badge variant={eq.estado === 'operativo' ? 'default' : 'secondary'} className="text-[10px]">{eq.estado}</Badge>
                          {eq.financiado && <Badge variant="outline" className="text-[10px] border-accent text-accent">Fin.</Badge>}
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

      {/* Financiados detail */}
      {financiados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-accent" /> Activos financiados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {financiados.map(eq => (
              <div key={eq.nombre} className="p-4 rounded-lg border border-accent/20 bg-accent/5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{eq.nombre}</p>
                    <p className="text-xs text-muted-foreground">{eq.marca}</p>
                  </div>
                  <Badge variant="outline" className="border-accent text-accent">{eq.cuotasRestantes} cuotas restantes</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Cuota mensual</p>
                    <p className="text-sm font-bold text-foreground">₡{eq.cuotaMensual.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Saldo pendiente</p>
                    <p className="text-sm font-bold text-accent">₡{(eq.cuotaMensual * eq.cuotasRestantes).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Pagado</p>
                    <p className="text-sm font-bold text-primary">₡{(eq.valorCompra - eq.cuotaMensual * eq.cuotasRestantes).toLocaleString()}</p>
                  </div>
                </div>
                <Progress value={((eq.valorCompra - eq.cuotaMensual * eq.cuotasRestantes) / eq.valorCompra) * 100} className="h-1.5 mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main Component ──
export default function ProduccionHub() {
  const [parcelas] = useState<Parcela[]>(initialParcelas);
  const [insumos, setInsumos] = useState<Insumo[]>(initialInsumos);
  const [equipos, setEquipos] = useState<Equipo[]>(initialEquipos);
  const [jornales, setJornales] = useState<Jornal[]>(initialJornales);
  const [jornalFilter, setJornalFilter] = useState('Todos');
  const [selectedParcela, setSelectedParcela] = useState<Parcela | null>(null);
  const [expandedInsumo, setExpandedInsumo] = useState<string | null>(null);
  const [inventarioSubTab, setInventarioSubTab] = useState<'insumos' | 'equipos' | 'activos'>('insumos');

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
                      <tr key={p.nombre} className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedParcela(p)}>
                        <td className="py-3 pr-4 font-medium text-foreground">{p.nombre}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.area} ha</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.variedad}</td>
                        <td className="py-3 pr-4"><Badge variant="outline">{p.estadoLegal}</Badge></td>
                        <td className="py-3 pr-4"><Badge variant="destructive">{p.estadoEUDR}</Badge></td>
                        <td className="py-3"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedParcela(p); }}><Edit className="h-3.5 w-3.5 mr-1" /> Editar</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={!!selectedParcela} onOpenChange={() => setSelectedParcela(null)}>
            <DialogContent className="max-w-lg">
              {selectedParcela && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> {selectedParcela.nombre}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoBlock label="Área" value={`${selectedParcela.area} ha`} />
                      <InfoBlock label="Variedad" value={selectedParcela.variedad} />
                      <InfoBlock label="Estado Legal" value={selectedParcela.estadoLegal} />
                      <div className="p-3 rounded-lg border border-border">
                        <p className="text-[11px] text-muted-foreground">Estado EUDR</p>
                        <Badge variant="destructive" className="mt-0.5">{selectedParcela.estadoEUDR}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-2 rounded-lg border ${selectedParcela.gps ? 'border-primary/20 bg-primary/5' : 'border-destructive/20 bg-destructive/5'}`}>
                        <div className="flex items-center gap-1.5">
                          {selectedParcela.gps ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                          <span className="text-xs">Geolocalización</span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg border ${selectedParcela.docs ? 'border-primary/20 bg-primary/5' : 'border-destructive/20 bg-destructive/5'}`}>
                        <div className="flex items-center gap-1.5">
                          {selectedParcela.docs ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                          <span className="text-xs">Documentación</span>
                        </div>
                      </div>
                    </div>
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-3 pb-3">
                        <p className="text-xs font-semibold text-primary mb-1">Interpretación Nova Silva</p>
                        <p className="text-sm text-muted-foreground">
                          Parcela de {selectedParcela.area} ha con variedad {selectedParcela.variedad}.
                          {!selectedParcela.docs && ' Requiere completar documentación para cumplimiento EUDR.'}
                          {selectedParcela.docs && selectedParcela.gps && ' Parcela con documentación y geolocalización completas.'}
                        </p>
                      </CardContent>
                    </Card>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => { toast.info('Edición de parcelas próximamente con Supabase'); setSelectedParcela(null); }}>
                        <Edit className="h-4 w-4 mr-1" /> Editar parcela
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedParcela(null)}>Cerrar</Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── INVENTARIO ── */}
        <TabsContent value="inventario" className="space-y-4 mt-4">
          {/* Sub-navigation */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            {([
              { key: 'insumos', label: 'Insumos', icon: Package },
              { key: 'equipos', label: 'Equipos', icon: Wrench },
              { key: 'activos', label: 'Dashboard Activos', icon: BarChart3 },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setInventarioSubTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${inventarioSubTab === tab.key ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {inventarioSubTab === 'insumos' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Insumos</CardTitle>
                  <div className="flex items-center gap-2">
                    <ImportXLSDialog onImport={(imported) => setInsumos(prev => [...prev, ...imported])} />
                    <AddInsumoDialog onAdd={(i) => setInsumos(prev => [...prev, i])} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {insumos.map((ins) => (
                  <div key={ins.nombre} className="border-b border-border/50 last:border-0">
                    {/* Row */}
                    <div className="flex items-center gap-3 py-3 cursor-pointer hover:bg-muted/30 transition-colors px-1 rounded"
                      onClick={() => setExpandedInsumo(expandedInsumo === ins.nombre ? null : ins.nombre)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{ins.nombre}</p>
                          <Badge variant="outline" className="text-[10px]">{ins.categoria}</Badge>
                          {stockBadge(ins.stock, ins.minimo)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{ins.nombreComercial}</p>
                      </div>
                      <div className="text-right shrink-0 mr-2">
                        <p className="text-sm font-medium text-foreground">{ins.stock} {ins.unidad}</p>
                        <p className="text-xs text-muted-foreground">mín: {ins.minimo}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <InsumoDetailDialog insumo={ins} />
                        {expandedInsumo === ins.nombre ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                    {/* Expandable detail */}
                    {expandedInsumo === ins.nombre && (
                      <div className="pb-4 px-1 space-y-3 animate-in slide-in-from-top-1 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                            <p className="text-[11px] font-medium text-muted-foreground mb-1">Ingrediente activo</p>
                            <p className="text-sm text-foreground">{ins.ingredienteActivo || '—'}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                            <p className="text-[11px] font-medium text-muted-foreground mb-1">Dosis recomendada</p>
                            <p className="text-sm text-foreground">{ins.dosisRecomendada || '—'}</p>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-[11px] font-medium text-primary mb-1 flex items-center gap-1"><Info className="h-3 w-3" /> Indicaciones de uso</p>
                          <p className="text-sm text-foreground leading-relaxed">{ins.indicaciones || 'Sin indicaciones registradas.'}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Precio: ₡{ins.precio.toLocaleString()}/{ins.unidad}</span>
                          <span>Valor en stock: ₡{(ins.precio * ins.stock).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {inventarioSubTab === 'equipos' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Equipos</CardTitle>
                  <AddEquipoDialog onAdd={(e) => setEquipos(prev => [...prev, e])} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {equipos.map((eq) => (
                  <EquipoDetailDialog key={eq.nombre} equipo={eq} />
                ))}
              </CardContent>
            </Card>
          )}

          {inventarioSubTab === 'activos' && (
            <AssetDashboard equipos={equipos} />
          )}
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
