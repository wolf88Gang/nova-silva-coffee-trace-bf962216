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
import { useOperatingModel } from '@/lib/operatingModel';
import { DEMO_PRODUCTORES } from '@/lib/demo-data';
import { Search, Plus, MapPin, Sprout, Mountain } from 'lucide-react';

// Demo parcela data
interface DemoParcela {
  id: string;
  nombre: string;
  productorId: string;
  productorNombre: string;
  area: number;
  variedad: string;
  altitud: number;
  estadoEUDR: 'compliant' | 'pending' | 'non-compliant';
  comunidad: string;
}

const DEMO_PARCELAS: DemoParcela[] = [
  { id: '1', nombre: 'El Mirador', productorId: '1', productorNombre: 'Juan Pérez López', area: 2.0, variedad: 'Caturra', altitud: 1450, estadoEUDR: 'compliant', comunidad: 'San Miguel' },
  { id: '2', nombre: 'La Esperanza', productorId: '1', productorNombre: 'Juan Pérez López', area: 1.5, variedad: 'Bourbon', altitud: 1380, estadoEUDR: 'compliant', comunidad: 'San Miguel' },
  { id: '3', nombre: 'Cerro Verde', productorId: '2', productorNombre: 'María Santos García', area: 3.2, variedad: 'Catuaí', altitud: 1520, estadoEUDR: 'compliant', comunidad: 'El Progreso' },
  { id: '4', nombre: 'Las Nubes', productorId: '3', productorNombre: 'Pedro Ramírez Cruz', area: 1.8, variedad: 'Caturra', altitud: 1400, estadoEUDR: 'pending', comunidad: 'Las Flores' },
  { id: '5', nombre: 'San José', productorId: '4', productorNombre: 'Ana López Martínez', area: 3.0, variedad: 'Bourbon', altitud: 1500, estadoEUDR: 'compliant', comunidad: 'San Miguel' },
  { id: '6', nombre: 'El Cafetal', productorId: '5', productorNombre: 'Carlos Hernández', area: 2.5, variedad: 'Catuaí', altitud: 1350, estadoEUDR: 'non-compliant', comunidad: 'El Progreso' },
  { id: '7', nombre: 'Cerro Alto', productorId: '4', productorNombre: 'Ana López Martínez', area: 1.8, variedad: 'Caturra', altitud: 1600, estadoEUDR: 'compliant', comunidad: 'San Miguel' },
  { id: '8', nombre: 'El Bosque', productorId: '6', productorNombre: 'Rosa Méndez Jiménez', area: 2.2, variedad: 'Bourbon', altitud: 1480, estadoEUDR: 'compliant', comunidad: 'Las Flores' },
];

const eudrBadge = (s: string) => {
  if (s === 'compliant') return <Badge variant="default">Cumple</Badge>;
  if (s === 'pending') return <Badge variant="secondary">Pendiente</Badge>;
  return <Badge variant="destructive">No cumple</Badge>;
};

function canWrite(role: string | null, model: string): boolean {
  return ['admin', 'cooperativa', 'exportador'].includes(role ?? '') || model === 'single_farm' || model === 'estate' || model === 'estate_hybrid';
}

export default function ParcelasHub() {
  const { orgTipo, role, activeModules, productorId } = useOrgContext();
  const { selectedActorId, selectedActor } = useActorContext();
  const model = useOperatingModel();
  const actorLabel = getActorLabel(orgTipo);

  const [search, setSearch] = useState('');
  const [comunidad, setComunidad] = useState('todas');

  // For single_farm / estate, the producer IS the org — show all parcels
  const isSelfManaged = model === 'single_farm' || model === 'estate';
  const effectiveActorId = isSelfManaged ? null : (role === 'productor' ? (productorId ?? null) : selectedActorId);

  const baseParcelas = useMemo(() => {
    let data = DEMO_PARCELAS;
    if (effectiveActorId) data = data.filter(p => p.productorId === effectiveActorId);
    return data;
  }, [effectiveActorId]);

  const comunidades = useMemo(() => [...new Set(baseParcelas.map(p => p.comunidad))], [baseParcelas]);

  const filtered = useMemo(() => baseParcelas.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || p.productorNombre.toLowerCase().includes(search.toLowerCase());
    const matchCom = comunidad === 'todas' || p.comunidad === comunidad;
    return matchSearch && matchCom;
  }), [baseParcelas, search, comunidad]);

  const subtitle = effectiveActorId && selectedActor
    ? `Mostrando parcelas de ${actorLabel}: ${selectedActor.nombre}`
    : 'Mostrando parcelas de toda la organización';

  const totalArea = filtered.reduce((s, p) => s + p.area, 0);
  const avgAltitud = filtered.length ? Math.round(filtered.reduce((s, p) => s + p.altitud, 0) / filtered.length) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parcelas</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          {canWrite(role) && <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva parcela</Button>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><MapPin className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Parcelas</span></div><p className="text-xl font-bold">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Sprout className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Hectáreas</span></div><p className="text-xl font-bold">{totalArea.toFixed(1)} ha</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Mountain className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Altitud prom.</span></div><p className="text-xl font-bold">{avgAltitud} msnm</p></CardContent></Card>
        {hasModule(activeModules, 'eudr') && (
          <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">EUDR Compliant</p><p className="text-xl font-bold">{filtered.filter(p => p.estadoEUDR === 'compliant').length}/{filtered.length}</p></CardContent></Card>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={`Buscar parcela o ${actorLabel.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={comunidad} onValueChange={setComunidad}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Comunidad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {comunidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                  <th className="px-4 py-3 font-medium">Parcela</th>
                  {!effectiveActorId && <th className="px-4 py-3 font-medium">{actorLabel}</th>}
                  <th className="px-4 py-3 font-medium">Comunidad</th>
                  <th className="px-4 py-3 font-medium">Área</th>
                  <th className="px-4 py-3 font-medium">Variedad</th>
                  <th className="px-4 py-3 font-medium">Altitud</th>
                  {hasModule(activeModules, 'eudr') && <th className="px-4 py-3 font-medium">EUDR</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{p.nombre}</td>
                    {!effectiveActorId && <td className="px-4 py-3 text-muted-foreground">{p.productorNombre}</td>}
                    <td className="px-4 py-3">{p.comunidad}</td>
                    <td className="px-4 py-3">{p.area} ha</td>
                    <td className="px-4 py-3">{p.variedad}</td>
                    <td className="px-4 py-3">{p.altitud} msnm</td>
                    {hasModule(activeModules, 'eudr') && <td className="px-4 py-3">{eudrBadge(p.estadoEUDR)}</td>}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No se encontraron parcelas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
