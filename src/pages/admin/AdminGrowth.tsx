/**
 * Admin Growth, Feedback & M&E (Monitoring, Evaluation & Learning)
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, Users, MessageSquare, Mail, Megaphone, ArrowRight,
  BarChart3, Globe, Shield, Cpu, Download, Target,
  ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import {
  SectionHeader, MetricCard, StatusBadge, EmptyState,
  DataSourceBadge, PendingIntegration, LimitedDataNotice,
} from '@/components/admin/shared/AdminComponents';
import { useAdminGrowthData } from '@/hooks/useAdminDataAdapters';
import {
  MOCK_MEL_INDICATORS, MOCK_MEL_ORG_IMPACT,
  type MELIndicator, type MELOrgImpact,
} from '@/lib/adminMockData';

// ── M&E Indicator Row ──

function IndicatorRow({ ind }: { ind: MELIndicator }) {
  const trendIcon = ind.trend === 'up'
    ? <ArrowUpRight className="h-3.5 w-3.5 text-success" />
    : ind.trend === 'down'
    ? <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
    : ind.trend === 'stable'
    ? <Minus className="h-3.5 w-3.5 text-muted-foreground" />
    : null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{ind.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{ind.period}</span>
          {ind.baseline && <span className="text-xs text-muted-foreground">. Base: {ind.baseline}</span>}
          {ind.target && <span className="text-xs text-muted-foreground">. Meta: {ind.target}</span>}
          <DataSourceBadge source={ind.source === 'real' ? 'real' : 'mock'} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {trendIcon}
        <span className="text-lg font-bold tabular-nums text-foreground">{ind.value}</span>
        {ind.unit && <span className="text-xs text-muted-foreground">{ind.unit}</span>}
      </div>
    </div>
  );
}

// ── M&E Org Impact Table ──

function OrgImpactTable({ orgs }: { orgs: MELOrgImpact[] }) {
  if (orgs.length === 0) {
    return <EmptyState title="No hay datos disponibles" description="Sin datos de impacto por organización." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left p-2 text-xs font-medium text-muted-foreground">Organización</th>
            <th className="text-center p-2 text-xs font-medium text-muted-foreground">País</th>
            <th className="text-center p-2 text-xs font-medium text-muted-foreground">Productores</th>
            <th className="text-center p-2 text-xs font-medium text-muted-foreground">Parcelas</th>
            <th className="text-center p-2 text-xs font-medium text-muted-foreground">Geo %</th>
            <th className="text-center p-2 text-xs font-medium text-muted-foreground">VITAL</th>
            <th className="text-center p-2 text-xs font-medium text-muted-foreground">EUDR %</th>
            <th className="text-center p-2 text-xs font-medium text-muted-foreground">Módulos</th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((o, i) => {
            const geoPct = o.plots > 0 ? Math.round((o.geolocated / o.plots) * 100) : 0;
            return (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                <td className="p-2">
                  <p className="font-medium text-foreground">{o.orgName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{o.orgType}</p>
                </td>
                <td className="text-center p-2 text-muted-foreground">{o.country}</td>
                <td className="text-center p-2 font-semibold tabular-nums">{o.producers.toLocaleString()}</td>
                <td className="text-center p-2 tabular-nums">{o.plots.toLocaleString()}</td>
                <td className="text-center p-2">
                  <Badge variant={geoPct >= 90 ? 'default' : geoPct >= 60 ? 'secondary' : 'destructive'} className="text-xs tabular-nums">
                    {geoPct}%
                  </Badge>
                </td>
                <td className="text-center p-2">
                  <span className={`font-semibold tabular-nums ${o.vitalAvg >= 75 ? 'text-success' : o.vitalAvg >= 60 ? 'text-warning' : 'text-destructive'}`}>
                    {o.vitalAvg}
                  </span>
                </td>
                <td className="text-center p-2">
                  <Badge variant={o.eudrCompliance >= 90 ? 'default' : o.eudrCompliance >= 60 ? 'secondary' : 'destructive'} className="text-xs tabular-nums">
                    {o.eudrCompliance}%
                  </Badge>
                </td>
                <td className="text-center p-2 tabular-nums">{o.modulesActive}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border/50 font-semibold">
            <td className="p-2 text-foreground">Total / Promedio</td>
            <td className="text-center p-2 text-muted-foreground">{new Set(orgs.map(o => o.country)).size}</td>
            <td className="text-center p-2 tabular-nums">{orgs.reduce((s, o) => s + o.producers, 0).toLocaleString()}</td>
            <td className="text-center p-2 tabular-nums">{orgs.reduce((s, o) => s + o.plots, 0).toLocaleString()}</td>
            <td className="text-center p-2 tabular-nums">
              {Math.round(orgs.reduce((s, o) => s + (o.plots > 0 ? (o.geolocated / o.plots) * 100 : 0), 0) / orgs.length)}%
            </td>
            <td className="text-center p-2 tabular-nums">
              {Math.round(orgs.reduce((s, o) => s + o.vitalAvg, 0) / orgs.length)}
            </td>
            <td className="text-center p-2 tabular-nums">
              {Math.round(orgs.reduce((s, o) => s + o.eudrCompliance, 0) / orgs.length)}%
            </td>
            <td className="text-center p-2 tabular-nums">
              {Math.round(orgs.reduce((s, o) => s + o.modulesActive, 0) / orgs.length)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── CSV Export ──

function exportMELToCSV() {
  const headers = ['Categoría', 'Indicador', 'Valor', 'Unidad', 'Línea Base', 'Meta', 'Período', 'Tendencia', 'Fuente'];
  const categoryLabels: Record<string, string> = { impact: 'Impacto', eudr: 'EUDR/Cumplimiento', platform: 'Plataforma', adoption: 'Adopción' };
  const rows = MOCK_MEL_INDICATORS.map(i => [
    categoryLabels[i.category] ?? i.category,
    i.name, String(i.value), i.unit,
    i.baseline ?? '', i.target ?? '', i.period,
    i.trend ?? '', i.source,
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `novasilva_mel_report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportOrgImpactCSV() {
  const headers = ['Organización', 'Tipo', 'País', 'Productores', 'Parcelas', 'Geolocalizadas', 'VITAL Avg', 'EUDR %', 'Módulos Activos'];
  const rows = MOCK_MEL_ORG_IMPACT.map(o => [
    o.orgName, o.orgType, o.country,
    String(o.producers), String(o.plots), String(o.geolocated),
    String(o.vitalAvg), String(o.eudrCompliance), String(o.modulesActive),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `novasilva_org_impact_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main ──

export default function AdminGrowth() {
  const growth = useAdminGrowthData();
  const [melTab, setMelTab] = useState('impact');

  const impactIndicators = MOCK_MEL_INDICATORS.filter(i => i.category === 'impact');
  const eudrIndicators = MOCK_MEL_INDICATORS.filter(i => i.category === 'eudr');
  const platformIndicators = MOCK_MEL_INDICATORS.filter(i => i.category === 'platform');
  const adoptionIndicators = MOCK_MEL_INDICATORS.filter(i => i.category === 'adoption');

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Growth, Feedback y M&E"
        subtitle="Leads, conversión, feedback, campañas e indicadores de impacto"
        actions={
          <div className="flex items-center gap-2">
            <DataSourceBadge source="mock" />
          </div>
        }
      />

      <PendingIntegration feature="Analytics backend (eventos, métricas de uso, conversiones)" />

      {/* M&E / MEL Section */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Monitoreo, Evaluación y Aprendizaje (M&E)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportMELToCSV}>
                <Download className="h-3.5 w-3.5" /> Exportar indicadores CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={melTab} onValueChange={setMelTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="impact" className="gap-1.5"><Globe className="h-3.5 w-3.5" /> Impacto</TabsTrigger>
              <TabsTrigger value="eudr" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> EUDR</TabsTrigger>
              <TabsTrigger value="platform" className="gap-1.5"><Cpu className="h-3.5 w-3.5" /> Plataforma</TabsTrigger>
              <TabsTrigger value="adoption" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Adopción</TabsTrigger>
              <TabsTrigger value="orgs" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Por organización</TabsTrigger>
            </TabsList>

            <TabsContent value="impact" className="space-y-2">
              {impactIndicators.length === 0 ? (
                <EmptyState title="No hay datos disponibles" description="Sin indicadores de impacto configurados." />
              ) : impactIndicators.map(i => <IndicatorRow key={i.id} ind={i} />)}
            </TabsContent>

            <TabsContent value="eudr" className="space-y-2">
              {eudrIndicators.length === 0 ? (
                <EmptyState title="No hay datos disponibles" description="Sin indicadores EUDR configurados." />
              ) : eudrIndicators.map(i => <IndicatorRow key={i.id} ind={i} />)}
            </TabsContent>

            <TabsContent value="platform" className="space-y-2">
              {platformIndicators.length === 0 ? (
                <EmptyState title="No hay datos disponibles" description="Sin indicadores de plataforma configurados." />
              ) : platformIndicators.map(i => <IndicatorRow key={i.id} ind={i} />)}
            </TabsContent>

            <TabsContent value="adoption" className="space-y-2">
              {adoptionIndicators.length === 0 ? (
                <EmptyState title="No hay datos disponibles" description="Sin indicadores de adopción configurados." />
              ) : adoptionIndicators.map(i => <IndicatorRow key={i.id} ind={i} />)}
            </TabsContent>

            <TabsContent value="orgs">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Impacto desagregado por organización</p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={exportOrgImpactCSV}>
                  <Download className="h-3.5 w-3.5" /> Exportar CSV
                </Button>
              </div>
              <OrgImpactTable orgs={MOCK_MEL_ORG_IMPACT} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Conversion KPIs */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversión y feedback</span>
          <DataSourceBadge source="mock" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Nuevos registros (mes)" value={7} icon={Users} source="mock" />
          <MetricCard label="Conversión trial a paid" value="42%" icon={TrendingUp} trend="up" source="mock" />
          <MetricCard label="Bugs reportados" value={growth.feedback.filter(f => f.type === 'bug').length} icon={MessageSquare} source="mock" />
          <MetricCard label="Sugerencias" value={growth.feedback.filter(f => f.type === 'sugerencia').length} icon={MessageSquare} source="mock" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Opportunities */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Oportunidades</CardTitle>
              <DataSourceBadge source="mock" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {growth.opportunities.length === 0 ? (
              <EmptyState title="No hay datos disponibles" description="Sin oportunidades detectadas." />
            ) : growth.opportunities.map((opp, i) => (
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Feedback</CardTitle>
              <DataSourceBadge source="mock" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {growth.feedback.length === 0 ? (
              <EmptyState title="No hay datos disponibles" description="Sin feedback recibido." />
            ) : growth.feedback.map(f => (
              <div key={f.id} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{f.user}</span>
                  <span className="text-xs text-muted-foreground">. {f.orgName}</span>
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
            <div className="flex items-center gap-2">
              <DataSourceBadge source="mock" />
              <Button variant="outline" size="sm" className="gap-1.5"><Mail className="h-3.5 w-3.5" /> Nueva campaña</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {growth.campaigns.length === 0 ? (
            <EmptyState title="No hay datos disponibles" description="Sin campañas registradas." />
          ) : growth.campaigns.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
              <Mail className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.audience} . {c.audienceCount} orgs . {c.date}</p>
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
