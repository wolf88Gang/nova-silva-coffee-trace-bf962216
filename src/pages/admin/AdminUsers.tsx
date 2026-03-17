/**
 * Admin Users — Global user management
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, Users, Shield, UserX } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminData';

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = useAdminUsers();
  const [search, setSearch] = useState('');

  const filtered = (users ?? []).filter(u =>
    (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.organization_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string | null) => {
    if (role === 'admin') return 'destructive' as const;
    if (role === 'cooperativa' || role === 'exportador') return 'default' as const;
    return 'secondary' as const;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} usuarios en la plataforma</p></div>
        <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar usuario, org o rol..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" /></div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nombre</th>
                    <th className="pb-2 font-medium">Organización</th>
                    <th className="pb-2 font-medium">Rol</th>
                    <th className="pb-2 font-medium">ID</th>
                    <th className="pb-2 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(u => (
                    <tr key={u.user_id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium text-foreground">{u.name ?? 'Sin nombre'}</td>
                      <td className="py-3 text-muted-foreground">{u.organization_name ?? '—'}</td>
                      <td className="py-3"><Badge variant={roleBadge(u.role)} className="capitalize">{u.role ?? 'sin rol'}</Badge></td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">{u.user_id.slice(0, 12)}…</td>
                      <td className="py-3 text-right space-x-1">
                        <Button variant="ghost" size="sm" className="h-7 gap-1"><Shield className="h-3 w-3" /> Rol</Button>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-destructive hover:text-destructive"><UserX className="h-3 w-3" /> Bloquear</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
