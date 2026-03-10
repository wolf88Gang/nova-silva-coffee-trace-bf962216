import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mail, Eye, Copy, Send, FileText, Shield, Handshake, Users, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  COMMUNICATION_TEMPLATES,
  type CommunicationTemplate,
  fillCommunicationTemplate,
  getTemplatesByCategory,
} from '@/lib/communicationTemplates';

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  bienvenida: { label: 'Bienvenida', icon: <Users className="h-4 w-4" />, color: 'bg-primary/10 text-primary' },
  transaccional: { label: 'Transaccional', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-success/10 text-success' },
  seguridad: { label: 'Seguridad', icon: <Shield className="h-4 w-4" />, color: 'bg-destructive/10 text-destructive' },
  operativo: { label: 'Operativo', icon: <FileText className="h-4 w-4" />, color: 'bg-warning/10 text-warning' },
  comercial: { label: 'Comercial', icon: <Handshake className="h-4 w-4" />, color: 'bg-accent/10 text-accent-foreground' },
};

export default function EmailTemplatePreview() {
  const [selected, setSelected] = useState<CommunicationTemplate | null>(null);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('todas');

  const categories = ['todas', 'bienvenida', 'transaccional', 'seguridad', 'operativo', 'comercial'];

  const templates =
    activeTab === 'todas'
      ? Object.values(COMMUNICATION_TEMPLATES)
      : getTemplatesByCategory(activeTab as CommunicationTemplate['categoria']);

  const openPreview = (tpl: CommunicationTemplate) => {
    const defaults: Record<string, string> = {};
    tpl.variables.forEach((v) => {
      defaults[v] = demoValue(v);
    });
    setPreviewVars(defaults);
    setSelected(tpl);
  };

  const copyHtml = () => {
    if (!selected) return;
    const html = fillCommunicationTemplate(selected.cuerpoHtml, previewVars);
    navigator.clipboard.writeText(html);
    toast.success('HTML copiado al portapapeles');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Mail className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Plantillas de Comunicacion</h1>
        <Badge variant="secondary">{Object.keys(COMMUNICATION_TEMPLATES).length} plantillas</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          {categories.slice(1).map((c) => (
            <TabsTrigger key={c} value={c} className="gap-1.5">
              {CATEGORY_META[c]?.icon}
              {CATEGORY_META[c]?.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <Card
                key={tpl.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => openPreview(tpl)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {tpl.nombre}
                    </CardTitle>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${CATEGORY_META[tpl.categoria]?.color}`}>
                      {CATEGORY_META[tpl.categoria]?.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Asunto: {tpl.asunto}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tpl.cuerpoTexto}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {tpl.canal === 'ambos' ? 'In-app + Email' : tpl.canal === 'email' ? 'Solo Email' : 'Solo In-app'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{tpl.variables.length} variables</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ PREVIEW DIALOG ═══ */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  {selected.nombre}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="preview">
                <TabsList>
                  <TabsTrigger value="preview">Vista Previa</TabsTrigger>
                  <TabsTrigger value="variables">Variables</TabsTrigger>
                  <TabsTrigger value="texto">Texto Plano</TabsTrigger>
                </TabsList>

                {/* Email preview */}
                <TabsContent value="preview" className="mt-4">
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 flex items-center gap-2 border-b border-border">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">
                        {fillCommunicationTemplate(selected.asunto, previewVars)}
                      </span>
                    </div>
                    <div
                      className="p-4 bg-white"
                      dangerouslySetInnerHTML={{
                        __html: fillCommunicationTemplate(selected.cuerpoHtml, previewVars),
                      }}
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={copyHtml}>
                      <Copy className="h-4 w-4 mr-1" /> Copiar HTML
                    </Button>
                    <Button size="sm" disabled>
                      <Send className="h-4 w-4 mr-1" /> Enviar Prueba
                    </Button>
                  </div>
                </TabsContent>

                {/* Variables editor */}
                <TabsContent value="variables" className="mt-4 space-y-3">
                  {selected.variables.map((v) => (
                    <div key={v} className="space-y-1">
                      <Label className="text-xs font-mono">{`{${v}}`}</Label>
                      <Input
                        value={previewVars[v] || ''}
                        onChange={(e) =>
                          setPreviewVars((s) => ({ ...s, [v]: e.target.value }))
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </TabsContent>

                {/* Plain text */}
                <TabsContent value="texto" className="mt-4">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-foreground font-medium mb-2">
                      Asunto: {fillCommunicationTemplate(selected.asunto, previewVars)}
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {fillCommunicationTemplate(selected.cuerpoTexto, previewVars)}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Generates realistic demo values for preview */
function demoValue(key: string): string {
  const map: Record<string, string> = {
    nombre_completo: 'Maria Lopez Gutierrez',
    organizacion_nombre: 'Cooperativa Cafe Sierra',
    organizacion_destino: 'Cooperativa Cafe Sierra',
    link_plataforma: 'https://novasilva.lovable.app',
    link_finanzas: 'https://novasilva.lovable.app/productor/finanzas',
    link_entregas: 'https://novasilva.lovable.app/productor/entregas',
    link_vital: 'https://novasilva.lovable.app/productor/vital',
    link_reset: 'https://novasilva.lovable.app/reset?token=abc123',
    link_verificacion: 'https://novasilva.lovable.app/verify?token=xyz789',
    link_ofertas: 'https://novasilva.lovable.app/cooperativa/ofertas-recibidas',
    link_eudr: 'https://novasilva.lovable.app/exportador/eudr',
    monto: '$1,250,000 COP',
    fecha_entrega: '2026-03-15',
    fecha: '2026-03-20',
    fecha_limite: '2026-04-01',
    referencia: 'PAG-2026-0042',
    cantidad_kg: '350',
    codigo_lote: 'L-2026-0018',
    plazo: '12',
    tasa: '1.5',
    puntaje: '78',
    nivel: 'Avanzado',
    punto_acopio: 'Vereda El Progreso',
    exportador_nombre: 'Cafe Exports S.A.',
    precio: '$4.20',
    incoterm: 'FOB Buenaventura',
    lista_parcelas: 'La Esperanza, El Roble, San Jose',
    minutos_expiracion: '30',
  };
  return map[key] ?? `[${key}]`;
}
