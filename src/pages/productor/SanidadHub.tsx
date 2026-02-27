import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Leaf, Bug, TreePine, Eye, Camera, ArrowRight, CheckCircle, AlertTriangle, Calendar, Shield } from 'lucide-react';

const steps = ['Triage', 'Análisis', 'Resultado', 'Acción'];
const bodyParts = [
  { id: 'hojas', label: 'Hojas', icon: Leaf, color: 'text-primary' },
  { id: 'fruto', label: 'Fruto', icon: Bug, color: 'text-accent' },
  { id: 'tallo', label: 'Tallo/Raíz', icon: TreePine, color: 'text-accent' },
];

const historial = [
  { fecha: '2026-02-20', tipo: 'Broca detectada', parcela: 'El Mirador', severidad: 'alta' as const, estado: 'tratamiento' },
  { fecha: '2026-02-15', tipo: 'Roya leve', parcela: 'La Esperanza', severidad: 'media' as const, estado: 'monitoreo' },
  { fecha: '2026-02-10', tipo: 'Ojo de gallo', parcela: 'Cerro Verde', severidad: 'baja' as const, estado: 'resuelto' },
  { fecha: '2026-01-28', tipo: 'Antracnosis', parcela: 'El Mirador', severidad: 'media' as const, estado: 'resuelto' },
];

const sevStyles: Record<string, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-accent/10 text-accent border-accent/20',
  baja: 'bg-primary/10 text-primary border-primary/20',
};

export default function SanidadHub() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sanidad Vegetal</h1>
        <p className="text-sm text-muted-foreground">Diagnóstico y seguimiento de la salud de tus cultivos</p>
      </div>

      <Tabs defaultValue="guard">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="guard" className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Nova Guard</TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="guard" className="space-y-6 mt-4">
          {/* Nova Guard Header */}
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-foreground">Nova Guard</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Leaf className="h-3.5 w-3.5 text-primary" /> Diagnóstico Inteligente de Sanidad Vegetal</p>
                </div>
              </div>

              {/* Step Progress */}
              <div className="flex items-center justify-between max-w-lg mx-auto">
                {steps.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`flex flex-col items-center`}>
                      <div className={`h-1.5 w-16 rounded-full ${i <= currentStep ? 'bg-primary' : 'bg-muted'}`} />
                      <span className={`text-xs mt-1 ${i <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{step}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Report */}
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">🔴 ¿Viste algo raro?</p>
                    <p className="text-xs text-muted-foreground">Reportar sospecha o indicio sin diagnóstico completo</p>
                  </div>
                </div>
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Triage - Body Part Selector */}
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-foreground">¿Qué problema detectas hoy?</h3>
            <p className="text-sm text-muted-foreground">Selecciona el área donde observas síntomas</p>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {bodyParts.map((part) => (
                <button
                  key={part.id}
                  onClick={() => { setSelectedPart(part.id); setCurrentStep(1); }}
                  className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                    selectedPart === part.id
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border bg-muted/30 hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center ${selectedPart === part.id ? 'bg-primary/20' : 'bg-muted'}`}>
                      <part.icon className={`h-8 w-8 ${selectedPart === part.id ? 'text-primary' : part.color}`} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{part.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedPart && (
              <div className="pt-4">
                <Button size="lg" onClick={() => setCurrentStep(2)}>
                  Continuar diagnóstico <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historial" className="space-y-4 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><Bug className="h-4 w-4 text-destructive" /><span className="text-xs text-muted-foreground">Alertas Activas</span></div>
              <p className="text-2xl font-bold text-foreground">2</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><Shield className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Parcelas Monitoreadas</span></div>
              <p className="text-2xl font-bold text-foreground">3/3</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><Calendar className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Próximo Monitoreo</span></div>
              <p className="text-2xl font-bold text-foreground">1 Mar</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-accent" /> Historial de Diagnósticos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {historial.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.tipo} — {h.parcela}</p>
                    <p className="text-xs text-muted-foreground">{h.fecha}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={sevStyles[h.severidad]}>{h.severidad}</Badge>
                    <Badge variant={h.estado === 'resuelto' ? 'default' : 'secondary'}>{h.estado}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
