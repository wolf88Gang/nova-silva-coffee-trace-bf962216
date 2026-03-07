import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Boxes, AlertTriangle, Wallet, Plus, Minus, Edit2, PackagePlus, History,
  MapPin, Wrench, ChevronRight, Fuel, Tractor, Truck, Scale, Thermometer,
  Sprout, Shield, Clock, Search, Filter, Package, Cog, Users
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
interface Insumo {
  id: string; producto: string; cat: string; stock: number; minimo: number;
  unidad: string; costoUnitario: number; ingredienteActivo?: string;
  indicaciones?: string; dosisSugerida?: string;
}

interface Equipo {
  id: string; nombre: string; marca: string; modelo: string;
  tipo: 'Herramienta' | 'Maquinaria' | 'Vehículo' | 'Instrumento';
  estado: 'Operativo' | 'En Mantenimiento' | 'Fuera de servicio';
  valor: number; fechaCompra: string;
  horasUso?: number; combustibleMes?: number; parcelaAsignada?: string;
  proximoMantenimiento?: string; frecuenciaMantenimiento?: string;
  responsable?: string; notasMantenimiento?: string;
}

interface Movimiento {
  id: string; itemId: string; itemNombre: string; itemTipo: 'insumo' | 'equipo';
  tipo: 'entrada' | 'salida'; cantidad: number; fecha: string;
  motivo: string; destino: string; observaciones: string;
  fuente?: string;
}

interface SugerenciaSalida {
  motivo: string; destino: string; cantidadSugerida: number; fuente: string; origen: 'nova_guard' | 'nutricion' | 'vital' | 'jornales';
}

/* ═══════════════════════════════════════════
   CONSTANTS & DEMO DATA
   ═══════════════════════════════════════════ */
const PROVEEDORES = ['AgroInsumos del Valle', 'Fertiquímica S.A.', 'BioControl Centroamérica', 'Agroveterinaria La Unión', 'Café Import Export', 'Distribuidora Nacional', 'Otro'];
const RESPONSABLES = ['Carlos Méndez (Jefe de campo)', 'María López (Técnica agrícola)', 'Roberto Jiménez (Operador maquinaria)', 'Ana Solano (Bodega)', 'Luis Herrera (Chofer)', 'Sin asignar'];
const FRECUENCIAS_MANT = ['Cada 100 hrs', 'Cada 250 hrs', 'Cada 500 hrs', 'Mensual', 'Trimestral', 'Semestral', 'Anual'];

const MOTIVOS_SALIDA = ['Aplicación programada', 'Recomendación Nova Guard', 'Recomendación VITAL', 'Plan de nutrición', 'Entrega a productor', 'Despacho a finca', 'Mantenimiento de equipo', 'Combustible maquinaria', 'Merma / Vencimiento', 'Otro'];
const MOTIVOS_ENTRADA = ['Compra a proveedor', 'Donación', 'Devolución de productor', 'Transferencia entre bodegas', 'Otro'];
const FINCAS_DESTINO = ['Finca El Progreso - Vereda Norte', 'Finca La Unión - Vereda Sur', 'Finca San José - Vereda Central', 'Finca Las Flores - Vereda Este', 'Bodega Central', 'Entrega directa a productor'];

const CATS_INSUMO = ['Fertilizantes', 'Fungicidas', 'Biocontrol', 'Herbicidas', 'Enmiendas', 'Empaque', 'Combustible', 'Semillas', 'Otro'];

const insumosInicial: Insumo[] = [
  { id: '1', producto: 'Fertilizante 18-5-15-6-2(MgO-S)', cat: 'Fertilizantes', stock: 45, minimo: 20, unidad: 'sacos (50 kg)', costoUnitario: 28500, ingredienteActivo: 'NPK + MgO + S', indicaciones: 'Aplicar al suelo en corona, 2 veces/año', dosisSugerida: '200 g/planta' },
  { id: '2', producto: 'Caldo bordelés (cobre orgánico)', cat: 'Fungicidas', stock: 12, minimo: 15, unidad: 'litros', costoUnitario: 8200, ingredienteActivo: 'Sulfato de cobre + cal', indicaciones: 'Aplicar foliar preventivo cada 21 días', dosisSugerida: '3-5 cc/L agua' },
  { id: '3', producto: 'Beauveria bassiana', cat: 'Biocontrol', stock: 3, minimo: 10, unidad: 'litros', costoUnitario: 15000, ingredienteActivo: 'Beauveria bassiana 1×10⁹ UFC/ml', indicaciones: 'Control biológico de broca. Aplicar en aspersión.', dosisSugerida: '2 ml/L agua' },
  { id: '4', producto: 'Cal dolomita', cat: 'Enmiendas', stock: 8, minimo: 10, unidad: 'sacos (25 kg)', costoUnitario: 9500, ingredienteActivo: 'CaMg(CO₃)₂', indicaciones: 'Corrección pH suelo ácido. Aplicar pre-siembra.', dosisSugerida: '1-2 t/ha según análisis' },
  { id: '5', producto: 'Sacos de yute exportación', cat: 'Empaque', stock: 200, minimo: 100, unidad: 'unidades', costoUnitario: 1800 },
  { id: '6', producto: 'Bolsas plásticas 25 kg', cat: 'Empaque', stock: 16, minimo: 20, unidad: 'bolsas', costoUnitario: 450 },
  { id: '7', producto: 'Alambre púas', cat: 'Otro', stock: 150, minimo: 100, unidad: 'metros', costoUnitario: 180 },
  { id: '8', producto: 'Diésel', cat: 'Combustible', stock: 120, minimo: 50, unidad: 'litros', costoUnitario: 980 },
  { id: '9', producto: 'Gasolina regular', cat: 'Combustible', stock: 35, minimo: 30, unidad: 'litros', costoUnitario: 890 },
  { id: '10', producto: 'Bomba de mochila', cat: 'Otro', stock: 2, minimo: 1, unidad: 'unidades', costoUnitario: 45000 },
];

