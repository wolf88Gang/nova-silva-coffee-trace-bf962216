import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Star } from 'lucide-react';
import { useOrgExportMarkets, MARKETS } from '@/hooks/useOrgExportMarkets';
import { DEMO_EXPORT_MARKETS } from '@/lib/demoInsightsData';

export default function OrgExportMarketsManager() {
  const { markets, isLoading, toggleMarket, setPrincipal } = useOrgExportMarkets();

  const displayMarkets = markets.length > 0 ? markets : DEMO_EXPORT_MARKETS;
  const isDemo = markets.length === 0;
  const activeSet = new Set(displayMarkets.map((m) => m.mercado));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4" /> Mercados de Exportación</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-sm">Cargando...</p> : (
          <div className="flex flex-wrap gap-2">
            {MARKETS.map((m) => {
              const active = activeSet.has(m);
              const market = displayMarkets.find((mk) => mk.mercado === m);
              return (
                <div key={m} className="flex items-center gap-1">
                  <Badge
                    variant={active ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => !isDemo && toggleMarket.mutate(m)}
                  >
                    {m}
                  </Badge>
                  {active && market && (
                    <button
                      onClick={() => !isDemo && setPrincipal.mutate(market.id)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Marcar como principal"
                      disabled={isDemo}
                    >
                      <Star className={`h-3 w-3 ${market.principal ? 'fill-primary text-primary' : ''}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
