import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Star } from 'lucide-react';
import { useOrgExportMarkets } from '@/hooks/useOrgExportMarkets';
import { toast } from 'sonner';

export function OrgExportMarketsManager() {
  const { data, isLoading, upsert, setPrincipal, mercados } = useOrgExportMarkets();

  const getMarket = (codigo: string) => data.find((m) => m.mercado === codigo);

  const handleToggle = async (mercado: string) => {
    const m = getMarket(mercado);
    const newActivo = !(m?.activo !== false);
    try {
      await upsert({ mercado, activo: newActivo });
      toast.success(newActivo ? `${mercado} activado` : `${mercado} desactivado`);
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleSetPrincipal = async (id: string) => {
    try {
      await setPrincipal(id);
      toast.success('Mercado principal actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" />
            Mercados de exportación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-primary" />
          Mercados de exportación
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Mercados destino para determinar LMR y restricciones.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {mercados.map((codigo) => {
            const m = getMarket(codigo);
            const activo = m?.activo !== false;
            const esPrincipal = m?.es_principal === true;
            return (
              <div key={codigo} className="flex items-center gap-1">
                <Badge
                  variant={activo ? 'default' : 'outline'}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleToggle(codigo)}
                >
                  {codigo}
                </Badge>
                {activo && m?.id && (
                  <button
                    type="button"
                    onClick={() => handleSetPrincipal(m.id)}
                    className="p-0.5 rounded hover:bg-muted"
                    title={esPrincipal ? 'Mercado principal' : 'Marcar como principal'}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${esPrincipal ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Clic en el badge para activar/desactivar. Estrella para marcar mercado principal.
        </p>
      </CardContent>
    </Card>
  );
}
