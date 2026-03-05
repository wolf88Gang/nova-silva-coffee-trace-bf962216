/**
 * CafeHub — Punto de entrada unificado del exportador para gestión de café
 * 3 tabs: Inventario, Ofrecidos, Subastas (URL synced)
 */
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coffee, Package, Gavel } from 'lucide-react';
import ExportadorLotes from './ExportadorLotes';
import LotesOfrecidos from './LotesOfrecidos';
import SubastasDisponibles from './SubastasDisponibles';

export default function CafeHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'inventario';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Gestión de Café</h1>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="inventario"><Coffee className="h-4 w-4 mr-1" /> Inventario</TabsTrigger>
          <TabsTrigger value="ofrecidos"><Package className="h-4 w-4 mr-1" /> Ofrecidos</TabsTrigger>
          <TabsTrigger value="subastas"><Gavel className="h-4 w-4 mr-1" /> Subastas</TabsTrigger>
        </TabsList>

        <TabsContent value="inventario" className="mt-4">
          <ExportadorLotes />
        </TabsContent>
        <TabsContent value="ofrecidos" className="mt-4">
          <LotesOfrecidos />
        </TabsContent>
        <TabsContent value="subastas" className="mt-4">
          <SubastasDisponibles />
        </TabsContent>
      </Tabs>
    </div>
  );
}
