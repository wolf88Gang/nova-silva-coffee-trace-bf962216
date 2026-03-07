import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldOff, Info } from 'lucide-react';
import { useBlockedIngredients, type BlockedIngredient } from '@/hooks/useComplianceEngine';
import { DEMO_BLOCKED_INGREDIENTS } from '@/lib/demoInsightsData';
import ComplianceStatusBadge from './ComplianceStatusBadge';

export default function BlockedIngredientsPanel() {
  const { data: blocked, isLoading, isError } = useBlockedIngredients();

  const items: BlockedIngredient[] = (!blocked || blocked.length === 0 || isError)
    ? DEMO_BLOCKED_INGREDIENTS
    : blocked;

  if (isLoading) return <p className="text-muted-foreground text-sm">Cargando...</p>;

  // Group by bloqueado_por
  const groups: Record<string, BlockedIngredient[]> = {};
  items.forEach((b) => {
    const key = b.bloqueado_por;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldOff className="h-4 w-4" /> Ingredientes Bloqueados</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groups).map(([source, groupItems]) => (
          <div key={source}>
            <h4 className="text-sm font-medium mb-2 capitalize">{source.replace('_', ' ')}</h4>
            <div className="space-y-1">
              {groupItems.map((item) => (
                <div key={item.ingredient_id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{item.nombre_comun}</span>
                    <span className="text-muted-foreground text-xs">({item.clase_funcional})</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                        <TooltipContent><p className="max-w-xs text-xs">{item.detalle}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <ComplianceStatusBadge nivel={item.nivel} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
