import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Boxes, AlertTriangle, Wallet, Plus, Minus, Edit2, PackagePlus, History, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Insumo {
  id: string;
  producto: string;
  cat: string;
  stock: number;
  minimo: number;
  unidad: string;
  costoUnitario: number;
}

interface Movimiento {
  id: string;
  insumoId: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
  motivo: string;
  destino: string;
  observaciones: string;
}

// Sugerencias contextuales basadas en tareas pendientes y recomendaciones de Nova Guard / VITAL
interface SugerenciaSalida {
  motivo: string;
  destino: string;
  cantidadSugerida: number;
  fuente: string; // De donde viene la recomendacion
}

const MOTIVOS_SALIDA = [
  'Aplicacion programada',
  'Recomendacion Nova Guard',
  'Recomendacion VITAL',
  'Entrega a productor',
  'Despacho a finca',
  'Mantenimiento de equipo',
  'Merma / Vencimiento',
  'Otro',
];

const MOTIVOS_ENTRADA = [
  'Compra a proveedor',
  'Donacion',
  'Devolucion de productor',
  'Transferencia entre bodegas',
  'Otro',
];

const FINCAS_DESTINO = [
  'Finca El Progreso - Vereda Norte',
  'Finca La Union - Vereda Sur',
  'Finca San Jose - Vereda Central',
  'Finca Las Flores - Vereda Este',
  'Bodega Central',
  'Entrega directa a productor',
];

const insumosInicial: Insumo[] = [
  { id: '1', producto: 'Fertilizante 18-5-15-6-2(MgO-S)', cat: 'Fertilizantes', stock: 45, minimo: 20, unidad: 'sacos (50 kg)', costoUnitario: 28500 },
  { id: '2', producto: 'Caldo bordeles (cobre organico)', cat: 'Fungicidas', stock: 12, minimo: 15, unidad: 'litros', costoUnitario: 8200 },
  { id: '3', producto: 'Beauveria bassiana', cat: 'Biocontrol', stock: 3, minimo: 10, unidad: 'litros', costoUnitario: 15000 },
  { id: '4', producto: 'Machetes marca Tramontina', cat: 'Herramientas', stock: 18, minimo: 5, unidad: 'unidades', costoUnitario: 12500 },
  { id: '5', producto: 'Sacos de yute exportacion', cat: 'Empaque', stock: 200, minimo: 100, unidad: 'unidades', costoUnitario: 1800 },
  { id: '6', producto: 'Cal dolomita', cat: 'Enmiendas', stock: 8, minimo: 10, unidad: 'sacos (25 kg)', costoUnitario: 9500 },
];

const categorias = ['Fertilizantes', 'Fungicidas', 'Biocontrol', 'Herbicidas', 'Herramientas', 'Empaque', 'Enmiendas', 'Semillas'];

// Sugerencias contextuales simuladas (en produccion vendrian de agro_alerts / nova_guard / vital)
function getSugerenciasSalida(insumo: Insumo): SugerenciaSalida[] {
  const sugerencias: SugerenciaSalida[] = [];
  if (insumo.cat === 'Fertilizantes') {
    sugerencias.push({
      motivo: 'Aplicacion programada',
      destino: 'Finca El Progreso - Vereda Norte',
      cantidadSugerida: 5,
      fuente: 'Plan de fertilizacion Feb-Mar: 5 sacos para 2.5 ha',
    });
    sugerencias.push({
      motivo: 'Entrega a productor',
      destino: 'Entrega directa a productor',
      cantidadSugerida: 3,
      fuente: 'Credito insumos activo: Juan Perez Lopez (3 sacos aprobados)',
    });
  }
  if (insumo.cat === 'Fungicidas') {
    sugerencias.push({
      motivo: 'Recomendacion Nova Guard',
      destino: 'Finca La Union - Vereda Sur',
      cantidadSugerida: 4,
      fuente: 'Alerta Roya: Incidencia 12% en Vereda Sur, aplicacion preventiva recomendada',
    });
  }
  if (insumo.cat === 'Biocontrol') {
    sugerencias.push({
      motivo: 'Recomendacion Nova Guard',
      destino: 'Finca San Jose - Vereda Central',
      cantidadSugerida: 2,
      fuente: 'Alerta Broca: Nivel 3% en Vereda Central, aplicacion de Beauveria recomendada',
    });
  }
  if (insumo.cat === 'Enmiendas') {
    sugerencias.push({
      motivo: 'Recomendacion VITAL',
      destino: 'Finca Las Flores - Vereda Este',
      cantidadSugerida: 4,
      fuente: 'VITAL: pH bajo detectado en parcelas de R. Mendez, encalado sugerido',
    });
  }
  return sugerencias;
}