const equiposInicial: Equipo[] = [
  { id: 'e1', nombre: 'Balanza digital', marca: 'Torrey', modelo: 'EQB-50', tipo: 'Instrumento', estado: 'Operativo', valor: 95000, fechaCompra: '2023-03-15', horasUso: 1200, parcelaAsignada: 'Bodega Central', responsable: 'Ana Solano (Bodega)' },
  { id: 'e2', nombre: 'Bomba de fumigación', marca: 'Solo', modelo: '423', tipo: 'Maquinaria', estado: 'Operativo', valor: 185000, fechaCompra: '2023-06-20', horasUso: 340, combustibleMes: 8, parcelaAsignada: 'Finca El Progreso', proximoMantenimiento: '2026-04-01', frecuenciaMantenimiento: 'Cada 250 hrs', responsable: 'Carlos Méndez (Jefe de campo)' },
  { id: 'e3', nombre: 'Desbrozadora', marca: 'Stihl', modelo: 'FS 120', tipo: 'Maquinaria', estado: 'En Mantenimiento', valor: 320000, fechaCompra: '2022-11-10', horasUso: 890, combustibleMes: 15, proximoMantenimiento: '2026-03-15', frecuenciaMantenimiento: 'Cada 250 hrs', responsable: 'Roberto Jiménez (Operador maquinaria)', notasMantenimiento: 'Filtro de aire y bujía en reemplazo' },
  { id: 'e4', nombre: 'Medidor humedad', marca: 'Delmhorst', modelo: 'G-7', tipo: 'Instrumento', estado: 'Operativo', valor: 125000, fechaCompra: '2024-01-05', horasUso: 200, parcelaAsignada: 'Bodega Central', responsable: 'Ana Solano (Bodega)' },
  { id: 'e5', nombre: 'Motosierra', marca: 'Stihl', modelo: 'MS 250', tipo: 'Maquinaria', estado: 'Operativo', valor: 450000, fechaCompra: '2023-09-01', horasUso: 560, combustibleMes: 12, parcelaAsignada: 'Finca La Unión', frecuenciaMantenimiento: 'Cada 100 hrs', responsable: 'Roberto Jiménez (Operador maquinaria)' },
  { id: 'e6', nombre: 'Pick-up de trabajo', marca: 'Toyota', modelo: 'Hilux 4×4', tipo: 'Vehículo', estado: 'Operativo', valor: 12500000, fechaCompra: '2024-06-15', horasUso: 8500, combustibleMes: 180, parcelaAsignada: 'Ruta general', proximoMantenimiento: '2026-03-20', frecuenciaMantenimiento: 'Cada 500 hrs', responsable: 'Luis Herrera (Chofer)' },
  { id: 'e7', nombre: 'Secadora solar', marca: 'Artesanal', modelo: 'Tipo parabólico', tipo: 'Maquinaria', estado: 'Operativo', valor: 280000, fechaCompra: '2022-02-20', parcelaAsignada: 'Beneficio Central', responsable: 'Carlos Méndez (Jefe de campo)' },
  { id: 'e8', nombre: 'Despulpadora', marca: 'JM Estrada', modelo: 'No. 3', tipo: 'Maquinaria', estado: 'Operativo', valor: 950000, fechaCompra: '2021-08-10', horasUso: 2400, parcelaAsignada: 'Beneficio Central', proximoMantenimiento: '2026-05-01', frecuenciaMantenimiento: 'Semestral', responsable: 'Carlos Méndez (Jefe de campo)' },
];

const historialInicial: Movimiento[] = [
  { id: 'h1', itemId: '3', itemNombre: 'Beauveria bassiana', itemTipo: 'insumo', tipo: 'salida', cantidad: 42, fecha: '2025-11-29', motivo: 'Stock muy bajo', destino: 'Finca El Progreso', observaciones: 'Consumo acelerado por broca', fuente: 'Nova Guard' },
  { id: 'h2', itemId: '5', itemNombre: 'Sacos de yute exportación', itemTipo: 'insumo', tipo: 'salida', cantidad: 5, fecha: '2025-11-19', motivo: 'Con carga de café', destino: 'Exportador', observaciones: '' },
  { id: 'h3', itemId: '10', itemNombre: 'Bomba de mochila', itemTipo: 'insumo', tipo: 'salida', cantidad: 2, fecha: '2025-11-14', motivo: 'Rotos durante recolección', destino: 'Baja', observaciones: '' },
  { id: 'h4', itemId: '1', itemNombre: 'Fertilizante 18-5-15', itemTipo: 'insumo', tipo: 'salida', cantidad: 1, fecha: '2025-10-19', motivo: 'Lote 1', destino: 'Finca La Unión', observaciones: 'Plan nutrición parcela 3', fuente: 'Nutrición' },
  { id: 'h5', itemId: '2', itemNombre: 'Caldo bordelés', itemTipo: 'insumo', tipo: 'salida', cantidad: 0.5, fecha: '2025-10-14', motivo: 'Control de roya detectada', destino: 'Finca San José', observaciones: 'Alerta roya activa', fuente: 'Nova Guard' },
  { id: 'h6', itemId: '1', itemNombre: 'Fertilizante 18-5-15', itemTipo: 'insumo', tipo: 'entrada', cantidad: 30, fecha: '2025-10-04', motivo: 'Para transporte a cooperativa', destino: 'Bodega Central', observaciones: 'Compra trimestral' },
  { id: 'h7', itemId: '8', itemNombre: 'Diésel', itemTipo: 'insumo', tipo: 'salida', cantidad: 45, fecha: '2025-10-01', motivo: 'Combustible maquinaria', destino: 'Pick-up Hilux', observaciones: 'Jornada de cosecha semana 40', fuente: 'Jornales' },
  { id: 'h8', itemId: 'e3', itemNombre: 'Desbrozadora Stihl', itemTipo: 'equipo', tipo: 'salida', cantidad: 1, fecha: '2025-09-28', motivo: 'Enviada a mantenimiento', destino: 'Taller externo', observaciones: 'Filtro de aire + bujía' },
];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
const getEstado = (stock: number, minimo: number) => {
  if (stock <= minimo * 0.3) return 'critico';
  if (stock <= minimo) return 'bajo';
  return 'ok';
};

