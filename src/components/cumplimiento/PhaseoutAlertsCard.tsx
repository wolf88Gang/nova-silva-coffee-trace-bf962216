import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';
import { usePhaseoutIngredients } from '@/hooks/useComplianceEngine';

export function PhaseoutAlertsCard() {
  const { data: phaseout = [], isLoading, error } = usePhaseoutIngredients();

  const sorted = [...phaseout].sort((a, b) => {
    const da = a.dias_restantes ?? 9999;
    const db = b.dias_restantes ?? 9999;
    return da - db;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Alertas de phase-out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Alertas de phase-out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            No se pudo cargar. Verificá que la RPC get_phaseout_ingredients exista.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (sorted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Alertas de phase-out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin alertas de phase-out activas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" />
          Alertas de phase-out
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ingredientes en fase de eliminación según certificaciones.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((p) => {
            const days = p.dias_restantes ?? 9999;
            const isUrgent = days < 180;
            const isWarning = days < 365 && !isUrgent;
            return (
              <div
                key={`${p.ingredient_id}-${p.certificadora}`}
                className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{p.nombre_comun}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.certificadora} · {p.fecha_phase_out ?? 'Sin fecha'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isUrgent && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  <span
                    className={
                      isUrgent
                        ? 'text-sm font-medium text-destructive'
                        : isWarning
                          ? 'text-sm text-warning'
                          : 'text-sm text-muted-foreground'
                    }
                  >
                    {days < 9999 ? `${days} días` : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