const getEstado = (stock: number, minimo: number) => {
  if (stock <= minimo * 0.3) return 'critico';
  if (stock < minimo) return 'bajo';
  return 'ok';
};

const estadoBadge = (e: string) => {
  if (e === 'ok') return <Badge className="bg-emerald-600 text-white border-0">OK</Badge>;
  if (e === 'bajo') return <Badge className="bg-amber-500 text-white border-0">Bajo</Badge>;
  return <Badge variant="destructive">Critico</Badge>;
};

const fmtCRC = (n: number) => `₡${n.toLocaleString()}`;

export default function InventarioTab() {
  const [insumos, setInsumos] = useState(insumosInicial);
  const [showAdd, setShowAdd] = useState(false);
  const [showMovimiento, setShowMovimiento] = useState<{ insumo: Insumo; tipo: 'entrada' | 'salida' } | null>(null);
  const [showEdit, setShowEdit] = useState<Insumo | null>(null);
  const [showHistorial, setShowHistorial] = useState(false);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  // Movement form
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [destino, setDestino] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [nuevoInsumo, setNuevoInsumo] = useState({ producto: '', cat: 'Fertilizantes', stock: '', minimo: '', unidad: '', costoUnitario: '' });

  const valorTotal = insumos.reduce((s, i) => s + i.stock * i.costoUnitario, 0);
  const alertasBajas = insumos.filter(i => getEstado(i.stock, i.minimo) !== 'ok').length;

  const sugerencias = showMovimiento?.tipo === 'salida' ? getSugerenciasSalida(showMovimiento.insumo) : [];

  const applySugerencia = (s: SugerenciaSalida) => {
    setCantidad(String(s.cantidadSugerida));
    setMotivo(s.motivo);
    setDestino(s.destino);
    setObservaciones(s.fuente);
  };

  const resetMovForm = () => {
    setCantidad('');
    setMotivo('');
    setDestino('');
    setObservaciones('');
  };

  const handleMovimiento = () => {
    if (!showMovimiento || !cantidad || Number(cantidad) <= 0) { toast.error('Ingrese una cantidad valida'); return; }
    if (!motivo) { toast.error('Seleccione un motivo'); return; }
    if (showMovimiento.tipo === 'salida' && !destino) { toast.error('Seleccione un destino'); return; }

    const qty = Number(cantidad);

    if (showMovimiento.tipo === 'salida' && qty > showMovimiento.insumo.stock) {
      toast.error(`Stock insuficiente. Disponible: ${showMovimiento.insumo.stock} ${showMovimiento.insumo.unidad}`);
      return;
    }

    const mov: Movimiento = {
      id: String(Date.now()),
      insumoId: showMovimiento.insumo.id,
      tipo: showMovimiento.tipo,
      cantidad: qty,
      fecha: new Date().toISOString().slice(0, 10),
      motivo,
      destino: showMovimiento.tipo === 'salida' ? destino : motivo,
      observaciones,
    };

    setMovimientos(prev => [mov, ...prev]);
    setInsumos(prev => prev.map(i => {
      if (i.id !== showMovimiento.insumo.id) return i;
      const newStock = showMovimiento.tipo === 'entrada' ? i.stock + qty : Math.max(0, i.stock - qty);
      return { ...i, stock: newStock };
    }));

    toast.success(`${showMovimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada: ${qty} ${showMovimiento.insumo.unidad} - ${motivo}`);
    setShowMovimiento(null);
    resetMovForm();
  };

  const handleAddInsumo = () => {
    if (!nuevoInsumo.producto || !nuevoInsumo.unidad) { toast.error('Complete los campos obligatorios'); return; }
    const nuevo: Insumo = {
      id: String(Date.now()),
      producto: nuevoInsumo.producto,
      cat: nuevoInsumo.cat,
      stock: Number(nuevoInsumo.stock) || 0,
      minimo: Number(nuevoInsumo.minimo) || 0,
      unidad: nuevoInsumo.unidad,
      costoUnitario: Number(nuevoInsumo.costoUnitario) || 0,
    };
    setInsumos(prev => [...prev, nuevo]);
    toast.success(`Insumo "${nuevo.producto}" agregado`);
    setShowAdd(false);
    setNuevoInsumo({ producto: '', cat: 'Fertilizantes', stock: '', minimo: '', unidad: '', costoUnitario: '' });
  };

  const handleEditSave = () => {
    if (!showEdit) return;
    setInsumos(prev => prev.map(i => i.id === showEdit.id ? showEdit : i));
    toast.success('Insumo actualizado');
    setShowEdit(null);
  };

  const kpis = [
    { label: 'Total Insumos', value: String(insumos.length), icon: Boxes, color: '' },
    { label: 'Alertas Stock Bajo', value: String(alertasBajas), icon: AlertTriangle, color: alertasBajas > 0 ? 'text-destructive' : '' },
    { label: 'Valor Inventario', value: fmtCRC(valorTotal), icon: Wallet, color: '' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">Control de insumos y materiales</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistorial(true)}>
            <History className="h-4 w-4 mr-1" /> Historial ({movimientos.length})
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <PackagePlus className="h-4 w-4 mr-1" /> Agregar Insumo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className={`h-4 w-4 ${k.color || 'text-primary'}`} />
                <span className="text-xs text-muted-foreground">{k.label}</span>
              </div>
              <p className={`text-xl font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Inventario de Insumos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Insumo</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Minimo</th>
                  <th className="px-4 py-3 font-medium">Unidad</th>
                  <th className="px-4 py-3 font-medium">Costo unit.</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((item) => {
                  const estado = getEstado(item.stock, item.minimo);
                  return (
                    <tr key={item.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${estado !== 'ok' ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                      <td className="px-4 py-3 font-medium text-foreground">{item.producto}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.cat}</td>
                      <td className="px-4 py-3 font-medium">{item.stock}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.minimo}</td>
                      <td className="px-4 py-3">{item.unidad}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtCRC(item.costoUnitario)}</td>
                      <td className="px-4 py-3">{estadoBadge(estado)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="Entrada" onClick={() => { setShowMovimiento({ insumo: item, tipo: 'entrada' }); resetMovForm(); }}>
                            <Plus className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Salida" onClick={() => { setShowMovimiento({ insumo: item, tipo: 'salida' }); resetMovForm(); }}>
                            <Minus className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Editar" onClick={() => setShowEdit({ ...item })}>
                            <Edit2 className="h-3.5 w-3.5" />
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

      {/* ═══ MOVIMIENTO DIALOG (Entrada/Salida) ═══ */}
      <Dialog open={!!showMovimiento} onOpenChange={() => { setShowMovimiento(null); resetMovForm(); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showMovimiento?.tipo === 'entrada'
                ? <><Plus className="h-5 w-5 text-emerald-600" /> Registrar Entrada</>
                : <><Minus className="h-5 w-5 text-destructive" /> Registrar Salida</>}
            </DialogTitle>
          </DialogHeader>
          {showMovimiento && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="text-sm">
                  <span className="text-muted-foreground">Insumo:</span>{' '}
                  <span className="font-medium text-foreground">{showMovimiento.insumo.producto}</span>
                </div>
                <div className="text-sm mt-1">
                  <span className="text-muted-foreground">Stock actual:</span>{' '}
                  <span className="font-bold text-foreground">{showMovimiento.insumo.stock} {showMovimiento.insumo.unidad}</span>
                  {getEstado(showMovimiento.insumo.stock, showMovimiento.insumo.minimo) !== 'ok' && (
                    <span className="ml-2">{estadoBadge(getEstado(showMovimiento.insumo.stock, showMovimiento.insumo.minimo))}</span>
                  )}
                </div>
                <div className="text-sm mt-1">
                  <span className="text-muted-foreground">Stock minimo:</span>{' '}
                  <span className="text-foreground">{showMovimiento.insumo.minimo} {showMovimiento.insumo.unidad}</span>
                </div>
              </div>

              {/* Sugerencias contextuales (solo para salidas) */}
              {showMovimiento.tipo === 'salida' && sugerencias.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sugerencias basadas en alertas y planes</p>
                  {sugerencias.map((s, i) => (
                    <button key={i} onClick={() => applySugerencia(s)}
                      className="w-full text-left p-3 rounded-lg border border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.cantidadSugerida} {showMovimiento.insumo.unidad} → {s.destino}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.fuente}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Motivo *</Label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger><SelectValue placeholder="Seleccione motivo..." /></SelectTrigger>
                  <SelectContent>
                    {(showMovimiento.tipo === 'salida' ? MOTIVOS_SALIDA : MOTIVOS_ENTRADA).map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showMovimiento.tipo === 'salida' && (
                <div className="space-y-2">
                  <Label>Destino / Finca *</Label>
                  <Select value={destino} onValueChange={setDestino}>
                    <SelectTrigger><SelectValue placeholder="Seleccione destino..." /></SelectTrigger>
                    <SelectContent>
                      {FINCAS_DESTINO.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Cantidad ({showMovimiento.insumo.unidad}) *</Label>
                <Input type="number" min="1" max={showMovimiento.tipo === 'salida' ? showMovimiento.insumo.stock : undefined}
                  value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="0" />
                {showMovimiento.tipo === 'salida' && cantidad && Number(cantidad) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Stock resultante: <span className="font-bold">{Math.max(0, showMovimiento.insumo.stock - Number(cantidad))}</span> {showMovimiento.insumo.unidad}
                    {Number(cantidad) > showMovimiento.insumo.stock && <span className="text-destructive ml-1">(excede stock disponible)</span>}
                  </p>
                )}
                {showMovimiento.tipo === 'entrada' && cantidad && Number(cantidad) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Stock resultante: <span className="font-bold">{showMovimiento.insumo.stock + Number(cantidad)}</span> {showMovimiento.insumo.unidad}
                    {' '}| Valor: {fmtCRC(Number(cantidad) * showMovimiento.insumo.costoUnitario)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales, referencia a orden de compra, etc." rows={2} />
              </div>

              <Button className="w-full" onClick={handleMovimiento}>
                Registrar {showMovimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ HISTORIAL DE MOVIMIENTOS ═══ */}
      <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Historial de Movimientos
            </DialogTitle>
          </DialogHeader>
          {movimientos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay movimientos registrados en esta sesion.</p>
          ) : (
            <div className="space-y-2">
              {movimientos.map(m => {
                const insumo = insumos.find(i => i.id === m.insumoId);
                return (
                  <div key={m.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {m.tipo === 'entrada'
                          ? <Badge className="bg-emerald-600 text-white border-0">Entrada</Badge>
                          : <Badge variant="destructive">Salida</Badge>}
                        <span className="font-medium text-foreground text-sm">{insumo?.producto || 'Insumo'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{m.fecha}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                      <div><span className="text-muted-foreground">Cantidad:</span> <span className="text-foreground font-medium">{m.cantidad} {insumo?.unidad}</span></div>
                      <div><span className="text-muted-foreground">Motivo:</span> <span className="text-foreground">{m.motivo}</span></div>
                      {m.destino && <div className="col-span-2"><span className="text-muted-foreground">Destino:</span> <span className="text-foreground">{m.destino}</span></div>}
                      {m.observaciones && <div className="col-span-2"><span className="text-muted-foreground">Obs:</span> <span className="text-foreground">{m.observaciones}</span></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add insumo dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-primary" /> Agregar Insumo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre del insumo *</Label>
              <Input value={nuevoInsumo.producto} onChange={e => setNuevoInsumo(s => ({ ...s, producto: e.target.value }))} placeholder="Ej: Sulfato de cobre" />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={nuevoInsumo.cat} onValueChange={v => setNuevoInsumo(s => ({ ...s, cat: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Stock inicial</Label>
                <Input type="number" value={nuevoInsumo.stock} onChange={e => setNuevoInsumo(s => ({ ...s, stock: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Stock minimo</Label>
                <Input type="number" value={nuevoInsumo.minimo} onChange={e => setNuevoInsumo(s => ({ ...s, minimo: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Unidad *</Label>
                <Input value={nuevoInsumo.unidad} onChange={e => setNuevoInsumo(s => ({ ...s, unidad: e.target.value }))} placeholder="Ej: litros" />
              </div>
              <div className="space-y-1">
                <Label>Costo unitario (₡)</Label>
                <Input type="number" value={nuevoInsumo.costoUnitario} onChange={e => setNuevoInsumo(s => ({ ...s, costoUnitario: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full" onClick={handleAddInsumo}>Agregar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit insumo dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" /> Editar Insumo
            </DialogTitle>
          </DialogHeader>
          {showEdit && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input value={showEdit.producto} onChange={e => setShowEdit(s => s ? { ...s, producto: e.target.value } : s)} />
              </div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select value={showEdit.cat} onValueChange={v => setShowEdit(s => s ? { ...s, cat: v } : s)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Stock minimo</Label>
                  <Input type="number" value={showEdit.minimo} onChange={e => setShowEdit(s => s ? { ...s, minimo: Number(e.target.value) } : s)} />
                </div>
                <div className="space-y-1">
                  <Label>Costo unitario (₡)</Label>
                  <Input type="number" value={showEdit.costoUnitario} onChange={e => setShowEdit(s => s ? { ...s, costoUnitario: Number(e.target.value) } : s)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Unidad</Label>
                <Input value={showEdit.unidad} onChange={e => setShowEdit(s => s ? { ...s, unidad: e.target.value } : s)} />
              </div>
              <Button className="w-full" onClick={handleEditSave}>Guardar Cambios</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