const stockPercent = (stock: number, minimo: number) => {
  if (minimo <= 0) return 100;
  const ratio = stock / (minimo * 2);
  return Math.min(100, Math.max(0, ratio * 100));
};

const fmtCRC = (n: number) => `₡${n.toLocaleString()}`;
const fmtDate = (d: string) => {
  const date = new Date(d + 'T12:00:00');
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
};


function getSugerenciasSalida(insumo: Insumo): SugerenciaSalida[] {
  const sugerencias: SugerenciaSalida[] = [];
  if (insumo.cat === 'Fertilizantes') {
    sugerencias.push({ motivo: 'Plan de nutrición', destino: 'Finca El Progreso - Vereda Norte', cantidadSugerida: 5, fuente: 'Plan fertilización Feb-Mar: 5 sacos para 2.5 ha (parcela 3)', origen: 'nutricion' });
    sugerencias.push({ motivo: 'Entrega a productor', destino: 'Entrega directa a productor', cantidadSugerida: 3, fuente: 'Crédito insumos activo: Juan Pérez López (3 sacos aprobados)', origen: 'vital' });
  }
  if (insumo.cat === 'Fungicidas') sugerencias.push({ motivo: 'Recomendación Nova Guard', destino: 'Finca La Unión - Vereda Sur', cantidadSugerida: 4, fuente: 'Alerta Roya: Incidencia 12% en Vereda Sur — aplicación foliar preventiva', origen: 'nova_guard' });
  if (insumo.cat === 'Biocontrol') sugerencias.push({ motivo: 'Recomendación Nova Guard', destino: 'Finca San José - Vereda Central', cantidadSugerida: 2, fuente: 'Alerta Broca: Nivel 3% en Vereda Central — aspersión recomendada', origen: 'nova_guard' });
  if (insumo.cat === 'Enmiendas') sugerencias.push({ motivo: 'Recomendación VITAL', destino: 'Finca Las Flores - Vereda Este', cantidadSugerida: 4, fuente: 'VITAL: pH 4.8 detectado, encalado Kamprath sugerido (1.2 t/ha)', origen: 'nutricion' });
  if (insumo.cat === 'Combustible') sugerencias.push({ motivo: 'Combustible maquinaria', destino: 'Pick-up Hilux 4×4', cantidadSugerida: 45, fuente: 'Jornales: Cosecha semana 11 — ruta Vereda Norte y Sur', origen: 'jornales' });
  return sugerencias;
}

const origenIcon = (o: string) => {
  if (o === 'nova_guard' || o === 'Nova Guard') return <Shield className="h-3.5 w-3.5 text-amber-500" />;
  if (o === 'nutricion' || o === 'Nutrición') return <Sprout className="h-3.5 w-3.5 text-primary" />;
  if (o === 'jornales' || o === 'Jornales') return <Clock className="h-3.5 w-3.5 text-blue-400" />;
  return <Package className="h-3.5 w-3.5 text-muted-foreground" />;
};

const equipoIcon = (tipo: string) => {
  if (tipo === 'Vehículo') return <Truck className="h-4 w-4" />;
  if (tipo === 'Maquinaria') return <Tractor className="h-4 w-4" />;
  if (tipo === 'Instrumento') return <Thermometer className="h-4 w-4" />;
  return <Wrench className="h-4 w-4" />;
};

