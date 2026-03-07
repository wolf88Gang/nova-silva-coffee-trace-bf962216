import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Clock, Boxes, Leaf, Lightbulb, ShieldCheck } from 'lucide-react';
import NovaGuardTab from '@/components/cooperativa/operaciones/NovaGuardTab';
import JornalesTab from '@/components/cooperativa/operaciones/JornalesTab';
import InventarioTab from '@/components/cooperativa/operaciones/InventarioTab';
import DemandaTab from '@/components/nutricion/DemandaTab';
import InsightsTab from '@/components/cooperativa/operaciones/InsightsTab';
import CumplimientoTab from '@/components/cooperativa/operaciones/CumplimientoTab';

export default function OperacionesHub() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Operaciones</h1>

      <Tabs defaultValue="monitor">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="monitor"><Shield className="h-4 w-4 mr-1" /> Nova Guard</TabsTrigger>
          <TabsTrigger value="jornales"><Clock className="h-4 w-4 mr-1" /> Jornales</TabsTrigger>
          <TabsTrigger value="inventario"><Boxes className="h-4 w-4 mr-1" /> Inventario</TabsTrigger>
          <TabsTrigger value="nutricion"><Leaf className="h-4 w-4 mr-1" /> Nutrición</TabsTrigger>
          <TabsTrigger value="insights"><Lightbulb className="h-4 w-4 mr-1" /> Insights</TabsTrigger>
          <TabsTrigger value="cumplimiento"><ShieldCheck className="h-4 w-4 mr-1" /> Cumplimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="mt-4">
          <NovaGuardTab />
        </TabsContent>
        <TabsContent value="jornales" className="mt-4">
          <JornalesTab />
        </TabsContent>
        <TabsContent value="inventario" className="mt-4">
          <InventarioTab />
        </TabsContent>
        <TabsContent value="nutricion" className="mt-4">
          <DemandaTab />
        </TabsContent>
        <TabsContent value="insights" className="mt-4">
          <InsightsTab />
        </TabsContent>
        <TabsContent value="cumplimiento" className="mt-4">
          <CumplimientoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
