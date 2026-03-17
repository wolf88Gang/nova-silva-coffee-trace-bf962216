/**
 * Admin Growth & Feedback — Uses adapter layer.
 * TODO: Replace mock data with analytics/feedback tables when ready.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, MessageSquare, Mail, Megaphone, ArrowRight } from 'lucide-react';
import { SectionHeader, MetricCard, StatusBadge, PendingIntegration } from '@/components/admin/shared/AdminComponents';
import { useAdminGrowthData } from '@/hooks/useAdminDataAdapters';

export default function AdminGrowth() {
  const growth = useAdminGrowthData();

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Growth & Feedback"
        subtitle="Leads, conversión, feedback y campañas"
        actions={<PendingIntegration feature="Analytics backend" />}
      />

      {/* Conversion KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Nuevos registros (mes)" value={7} icon={Users} />
        <MetricCard label="Conversión trial→paid" value="42%" icon={TrendingUp} trend="up" />
        <MetricCard label="Bugs reportados" value={growth.feedback.filter(f => f.type === 'bug').length} icon={MessageSquare} />
        <MetricCard label="Sugerencias" value={growth.feedback.filter(f => f.type === 'sugerencia').length} icon={MessageSquare} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Opportunities */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Oportunidades</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {growth.opportunities.map((opp, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{opp.orgName}</span>
                  <Badge variant={opp.type === 'upgrade' ? 'default' : opp.type === 'conversion' ? 'secondary' : 'outline'} className="text-xs capitalize">{opp.type}</Badge>
                  {opp.engagement > 0 && <span className="text-xs text-muted-foreground ml-auto">{opp.engagement}% engagement</span>}
                </div>
                <p className="text-xs text-muted-foreground">{opp.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Feedback</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {growth.feedback.map(f => (
              <div key={f.id} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{f.user}</span>
                  <span className="text-xs text-muted-foreground">· {f.orgName}</span>
                  <Badge variant={f.type === 'bug' ? 'destructive' : f.type === 'sugerencia' ? 'secondary' : 'outline'} className="ml-auto text-xs">{f.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{f.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-xs">{f.category}</Badge>
                  <StatusBadge
                    status={f.status === 'resolved' ? 'ok' : f.status === 'planned' ? 'info' : f.status === 'reviewed' ? 'warning' : 'neutral'}
                    label={f.status === 'resolved' ? 'Resuelto' : f.status === 'planned' ? 'Planeado' : f.status === 'reviewed' ? 'Revisado' : 'Nuevo'}
                  />
                  <span className="text-xs text-muted-foreground ml-auto">{f.date}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Campaigns */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4" /> Campañas</CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5"><Mail className="h-3.5 w-3.5" /> Nueva campaña</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {growth.campaigns.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
              <Mail className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.audience} · {c.audienceCount} orgs · {c.date}</p>
              </div>
              {c.openRate !== undefined && <span className="text-xs text-muted-foreground">{c.openRate}% apertura</span>}
              <Badge variant={c.status === 'sent' ? 'default' : c.status === 'scheduled' ? 'secondary' : 'outline'} className="capitalize">
                {c.status === 'sent' ? 'Enviada' : c.status === 'scheduled' ? 'Programada' : 'Borrador'}
              </Badge>
              <Button variant="ghost" size="sm" className="gap-1">Ver <ArrowRight className="h-3 w-3" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
