import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sprout, FlaskConical, FileText, Zap, ShoppingCart, ClipboardCheck, History, TestTube, Layers } from 'lucide-react';
import EstadoNutricionalTab from './EstadoNutricionalTab';
import AnalisisTab from './AnalisisTab';
import PlanesTab from './PlanesTab';
import GeneratePlanV2 from './GeneratePlanV2';
import CotizacionTab from './CotizacionTab';
import EjecucionTab from './EjecucionTab';
import HistorialTab from './HistorialTab';
import ProtocoloMuestreoTab from './ProtocoloMuestreoTab';
import SoilHealthTab from './SoilHealthTab';

export default function NutricionDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nutrición de Parcelas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estado nutricional, análisis, planes de fertilización y cotización de insumos
        </p>
      </div>

      <Tabs defaultValue="estado">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="estado"><Sprout className="h-4 w-4 mr-1" /> Estado</TabsTrigger>
          <TabsTrigger value="analisis"><FlaskConical className="h-4 w-4 mr-1" /> Análisis</TabsTrigger>
          <TabsTrigger value="suelo"><Layers className="h-4 w-4 mr-1" /> Suelo</TabsTrigger>
          <TabsTrigger value="planes"><FileText className="h-4 w-4 mr-1" /> Planes</TabsTrigger>
          <TabsTrigger value="generar"><Zap className="h-4 w-4 mr-1" /> Generar Plan</TabsTrigger>
          <TabsTrigger value="cotizacion"><ShoppingCart className="h-4 w-4 mr-1" /> Cotización</TabsTrigger>
          <TabsTrigger value="ejecucion"><ClipboardCheck className="h-4 w-4 mr-1" /> Ejecución</TabsTrigger>
          <TabsTrigger value="historial"><History className="h-4 w-4 mr-1" /> Historial</TabsTrigger>
          <TabsTrigger value="protocolo"><TestTube className="h-4 w-4 mr-1" /> Protocolo</TabsTrigger>
        </TabsList>

        <TabsContent value="estado" className="mt-4"><EstadoNutricionalTab /></TabsContent>
        <TabsContent value="analisis" className="mt-4"><AnalisisTab /></TabsContent>
        <TabsContent value="suelo" className="mt-4"><SoilHealthTab /></TabsContent>
        <TabsContent value="planes" className="mt-4"><PlanesTab /></TabsContent>
        <TabsContent value="generar" className="mt-4"><GeneratePlanV2 /></TabsContent>
        <TabsContent value="cotizacion" className="mt-4"><CotizacionTab /></TabsContent>
        <TabsContent value="ejecucion" className="mt-4"><EjecucionTab /></TabsContent>
        <TabsContent value="historial" className="mt-4"><HistorialTab /></TabsContent>
        <TabsContent value="protocolo" className="mt-4"><ProtocoloMuestreoTab /></TabsContent>
      </Tabs>
    </div>
  );
}
