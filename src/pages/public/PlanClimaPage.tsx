import { NavLink } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Sprout, BarChart3, ArrowRight, CheckCircle, Thermometer, Droplets, TreePine, Users, Lightbulb } from 'lucide-react';

const components = [
  { icon: Thermometer, letter: 'C', title: 'Contexto', desc: 'Análisis de la exposición territorial: temperatura, precipitación, eventos extremos, altitud y microclima.' },
  { icon: BarChart3, letter: 'L', title: 'Línea base', desc: 'Evaluación de la situación actual de la finca: productividad, prácticas de manejo, infraestructura y capacidades del productor.' },
  { icon: Lightbulb, letter: 'I', title: 'Intervenciones', desc: 'Plan de mejora con acciones priorizadas: renovación de cafetales, sombra, manejo de agua, diversificación de ingresos.' },
  { icon: Sprout, letter: 'M', title: 'Monitoreo', desc: 'Seguimiento de indicadores clave con dashboards automatizados: avance de acciones, cambios en scoring, evidencias fotográficas.' },
  { icon: Users, letter: 'A', title: 'Acompañamiento', desc: 'Asistencia técnica continua con visitas programadas, alertas tempranas y recomendaciones basadas en datos actualizados.' },
];

const benefitsCoops = [
  'Diagnóstico de vulnerabilidad climática de todos los productores en un solo panel',
  'Priorización de asistencia técnica por nivel de riesgo',
  'Documentación lista para reportes a donantes y certificadoras',
  'Integración con módulos de cumplimiento EUDR y trazabilidad',
];

const benefitsDonantes = [
  'Evidencia técnica verificable del impacto de las inversiones',
  'Indicadores alineados con marcos IPCC y ODS',
  'Monitoreo remoto de avance sin depender solo de visitas',
  'Base para modelos de financiamiento climático y carbono',
];

export default function PlanClimaPage() {
  return (
    <PublicLayout>
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Protocolo VITAL</h1>
          <p className="text-primary-foreground/80 text-lg">
            Metodología de diagnóstico de resiliencia climática para cooperativas y productores, integrada con herramientas digitales de monitoreo y reporte.
          </p>
        </div>
      </section>

      {/* Qué es */}
      <section id="que-es" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Contexto, Línea base, Intervenciones, Monitoreo, Acompañamiento
          </h2>
          <p className="text-muted-foreground text-lg">
            El Protocolo VITAL evalúa la capacidad adaptativa de cada finca frente al cambio climático, generando un índice de solidez (0.0–1.0) y un plan de mejora con acciones concretas y seguimiento continuo.
          </p>
        </div>
      </section>

      {/* 5 componentes */}
      <section id="componentes-vital" className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">Los cinco componentes</h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            {components.map((c) => (
              <div key={c.letter} className="flex gap-4 p-6 rounded-xl bg-card border border-border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-primary">{c.letter}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios-vital" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">Beneficios del Protocolo VITAL</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Para cooperativas</h3>
              <ul className="space-y-3">
                {benefitsCoops.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Para donantes e inversionistas</h3>
              <ul className="space-y-3">
                {benefitsDonantes.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integración dashboard */}
      <section id="integracion-dashboard-vital" className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Integración con la plataforma digital</h2>
              <p className="text-muted-foreground">
                El diagnóstico VITAL se integra directamente con los módulos de trazabilidad, cumplimiento y finanzas de Nova Silva, permitiendo una visión unificada de riesgo, producción y cumplimiento.
              </p>
              <NavLink to="/soluciones#modulo-protocolo-vital" className="inline-flex items-center gap-2 text-accent font-medium hover:underline">
                Ver indicadores en la plataforma <ArrowRight className="h-4 w-4" />
              </NavLink>
            </div>
            <div className="flex-1 w-full lg:max-w-sm">
              <div className="aspect-video rounded-xl bg-muted border border-border flex items-center justify-center">
                <BarChart3 className="h-16 w-16 text-muted-foreground/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta-propuesta-vital" className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Solicite una propuesta personalizada del Protocolo VITAL</h2>
          <NavLink to="/contacto#form-contacto-demo" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors shadow-lg">
            Solicitar propuesta Protocolo VITAL <ArrowRight className="h-4 w-4" />
          </NavLink>
        </div>
      </section>
    </PublicLayout>
  );
}
