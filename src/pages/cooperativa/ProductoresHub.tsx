import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEMO_PRODUCTORES } from '@/lib/demo-data';
import { Users, Search, Plus, Download } from 'lucide-react';
import { useOrgContext } from '@/hooks/useOrgContext';
import { getSociosLabel, getSociosLabelSingular } from '@/lib/org-terminology';

const eudrBadge = (s: string) => {
  if (s === 'compliant') return <Badge variant="default">Compliant</Badge>;
  if (s === 'pending') return <Badge variant="secondary">Pendiente</Badge>;
  return <Badge variant="destructive">No Compliant</Badge>;
};

const vitalColor = (v: number) => {
  if (v >= 81) return 'text-emerald-600';
  if (v >= 61) return 'text-primary';
  if (v >= 41) return 'text-yellow-600';
  return 'text-destructive';
};

export default function ProductoresHub() {
  const { orgTipo } = useOrgContext();
  const [search, setSearch] = useState('');
  const [comunidad, setComunidad] = useState('todas');

  const label = getSociosLabel(orgTipo);
  const comunidades = [...new Set(DEMO_PRODUCTORES.map(p => p.comunidad))];
  const filtered = DEMO_PRODUCTORES.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || p.cedula.includes(search);
    const matchCom = comunidad === 'todas' || p.comunidad === comunidad;
    return matchSearch && matchCom;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{label}</h1>
        <div className="flex gap-2">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo {getSociosLabelSingular(orgTipo)}</Button>
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
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Hectáreas</p><p className="text-xl font-bold">{filtered.reduce((s, p) => s + p.hectareas, 0).toFixed(1)} ha</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">EUDR Compliant</p><p className="text-xl font-bold">{filtered.filter(p => p.estadoEUDR === 'compliant').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Prom. VITAL</p><p className="text-xl font-bold">{Math.round(filtered.reduce((s, p) => s + p.puntajeVITAL, 0) / (filtered.length || 1))}</p></CardContent></Card>
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
                    <td className="px-4 py-3 text-muted-foreground">{p.cedula}</td>
                    <td className="px-4 py-3">{p.comunidad}</td>
                    <td className="px-4 py-3">{p.parcelas}</td>
                    <td className="px-4 py-3">{p.hectareas}</td>
                    <td className="px-4 py-3">{eudrBadge(p.estadoEUDR)}</td>
                    <td className={`px-4 py-3 font-bold ${vitalColor(p.puntajeVITAL)}`}>{p.puntajeVITAL}</td>
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
