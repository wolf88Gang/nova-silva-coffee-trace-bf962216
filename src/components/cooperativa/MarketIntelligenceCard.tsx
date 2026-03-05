/**
 * MarketIntelligenceCard — Análisis de mercado + Interpretación Nova Silva
 * Comparativo de precios, margen, estrategias de respuesta y borrador de carta.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Brain, TrendingUp, TrendingDown, Copy, CheckCircle, XCircle, ArrowRightLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface MarketIntelligenceProps {
  precioOferta: number;
  precioMercado: number; // NY + diferencial
  exportadorNombre: string;
  loteCode: string;
  volumenKg: number;
  esVIP?: boolean;
  condicionesPago?: string;
  onAceptar?: () => void;
  onContraofertar?: (precio: number, carta: string) => void;
  onRechazar?: () => void;
}

// Pre-loaded message templates
const generarCarta = (tipo: 'aceptar' | 'contraofertar' | 'rechazar', props: MarketIntelligenceProps, precioSugerido?: number) => {
  const { exportadorNombre, loteCode, volumenKg, precioOferta, precioMercado } = props;
  if (tipo === 'aceptar') {
    return `Estimado equipo de ${exportadorNombre},\n\nConfirmamos la aceptación de su oferta por el lote ${loteCode} (${volumenKg.toLocaleString()} kg) al precio de $${precioOferta.toFixed(2)}/lb.\n\nProcederemos a preparar la documentación de despacho y trazabilidad EUDR correspondiente.\n\nQuedamos a disposición para coordinar los detalles logísticos.\n\nAtentamente,\nDepartamento Comercial`;
  }
  if (tipo === 'contraofertar') {
    const precio = precioSugerido || Math.max(precioOferta * 1.03, precioMercado + 2.5);
    return `Estimado equipo de ${exportadorNombre},\n\nAgradecemos su oferta de $${precioOferta.toFixed(2)}/lb por el lote ${loteCode} (${volumenKg.toLocaleString()} kg).\n\nTras analizar las condiciones actuales del mercado (referencia NY: $${precioMercado.toFixed(2)}/lb), nos permitimos proponer un precio de $${precio.toFixed(2)}/lb, que refleja la calidad premium y trazabilidad completa de este lote.\n\nQuedamos abiertos a continuar la negociación.\n\nAtentamente,\nDepartamento Comercial`;
  }
  return `Estimado equipo de ${exportadorNombre},\n\nAgradecemos su interés en nuestro lote ${loteCode}.\n\nEn esta ocasión, hemos decidido no aceptar la oferta de $${precioOferta.toFixed(2)}/lb, ya que consideramos que no refleja el valor de mercado actual ni la calidad de trazabilidad y sostenibilidad de nuestro café.\n\nQuedamos abiertos a futuras negociaciones en mejores condiciones.\n\nAtentamente,\nDepartamento Comercial`;
};

export default function MarketIntelligenceCard(props: MarketIntelligenceProps) {
  const { precioOferta, precioMercado, exportadorNombre, esVIP, condicionesPago } = props;
  const [estrategia, setEstrategia] = useState<'aceptar' | 'contraofertar' | 'rechazar' | null>(null);
  const [borrador, setBorrador] = useState('');

  const margen = ((precioOferta - precioMercado) / precioMercado) * 100;
  const precioSugerido = Math.max(precioOferta * 1.03, precioMercado + 2.5);

  // Interpretación Nova Silva
  let interpretacion = '';
  if (margen >= 0) {
    interpretacion = `Excelente oferta. El precio de $${precioOferta.toFixed(2)}/lb supera la referencia de mercado en ${margen.toFixed(1)}%. Se recomienda proceder con la aceptación para asegurar este diferencial favorable.`;
  } else if (margen >= -2) {
    interpretacion = `Oferta aceptable. El precio está ${Math.abs(margen).toFixed(1)}% por debajo de la paridad de mercado, pero dentro del rango razonable.${condicionesPago ? ` Las condiciones de pago (${condicionesPago}) pueden compensar la diferencia.` : ''} Evaluar según necesidades de flujo de caja.`;
  } else if (esVIP) {
    interpretacion = `La oferta está ${Math.abs(margen).toFixed(1)}% por debajo del precio de paridad. Sin embargo, ${exportadorNombre} es un comprador recurrente con historial de cumplimiento.${condicionesPago ? ` Las condiciones (${condicionesPago}) mejoran el flujo operativo.` : ''} Considerar aceptar para mantener la relación comercial.`;
  } else {
    interpretacion = `La oferta actual está ${Math.abs(margen).toFixed(1)}% por debajo del precio de paridad de hoy ($${precioMercado.toFixed(2)}/lb). Se recomienda negociar un mejor precio o buscar ofertas alternativas antes de comprometer este volumen.`;
  }

  const handleEstrategia = (tipo: 'aceptar' | 'contraofertar' | 'rechazar') => {
    setEstrategia(tipo);
    setBorrador(generarCarta(tipo, props, precioSugerido));
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Inteligencia de Mercado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price comparison */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground">Precio Oferta</p>
            <p className="text-lg font-bold text-foreground">${precioOferta.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">USD/lb</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground">Precio Mercado</p>
            <p className="text-lg font-bold text-foreground">${precioMercado.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">NY + Diferencial</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${margen >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
            <p className="text-xs text-muted-foreground">Margen</p>
            <div className="flex items-center justify-center gap-1">
              {margen >= 0 ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
              <p className={`text-lg font-bold ${margen >= 0 ? 'text-primary' : 'text-destructive'}`}>{margen >= 0 ? '+' : ''}{margen.toFixed(1)}%</p>
            </div>
            <Badge className={`text-[10px] mt-1 ${margen >= 0 ? 'bg-primary text-white border-0' : 'bg-destructive text-white border-0'}`}>
              {margen >= 0 ? 'Sobre mercado' : 'Bajo mercado'}
            </Badge>
          </div>
        </div>

        {/* Nova Silva interpretation */}
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1"><Brain className="h-3 w-3" /> Interpretación Nova Silva</p>
          <p className="text-sm text-foreground italic">{interpretacion}</p>
        </div>

        {/* Strategy buttons */}
        {!estrategia && (
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" onClick={() => handleEstrategia('aceptar')} className="flex-col h-auto py-3">
              <CheckCircle className="h-4 w-4 mb-1" />
              <span className="text-xs">Aceptar</span>
              <span className="text-[10px] text-primary-foreground/70">Priorizar flujo</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleEstrategia('contraofertar')} className="flex-col h-auto py-3">
              <ArrowRightLeft className="h-4 w-4 mb-1" />
              <span className="text-xs">Contraofertar</span>
              <span className="text-[10px] text-muted-foreground">Negociar precio</span>
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleEstrategia('rechazar')} className="flex-col h-auto py-3">
              <XCircle className="h-4 w-4 mb-1" />
              <span className="text-xs">Rechazar</span>
              <span className="text-[10px] text-destructive-foreground/70">Buscar mejor</span>
            </Button>
          </div>
        )}

        {/* Draft letter */}
        {estrategia && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">Borrador de {estrategia === 'aceptar' ? 'aceptación' : estrategia === 'contraofertar' ? 'contraoferta' : 'rechazo'}</p>
              <Badge variant="outline" className="text-[10px]">Editable</Badge>
            </div>
            <Textarea value={borrador} onChange={e => setBorrador(e.target.value)} rows={8} className="text-xs" />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEstrategia(null)}>Volver</Button>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(borrador); toast.success('Propuesta copiada al portapapeles'); }}>
                <Copy className="h-3 w-3 mr-1" /> Copiar
              </Button>
              <Button size="sm" className="flex-1" onClick={() => {
                if (estrategia === 'aceptar') props.onAceptar?.();
                else if (estrategia === 'contraofertar') props.onContraofertar?.(precioSugerido, borrador);
                else props.onRechazar?.();
                toast.success(`Respuesta enviada: ${estrategia}`);
                setEstrategia(null);
              }}>
                Confirmar {estrategia === 'aceptar' ? 'Aceptación' : estrategia === 'contraofertar' ? 'Contraoferta' : 'Rechazo'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
