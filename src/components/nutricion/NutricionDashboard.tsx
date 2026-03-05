import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sprout, FlaskConical, FileText } from 'lucide-react';
import EstadoNutricionalTab from './EstadoNutricionalTab';
import AnalisisTab from './AnalisisTab';
import PlanesTab from './PlanesTab';

export default function NutricionDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nutrición de Parcelas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estado nutricional, análisis de suelo/foliar y planes de fertilización
        </p>
      </div>

      <Tabs defaultValue="estado">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="estado"><Sprout className="h-4 w-4 mr-1" /> Estado Nutricional</TabsTrigger>
          <TabsTrigger value="analisis"><FlaskConical className="h-4 w-4 mr-1" /> Análisis</TabsTrigger>
          <TabsTrigger value="planes"><FileText className="h-4 w-4 mr-1" /> Planes</TabsTrigger>
        </TabsList>

        <TabsContent value="estado" className="mt-4">
          <EstadoNutricionalTab />
        </TabsContent>
        <TabsContent value="analisis" className="mt-4">
          <AnalisisTab />
        </TabsContent>
        <TabsContent value="planes" className="mt-4">
          <PlanesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
