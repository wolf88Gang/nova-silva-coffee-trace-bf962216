import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, TrendingUp, Leaf, FileText, ArrowRight } from 'lucide-react';

const sections = [
  { title: 'Panel financiero', description: 'Ingresos, costos e indicadores operativos', icon: DollarSign, path: '/finanzas/panel', stat: '₡ 142M ingresos' },
  { title: 'Créditos', description: 'Solicitudes, scoring y decisiones de comité', icon: CreditCard, path: '/finanzas/creditos', stat: '8 solicitudes' },
  { title: 'Score Nova', description: 'Factores agronómicos y operativos del score crediticio', icon: TrendingUp, path: '/finanzas/score-nova', stat: 'Score: 74' },
  { title: 'Carbono', description: 'Activos naturales, MRV y estimaciones de carbono', icon: Leaf, path: '/finanzas/carbono', stat: '12.4 tCO₂e' },
  { title: 'Facturación', description: 'Plan, uso, add-ons e invoices', icon: FileText, path: '/finanzas/facturacion', stat: 'Plan Pro' },
];

export default function FinanzasIndex() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader title="Finanzas" description="Monetización, scoring y capital" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(s => (
          <Card key={s.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(s.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <s.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardTitle className="text-base mt-2">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{s.description}</p>
              <Badge variant="secondary" className="text-xs">{s.stat}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
