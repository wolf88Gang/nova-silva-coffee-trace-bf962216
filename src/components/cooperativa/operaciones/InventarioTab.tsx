import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Boxes, AlertTriangle, Wallet, Plus, Minus, Edit2, PackagePlus } from 'lucide-react';
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

const insumosInicial: Insumo[] = [
  { id: '1', producto: 'Fertilizante 18-5-15-6-2(MgO-S)', cat: 'Fertilizantes', stock: 45, minimo: 20, unidad: 'sacos (50 kg)', costoUnitario: 28500 },
  { id: '2', producto: 'Caldo bordelés (cobre orgánico)', cat: 'Fungicidas', stock: 12, minimo: 15, unidad: 'litros', costoUnitario: 8200 },
  { id: '3', producto: 'Beauveria bassiana', cat: 'Biocontrol', stock: 3, minimo: 10, unidad: 'litros', costoUnitario: 15000 },
  { id: '4', producto: 'Machetes marca Tramontina', cat: 'Herramientas', stock: 18, minimo: 5, unidad: 'unidades', costoUnitario: 12500 },
  { id: '5', producto: 'Sacos de yute exportación', cat: 'Empaque', stock: 200, minimo: 100, unidad: 'unidades', costoUnitario: 1800 },
  { id: '6', producto: 'Cal dolomita', cat: 'Enmiendas', stock: 8, minimo: 10, unidad: 'sacos (25 kg)', costoUnitario: 9500 },
];

const categorias = ['Fertilizantes', 'Fungicidas', 'Biocontrol', 'Herramientas', 'Empaque', 'Enmiendas'];

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
  const [cantidad, setCantidad] = useState('');
  const [nuevoInsumo, setNuevoInsumo] = useState({ producto: '', cat: 'Fertilizantes', stock: '', minimo: '', unidad: '', costoUnitario: '' });

  const valorTotal = insumos.reduce((s, i) => s + i.stock * i.costoUnitario, 0);
  const alertasBajas = insumos.filter(i => getEstado(i.stock, i.minimo) !== 'ok').length;

  const handleMovimiento = () => {
    if (!showMovimiento || !cantidad || Number(cantidad) <= 0) { toast.error('Ingrese una cantidad válida'); return; }
    const qty = Number(cantidad);
    setInsumos(prev => prev.map(i => {
      if (i.id !== showMovimiento.insumo.id) return i;
      const newStock = showMovimiento.tipo === 'entrada' ? i.stock + qty : Math.max(0, i.stock - qty);
      return { ...i, stock: newStock };
    }));
    toast.success(`${showMovimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada: ${qty} ${showMovimiento.insumo.unidad}`);
    setShowMovimiento(null);
    setCantidad('');
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Control de insumos y materiales</p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <PackagePlus className="h-4 w-4 mr-1" /> Agregar Insumo
        </Button>
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
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Mínimo</th>
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
                    <tr
                      key={item.id}
                      className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${
                        estado !== 'ok' ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{item.producto}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.cat}</td>
                      <td className="px-4 py-3 font-medium">{item.stock}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.minimo}</td>
                      <td className="px-4 py-3">{item.unidad}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtCRC(item.costoUnitario)}</td>
                      <td className="px-4 py-3">{estadoBadge(estado)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="Entrada" onClick={() => { setShowMovimiento({ insumo: item, tipo: 'entrada' }); setCantidad(''); }}>
                            <Plus className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Salida" onClick={() => { setShowMovimiento({ insumo: item, tipo: 'salida' }); setCantidad(''); }}>
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

      {/* Movimiento dialog */}
      <Dialog open={!!showMovimiento} onOpenChange={() => setShowMovimiento(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showMovimiento?.tipo === 'entrada'
                ? <><Plus className="h-5 w-5 text-emerald-600" /> Registrar Entrada</>
                : <><Minus className="h-5 w-5 text-destructive" /> Registrar Salida</>}
            </DialogTitle>
          </DialogHeader>
          {showMovimiento && (
            <div className="space-y-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Insumo:</span>{' '}
                <span className="font-medium text-foreground">{showMovimiento.insumo.producto}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Stock actual:</span>{' '}
                <span className="font-medium text-foreground">{showMovimiento.insumo.stock} {showMovimiento.insumo.unidad}</span>
              </div>
              <div className="space-y-2">
                <Label>Cantidad ({showMovimiento.insumo.unidad})</Label>
                <Input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="0" />
              </div>
              <Button className="w-full" onClick={handleMovimiento}>
                Registrar {showMovimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
              </Button>
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
              <Label>Categoría</Label>
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
                <Label>Stock mínimo</Label>
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
                <Label>Categoría</Label>
                <Select value={showEdit.cat} onValueChange={v => setShowEdit(s => s ? { ...s, cat: v } : s)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Stock mínimo</Label>
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
