import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';
import { usePhaseoutIngredients } from '@/hooks/useComplianceEngine';

export default function PhaseoutAlertsCard() {
  const { data: items, isLoading } = usePhaseoutIngredients();

  if (isLoading) return <p className="text-muted-foreground text-sm">Cargando...</p>;

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" /> Alertas de Phase-out</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Sin alertas de phase-out activas.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" /> Alertas de Phase-out</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => {
          const urgent = item.dias_restantes < 180;
          const warning = item.dias_restantes < 365;
          const colorClass = urgent ? 'text-destructive' : warning ? 'text-accent-foreground' : 'text-muted-foreground';
          return (
            <div key={item.ingredient_id + item.certificadora} className={`flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0 ${colorClass}`}>
              <div className="flex items-center gap-2">
                {urgent && <AlertTriangle className="h-4 w-4" />}
                <span className="font-medium">{item.nombre_comun}</span>
                <span className="text-xs">({item.certificadora})</span>
              </div>
              <div className="text-xs">
                {item.fecha_phase_out} · {item.dias_restantes} días
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
