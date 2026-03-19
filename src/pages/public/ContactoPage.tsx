import { useState } from 'react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Mail, MapPin, MessageCircle, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';
import { submitLead } from '@/services/demoLeadsService';

const contactSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(100),
  organizacion: z.string().trim().min(2, 'La organización es obligatoria').max(150),
  pais: z.string().trim().min(2, 'El país es obligatorio').max(60),
  correo: z.string().trim().email('Correo electrónico inválido').max(255),
  telefono: z.string().trim().max(20).optional(),
  interes: z.string().min(1, 'Seleccione un tipo de interés'),
  mensaje: z.string().trim().max(2000).optional(),
  solicitarDemo: z.boolean(),
  consentimiento: z.boolean().refine(val => val === true, { message: 'Debe aceptar el tratamiento de datos' }),
});

type ContactFormData = z.infer<typeof contactSchema>;

const interesOptions = [
  'Trazabilidad y cumplimiento EUDR',
  'Protocolo VITAL y resiliencia',
  'Blockchain Integrity',
  'GIS Satélite / NDVI',
  'Plataforma completa',
  'Alianza institucional',
  'Inversión / donación',
  'Otro',
];

export default function ContactoPage() {
  const [formData, setFormData] = useState<Partial<ContactFormData>>({
    nombre: '', organizacion: '', pais: '', correo: '', telefono: '', interes: '', mensaje: '',
    solicitarDemo: false, consentimiento: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    const mensajeCompleto = [
      result.data.pais && `País: ${result.data.pais}`,
      result.data.telefono && `Tel: ${result.data.telefono}`,
      result.data.mensaje,
    ].filter(Boolean).join('\n\n');

    const leadResult = await submitLead({
      nombre: result.data.nombre,
      email: result.data.correo,
      organizacion: result.data.organizacion || null,
      tipo_organizacion: result.data.interes || null,
      mensaje: mensajeCompleto || null,
      cta_source: 'contacto_page',
      demo_route: '/contacto',
    });

    if (!leadResult.ok) {
      toast.error(leadResult.error ?? 'Error al enviar. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
    toast.success('Mensaje enviado correctamente');
  };

  if (submitted) {
    return (
      <PublicLayout>
        <section id="mensaje-confirmacion" className="pt-28 pb-20 md:pt-36 min-h-[70vh] flex items-center">
          <div className="container mx-auto px-4 lg:px-8 max-w-lg text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mensaje enviado</h1>
            <p className="text-muted-foreground">
              Gracias por contactarnos. Un miembro de nuestro equipo técnico revisará su consulta y le responderá a la brevedad posible.
            </p>
            <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({ nombre: '', organizacion: '', pais: '', correo: '', telefono: '', interes: '', mensaje: '', solicitarDemo: false, consentimiento: false }); }}>
              Enviar otra consulta
            </Button>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Contacto</h1>
          <p className="text-primary-foreground/80 text-lg">
            Complete el formulario para solicitar una demo, una propuesta personalizada o resolver cualquier consulta sobre la plataforma.
          </p>
        </div>
      </section>

      <section id="form-contacto-demo" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre completo *</Label>
                  <Input id="nombre" value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} placeholder="Su nombre" />
                  {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="organizacion">Organización *</Label>
                  <Input id="organizacion" value={formData.organizacion} onChange={(e) => handleChange('organizacion', e.target.value)} placeholder="Nombre de la cooperativa o empresa" />
                  {errors.organizacion && <p className="text-xs text-destructive">{errors.organizacion}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pais">País *</Label>
                  <Input id="pais" value={formData.pais} onChange={(e) => handleChange('pais', e.target.value)} placeholder="País de la organización" />
                  {errors.pais && <p className="text-xs text-destructive">{errors.pais}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="correo">Correo electrónico *</Label>
                  <Input id="correo" type="email" value={formData.correo} onChange={(e) => handleChange('correo', e.target.value)} placeholder="correo@ejemplo.com" />
                  {errors.correo && <p className="text-xs text-destructive">{errors.correo}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <Input id="telefono" value={formData.telefono} onChange={(e) => handleChange('telefono', e.target.value)} placeholder="+506 8888-8888" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="interes">Tipo de interés *</Label>
                  <Select value={formData.interes} onValueChange={(v) => handleChange('interes', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent>
                      {interesOptions.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.interes && <p className="text-xs text-destructive">{errors.interes}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mensaje">Mensaje (opcional)</Label>
                <Textarea id="mensaje" rows={4} value={formData.mensaje} onChange={(e) => handleChange('mensaje', e.target.value)} placeholder="Cuéntenos sobre su organización y lo que necesita..." />
              </div>

              <div className="flex items-start gap-2">
                <Checkbox id="solicitarDemo" checked={formData.solicitarDemo as boolean} onCheckedChange={(v) => handleChange('solicitarDemo', v as boolean)} />
                <Label htmlFor="solicitarDemo" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  Solicitar demo personalizada de la plataforma
                </Label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox id="consentimiento" checked={formData.consentimiento as boolean} onCheckedChange={(v) => handleChange('consentimiento', v as boolean)} />
                <Label htmlFor="consentimiento" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  Acepto el tratamiento de mis datos personales conforme a la política de privacidad de Nova Silva. *
                </Label>
              </div>
              {errors.consentimiento && <p className="text-xs text-destructive">{errors.consentimiento}</p>}

              <Button type="submit" disabled={loading} className="w-full sm:w-auto px-8 bg-accent hover:bg-accent/90 text-white">
                {loading ? 'Enviando...' : 'Enviar mensaje'}
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </form>

            {/* Sidebar channels */}
            <div id="canales-alternativos" className="space-y-6">
              <h3 className="font-semibold text-foreground text-lg">Canales alternativos</h3>
              <div className="space-y-4">
                <a href="https://wa.me/50688888888" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm hover:border-primary/30 transition-colors">
                  <MessageCircle className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium text-foreground text-sm">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Respuesta en menos de 24h</p>
                  </div>
                </a>
                <a href="mailto:info@novasilva.co" className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm hover:border-primary/30 transition-colors">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground text-sm">info@novasilva.co</p>
                    <p className="text-xs text-muted-foreground">Correo institucional</p>
                  </div>
                </a>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border shadow-sm">
                  <MapPin className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Costa Rica</p>
                    <p className="text-xs text-muted-foreground">Centroamérica</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
