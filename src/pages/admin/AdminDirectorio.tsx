import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Search, Users, MapPin, Globe, Calendar, Eye } from 'lucide-react';

interface OrgEntry {
  id: string; nombre: string; tipo: string; pais: string; productores: number;
  hectareas: number; plan: string; estado: 'activa' | 'trial' | 'inactiva';
  fechaRegistro: string; contacto: string;
}

const DEMO_ORGS: OrgEntry[] = [
  { id: '1', nombre: 'Cooperativa Café de la Selva', tipo: 'cooperativa', pais: 'Guatemala', productores: 67, hectareas: 245, plan: 'Pro', estado: 'activa', fechaRegistro: '2025-03-15', contacto: 'maria@cafeselva.gt' },
  { id: '2', nombre: 'Exportadora Sol de América', tipo: 'exportador', pais: 'Colombia', productores: 0, hectareas: 0, plan: 'Enterprise', estado: 'activa', fechaRegistro: '2025-06-01', contacto: 'carlos@solamerica.co' },
  { id: '3', nombre: 'CertifiCafé Internacional', tipo: 'certificadora', pais: 'Costa Rica', productores: 0, hectareas: 0, plan: 'Pro', estado: 'activa', fechaRegistro: '2025-08-20', contacto: 'ana@certificafe.cr' },
  { id: '4', nombre: 'Cooperativa Montaña Verde', tipo: 'cooperativa', pais: 'Honduras', productores: 42, hectareas: 180, plan: 'Starter', estado: 'trial', fechaRegistro: '2026-01-10', contacto: 'info@montanaverde.hn' },
  { id: '5', nombre: 'Beneficio Don José', tipo: 'beneficio_privado', pais: 'Guatemala', productores: 15, hectareas: 60, plan: 'Starter', estado: 'activa', fechaRegistro: '2025-11-05', contacto: 'jose@beneficiodonj.gt' },
  { id: '6', nombre: 'Finca Experimental USAC', tipo: 'productor_empresarial', pais: 'Guatemala', productores: 1, hectareas: 25, plan: 'Starter', estado: 'inactiva', fechaRegistro: '2025-04-01', contacto: 'lab@usac.edu.gt' },
];

const tipoLabel: Record<string, string> = {
  cooperativa: 'Cooperativa', exportador: 'Exportador', certificadora: 'Certificadora',
  beneficio_privado: 'Beneficio Privado', productor_empresarial: 'Productor Empresarial',
};

const estadoBadge = (e: string) => {
  if (e === 'activa') return <Badge variant="default">Activa</Badge>;
  if (e === 'trial') return <Badge variant="secondary">Trial</Badge>;
  return <Badge variant="outline">Inactiva</Badge>;
};

export default function AdminDirectorio() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OrgEntry | null>(null);

  const filtered = DEMO_ORGS.filter(o =>
    o.nombre.toLowerCase().includes(search.toLowerCase()) ||
    o.tipo.includes(search.toLowerCase()) ||
    o.pais.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Directorio de Organizaciones
          </h1>
          <p className="text-sm text-muted-foreground">{DEMO_ORGS.length} organizaciones registradas en la plataforma</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Total organizaciones</p><p className="text-2xl font-bold text-foreground">{DEMO_ORGS.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Activas</p><p className="text-2xl font-bold text-primary">{DEMO_ORGS.filter(o => o.estado === 'activa').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Productores totales</p><p className="text-2xl font-bold text-foreground">{DEMO_ORGS.reduce((s, o) => s + o.productores, 0)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Organización</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">País</th>
                  <th className="px-4 py-3 font-medium">Productores</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{o.nombre}</td>
                    <td className="px-4 py-3">{tipoLabel[o.tipo] || o.tipo}</td>
                    <td className="px-4 py-3 flex items-center gap-1"><Globe className="h-3 w-3 text-muted-foreground" />{o.pais}</td>
                    <td className="px-4 py-3">{o.productores || '—'}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{o.plan}</Badge></td>
                    <td className="px-4 py-3">{estadoBadge(o.estado)}</td>
                    <td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => setSelected(o)}><Eye className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{selected.nombre}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Tipo</span><p className="font-medium text-foreground">{tipoLabel[selected.tipo]}</p></div>
                  <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Plan</span><p className="font-medium text-foreground">{selected.plan}</p></div>
                  <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs flex items-center gap-1"><Globe className="h-3 w-3" />País</span><p className="font-medium text-foreground">{selected.pais}</p></div>
                  <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Estado</span><p>{estadoBadge(selected.estado)}</p></div>
                  <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs flex items-center gap-1"><Users className="h-3 w-3" />Productores</span><p className="font-medium text-foreground">{selected.productores}</p></div>
                  <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />Hectáreas</span><p className="font-medium text-foreground">{selected.hectareas}</p></div>
                  <div className="p-2 rounded border border-border col-span-2"><span className="text-muted-foreground text-xs flex items-center gap-1"><Calendar className="h-3 w-3" />Registro</span><p className="font-medium text-foreground">{selected.fechaRegistro}</p></div>
                  <div className="p-2 rounded border border-border col-span-2"><span className="text-muted-foreground text-xs">Contacto</span><p className="font-medium text-foreground">{selected.contacto}</p></div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
