/**
 * Cumplimiento > Lotes — Demo-aware page showing lots with EUDR status.
 */
import { DemoBadge } from '@/components/common/DemoBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDemoLotesComerciales, getDemoDossiersEUDR } from '@/lib/demoSeedData';
import { Search, Package, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState, useMemo } from 'react';

const eudrBadge: Record<string, { variant: any; label: string }> = {
  Verde: { variant: 'default', label: 'Cumple' },
  Ámbar: { variant: 'secondary', label: 'Pendiente' },
  Rojo: { variant: 'destructive', label: 'No cumple' },
};

export default function CumplimientoLotesPage() {
  const lotes = getDemoLotesComerciales();
  const dossiers = getDemoDossiersEUDR();
  const [search, setSearch] = useState('');
  const [filtroEudr, setFiltroEudr] = useState('todos');

  const filtered = useMemo(() => lotes.filter(l => {
    const matchSearch = l.codigo.toLowerCase().includes(search.toLowerCase()) || l.origen.toLowerCase().includes(search.toLowerCase());
    const matchEudr = filtroEudr === 'todos' || l.eudr === filtroEudr;
    return matchSearch && matchEudr;
  }), [lotes, search, filtroEudr]);

  const verde = lotes.filter(l => l.eudr === 'Verde').length;
  const ambar = lotes.filter(l => l.eudr === 'Ámbar').length;
  const rojo = lotes.filter(l => l.eudr === 'Rojo').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Lotes y cumplimiento" description="Estado EUDR y documental por lote comercial" />
        <DemoBadge />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Package className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{lotes.length}</p><p className="text-xs text-muted-foreground">Lotes totales</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{verde}</p><p className="text-xs text-muted-foreground">Cumple EUDR</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">{ambar}</p><p className="text-xs text-muted-foreground">Pendientes</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-destructive" /><div><p className="text-2xl font-bold">{rojo}</p><p className="text-xs text-muted-foreground">No cumplen</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código o región..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtroEudr} onValueChange={setFiltroEudr}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado EUDR" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Verde">Cumple</SelectItem>
            <SelectItem value="Ámbar">Pendiente</SelectItem>
            <SelectItem value="Rojo">No cumple</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Origen</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Volumen</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Calidad</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Composición</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">EUDR</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const badge = eudrBadge[l.eudr] || { variant: 'outline', label: l.eudr };
                  return (
                    <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{l.codigo}</td>
                      <td className="py-3 px-4 text-muted-foreground">{l.origen}</td>
                      <td className="py-3 px-4">{l.volumen}</td>
                      <td className="py-3 px-4 text-center">{l.calidad}</td>
                      <td className="py-3 px-4"><Badge variant="outline" className="text-xs">{l.estado}</Badge></td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate">{l.composicion}</td>
                      <td className="py-3 px-4 text-center"><Badge variant={badge.variant} className="text-xs">{badge.label}</Badge></td>
                      <td className="py-3 px-4 text-muted-foreground">{l.fecha}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Sin lotes que coincidan con los filtros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
