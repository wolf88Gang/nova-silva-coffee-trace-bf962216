/**
 * LeadsPipelineTable — visual pipeline for demo_leads.
 * Read-only from Supabase. No mock data. No backend mutations.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  SearchInput, EmptyState, ErrorState, DataSourceBadge,
} from '@/components/admin/shared/AdminComponents';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { UserPlus, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Types ──

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed';

interface DemoLead {
  id: string;
  nombre: string;
  email: string;
  organizacion: string | null;
  cta_source: string | null;
  estado: LeadStatus;
  created_at: string;
}

// ── Status badge config ──

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new: {
    label: 'Nuevo',
    className: 'bg-primary/15 text-primary border-primary/30',
  },
  contacted: {
    label: 'Contactado',
    className: 'bg-warning/15 text-warning border-warning/30',
  },
  qualified: {
    label: 'Calificado',
    className: 'bg-success/15 text-success border-success/30',
  },
  closed: {
    label: 'Cerrado',
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
  },
};

function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

// ── Hook ──

function useDemoLeads() {
  return useQuery({
    queryKey: ['admin', 'demo-leads'],
    queryFn: async (): Promise<DemoLead[]> => {
      const { data, error } = await supabase
        .from('demo_leads' as any)
        .select('id, nombre, email, organizacion, cta_source, estado, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) ?? []).map((row) => ({
        id: row.id,
        nombre: row.nombre ?? '',
        email: row.email ?? '',
        organizacion: row.organizacion,
        cta_source: row.cta_source,
        estado: (['new', 'contacted', 'qualified', 'closed'].includes(row.estado) ? row.estado : 'new') as LeadStatus,
        created_at: row.created_at,
      }));
    },
  });
}

// ── Loading skeleton ──

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

// ── Main component ──

export default function LeadsPipelineTable() {
  const { data: leads, isLoading, isError, error, refetch } = useDemoLeads();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = (leads ?? []).filter((lead) => {
    const matchesSearch =
      !search ||
      lead.nombre.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (lead.organizacion ?? '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Pipeline de leads</CardTitle>
            <DataSourceBadge source={isError ? 'mock' : 'real'} label={isError ? 'Sin conexión' : 'demo_leads'} />
          </div>
          {!isLoading && !isError && (
            <span className="text-xs text-muted-foreground">
              {filtered.length} de {leads?.length ?? 0} leads
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        {!isLoading && !isError && (
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nombre, email u organización…"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Filtrar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="new">Nuevo</SelectItem>
                <SelectItem value="contacted">Contactado</SelectItem>
                <SelectItem value="qualified">Calificado</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* States */}
        {isLoading && <TableSkeleton />}

        {isError && (
          <ErrorState
            message={error instanceof Error ? error.message : 'No se pudo conectar a demo_leads.'}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            title="Sin leads registrados"
            description={
              search || statusFilter !== 'all'
                ? 'No se encontraron leads con los filtros aplicados.'
                : 'Aún no se han capturado leads desde el flujo demo.'
            }
            icon={Inbox}
          />
        )}

        {/* Table */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Organización</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                    <TableCell>{lead.organizacion ?? <span className="text-muted-foreground italic">—</span>}</TableCell>
                    <TableCell>
                      {lead.cta_source ? (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {lead.cta_source}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <LeadStatusBadge status={lead.estado} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {lead.created_at
                        ? format(new Date(lead.created_at), "d MMM yyyy, HH:mm", { locale: es })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
