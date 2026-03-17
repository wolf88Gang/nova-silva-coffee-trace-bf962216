/**
 * Admin Organizations — list + drilldown
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2, Search, RefreshCw, Users, Map, FileText, Shield,
  ChevronLeft, Package, Zap, Settings,
} from 'lucide-react';
import { useAdminOrganizations, useAdminUsers, type AdminOrg } from '@/hooks/useAdminData';

// Mock enrichment per org
function getOrgMockData(org: AdminOrg) {
  return {
    plan: org.tipo === 'certificadora' ? 'enterprise' : 'smart',
    status: 'active' as const,
    users: Math.floor(Math.random() * 20) + 3,
    producers: Math.floor(Math.random() * 500) + 50,
    plots: Math.floor(Math.random() * 1000) + 100,
    modules: ['Producción', 'Agronomía', org.tipo === 'exportador' ? 'EUDR' : 'VITAL', 'Finanzas'],
    healthScore: Math.floor(Math.random() * 30) + 70,
    lastActivity: 'Hace 2h',
  };
}

function OrgDetail({ org, onBack }: { org: AdminOrg; onBack: () => void }) {
  const mock = getOrgMockData(org);
  const { data: allUsers } = useAdminUsers();
  const orgUsers = (allUsers ?? []).filter(u => u.organization_id === org.id);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ChevronLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">{org.nombre}</h2>
          <p className="text-sm text-muted-foreground capitalize">{org.tipo} · ID: {org.id.slice(0, 12)}…</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> Configurar</Button>
          <Button variant="destructive" size="sm">Suspender</Button>
        </div>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList className="grid grid-cols-5 max-w-2xl">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="uso">Uso</TabsTrigger>
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
          <TabsTrigger value="riesgo">Riesgo</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="text-lg font-bold text-foreground capitalize">{mock.plan}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Health score</p>
              <p className="text-lg font-bold text-foreground">{mock.healthScore}%</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Usuarios</p>
              <p className="text-lg font-bold text-foreground">{orgUsers.length || mock.users}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Última actividad</p>
              <p className="text-lg font-bold text-foreground">{mock.lastActivity}</p>
            </CardContent></Card>
          </div>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Módulos activos</CardTitle></CardHeader>
            <CardContent><div className="flex flex-wrap gap-2">
              {mock.modules.map(m => <Badge key={m} variant="outline">{m}</Badge>)}
            </div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4">
          <Card><CardContent className="pt-4 space-y-2">
            {orgUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin usuarios vinculados</p>
            ) : orgUsers.map(u => (
              <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <Users className="h-4 w-4 text-primary" />
                <div className="flex-1"><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.user_id.slice(0, 8)}…</p></div>
                <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                <Button variant="ghost" size="sm">Desactivar</Button>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="uso" className="mt-4">
          <Card><CardContent className="pt-4 space-y-3">
            {[
              { label: 'Productores activos', value: mock.producers, limit: 500, icon: Users },
              { label: 'Parcelas', value: mock.plots, limit: 1000, icon: Map },
              { label: 'Lotes', value: 42, limit: 100, icon: Package },
              { label: 'Dossiers EUDR', value: 18, limit: 50, icon: FileText },
            ].map(item => {
              const pct = Math.min((item.value / item.limit) * 100, 100);
              const over = item.value > item.limit;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><item.icon className="h-3.5 w-3.5 text-muted-foreground" /> {item.label}</span>
                    <span className={over ? 'text-red-500 font-semibold' : 'text-foreground'}>{item.value} / {item.limit}{over ? ' ⚠️' : ''}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-primary'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="facturacion" className="mt-4">
          <Card><CardContent className="pt-4 space-y-2">
            {[
              { id: 'INV-001', date: '2026-03-01', amount: '$750', status: 'Pagada' },
              { id: 'INV-002', date: '2026-02-01', amount: '$750', status: 'Pagada' },
              { id: 'INV-003', date: '2026-01-01', amount: '$620', status: 'Pagada' },
            ].map(inv => (
              <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1"><p className="text-sm font-medium">{inv.id}</p><p className="text-xs text-muted-foreground">{inv.date}</p></div>
                <span className="text-sm font-semibold">{inv.amount}</span>
                <Badge variant="outline">{inv.status}</Badge>
                <Button variant="ghost" size="sm">Ver</Button>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="riesgo" className="mt-4">
          <Card><CardContent className="pt-4 space-y-2">
            {[
              { label: 'Trazabilidad incompleta', count: 3, severity: 'high' },
              { label: 'Fallas EUDR', count: 1, severity: 'medium' },
              { label: 'Inconsistencias de datos', count: 0, severity: 'low' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <span className="text-sm">{r.label}</span>
                <Badge variant={r.count > 0 ? (r.severity === 'high' ? 'destructive' : 'secondary') : 'outline'}>{r.count}</Badge>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminOrganizations() {
  const { data: orgs, isLoading, refetch } = useAdminOrganizations();
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<AdminOrg | null>(null);

  if (selectedOrg) return <OrgDetail org={selectedOrg} onBack={() => setSelectedOrg(null)} />;

  const filtered = (orgs ?? []).filter(o =>
    o.nombre.toLowerCase().includes(search.toLowerCase()) || o.tipo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Organizaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} organizaciones registradas</p></div>
        <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o tipo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 max-w-sm" /></div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(o => {
            const mock = getOrgMockData(o);
            return (
              <button key={o.id} onClick={() => setSelectedOrg(o)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left">
                <Building2 className="h-6 w-6 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{o.nombre}</p>
                  <p className="text-xs text-muted-foreground capitalize">{o.tipo} · Creada {new Date(o.created_at).toLocaleDateString('es')}</p>
                </div>
                <Badge variant="outline" className="capitalize">{mock.plan}</Badge>
                <Badge variant="default">{mock.status}</Badge>
                <span className="text-sm text-muted-foreground">{mock.healthScore}%</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
