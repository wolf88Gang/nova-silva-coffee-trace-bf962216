import { useState, useCallback, createContext, useContext } from 'react';
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

// Context to allow child components to switch tabs
type NutricionTabSetter = (tab: string) => void;
const NutricionTabContext = createContext<NutricionTabSetter>(() => {});

export function useNutricionTab() {
  return useContext(NutricionTabContext);
}

export default function NutricionDashboard() {
  const [activeTab, setActiveTab] = useState('parcelas');

  return (
    <NutricionTabContext.Provider value={setActiveTab}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nutrición de Parcelas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estado nutricional, análisis de suelo/foliar, planes de fertilización, ejecución e historial
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="w-max sm:w-auto">
              <TabsTrigger value="parcelas" className="text-xs sm:text-sm"><Sprout className="h-3.5 w-3.5 mr-1 shrink-0" /><span className="hidden sm:inline">Estado y </span>Análisis</TabsTrigger>
              <TabsTrigger value="suelo" className="text-xs sm:text-sm"><Layers className="h-3.5 w-3.5 mr-1 shrink-0" /> Suelo</TabsTrigger>
              <TabsTrigger value="demanda" className="text-xs sm:text-sm"><Calculator className="h-3.5 w-3.5 mr-1 shrink-0" /> Demanda</TabsTrigger>
              <TabsTrigger value="planes" className="text-xs sm:text-sm"><FileText className="h-3.5 w-3.5 mr-1 shrink-0" /> Planes</TabsTrigger>
              <TabsTrigger value="ejecucion" className="text-xs sm:text-sm"><Activity className="h-3.5 w-3.5 mr-1 shrink-0" /> Ejecución</TabsTrigger>
              <TabsTrigger value="analisis" className="text-xs sm:text-sm"><Beaker className="h-3.5 w-3.5 mr-1 shrink-0" /> Análisis</TabsTrigger>
              <TabsTrigger value="protocolo" className="text-xs sm:text-sm"><ClipboardCheck className="h-3.5 w-3.5 mr-1 shrink-0" /> Protocolo</TabsTrigger>
              <TabsTrigger value="historial" className="text-xs sm:text-sm"><History className="h-3.5 w-3.5 mr-1 shrink-0" /> Historial</TabsTrigger>
            </TabsList>
          </div>

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
    </NutricionTabContext.Provider>
  );
}
