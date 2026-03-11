import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sprout, Bug, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';

const modules = [
  {
    title: 'Nutrición',
    description: 'Análisis de suelo, planes nutricionales y ejecución por parcela.',
    icon: Sprout,
    path: '/agronomia/nutricion',
    alerts: [
      { text: '14 parcelas con plan vencido', level: 'warning' as const },
      { text: '6 análisis pendientes de revisión', level: 'info' as const },
    ],
  },
  {
    title: 'Nova Guard',
    description: 'Diagnóstico fitosanitario, brotes activos y alertas regionales.',
    icon: Bug,
    path: '/agronomia/guard',
    alerts: [
      { text: '3 brotes activos', level: 'destructive' as const },
      { text: '2 parcelas en observación', level: 'warning' as const },
    ],
  },
  {
    title: 'Nova Yield',
    description: 'Estimaciones de cosecha, muestreo y proyecciones productivas.',
    icon: TrendingUp,
    path: '/agronomia/yield',
    alerts: [
      { text: '8 estimaciones pendientes', level: 'warning' as const },
    ],
  },
  {
    title: 'Recomendaciones y alertas',
    description: 'Vista transversal de alertas agronómicas y recomendaciones accionables.',
    icon: AlertTriangle,
    path: '/agronomia/alertas',
    alerts: [],
  },
];

const alertColors = { warning: 'bg-warning/10 border-warning/20 text-warning', destructive: 'bg-destructive/10 border-destructive/20 text-destructive', info: 'bg-accent/10 border-accent/20 text-accent' };

export default function AgronomiaIndex() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader title="Centro Agronómico" description="Interpretación y acción técnica sobre el contexto productivo" />

      <div className="grid gap-5 sm:grid-cols-2">
        {modules.map(m => (
          <Card key={m.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(m.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <m.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardTitle className="text-base mt-2">{m.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{m.description}</p>
              {m.alerts.length > 0 && (
                <div className="space-y-1.5">
                  {m.alerts.map((a, i) => (
                    <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs ${alertColors[a.level]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {a.text}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cross-module indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Indicadores cruzados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: 'Parcelas con plan activo', value: '312', badge: 'success' },
              { label: 'Alertas Guard activas', value: '5', badge: 'destructive' },
              { label: 'Estimaciones pendientes', value: '8', badge: 'warning' },
              { label: 'Señales climáticas', value: '2', badge: 'info' },
            ].map(ind => (
              <div key={ind.label} className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">{ind.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{ind.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
