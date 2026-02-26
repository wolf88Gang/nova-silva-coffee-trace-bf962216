import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductores, type ProductorRow } from '@/hooks/useProductores';
import { Search, Plus, Download, Loader2, AlertCircle, Inbox } from 'lucide-react';

const eudrBadge = (s: ProductorRow['eudr_status']) => {
  if (s === 'compliant') return <Badge variant="default">Compliant</Badge>;
  if (s === 'pending') return <Badge variant="secondary">Pendiente</Badge>;
  return <Badge variant="destructive">No Compliant</Badge>;
};

const vitalColor = (v: number | null) => {
  if (v === null) return 'text-muted-foreground';
  if (v >= 81) return 'text-emerald-600';
  if (v >= 61) return 'text-primary';
  if (v >= 41) return 'text-yellow-600';
  return 'text-destructive';
};

export default function ProductoresHub() {
  const [search, setSearch] = useState('');
  const [comunidad, setComunidad] = useState('todas');
  const { data: productores, isLoading, error } = useProductores();

  const list = productores ?? [];
  const comunidades = [...new Set(list.map(p => p.comunidad).filter(Boolean))] as string[];
  const filtered = list.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.cedula ?? '').includes(search);
    const matchCom = comunidad === 'todas' || p.comunidad === comunidad;
    return matchSearch && matchCom;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Cargando productores…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm">Error al cargar productores</p>
        <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Productores</h1>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo productor</Button>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Inbox className="h-10 w-10" />
          <p>No hay productores registrados</p>
          <p className="text-xs">Agrega tu primer productor para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Productores</h1>
        <div className="flex gap-2">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo productor</Button>
          <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" /> Exportar</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o documento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={comunidad} onValueChange={setComunidad}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Comunidad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {comunidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Hectáreas</p><p className="text-xl font-bold">{filtered.reduce((s, p) => s + p.hectareas_total, 0).toFixed(1)} ha</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">EUDR Compliant</p><p className="text-xl font-bold">{filtered.filter(p => p.eudr_status === 'compliant').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Prom. VITAL</p><p className="text-xl font-bold">{(() => { const withVital = filtered.filter(p => p.puntaje_vital !== null); return withVital.length ? Math.round(withVital.reduce((s, p) => s + (p.puntaje_vital ?? 0), 0) / withVital.length) : '—'; })()}</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium">Comunidad</th>
                  <th className="px-4 py-3 font-medium">Parcelas</th>
                  <th className="px-4 py-3 font-medium">Hectáreas</th>
                  <th className="px-4 py-3 font-medium">EUDR</th>
                  <th className="px-4 py-3 font-medium">VITAL</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{p.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.cedula ?? '—'}</td>
                    <td className="px-4 py-3">{p.comunidad ?? '—'}</td>
                    <td className="px-4 py-3">{p.parcelas_count}</td>
                    <td className="px-4 py-3">{p.hectareas_total}</td>
                    <td className="px-4 py-3">{eudrBadge(p.eudr_status)}</td>
                    <td className={`px-4 py-3 font-bold ${vitalColor(p.puntaje_vital)}`}>{p.puntaje_vital ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
