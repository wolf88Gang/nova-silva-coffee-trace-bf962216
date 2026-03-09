import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sprout, FileText, History } from 'lucide-react';
import ParcelasNutricionTab from './ParcelasNutricionTab';
import PlanesTab from './PlanesTab';
import HistorialTab from './HistorialTab';

export default function NutricionDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nutrición de Parcelas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estado nutricional por parcela, planes de fertilización e historial
        </p>
      </div>

      <Tabs defaultValue="parcelas">
        <TabsList>
          <TabsTrigger value="parcelas" data-value="parcelas"><Sprout className="h-4 w-4 mr-1" /> Parcelas</TabsTrigger>
          <TabsTrigger value="planes" data-value="planes"><FileText className="h-4 w-4 mr-1" /> Planes</TabsTrigger>
          <TabsTrigger value="historial"><History className="h-4 w-4 mr-1" /> Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="parcelas" className="mt-4"><ParcelasNutricionTab /></TabsContent>
        <TabsContent value="planes" className="mt-4"><PlanesTab /></TabsContent>
        <TabsContent value="historial" className="mt-4"><HistorialTab /></TabsContent>
      </Tabs>
    </div>
  );
}
