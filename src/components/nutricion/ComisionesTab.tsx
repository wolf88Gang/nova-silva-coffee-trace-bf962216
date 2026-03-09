import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Filter, TrendingUp } from 'lucide-react';

interface Commission {
  id: string;
  quote_id: string;
  supplier_id: string;
  amount: number;
  commission_pct: number;
  status: string;
  created_at: string;
}

interface Supplier {
  id: string;
  nombre: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  paid: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  cancelled: 'Cancelada',
};

export default function ComisionesTab() {
  const { organizationId } = useOrgContext();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['ag_commissions', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_commissions' as any);
      if (error) throw error;
      return (data ?? []) as Commission[];
    },
    enabled: !!organizationId,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['ag_suppliers', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_suppliers' as any);
      if (error) throw error;
      return (data ?? []) as Supplier[];
    },
    enabled: !!organizationId,
  });

  const supplierName = (id: string) => suppliers?.find(s => s.id === id)?.nombre ?? 'Proveedor';

  const filtered = commissions?.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (dateFrom && c.created_at < dateFrom) return false;
    if (dateTo && c.created_at > dateTo + 'T23:59:59') return false;
    return true;
  }) ?? [];

  const totalPending = filtered.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
  const totalPaid = filtered.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="text-lg font-bold text-foreground">${totalPending.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Pagadas</p>
              <p className="text-lg font-bold text-foreground">${totalPaid.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Filter className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Registros</p>
              <p className="text-lg font-bold text-foreground">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-40">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">Sin comisiones</h3>
            <p className="text-sm text-muted-foreground">
              Las comisiones se generan automáticamente al aceptar o cumplir una cotización.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">% Comisión</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">
                      {new Date(c.created_at).toLocaleDateString('es')}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{supplierName(c.supplier_id)}</TableCell>
                    <TableCell className="text-right text-sm">{(c.commission_pct * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-sm font-medium">${c.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_BADGE[c.status] ?? ''}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
