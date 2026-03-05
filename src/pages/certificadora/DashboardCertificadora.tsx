import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGreeting } from '@/lib/genderHelper';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ClipboardCheck, Building2, ShieldCheck, AlertTriangle, Calendar,
  ChevronRight, ExternalLink, FileSearch, TrendingUp,
} from 'lucide-react';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle } from '@/lib/chartStyles';

/* ── Demo data ── */
const kpis = [
  { label: 'Auditorías activas', value: '6', icon: ClipboardCheck, route: '/certificadora/auditorias', sub: '2 esta semana' },
  { label: 'Organizaciones', value: '12', icon: Building2, route: '/certificadora/orgs', sub: 'En seguimiento' },
  { label: 'Cumplimiento promedio', value: '78%', icon: ShieldCheck, route: '/certificadora/verificar', sub: '+3% vs trimestre anterior' },
  { label: 'Hallazgos abiertos', value: '14', icon: AlertTriangle, route: '/certificadora/reportes', sub: '5 críticos' },
];

const cumplimientoSellos = [
  { sello: 'Rainforest Alliance', orgs: 5, cumplimiento: 82 },
  { sello: 'Fairtrade', orgs: 4, cumplimiento: 76 },
  { sello: 'EUDR Compliance', orgs: 3, cumplimiento: 71 },
  { sello: 'UTZ / 4C', orgs: 2, cumplimiento: 88 },
];

const hallazgosPorTipo = [
  { tipo: 'Documentación', cantidad: 5, color: 'hsl(var(--primary))' },
  { tipo: 'Trazabilidad', cantidad: 4, color: 'hsl(var(--accent))' },
  { tipo: 'Ambiental', cantidad: 3, color: 'hsl(142 71% 45%)' },
  { tipo: 'Social/Laboral', cantidad: 2, color: 'hsl(var(--muted-foreground))' },
];

const proximasAuditorias = [
  { id: 'a1', org: 'Cooperativa Café de la Selva', sello: 'Rainforest Alliance', fecha: '2026-03-10', auditor: 'Dr. Carlos Ruiz', tipo: 'Renovación' },
  { id: 'a2', org: 'Exportadora Sol de América', sello: 'EUDR Compliance', fecha: '2026-03-15', auditor: 'Ing. Ana López', tipo: 'Primera certificación' },
  { id: 'a3', org: 'Cooperativa Los Altos', sello: 'Fairtrade', fecha: '2026-03-22', auditor: 'Dr. Carlos Ruiz', tipo: 'Seguimiento' },
];

const hallazgosRecientes = [
  { id: 'h1', org: 'Cooperativa Montaña Verde', hallazgo: 'Falta de registros de aplicación de agroquímicos en 3 fincas', severidad: 'critico' as const, fecha: '2026-02-28' },
  { id: 'h2', org: 'Exportadora Sol de América', hallazgo: 'GPS desactualizado en 12 parcelas — no coincide con polígonos declarados', severidad: 'critico' as const, fecha: '2026-02-25' },
  { id: 'h3', org: 'Cooperativa Los Altos', hallazgo: 'Contratos laborales vencidos para 8 trabajadores temporales', severidad: 'mayor' as const, fecha: '2026-02-20' },
  { id: 'h4', org: 'Cooperativa Café de la Selva', hallazgo: 'Calibración de básculas pendiente desde hace 4 meses', severidad: 'menor' as const, fecha: '2026-02-15' },
];

const sevConfig = {
  critico: { label: 'Crítico', badge: 'bg-destructive text-destructive-foreground' },
  mayor: { label: 'Mayor', badge: 'bg-accent text-accent-foreground' },
  menor: { label: 'Menor', badge: 'bg-muted text-muted-foreground' },
};

