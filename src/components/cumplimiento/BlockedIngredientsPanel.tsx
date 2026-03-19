import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ShieldCheck } from 'lucide-react';
import { useBlockedIngredients } from '@/hooks/useComplianceEngine';
import { ComplianceStatusBadge } from './ComplianceStatusBadge';

const BLOQUEADO_POR_LABELS: Record<string, string> = {
  Mercado: 'Mercado',
  Certificación: 'Certificación',
  Convenio_Internacional: 'Convenio Internacional',
};

export function BlockedIngredientsPanel() {
  const { data: blocked = [], isLoading, error } = useBlockedIngredients();

  const bySource = blocked.reduce(
    (acc, b) => {
      const key = BLOQUEADO_POR_LABELS[b.bloqueado_por] ?? b.bloqueado_por;
      if (!acc[key]) acc[key] = [];
      acc[key].push(b);
      return acc;
    },
    {} as Record<string, typeof blocked>
  );

  const hasCertsOrMarkets = blocked.length > 0 || !isLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Ingredientes bloqueados
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
            <ShieldCheck className="h-4 w-4 text-primary" />
            Ingredientes bloqueados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            No se pudo cargar. Verificá que la RPC get_blocked_ingredients exista.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (blocked.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Ingredientes bloqueados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hasCertsOrMarkets
              ? 'No hay ingredientes bloqueados para su organización.'
              : 'Configurá certificaciones y mercados de exportación para ver los ingredientes bloqueados.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Ingredientes bloqueados
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cruce automático por certificaciones y mercados configurados.
        </p>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            {Object.entries(bySource).map(([source, items]) => (
              <div key={source}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{source}</p>
                <div className="space-y-2">
                  {items.map((i) => (
                    <div
                      key={i.ingredient_id}
                      className="flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{i.nombre_comun}</p>
                        {i.clase_funcional && (
                          <p className="text-xs text-muted-foreground">{i.clase_funcional}</p>
                        )}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <ComplianceStatusBadge nivel={i.nivel} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{i.detalle ?? i.bloqueado_por}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
