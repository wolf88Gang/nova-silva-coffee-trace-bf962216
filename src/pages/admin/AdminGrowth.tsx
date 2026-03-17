/**
 * Admin Growth & Feedback
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, MessageSquare, Mail, Megaphone, ArrowRight } from 'lucide-react';

const MOCK_LEADS = [
  { name: 'Cooperativa La Esperanza', type: 'cooperativa', status: 'trial', date: '2026-03-15' },
  { name: 'Exportadora Volcán', type: 'exportador', status: 'lead', date: '2026-03-12' },
  { name: 'Finca San Cristóbal', type: 'productor_privado', status: 'trial', date: '2026-03-10' },
];

const MOCK_FEEDBACK = [
  { id: 1, user: 'María G.', org: 'Cooperativa Demo', type: 'sugerencia', message: 'Agregar exportación PDF de dossiers EUDR', date: '2026-03-14' },
  { id: 2, user: 'Carlos M.', org: 'Exportadora Sol', type: 'bug', message: 'Error al cargar parcelas con >100 puntos GPS', date: '2026-03-13' },
  { id: 3, user: 'Pedro T.', org: 'Cooperativa Demo', type: 'sugerencia', message: 'Notificaciones push para alertas de Guard', date: '2026-03-11' },
];

export default function AdminGrowth() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Growth & Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">Leads, conversión, feedback y campañas</p>
      </div>

      {/* Conversion KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-muted-foreground">Nuevos registros (mes)</p><p className="text-2xl font-bold text-foreground">7</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-muted-foreground">Conversión trial→paid</p><p className="text-2xl font-bold text-emerald-500">42%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-muted-foreground">Bugs reportados</p><p className="text-2xl font-bold text-yellow-500">3</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-muted-foreground">Sugerencias</p><p className="text-2xl font-bold text-foreground">12</p>
        </CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Leads */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Leads & Trials</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {MOCK_LEADS.map(l => (
              <div key={l.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{l.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{l.type} · {l.date}</p>
                </div>
                <Badge variant={l.status === 'trial' ? 'default' : 'secondary'}>{l.status}</Badge>
                <Button variant="ghost" size="sm" className="gap-1">Ver <ArrowRight className="h-3 w-3" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Feedback</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {MOCK_FEEDBACK.map(f => (
              <div key={f.id} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{f.user}</span>
                  <span className="text-xs text-muted-foreground">· {f.org}</span>
                  <Badge variant={f.type === 'bug' ? 'destructive' : 'outline'} className="ml-auto text-xs">{f.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{f.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Campaigns */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4" /> Campañas & Ofertas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
            <Mail className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Newsletter: Novedades EUDR Q1 2026</p>
              <p className="text-xs text-muted-foreground">Enviado a 3 organizaciones · 12 Mar 2026</p>
            </div>
            <Badge variant="outline">Enviado</Badge>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
            <Megaphone className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Promo: 20% descuento anual para trials activos</p>
              <p className="text-xs text-muted-foreground">Programada · 20 Mar 2026</p>
            </div>
            <Badge variant="secondary">Programada</Badge>
            <Button variant="outline" size="sm">Editar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