export default function DashboardCertificadora() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedAuditoria, setSelectedAuditoria] = useState<typeof proximasAuditorias[0] | null>(null);
  const [selectedHallazgo, setSelectedHallazgo] = useState<typeof hallazgosRecientes[0] | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {user?.name ? `${getGreeting(user.name)}, ${user.name.split(' ')[0]}` : 'Centro de Certificación'}
        </h1>
        <p className="text-sm text-muted-foreground">Auditorías, verificación y cumplimiento de organizaciones</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group" onClick={() => navigate(kpi.route)}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <kpi.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-[11px] text-primary/70 mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Cumplimiento por Sello</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cumplimientoSellos.map((s) => (
                <div key={s.sello} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{s.sello}</span>
                    <span className="text-muted-foreground">{s.cumplimiento}% ({s.orgs} orgs)</span>
                  </div>
                  <Progress value={s.cumplimiento} className="h-2.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-accent" /> Hallazgos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={hallazgosPorTipo} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="cantidad" paddingAngle={3}
                  label={({ tipo, cantidad }) => `${tipo}: ${cantidad}`}>
                  {hallazgosPorTipo.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Próximas auditorías + Hallazgos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Próximas Auditorías</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/certificadora/auditorias')}>Ver todas <ExternalLink className="h-3 w-3 ml-1" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {proximasAuditorias.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-all group" onClick={() => setSelectedAuditoria(a)}>
                <div>
                  <p className="text-sm font-medium text-foreground">{a.org}</p>
                  <p className="text-xs text-muted-foreground">{a.sello} · {a.tipo}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <p className="text-xs font-medium text-foreground">{a.fecha}</p>
                    <p className="text-[10px] text-muted-foreground">{a.auditor}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><FileSearch className="h-4 w-4 text-accent" /> Hallazgos Recientes</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/certificadora/reportes')}>Ver todos <ExternalLink className="h-3 w-3 ml-1" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {hallazgosRecientes.map((h) => (
              <div key={h.id} className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${h.severidad === 'critico' ? 'border-destructive/20 bg-destructive/5' : h.severidad === 'mayor' ? 'border-accent/20 bg-accent/5' : 'border-border'}`} onClick={() => setSelectedHallazgo(h)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-1">{h.hallazgo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{h.org} · {h.fecha}</p>
                  </div>
                  <Badge className={sevConfig[h.severidad].badge}>{sevConfig[h.severidad].label}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Auditorías', icon: ClipboardCheck, route: '/certificadora/auditorias' },
          { label: 'Organizaciones', icon: Building2, route: '/certificadora/orgs' },
          { label: 'Verificar', icon: ShieldCheck, route: '/certificadora/verificar' },
          { label: 'Reportes', icon: FileSearch, route: '/certificadora/reportes' },
        ].map(a => (
          <Button key={a.label} variant="outline" className="h-auto py-3 flex flex-col items-center gap-1.5" onClick={() => navigate(a.route)}>
            <a.icon className="h-5 w-5 text-primary" />
            <span className="text-xs">{a.label}</span>
          </Button>
        ))}
      </div>

      {/* Auditoria detail */}
      <Dialog open={!!selectedAuditoria} onOpenChange={(o) => !o && setSelectedAuditoria(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Detalle de Auditoría</DialogTitle></DialogHeader>
          {selectedAuditoria && (
            <div className="space-y-3">
              {[
                { l: 'Organización', v: selectedAuditoria.org },
                { l: 'Sello', v: selectedAuditoria.sello },
                { l: 'Tipo', v: selectedAuditoria.tipo },
                { l: 'Fecha', v: selectedAuditoria.fecha },
                { l: 'Auditor', v: selectedAuditoria.auditor },
              ].map(i => (
                <div key={i.l} className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">{i.l}</span>
                  <span className="text-sm font-medium text-foreground">{i.v}</span>
                </div>
              ))}
              <Button className="w-full" onClick={() => { setSelectedAuditoria(null); navigate('/certificadora/auditorias'); }}>Ir a Auditorías</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hallazgo detail */}
      <Dialog open={!!selectedHallazgo} onOpenChange={(o) => !o && setSelectedHallazgo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-accent" /> Hallazgo</DialogTitle></DialogHeader>
          {selectedHallazgo && (
            <div className="space-y-4">
              <Badge className={sevConfig[selectedHallazgo.severidad].badge}>{sevConfig[selectedHallazgo.severidad].label}</Badge>
              <p className="text-sm text-foreground">{selectedHallazgo.hallazgo}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Organización</p><p className="text-sm font-medium text-foreground">{selectedHallazgo.org}</p></div>
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Fecha</p><p className="text-sm font-medium text-foreground">{selectedHallazgo.fecha}</p></div>
              </div>
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-xs font-medium text-foreground mb-1">Acción recomendada</p>
                <p className="text-xs text-muted-foreground">
                  {selectedHallazgo.severidad === 'critico'
                    ? 'Requiere corrección inmediata. La organización debe presentar evidencia de resolución en un plazo no mayor a 30 días para mantener el estatus de certificación.'
                    : selectedHallazgo.severidad === 'mayor'
                    ? 'Se debe corregir antes de la próxima auditoría de seguimiento. Documentar el plan de acción correctivo.'
                    : 'Observación menor. Se recomienda corregir para mejorar el puntaje general de cumplimiento.'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
