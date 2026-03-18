/**
 * Admin Growth, Feedback & M&E
 * All sections pending real backend integration — no mock data shown.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, Users, MessageSquare, Mail, Megaphone,
  BarChart3, Globe, Shield, Cpu, Target,
} from 'lucide-react';
import {
  SectionHeader, EmptyState, PendingIntegration,
} from '@/components/admin/shared/AdminComponents';
import { useState } from 'react';

const MEL_EMPTY = "Pendiente de integración con backend de analítica.";

export default function AdminGrowth() {
  const [melTab, setMelTab] = useState('impact');

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Growth, Feedback y M&E"
        subtitle="Leads, conversión, feedback, campañas e indicadores de impacto"
      />

      <PendingIntegration feature="Analytics backend (eventos, métricas de uso, conversiones)" />

      {/* M&E / MEL Section */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Monitoreo, Evaluación y Aprendizaje (M&E)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={melTab} onValueChange={setMelTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="impact" className="gap-1.5"><Globe className="h-3.5 w-3.5" /> Impacto</TabsTrigger>
              <TabsTrigger value="eudr" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> EUDR</TabsTrigger>
              <TabsTrigger value="platform" className="gap-1.5"><Cpu className="h-3.5 w-3.5" /> Plataforma</TabsTrigger>
              <TabsTrigger value="adoption" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Adopción</TabsTrigger>
              <TabsTrigger value="orgs" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Por organización</TabsTrigger>
            </TabsList>

            <TabsContent value="impact">
              <EmptyState title="Sin indicadores de impacto" description={MEL_EMPTY} />
            </TabsContent>
            <TabsContent value="eudr">
              <EmptyState title="Sin indicadores EUDR" description={MEL_EMPTY} />
            </TabsContent>
            <TabsContent value="platform">
              <EmptyState title="Sin indicadores de plataforma" description={MEL_EMPTY} />
            </TabsContent>
            <TabsContent value="adoption">
              <EmptyState title="Sin indicadores de adopción" description={MEL_EMPTY} />
            </TabsContent>
            <TabsContent value="orgs">
              <EmptyState title="Sin datos de impacto por organización" description={MEL_EMPTY} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Conversion KPIs */}
      <div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversión y feedback</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          <EmptyMetricSlot label="Nuevos registros (mes)" icon={Users} />
          <EmptyMetricSlot label="Conversión trial → paid" icon={TrendingUp} />
          <EmptyMetricSlot label="Bugs reportados" icon={MessageSquare} />
          <EmptyMetricSlot label="Sugerencias" icon={MessageSquare} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Oportunidades</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState title="Sin oportunidades" description={MEL_EMPTY} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState title="Sin feedback" description={MEL_EMPTY} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4" /> Campañas</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="Sin campañas" description={MEL_EMPTY} />
        </CardContent>
      </Card>
    </div>
  );
}

/** Small placeholder card showing a metric slot that's not yet connected */
function EmptyMetricSlot({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm text-muted-foreground italic">Sin datos</span>
    </Card>
  );
}
