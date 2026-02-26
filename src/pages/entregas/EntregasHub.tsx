import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useActorContext } from '@/contexts/ActorContext';
import { hasModule } from '@/lib/org-modules';
import { getActorLabel } from '@/lib/org-terminology';
import { DEMO_PRODUCTORES, DEMO_ENTREGAS } from '@/lib/demo-data';
import { Search, Plus, Package, CalendarDays, DollarSign } from 'lucide-react';

const payBadge = (s: string) => {
  if (s === 'pagado') return <Badge variant="default">Pagado</Badge>;
  if (s === 'parcial') return <Badge variant="secondary">Parcial</Badge>;
  return <Badge variant="destructive">Pendiente</Badge>;
};

function canWrite(role: string | null): boolean {
  return ['admin', 'cooperativa', 'exportador'].includes(role ?? '');
}

export default function EntregasHub() {
  const { orgTipo, role, activeModules, productorId } = useOrgContext();
  const { selectedActorId, selectedActor } = useActorContext();
  const actorLabel = getActorLabel(orgTipo);

  const [search, setSearch] = useState('');
  const [tipoCafe, setTipoCafe] = useState('todos');

  const effectiveActorId = role === 'productor' ? (productorId ?? null) : selectedActorId;

  const baseEntregas = useMemo(() => {
    let data = DEMO_ENTREGAS;
    if (effectiveActorId) {
      const actor = DEMO_PRODUCTORES.find(p => p.id === effectiveActorId);
      if (actor) data = data.filter(e => e.productorNombre === actor.nombre);
    }
    return data;
  }, [effectiveActorId]);

  const tipos = useMemo(() => [...new Set(baseEntregas.map(e => e.tipoCafe))], [baseEntregas]);

  const filtered = useMemo(() => baseEntregas.filter(e => {
    const matchSearch = e.productorNombre.toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoCafe === 'todos' || e.tipoCafe === tipoCafe;
    return matchSearch && matchTipo;
  }), [baseEntregas, search, tipoCafe]);

  const subtitle = effectiveActorId && selectedActor
    ? `Mostrando entregas de ${actorLabel}: ${selectedActor.nombre}`
    : 'Mostrando entregas de toda la organización';

  const totalKg = filtered.reduce((s, e) => s + e.pesoKg, 0);
  const totalValue = filtered.reduce((s, e) => s + e.pesoKg * e.precioUnitario, 0);

  // VITAL flag: highlight actors with low score
  const lowVitalActors = hasModule(activeModules, 'vital')
    ? new Set(DEMO_PRODUCTORES.filter(p => p.puntajeVITAL < 50).map(p => p.nombre))
    : new Set<string>();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entregas</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          {canWrite(role) && <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva entrega</Button>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Entregas</span></div><p className="text-xl font-bold">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><CalendarDays className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Volumen</span></div><p className="text-xl font-bold">{totalKg.toLocaleString()} kg</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Valor total</span></div><p className="text-xl font-bold">Q {totalValue.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Pagados</p><p className="text-xl font-bold">{filtered.filter(e => e.estadoPago === 'pagado').length}/{filtered.length}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={`Buscar por nombre de ${actorLabel.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tipoCafe} onValueChange={setTipoCafe}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo café" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  {!effectiveActorId && <th className="px-4 py-3 font-medium">{actorLabel}</th>}
                  <th className="px-4 py-3 font-medium">Peso (kg)</th>
                  <th className="px-4 py-3 font-medium">Tipo Café</th>
                  <th className="px-4 py-3 font-medium">Precio/kg</th>
                  <th className="px-4 py-3 font-medium">Pago</th>
                  {hasModule(activeModules, 'vital') && <th className="px-4 py-3 font-medium">VITAL</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-foreground">{e.fecha}</td>
                    {!effectiveActorId && (
                      <td className="px-4 py-3">
                        <span className="text-foreground">{e.productorNombre}</span>
                        {lowVitalActors.has(e.productorNombre) && (
                          <Badge variant="destructive" className="ml-2 text-[10px]">VITAL bajo</Badge>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium">{e.pesoKg}</td>
                    <td className="px-4 py-3">{e.tipoCafe}</td>
                    <td className="px-4 py-3">Q {e.precioUnitario.toLocaleString()}</td>
                    <td className="px-4 py-3">{payBadge(e.estadoPago)}</td>
                    {hasModule(activeModules, 'vital') && (
                      <td className="px-4 py-3">
                        {lowVitalActors.has(e.productorNombre) ? (
                          <span className="text-destructive font-medium">Rojo</span>
                        ) : (
                          <span className="text-emerald-600">OK</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No se encontraron entregas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
