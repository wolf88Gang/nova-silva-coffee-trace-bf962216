import { NavLink } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import { ArrowRight, TrendingUp, Users, Clock, Shield, Quote } from 'lucide-react';

const kpis = [
  { value: '500+', label: 'Productores registrados en la plataforma', icon: Users },
  { value: '12', label: 'Cooperativas en fase piloto', icon: TrendingUp },
  { value: '60%', label: 'Reducción en tiempo de preparación de auditorías', icon: Clock },
  { value: '95%', label: 'Evidencias con huella digital verificada', icon: Shield },
  { value: '3 países', label: 'Presencia en Centroamérica', icon: TrendingUp },
  { value: '<5 min', label: 'Generación de paquete EUDR por lote', icon: Clock },
];

const cases = [
  {
    title: 'Cooperativa cafetalera en Costa Rica',
    desc: 'Digitalización de 120 productores, 80 parcelas georreferenciadas y generación de primeros paquetes EUDR con trazabilidad completa.',
    result: 'Auditoría Rainforest Alliance preparada en 3 días en lugar de 3 semanas.',
  },
  {
    title: 'Exportadora con 5 proveedores en Honduras',
    desc: 'Integración de datos de múltiples cooperativas para generar paquetes de debida diligencia unificados para importadores europeos.',
    result: 'Primer embarque con documentación EUDR completa y hash blockchain verificado.',
  },
  {
    title: 'Proyecto climático GIZ en Guatemala',
    desc: 'Implementación del Plan CLIMA para diagnóstico de resiliencia en 200 fincas con seguimiento satelital NDVI.',
    result: 'Reportes de impacto climático con evidencia verificable para informes de donantes.',
  },
];

const testimonials = [
  { text: 'Antes preparar una auditoría nos tomaba semanas de trabajo manual. Ahora es cuestión de generar los reportes y están listos para el auditor.', author: 'Gerente de cooperativa, Costa Rica' },
  { text: 'La trazabilidad digital nos da confianza frente a nuestros compradores en Europa. Sabemos que la evidencia es sólida.', author: 'Responsable de cumplimiento, Honduras' },
];

export default function ImpactoPage() {
  return (
    <PublicLayout>
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Impacto</h1>
          <p className="text-primary-foreground/80 text-lg">
            Evidencia cuantificable de cómo la digitalización transforma la gestión de cooperativas, la preparación para auditorías y la resiliencia climática.
          </p>
        </div>
      </section>

      {/* KPIs */}
      <section id="kpis-impacto" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">Indicadores clave</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {kpis.map((k) => (
              <div key={k.label} className="text-center p-6 rounded-xl bg-card border border-border shadow-sm">
                <k.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                <p className="text-2xl md:text-3xl font-bold text-primary">{k.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Casos */}
      <section id="casos-uso" className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">Casos de implementación</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {cases.map((c) => (
              <div key={c.title} className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-3">
                <h3 className="font-semibold text-foreground">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
                <p className="text-sm font-medium text-primary">{c.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section id="testimonios" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">Lo que dicen nuestros aliados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.author} className="p-6 rounded-xl bg-card border border-border shadow-sm">
                <Quote className="h-6 w-6 text-accent/40 mb-3" />
                <p className="text-foreground italic mb-4">"{t.text}"</p>
                <p className="text-sm text-muted-foreground font-medium">— {t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alianzas */}
      <section id="alianzas-validaciones" className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Validado con socios técnicos e institucionales</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['CATIE', 'EARTH University', 'Rainforest Alliance', 'Fairtrade', 'GIZ', 'BID Lab', 'CAF'].map((a) => (
              <span key={a} className="px-5 py-2.5 rounded-lg bg-card border border-border text-sm font-medium text-foreground/70 shadow-sm">
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="cta-ver-demo" className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Conozca cómo Nova Silva puede generar impacto en su organización</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <NavLink to="/soluciones" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-primary-foreground/30 text-primary-foreground font-semibold hover:bg-primary-foreground/10 transition-colors">
              Ver cómo funciona
            </NavLink>
            <NavLink to="/contacto#form-contacto-demo" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors shadow-lg">
              Solicitar demo <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