const estadoEquipoBadge = (estado: string) => {
  if (estado === 'Operativo') return <Badge className="bg-emerald-600/90 text-white border-0 text-[10px]">Operativo</Badge>;
  if (estado === 'En Mantenimiento') return <Badge className="bg-amber-500/90 text-white border-0 text-[10px]">En Mantenimiento</Badge>;
  return <Badge variant="destructive" className="text-[10px]">Fuera de servicio</Badge>;
};

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function InventarioTab() {
  const [insumos, setInsumos] = useState(insumosInicial);
  const [equipos, setEquipos] = useState(equiposInicial);
  const [movimientos, setMovimientos] = useState<Movimiento[]>(historialInicial);

  // Dialogs
  const [showAdd, setShowAdd] = useState(false);
  const [showAddEquipo, setShowAddEquipo] = useState(false);
  const [showMovimiento, setShowMovimiento] = useState<{ insumo: Insumo; tipo: 'entrada' | 'salida' } | null>(null);
  const [showEdit, setShowEdit] = useState<Insumo | null>(null);
  const [showDetalle, setShowDetalle] = useState<Insumo | null>(null);
  const [showDetalleEquipo, setShowDetalleEquipo] = useState<Equipo | null>(null);

  // Movimiento form
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [destino, setDestino] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [proveedor, setProveedor] = useState('');

  // Add insumo form
  const [nuevoInsumo, setNuevoInsumo] = useState({ producto: '', cat: 'Fertilizantes', stock: '', minimo: '', unidad: '', costoUnitario: '', ingredienteActivo: '', indicaciones: '', dosisSugerida: '' });

  // Filters
  const [searchInsumo, setSearchInsumo] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [searchEquipo, setSearchEquipo] = useState('');
  const [filterHistorial, setFilterHistorial] = useState<'all' | 'entrada' | 'salida'>('all');

  // KPIs
  const valorTotal = insumos.reduce((s, i) => s + i.stock * i.costoUnitario, 0);
  const alertasBajas = insumos.filter(i => getEstado(i.stock, i.minimo) !== 'ok').length;
  const valorEquipos = equipos.reduce((s, e) => s + e.valor, 0);
  const equiposMantenimiento = equipos.filter(e => e.estado !== 'Operativo').length;
  const combustibleMes = equipos.reduce((s, e) => s + (e.combustibleMes || 0), 0);

  const sugerencias = showMovimiento?.tipo === 'salida' ? getSugerenciasSalida(showMovimiento.insumo) : [];

  // Filtered lists
  const filteredInsumos = useMemo(() => {
    return insumos.filter(i => {
      if (searchInsumo && !i.producto.toLowerCase().includes(searchInsumo.toLowerCase())) return false;
      if (filterCat !== 'all' && i.cat !== filterCat) return false;
      return true;
    });
  }, [insumos, searchInsumo, filterCat]);

  const filteredEquipos = useMemo(() => {
    return equipos.filter(e => {
      if (searchEquipo && !e.nombre.toLowerCase().includes(searchEquipo.toLowerCase()) && !e.marca.toLowerCase().includes(searchEquipo.toLowerCase())) return false;
      return true;
    });
  }, [equipos, searchEquipo]);

  const filteredMovimientos = useMemo(() => {
    if (filterHistorial === 'all') return movimientos;
    return movimientos.filter(m => m.tipo === filterHistorial);
  }, [movimientos, filterHistorial]);

  // Handlers
  const resetMovForm = () => { setCantidad(''); setMotivo(''); setDestino(''); setObservaciones(''); setProveedor(''); };
  const applySugerencia = (s: SugerenciaSalida) => { setCantidad(String(s.cantidadSugerida)); setMotivo(s.motivo); setDestino(s.destino); setObservaciones(s.fuente); };

  const handleMovimiento = () => {
    if (!showMovimiento || !cantidad || Number(cantidad) <= 0) { toast.error('Ingrese una cantidad válida'); return; }
    if (!motivo) { toast.error('Seleccione un motivo'); return; }
    if (showMovimiento.tipo === 'salida' && !destino) { toast.error('Seleccione un destino'); return; }
    const qty = Number(cantidad);
    if (showMovimiento.tipo === 'salida' && qty > showMovimiento.insumo.stock) { toast.error(`Stock insuficiente. Disponible: ${showMovimiento.insumo.stock} ${showMovimiento.insumo.unidad}`); return; }
    const mov: Movimiento = {
      id: String(Date.now()), itemId: showMovimiento.insumo.id, itemNombre: showMovimiento.insumo.producto,
      itemTipo: 'insumo', tipo: showMovimiento.tipo, cantidad: qty,
      fecha: new Date().toISOString().slice(0, 10), motivo, destino: showMovimiento.tipo === 'salida' ? destino : motivo, observaciones
    };
    setMovimientos(prev => [mov, ...prev]);
    setInsumos(prev => prev.map(i => {
      if (i.id !== showMovimiento.insumo.id) return i;
      return { ...i, stock: showMovimiento.tipo === 'entrada' ? i.stock + qty : Math.max(0, i.stock - qty) };
    }));
    toast.success(`${showMovimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada: ${qty} ${showMovimiento.insumo.unidad}`);
    setShowMovimiento(null); resetMovForm();
  };

  const handleAddInsumo = () => {
    if (!nuevoInsumo.producto || !nuevoInsumo.unidad) { toast.error('Complete los campos obligatorios'); return; }
    const nuevo: Insumo = {
      id: String(Date.now()), producto: nuevoInsumo.producto, cat: nuevoInsumo.cat,
      stock: Number(nuevoInsumo.stock) || 0, minimo: Number(nuevoInsumo.minimo) || 0,
      unidad: nuevoInsumo.unidad, costoUnitario: Number(nuevoInsumo.costoUnitario) || 0,
      ingredienteActivo: nuevoInsumo.ingredienteActivo || undefined,
      indicaciones: nuevoInsumo.indicaciones || undefined,
      dosisSugerida: nuevoInsumo.dosisSugerida || undefined,
    };
    setInsumos(prev => [...prev, nuevo]);
    toast.success(`Insumo "${nuevo.producto}" agregado`);
    setShowAdd(false);
    setNuevoInsumo({ producto: '', cat: 'Fertilizantes', stock: '', minimo: '', unidad: '', costoUnitario: '', ingredienteActivo: '', indicaciones: '', dosisSugerida: '' });
  };

  const handleEditSave = () => { if (!showEdit) return; setInsumos(prev => prev.map(i => i.id === showEdit.id ? showEdit : i)); toast.success('Insumo actualizado'); setShowEdit(null); };

  return (
    <div className="space-y-4">
      {/* ═══ KPI BAR ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Insumos', value: String(insumos.length), icon: Boxes, accent: false },
          { label: 'Alertas Stock', value: String(alertasBajas), icon: AlertTriangle, accent: alertasBajas > 0 },
          { label: 'Valor Insumos', value: fmtCRC(valorTotal), icon: Wallet, accent: false },
          { label: 'Valor Equipos', value: fmtCRC(valorEquipos), icon: Wrench, accent: false },
          { label: 'Combustible/mes', value: `${combustibleMes} L`, icon: Fuel, accent: false },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-3 pb-2.5 px-4">
              <div className="flex items-center gap-1.5 mb-0.5">
                <k.icon className={`h-3.5 w-3.5 ${k.accent ? 'text-destructive' : 'text-primary'}`} />
                <span className="text-[11px] text-muted-foreground">{k.label}</span>
              </div>
              <p className={`text-lg font-bold ${k.accent ? 'text-destructive' : 'text-foreground'}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ SUB-TABS ═══ */}
      <Tabs defaultValue="insumos" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="insumos" className="gap-1.5"><Package className="h-4 w-4" /> Insumos</TabsTrigger>
          <TabsTrigger value="equipos" className="gap-1.5"><Cog className="h-4 w-4" /> Equipos</TabsTrigger>
          <TabsTrigger value="historial" className="gap-1.5"><History className="h-4 w-4" /> Historial</TabsTrigger>
        </TabsList>

        {/* ─── INSUMOS TAB ─── */}
        <TabsContent value="insumos" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Inventario de Insumos</CardTitle>
                <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Agregar insumo</Button>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar insumo..." value={searchInsumo} onChange={e => setSearchInsumo(e.target.value)} className="pl-9 h-9" />
                </div>
                <Select value={filterCat} onValueChange={setFilterCat}>
                  <SelectTrigger className="w-[160px] h-9"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {CATS_INSUMO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {filteredInsumos.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No se encontraron insumos</p>}
              {filteredInsumos.map(item => {
                const estado = getEstado(item.stock, item.minimo);
                const pct = stockPercent(item.stock, item.minimo);
                const progressColor = estado === 'critico' ? 'bg-destructive' : estado === 'bajo' ? 'bg-amber-500' : 'bg-primary';
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-4 transition-all hover:shadow-md cursor-pointer ${estado === 'critico' ? 'border-destructive/40 bg-destructive/5' : estado === 'bajo' ? 'border-amber-500/30 bg-amber-500/5' : 'border-border'}`}
                    onClick={() => setShowDetalle(item)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{item.producto}</span>
                          <Badge variant="outline" className="text-[10px]">{item.cat}</Badge>
                          {estado === 'bajo' && <Badge className="bg-amber-500/90 text-white border-0 text-[10px]">⚠ Stock bajo</Badge>}
                          {estado === 'critico' && <Badge variant="destructive" className="text-[10px]">⚠ Crítico</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{item.stock} <span className="font-normal text-muted-foreground">{item.unidad}</span></span>
                          <span>@ {fmtCRC(item.costoUnitario)}/{item.unidad.split(' ')[0]}</span>
                          <span>Mín: {item.minimo}</span>
                        </div>
                        <div className="mt-2.5 max-w-md">
                          <Progress value={pct} className="h-1.5 bg-muted [&>div]:transition-all" style={{ ['--tw-progress' as string]: progressColor }}>
                            <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${pct}%` }} />
                          </Progress>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" title="Entrada" onClick={e => { e.stopPropagation(); setShowMovimiento({ insumo: item, tipo: 'entrada' }); resetMovForm(); }}>
                          <Plus className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Salida" onClick={e => { e.stopPropagation(); setShowMovimiento({ insumo: item, tipo: 'salida' }); resetMovForm(); }}>
                          <Minus className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setShowMovimiento({ insumo: item, tipo: 'salida' }); resetMovForm(); }}>
                          Registrar <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── EQUIPOS TAB ─── */}
        <TabsContent value="equipos" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Equipos y Vehículos</CardTitle>
                <Button size="sm" onClick={() => setShowAddEquipo(true)}><Plus className="h-4 w-4 mr-1" /> Agregar equipo</Button>
              </div>
              <div className="relative mt-2 max-w-sm">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar equipo..." value={searchEquipo} onChange={e => setSearchEquipo(e.target.value)} className="pl-9 h-9" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredEquipos.map(eq => (
                  <div
                    key={eq.id}
                    className="rounded-lg border border-border p-4 hover:shadow-md transition-all cursor-pointer hover:border-primary/30"
                    onClick={() => setShowDetalleEquipo(eq)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{eq.nombre}</p>
                        <p className="text-sm text-muted-foreground">{eq.marca} - {eq.modelo}</p>
                      </div>
                      {estadoEquipoBadge(eq.estado)}
                    </div>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <Badge variant="outline" className="gap-1 text-[10px]">{equipoIcon(eq.tipo)} {eq.tipo}</Badge>
                      <span className="text-sm font-medium text-muted-foreground">{fmtCRC(eq.valor)}</span>
                    </div>
                    {(eq.horasUso || eq.combustibleMes || eq.proximoMantenimiento) && (
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                        {eq.horasUso && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {eq.horasUso.toLocaleString()} hrs</span>}
                        {eq.combustibleMes && <span className="flex items-center gap-1"><Fuel className="h-3 w-3" /> {eq.combustibleMes} L/mes</span>}
                        {eq.proximoMantenimiento && <span className="flex items-center gap-1"><Wrench className="h-3 w-3" /> Mant: {fmtDate(eq.proximoMantenimiento)}</span>}
                      </div>
                    )}
                  </div>
                ))}

              </div>
              {filteredEquipos.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No se encontraron equipos</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── HISTORIAL TAB ─── */}
        <TabsContent value="historial" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Historial de Movimientos</CardTitle>
                <div className="flex gap-1.5">
                  {(['all', 'entrada', 'salida'] as const).map(f => (
                    <Button key={f} variant={filterHistorial === f ? 'default' : 'outline'} size="sm" onClick={() => setFilterHistorial(f)}>
                      {f === 'all' ? 'Todos' : f === 'entrada' ? 'Entradas' : 'Salidas'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {filteredMovimientos.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No hay movimientos registrados</p>}
              {filteredMovimientos.map(m => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-3.5 hover:bg-muted/30 transition-colors">
                  <div className={`shrink-0 w-14 h-10 rounded-md flex items-center justify-center font-bold text-sm ${m.tipo === 'entrada' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-destructive/15 text-destructive'}`}>
                    {m.tipo === 'entrada' ? '+' : '-'} {m.cantidad}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm truncate">{m.motivo || m.itemNombre}</span>
                      {m.fuente && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          {origenIcon(m.fuente)} {m.fuente}
                        </span>
                      )}
                    </div>
                    {m.observaciones && <p className="text-xs text-muted-foreground truncate mt-0.5">{m.observaciones}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{fmtDate(m.fecha)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════════ */}

      {/* ─── DETALLE INSUMO ─── */}
      <Dialog open={!!showDetalle} onOpenChange={() => setShowDetalle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ficha de Insumo</DialogTitle></DialogHeader>
          {showDetalle && (() => {
            const estado = getEstado(showDetalle.stock, showDetalle.minimo);
            const movs = movimientos.filter(m => m.itemId === showDetalle.id);
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold text-foreground">{showDetalle.producto}</span>
                  <Badge variant="outline">{showDetalle.cat}</Badge>
                  {estado !== 'ok' && <Badge variant={estado === 'critico' ? 'destructive' : 'secondary'} className={estado === 'bajo' ? 'bg-amber-500 text-white border-0' : ''}>
                    {estado === 'critico' ? 'Crítico' : 'Stock bajo'}
                  </Badge>}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50"><span className="text-muted-foreground block text-xs">Stock actual</span><span className="font-bold text-foreground text-lg">{showDetalle.stock}</span> <span className="text-muted-foreground">{showDetalle.unidad}</span></div>
                  <div className="p-3 rounded-lg bg-muted/50"><span className="text-muted-foreground block text-xs">Mínimo / Costo</span><span className="font-bold text-foreground">{showDetalle.minimo}</span> <span className="text-muted-foreground">· {fmtCRC(showDetalle.costoUnitario)}/u</span></div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm"><span className="text-muted-foreground block text-xs">Valor en bodega</span><span className="font-bold text-foreground text-lg">{fmtCRC(showDetalle.stock * showDetalle.costoUnitario)}</span></div>
                {showDetalle.ingredienteActivo && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ficha Técnica</p>
                    <div className="text-sm space-y-1">
                      <div><span className="text-muted-foreground">Ingrediente activo:</span> <span className="text-foreground">{showDetalle.ingredienteActivo}</span></div>
                      {showDetalle.indicaciones && <div><span className="text-muted-foreground">Indicaciones:</span> <span className="text-foreground">{showDetalle.indicaciones}</span></div>}
                      {showDetalle.dosisSugerida && <div><span className="text-muted-foreground">Dosis sugerida:</span> <span className="text-foreground">{showDetalle.dosisSugerida}</span></div>}
                    </div>
                  </div>
                )}
                {movs.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Últimos Movimientos</p>
                    {movs.slice(0, 4).map(m => (
                      <div key={m.id} className="flex items-center gap-2 text-sm">
                        <span className={`font-bold ${m.tipo === 'entrada' ? 'text-emerald-500' : 'text-destructive'}`}>{m.tipo === 'entrada' ? '+' : '-'}{m.cantidad}</span>
                        <span className="text-foreground">{m.motivo}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{fmtDate(m.fecha)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={() => { setShowDetalle(null); setShowMovimiento({ insumo: showDetalle, tipo: 'entrada' }); resetMovForm(); }}>
                    <Plus className="h-4 w-4 mr-1" /> Entrada
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => { setShowDetalle(null); setShowMovimiento({ insumo: showDetalle, tipo: 'salida' }); resetMovForm(); }}>
                    <Minus className="h-4 w-4 mr-1" /> Salida
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setShowDetalle(null); setShowEdit({ ...showDetalle }); }}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── DETALLE EQUIPO (EDITABLE) ─── */}
      <Dialog open={!!showDetalleEquipo} onOpenChange={() => setShowDetalleEquipo(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ficha de Equipo</DialogTitle></DialogHeader>
          {showDetalleEquipo && (() => {
            const eq = showDetalleEquipo;
            const movs = movimientos.filter(m => m.itemId === eq.id);
            return (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold text-foreground">{eq.nombre}</p>
                    <p className="text-sm text-muted-foreground">{eq.marca} — {eq.modelo}</p>
                  </div>
                  {estadoEquipoBadge(eq.estado)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50"><span className="text-muted-foreground block text-xs">Tipo</span><span className="font-bold text-foreground flex items-center gap-1.5">{equipoIcon(eq.tipo)} {eq.tipo}</span></div>
                  <div className="p-3 rounded-lg bg-muted/50"><span className="text-muted-foreground block text-xs">Valor</span><span className="font-bold text-foreground">{fmtCRC(eq.valor)}</span></div>
                  <div className="p-3 rounded-lg bg-muted/50"><span className="text-muted-foreground block text-xs">Fecha compra</span><span className="text-foreground">{fmtDate(eq.fechaCompra)}</span></div>
                  <div className="p-3 rounded-lg bg-muted/50"><span className="text-muted-foreground block text-xs">Horas uso</span><span className="text-foreground">{eq.horasUso?.toLocaleString() ?? '—'} hrs</span></div>
                </div>


                {/* Operación (read-only) */}
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operación</p>
                  <div className="text-sm space-y-2">
                    {eq.parcelaAsignada && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-foreground">{eq.parcelaAsignada}</span></div>}
                    {eq.combustibleMes && <div className="flex items-center gap-2"><Fuel className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-foreground">{eq.combustibleMes} litros/mes</span></div>}
                  </div>
                </div>

                {/* Responsable (editable) */}
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Responsable (Jornales)</p>
                  <Select value={eq.responsable || ''} onValueChange={v => {
                    const updated = { ...eq, responsable: v };
                    setShowDetalleEquipo(updated);
                    setEquipos(prev => prev.map(e => e.id === eq.id ? updated : e));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Asignar responsable..." /></SelectTrigger>
                    <SelectContent>{RESPONSABLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Mantenimiento (editable) */}
                <div className="space-y-3 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> Mantenimiento</p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Frecuencia</Label>
                      <Select value={eq.frecuenciaMantenimiento || ''} onValueChange={v => {
                        const updated = { ...eq, frecuenciaMantenimiento: v };
                        setShowDetalleEquipo(updated);
                        setEquipos(prev => prev.map(e => e.id === eq.id ? updated : e));
                      }}>
                        <SelectTrigger><SelectValue placeholder="Seleccione frecuencia..." /></SelectTrigger>
                        <SelectContent>{FRECUENCIAS_MANT.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Próximo mantenimiento</Label>
                      <Input type="date" value={eq.proximoMantenimiento || ''} onChange={e => {
                        const updated = { ...eq, proximoMantenimiento: e.target.value };
                        setShowDetalleEquipo(updated);
                        setEquipos(prev => prev.map(e2 => e2.id === eq.id ? updated : e2));
                      }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estado del equipo</Label>
                      <Select value={eq.estado} onValueChange={v => {
                        const updated = { ...eq, estado: v as Equipo['estado'] };
                        setShowDetalleEquipo(updated);
                        setEquipos(prev => prev.map(e => e.id === eq.id ? updated : e));
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Operativo">Operativo</SelectItem>
                          <SelectItem value="En Mantenimiento">En Mantenimiento</SelectItem>
                          <SelectItem value="Fuera de servicio">Fuera de servicio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notas de mantenimiento</Label>
                      <Textarea rows={2} placeholder="Estado actual, observaciones..." value={eq.notasMantenimiento || ''} onChange={e => {
                        const updated = { ...eq, notasMantenimiento: e.target.value };
                        setShowDetalleEquipo(updated);
                        setEquipos(prev => prev.map(e2 => e2.id === eq.id ? updated : e2));
                      }} />
                    </div>
                  </div>
                </div>

                {/* Horas de uso editable */}
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Registrar Horas</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Horas acumuladas</Label>
                      <Input type="number" value={eq.horasUso ?? ''} onChange={e => {
                        const updated = { ...eq, horasUso: Number(e.target.value) || 0 };
                        setShowDetalleEquipo(updated);
                        setEquipos(prev => prev.map(e2 => e2.id === eq.id ? updated : e2));
                      }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Combustible mes (L)</Label>
                      <Input type="number" value={eq.combustibleMes ?? ''} onChange={e => {
                        const updated = { ...eq, combustibleMes: Number(e.target.value) || 0 };
                        setShowDetalleEquipo(updated);
                        setEquipos(prev => prev.map(e2 => e2.id === eq.id ? updated : e2));
                      }} />
                    </div>
                  </div>
                </div>

                {movs.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historial</p>
                    {movs.slice(0, 4).map(m => (
                      <div key={m.id} className="text-sm flex items-center gap-2">
                        <span className="text-muted-foreground">{fmtDate(m.fecha)}</span>
                        <span className="text-foreground">{m.motivo}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button className="w-full" variant="outline" onClick={() => {
                  toast.success(`Equipo "${eq.nombre}" actualizado`);
                  setShowDetalleEquipo(null);
                }}>
                  Guardar Cambios
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── MOVIMIENTO DIALOG ─── */}
      <Dialog open={!!showMovimiento} onOpenChange={() => { setShowMovimiento(null); resetMovForm(); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showMovimiento?.tipo === 'entrada' ? <><Plus className="h-5 w-5 text-emerald-500" /> Registrar Entrada</> : <><Minus className="h-5 w-5 text-destructive" /> Registrar Salida</>}
            </DialogTitle>
          </DialogHeader>
          {showMovimiento && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="text-sm"><span className="text-muted-foreground">Insumo:</span> <span className="font-medium text-foreground">{showMovimiento.insumo.producto}</span></div>
                <div className="text-sm mt-1"><span className="text-muted-foreground">Stock actual:</span> <span className="font-bold text-foreground">{showMovimiento.insumo.stock} {showMovimiento.insumo.unidad}</span></div>
              </div>
              {showMovimiento.tipo === 'salida' && sugerencias.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sugerencias inteligentes</p>
                  {sugerencias.map((s, i) => (
                    <button key={i} onClick={() => applySugerencia(s)} className="w-full text-left p-3 rounded-lg border border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all group">
                      <div className="flex items-start gap-2">
                        {origenIcon(s.origen)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{s.cantidadSugerida} {showMovimiento.insumo.unidad} → {s.destino}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.fuente}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="space-y-2"><Label>Motivo *</Label>
                <Select value={motivo} onValueChange={setMotivo}><SelectTrigger><SelectValue placeholder="Seleccione motivo..." /></SelectTrigger>
                  <SelectContent>{(showMovimiento.tipo === 'salida' ? MOTIVOS_SALIDA : MOTIVOS_ENTRADA).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {showMovimiento.tipo === 'entrada' && (
                <div className="space-y-2"><Label>Proveedor</Label>
                  <Select value={proveedor} onValueChange={setProveedor}><SelectTrigger><SelectValue placeholder="Seleccione proveedor..." /></SelectTrigger>
                    <SelectContent>{PROVEEDORES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {showMovimiento.tipo === 'salida' && (
                <div className="space-y-2"><Label>Destino / Finca *</Label>
                  <Select value={destino} onValueChange={setDestino}><SelectTrigger><SelectValue placeholder="Seleccione destino..." /></SelectTrigger>
                    <SelectContent>{FINCAS_DESTINO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2"><Label>Cantidad ({showMovimiento.insumo.unidad}) *</Label>
                <Input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2"><Label>Observaciones</Label><Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} /></div>
              <Button className="w-full" onClick={handleMovimiento}>Registrar {showMovimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── ADD INSUMO ─── */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5 text-primary" /> Agregar Insumo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nombre del insumo *</Label><Input value={nuevoInsumo.producto} onChange={e => setNuevoInsumo(s => ({ ...s, producto: e.target.value }))} placeholder="Ej: Sulfato de cobre" /></div>
            <div className="space-y-1"><Label>Categoría</Label>
              <Select value={nuevoInsumo.cat} onValueChange={v => setNuevoInsumo(s => ({ ...s, cat: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS_INSUMO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Stock inicial</Label><Input type="number" value={nuevoInsumo.stock} onChange={e => setNuevoInsumo(s => ({ ...s, stock: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Stock mínimo</Label><Input type="number" value={nuevoInsumo.minimo} onChange={e => setNuevoInsumo(s => ({ ...s, minimo: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Unidad *</Label><Input value={nuevoInsumo.unidad} onChange={e => setNuevoInsumo(s => ({ ...s, unidad: e.target.value }))} placeholder="Ej: litros" /></div>
              <div className="space-y-1"><Label>Costo unitario (₡)</Label><Input type="number" value={nuevoInsumo.costoUnitario} onChange={e => setNuevoInsumo(s => ({ ...s, costoUnitario: e.target.value }))} /></div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ficha técnica (opcional)</p>
              <div className="space-y-2">
                <div className="space-y-1"><Label>Ingrediente activo</Label><Input value={nuevoInsumo.ingredienteActivo} onChange={e => setNuevoInsumo(s => ({ ...s, ingredienteActivo: e.target.value }))} placeholder="Ej: NPK 18-5-15" /></div>
                <div className="space-y-1"><Label>Indicaciones</Label><Textarea value={nuevoInsumo.indicaciones} onChange={e => setNuevoInsumo(s => ({ ...s, indicaciones: e.target.value }))} rows={2} placeholder="Modo de aplicación..." /></div>
                <div className="space-y-1"><Label>Dosis sugerida</Label><Input value={nuevoInsumo.dosisSugerida} onChange={e => setNuevoInsumo(s => ({ ...s, dosisSugerida: e.target.value }))} placeholder="Ej: 200 g/planta" /></div>
              </div>
            </div>
            <Button className="w-full" onClick={handleAddInsumo}>Agregar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── ADD EQUIPO ─── */}
      <Dialog open={showAddEquipo} onOpenChange={setShowAddEquipo}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Cog className="h-5 w-5 text-primary" /> Agregar Equipo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nombre *</Label><Input placeholder="Ej: Bomba de fumigación" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Marca</Label><Input placeholder="Ej: Stihl" /></div>
              <div className="space-y-1"><Label>Modelo</Label><Input placeholder="Ej: FS 120" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Tipo</Label>
                <Select defaultValue="Maquinaria"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maquinaria">Maquinaria</SelectItem>
                    <SelectItem value="Vehículo">Vehículo</SelectItem>
                    <SelectItem value="Instrumento">Instrumento</SelectItem>
                    <SelectItem value="Herramienta">Herramienta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Valor (₡)</Label><Input type="number" placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Fecha compra</Label><Input type="date" /></div>
              <div className="space-y-1"><Label>Horas acumuladas</Label><Input type="number" placeholder="0" /></div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Operación</p>
              <div className="space-y-2">
                <div className="space-y-1"><Label>Combustible mensual (L)</Label><Input type="number" placeholder="0" /></div>
                <div className="space-y-1"><Label>Ubicación / Parcela</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Seleccione ubicación..." /></SelectTrigger>
                    <SelectContent>{FINCAS_DESTINO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Responsable (Jornales)</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Asignar responsable..." /></SelectTrigger>
                    <SelectContent>{RESPONSABLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mantenimiento</p>
              <div className="space-y-2">
                <div className="space-y-1"><Label>Frecuencia</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Seleccione frecuencia..." /></SelectTrigger>
                    <SelectContent>{FRECUENCIAS_MANT.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Próximo mantenimiento</Label><Input type="date" /></div>
                <div className="space-y-1"><Label>Notas</Label><Textarea rows={2} placeholder="Estado actual, observaciones..." /></div>
              </div>
            </div>
            <Button className="w-full" onClick={() => { toast.success('Equipo registrado'); setShowAddEquipo(false); }}>Agregar Equipo</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT INSUMO ─── */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit2 className="h-5 w-5 text-primary" /> Editar Insumo</DialogTitle></DialogHeader>
          {showEdit && (
            <div className="space-y-3">
              <div className="space-y-1"><Label>Nombre</Label><Input value={showEdit.producto} onChange={e => setShowEdit(s => s ? { ...s, producto: e.target.value } : s)} /></div>
              <div className="space-y-1"><Label>Categoría</Label>
                <Select value={showEdit.cat} onValueChange={v => setShowEdit(s => s ? { ...s, cat: v } : s)}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATS_INSUMO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Stock mínimo</Label><Input type="number" value={showEdit.minimo} onChange={e => setShowEdit(s => s ? { ...s, minimo: Number(e.target.value) } : s)} /></div>
                <div className="space-y-1"><Label>Costo unitario (₡)</Label><Input type="number" value={showEdit.costoUnitario} onChange={e => setShowEdit(s => s ? { ...s, costoUnitario: Number(e.target.value) } : s)} /></div>
              </div>
              <div className="space-y-1"><Label>Unidad</Label><Input value={showEdit.unidad} onChange={e => setShowEdit(s => s ? { ...s, unidad: e.target.value } : s)} /></div>
              <Button className="w-full" onClick={handleEditSave}>Guardar Cambios</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
