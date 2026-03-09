import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sprout, FileText, History, Layers, Beaker,
  Calculator, ClipboardCheck, Activity,
} from 'lucide-react';
import ParcelasNutricionTab from './ParcelasNutricionTab';
import PlanesTab from './PlanesTab';
import HistorialTab from './HistorialTab';
import SoilHealthTab from './SoilHealthTab';
import EjecucionTab from './EjecucionTab';
import DemandaTab from './DemandaTab';
import ProtocoloMuestreoTab from './ProtocoloMuestreoTab';
import AnalisisTab from './AnalisisTab';

export default function NutricionDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nutrición de Parcelas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estado nutricional, análisis de suelo/foliar, planes de fertilización, ejecución e historial
        </p>
      </div>

      <Tabs defaultValue="parcelas">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="parcelas" data-value="parcelas"><Sprout className="h-4 w-4 mr-1" /> Estado y Análisis</TabsTrigger>
          <TabsTrigger value="suelo"><Layers className="h-4 w-4 mr-1" /> Suelo</TabsTrigger>
          <TabsTrigger value="demanda"><Calculator className="h-4 w-4 mr-1" /> Demanda</TabsTrigger>
          <TabsTrigger value="planes" data-value="planes"><FileText className="h-4 w-4 mr-1" /> Planes</TabsTrigger>
          <TabsTrigger value="ejecucion"><Activity className="h-4 w-4 mr-1" /> Ejecución</TabsTrigger>
          <TabsTrigger value="analisis"><Beaker className="h-4 w-4 mr-1" /> Análisis</TabsTrigger>
          <TabsTrigger value="protocolo"><ClipboardCheck className="h-4 w-4 mr-1" /> Protocolo</TabsTrigger>
          <TabsTrigger value="historial"><History className="h-4 w-4 mr-1" /> Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="parcelas" className="mt-4"><ParcelasNutricionTab /></TabsContent>
        <TabsContent value="suelo" className="mt-4"><SoilHealthTab /></TabsContent>
        <TabsContent value="demanda" className="mt-4"><DemandaTab /></TabsContent>
        <TabsContent value="planes" className="mt-4"><PlanesTab /></TabsContent>
        <TabsContent value="ejecucion" className="mt-4"><EjecucionTab /></TabsContent>
        <TabsContent value="analisis" className="mt-4"><AnalisisTab /></TabsContent>
        <TabsContent value="protocolo" className="mt-4"><ProtocoloMuestreoTab /></TabsContent>
        <TabsContent value="historial" className="mt-4"><HistorialTab /></TabsContent>
      </Tabs>
    </div>
  );
}
