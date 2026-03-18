/**
 * Admin Compliance Hub — All sections pending real backend integration.
 * No mock data shown.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield, CheckCircle2, AlertTriangle, FileText, Lock, Eye,
} from 'lucide-react';
import {
  SectionHeader, EmptyState, PendingIntegration,
} from '@/components/admin/shared/AdminComponents';
import { useState } from 'react';

const PENDING_MSG = "Pendiente de integración con backend de auditoría.";

export default function AdminCompliance() {
  const [tab, setTab] = useState('integridad');

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Cumplimiento e Integridad"
        subtitle="Garante de verdad: integridad criptográfica, trazabilidad y cumplimiento regulatorio"
      />

      <PendingIntegration feature="Eventos de auditoría y métricas de cumplimiento pendientes de integración con backend" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 max-w-2xl">
          <TabsTrigger value="integridad">Integridad</TabsTrigger>
          <TabsTrigger value="documental">Documental</TabsTrigger>
          <TabsTrigger value="eudr">EUDR</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
          <TabsTrigger value="cola">Cola de revisión</TabsTrigger>
        </TabsList>

        <TabsContent value="integridad" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PendingMetricSlot label="Registros verificados" icon={CheckCircle2} />
            <PendingMetricSlot label="Hashes SHA-256 válidos" icon={Lock} />
            <PendingMetricSlot label="Mismatch detectados" icon={AlertTriangle} />
            <PendingMetricSlot label="Eventos sin evidencia" icon={FileText} />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Registros con problemas de integridad</CardTitle></CardHeader>
            <CardContent>
              <EmptyState title="Sin datos" description={PENDING_MSG} icon={CheckCircle2} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documental" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PendingMetricSlot label="Orgs con faltantes" icon={AlertTriangle} />
            <PendingMetricSlot label="Lotes incompletos" icon={FileText} />
            <PendingMetricSlot label="Parcelas sin polígono" icon={Shield} />
            <PendingMetricSlot label="Dossiers con advertencias" icon={Eye} />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Incidencias documentales</CardTitle></CardHeader>
            <CardContent>
              <EmptyState title="Sin datos" description={PENDING_MSG} icon={CheckCircle2} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eudr" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Estado EUDR global</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <PendingMetricSlot label="Dossiers generados" icon={FileText} />
                <PendingMetricSlot label="Aprobables" icon={CheckCircle2} />
                <PendingMetricSlot label="En riesgo" icon={AlertTriangle} />
                <PendingMetricSlot label="Con brechas" icon={Shield} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Organizaciones con brechas EUDR</CardTitle></CardHeader>
            <CardContent>
              <EmptyState title="Sin datos" description={PENDING_MSG} icon={CheckCircle2} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" /> Auditoría y trazabilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState title="Sin eventos de auditoría" description={PENDING_MSG} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cola" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <EmptyState title="Sin incidencias en cola" description={PENDING_MSG} icon={CheckCircle2} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PendingMetricSlot({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
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
