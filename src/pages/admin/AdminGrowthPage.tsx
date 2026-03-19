import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { MetricCard } from '@/components/admin/MetricCard';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAdminGrowth } from '@/hooks/admin/useAdminGrowth';
import { useAdminUpdateDemoLead } from '@/hooks/admin/useAdminUpdateDemoLead';
import { DegradedModeBanner } from '@/components/admin/DegradedModeBanner';
import { AdminErrorAlert } from '@/components/admin/AdminErrorAlert';
import { LimitedDataNotice } from '@/components/admin/LimitedDataNotice';
import { TrendingUp, MessageSquare, Target, Users, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { AdminDemoLead } from '@/types/admin';

const OPPORTUNITY_TYPE_LABELS: Record<string, string> = {
  high_usage_low_plan: 'Alto uso + plan bajo',
  trial_engaged: 'Trial con engagement',
  inactive_recoverable: 'Inactivo recuperable',
  addon_candidate: 'Candidato add-on',
};

const DEMO_LEAD_STATUSES = ['new', 'contacted', 'qualified', 'closed'] as const;
const DEMO_LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  closed: 'Cerrado',
};

const LEAD_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  new: 'neutral',
  contacted: 'warning',
  qualified: 'success',
  closed: 'neutral',
};

export default function AdminGrowthPage() {
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [leadCtaFilter, setLeadCtaFilter] = useState<string>('all');
  const [editingLead, setEditingLead] = useState<AdminDemoLead | null>(null);
  const [editStatus, setEditStatus] = useState<string>('new');
  const [editNotes, setEditNotes] = useState<string>('');
  const { trialMetrics, feedback, opportunities, demoLeads } = useAdminGrowth();
  const updateLead = useAdminUpdateDemoLead();
  const trialResult = trialMetrics.data;
  const feedbackResult = feedback.data;
  const oppsResult = opportunities.data;
  const leadsResult = demoLeads.data;
  const trialMetricsData = trialResult?.data;
  const feedbackData = feedbackResult?.data ?? [];
  const opportunitiesData = oppsResult?.data ?? [];
  const demoLeadsData = leadsResult?.data ?? [];
  const isDegraded = !!(trialResult?.isFallback || feedbackResult?.isFallback || oppsResult?.isFallback || leadsResult?.isFallback);
  const hasError = trialMetrics.isError || feedback.isError || opportunities.isError || demoLeads.isError;

  const filteredLeads = demoLeadsData.filter((l) => {
    if (leadStatusFilter !== 'all' && l.status !== leadStatusFilter) return false;
    if (leadCtaFilter !== 'all' && (l.ctaSource ?? '') !== leadCtaFilter) return false;
    return true;
  });

  const ctaSources = [...new Set(demoLeadsData.map((l) => l.ctaSource ?? '').filter(Boolean))].sort();

  const openEditLead = (lead: AdminDemoLead) => {
    setEditingLead(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.notes ?? '');
  };

  const handleSaveLead = async () => {
    if (!editingLead) return;
    try {
      await updateLead.mutateAsync({
        id: editingLead.id,
        status: editStatus,
        notes: editNotes || null,
      });
      toast.success('Lead actualizado');
      setEditingLead(null);
    } catch {
      toast.error('Error al actualizar');
    }
  };

  return (
    <div className="space-y-6">
      <AdminErrorAlert visible={hasError} />
      <DegradedModeBanner visible={isDegraded} />
      <LimitedDataNotice
        title="Datos limitados"
        description="Feedback y oportunidades provienen de tablas que pueden estar vacías. Trial metrics desde v_admin_organizations_summary."
      />
      <AdminPageHeader
        title="Growth"
        description="Trials, conversión, feedback y oportunidades"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Trials activos" value={trialMetricsData?.active ?? '—'} icon={TrendingUp} />
        <MetricCard label="Por vencer" value={trialMetricsData?.expiringSoon ?? '—'} variant="warning" />
        <MetricCard label="Tasa conversión" value={`${((trialMetricsData?.conversionRate ?? 0) * 100).toFixed(0)}%`} />
        <MetricCard label="Leads demo" value={demoLeadsData.length} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Feedback y sugerencias" description="Solicitudes de clientes">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organización</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbackData.slice(0, 6).map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.organizationName}</TableCell>
                  <TableCell>{f.category}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{f.message}</TableCell>
                  <TableCell><StatusBadge label={f.status} variant="neutral" /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(f.createdAt), "d MMM", { locale: es })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Oportunidades" description="Upsell, reactivación, add-ons">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organización</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunitiesData.slice(0, 6).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.organizationName}</TableCell>
                  <TableCell>{OPPORTUNITY_TYPE_LABELS[o.type] ?? o.type}</TableCell>
                  <TableCell>{o.score}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground text-sm">{o.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </div>

      <SectionCard title="Leads demo" description="Captura desde flujo demo y formulario de contacto">
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {DEMO_LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{DEMO_LEAD_STATUS_LABELS[s] ?? s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={leadCtaFilter} onValueChange={setLeadCtaFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Origen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los orígenes</SelectItem>
              {ctaSources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organización</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoLeads.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                  Sin leads
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.slice(0, 20).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.nombre}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell className="max-w-[120px] truncate">{l.organizacion ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{l.ctaSource ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge label={DEMO_LEAD_STATUS_LABELS[l.status] ?? l.status} variant={LEAD_STATUS_VARIANT[l.status] ?? 'neutral'} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(l.createdAt), "d MMM", { locale: es })}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditLead(l)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <Dialog open={!!editingLead} onOpenChange={(o) => !o && setEditingLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-4">
              <div>
                <Label>Estado</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{DEMO_LEAD_STATUS_LABELS[s] ?? s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notas internas..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLead(null)}>Cancelar</Button>
            <Button onClick={handleSaveLead} disabled={updateLead.isPending}>
              {updateLead.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
