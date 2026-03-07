import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { useRankingCooperativas } from '@/hooks/useRankingCooperativas';

const DEMO_PROVEEDORES = [
  { id: '1', nombre: 'Cooperativa Café de la Selva', pais: 'Guatemala', region: 'Huehuetenango', productores: 120, volumenHistorico: '450 sacos', compliance: 'compliant' as const },
  { id: '2', nombre: 'Cooperativa Los Altos', pais: 'Guatemala', region: 'Antigua', productores: 85, volumenHistorico: '320 sacos', compliance: 'compliant' as const },
  { id: '3', nombre: 'Cooperativa Montaña Verde', pais: 'Costa Rica', region: 'Tarrazú', productores: 200, volumenHistorico: '680 sacos', compliance: 'pending' as const },
];

const eudrBadge = (estado: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    compliant: { label: 'Cumple EUDR', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'secondary' },
    'non-compliant': { label: 'No cumple', variant: 'destructive' },
  };
  const { label, variant } = map[estado] ?? map.pending;
  return <Badge variant={variant}>{label}</Badge>;
};

export default function ExportadorProveedores() {
  const { data: ranking, isLoading } = useRankingCooperativas();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const proveedores = ranking?.length ? ranking.map(r => ({
    id: r.cooperativa_id,
    nombre: r.nombre ?? 'Cooperativa',
    pais: '-',
    region: '-',
    productores: r.lotes_entregados ?? 0,
    volumenHistorico: r.volumen_total ? `${(r.volumen_total / 69).toFixed(0)} sacos` : '-',
    valorUsd: r.valor_estimado_usd,
    compliance: 'compliant' as const,
  })) : DEMO_PROVEEDORES.map(p => ({ ...p, valorUsd: 0 }));

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Red de Proveedores</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {proveedores.map((p) => (
            <div key={p.id} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-foreground">{p.nombre}</p>
                  {p.region !== '-' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" /><span>{p.region}, {p.pais}</span>
                    </div>
                  )}
                </div>
                {eudrBadge(p.compliance)}
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground mt-2 flex-wrap">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{p.productores} {ranking?.length ? 'lotes' : 'productores'}</span>
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{p.volumenHistorico}</span>
                {p.valorUsd > 0 && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${p.valorUsd.toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
