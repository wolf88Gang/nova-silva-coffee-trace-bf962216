import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, Ship, ShieldCheck, Users, ArrowRight, Award } from 'lucide-react';
import { getExportadorStats, DEMO_LOTES_COMERCIALES } from '@/lib/demo-data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const estadoBadge = (s: string) => {
  const map: Record<string, string> = { en_formacion: 'En formación', listo: 'Listo', en_transito: 'En tránsito', entregado: 'Entregado' };
  const variant = s === 'en_transito' ? 'secondary' : s === 'listo' ? 'default' : 'outline';
  return <Badge variant={variant as any}>{map[s] || s}</Badge>;
};

export default function DashboardExportador() {
  const stats = getExportadorStats();
  const navigate = useNavigate();

  const kpis = [
    { label: 'Volumen total (sacos)', value: stats.volumenTotal, icon: Package, route: '/exportador/lotes' },
    { label: 'Contratos activos', value: stats.contratosActivos, icon: FileText, route: '/exportador/contratos' },
    { label: 'Embarques en tránsito', value: stats.embarquesEnTransito, icon: Ship, route: '/exportador/embarques' },
    { label: 'EUDR Compliance', value: `${stats.eudrCompliance}%`, icon: ShieldCheck, route: '/exportador/eudr' },
    { label: 'Proveedores activos', value: stats.proveedoresActivos, icon: Users, route: '/exportador/proveedores' },
  ];

  const chartData = DEMO_LOTES_COMERCIALES.map(l => ({
    name: l.codigoICO.split('-').slice(-1)[0],
    sacos: l.pesoSacos,
    sca: l.puntajeSCA,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={kpi.route ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={() => kpi.route && navigate(kpi.route)}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Volume chart */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Volumen por lote</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="sacos" name="Sacos" radius={[4,4,0,0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={`hsl(var(--primary))`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quality chart */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Puntaje SCA por lote</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[75, 90]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="sca" name="SCA" radius={[4,4,0,0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={`hsl(var(--accent))`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lotes table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Lotes comerciales</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/exportador/lotes')}>Ver todo <ArrowRight className="h-3 w-3 ml-1" /></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-left">
                <th className="py-2 font-medium">Código ICO</th>
                <th className="py-2 font-medium">Origen</th>
                <th className="py-2 font-medium">Sacos</th>
                <th className="py-2 font-medium">SCA</th>
                <th className="py-2 font-medium">EUDR</th>
                <th className="py-2 font-medium">Estado</th>
              </tr></thead>
              <tbody>
                {DEMO_LOTES_COMERCIALES.map(l => (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2 font-medium text-foreground">{l.codigoICO}</td>
                    <td className="py-2 text-muted-foreground">{l.origen}</td>
                    <td className="py-2">{l.pesoSacos}</td>
                    <td className="py-2 font-bold">{l.puntajeSCA}</td>
                    <td className="py-2"><Badge variant={l.estadoEUDR === 'compliant' ? 'default' : 'secondary'}>{l.estadoEUDR}</Badge></td>
                    <td className="py-2">{estadoBadge(l.estado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
