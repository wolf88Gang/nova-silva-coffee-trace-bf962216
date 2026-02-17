import { NavLink } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import {
  Shield, Leaf, BarChart3, Globe2, Cpu, Lock,
  ArrowRight, Users, Building2, CheckCircle2,
  Sprout, FileCheck, Zap, TrendingUp
} from 'lucide-react';
import bgTerraces from '@/assets/bg-terraces.jpg';

const modules = [
  { icon: Sprout, title: 'Plan CLIMA', desc: 'Diagnóstico de resiliencia climática basado en IPCC con scoring y plan de mejora.', anchor: '/soluciones#modulo-clima-plan' },
  { icon: Shield, title: 'Trazabilidad EUDR', desc: 'Registro georreferenciado con validación satelital y reportes para certificadoras.', anchor: '/soluciones#modulo-trazabilidad-eudr' },
  { icon: Lock, title: 'Blockchain Integrity', desc: 'Huellas digitales SHA-256 en blockchain pública para evidencia a prueba de manipulación.', anchor: '/soluciones#modulo-blockchain-integrity' },
  { icon: Globe2, title: 'GIS Satélite / NDVI', desc: 'Análisis satelital de cobertura vegetal y detección de cambios en uso de suelo.', anchor: '/soluciones#modulo-gis-ndvi' },
  { icon: Cpu, title: 'IA Coach', desc: 'Asistente inteligente para recomendaciones agronómicas y análisis de datos.', anchor: '/soluciones#modulo-ia-coach' },
  { icon: FileCheck, title: 'Governance & Consent', desc: 'Gobernanza de datos, control de accesos y consentimiento informado del productor.', anchor: '/soluciones#modulo-governance-consent' },
];

const benefits = [
  { icon: Users, title: 'Productores', desc: 'Registro sencillo desde el teléfono, mejor historial de cumplimiento y recomendaciones climáticas.' },
  { icon: Building2, title: 'Cooperativas', desc: 'Menos tareas manuales, mejor control de datos y documentación lista para auditoría.' },
  { icon: CheckCircle2, title: 'Certificadoras y compradores', desc: 'Evidencia consistente, trazable y verificable, con indicadores claros de riesgo.' },
];

const steps = [
  { num: '01', title: 'Captura en campo', desc: 'Datos de productores, parcelas y entregas registrados desde dispositivos móviles.' },
  { num: '02', title: 'Validación geoespacial', desc: 'Cruce con imágenes satelitales y registro de huella digital en blockchain.' },
  { num: '03', title: 'Análisis CLIMA', desc: 'Evaluación de resiliencia climática con scoring por finca y plan de mejora.' },
  { num: '04', title: 'Reportes auditoría', desc: 'Paquetes de debida diligencia listos para EUDR, Rainforest y certificadoras.' },
];

export default function HomePage() {
  return (
    <PublicLayout>
      {/* H1 - Hero */}
      <section id="hero" className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <img src={bgTerraces} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/75 to-primary/50" />
        </div>
        <div className="relative container mx-auto px-4 lg:px-8 py-32 md:py-40">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Cumplimiento digital para cooperativas agrícolas, con datos verificables desde el campo hasta la certificación.
            </h1>
            <p className="text-lg text-white/80 max-w-xl">
              Plataforma que integra datos de productores, georreferenciación, análisis satelital y reportes listos para EUDR, Rainforest, Fairtrade y esquemas orgánicos.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <NavLink to="/contacto#form-contacto-demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors shadow-lg">
                Solicitar demo <ArrowRight className="h-4 w-4" />
              </NavLink>
              <NavLink to="/soluciones#plataforma-resumen" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
                Explorar plataforma
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* H2 - Qué es Nova Silva */}
      <section id="que-es-nova-silva" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Plataforma latinoamericana para trazabilidad, cumplimiento y acción climática cooperativa.
            </h2>
            <p className="text-muted-foreground text-lg">
              Nova Silva unifica los datos de campo, las imágenes satelitales y las herramientas de gobernanza en una sola plataforma, para que las cooperativas gestionen cumplimiento normativo, transparencia de cadena y resiliencia climática con evidencia técnica verificable.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Shield, label: 'Trazabilidad', desc: 'Registro digital extremo a extremo desde el productor.' },
              { icon: FileCheck, label: 'Evidencia auditable', desc: 'Reportes y paquetes listos para certificadoras.' },
              { icon: Sprout, label: 'Resiliencia climática', desc: 'Diagnóstico y plan de mejora por finca.' },
            ].map((p) => (
              <div key={p.label} className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <p.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{p.label}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* H3 - Módulos principales */}
      <section id="soluciones-resumen" className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Un ecosistema de soluciones interoperables</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Cada módulo responde a un componente clave del trabajo diario en cooperativas, desde la trazabilidad y el cumplimiento hasta el monitoreo climático.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => (
              <NavLink key={m.title} to={m.anchor} className="group p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <m.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      {/* H4 - Beneficios por tipo de usuario */}
      <section id="beneficios" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Beneficios para productores, cooperativas y certificadoras
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefits.map((b) => (
              <div key={b.title} className="text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <b.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* H5 - Cómo funciona */}
      <section id="como-funciona" className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Del registro en campo al reporte digital para auditoría</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              El flujo de trabajo se estructura en pasos claros: captura en finca, validación geoespacial e integridad de evidencia, análisis de resiliencia y generación de reportes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((s) => (
              <div key={s.num} className="relative p-6 rounded-xl bg-card border border-border shadow-sm">
                <span className="text-4xl font-bold text-primary/15">{s.num}</span>
                <h3 className="font-semibold text-foreground mt-2 mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* H6 - Impacto resumido */}
      <section id="impacto-resumen" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-12">Indicadores de impacto y eficiencia</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '500+', label: 'Productores registrados' },
              { value: '12', label: 'Cooperativas piloto' },
              { value: '60%', label: 'Reducción tiempo auditoría' },
              { value: '95%', label: 'Evidencias con hash verificado' },
            ].map((k) => (
              <div key={k.label} className="space-y-1">
                <p className="text-3xl md:text-4xl font-bold text-primary">{k.value}</p>
                <p className="text-sm text-muted-foreground">{k.label}</p>
              </div>
            ))}
          </div>
          <NavLink to="/impacto#kpis-impacto" className="inline-flex items-center gap-2 mt-10 text-accent font-medium hover:underline">
            Ver casos y métricas <ArrowRight className="h-4 w-4" />
          </NavLink>
        </div>
      </section>

      {/* H7 - Planes */}
      <section id="planes-resumen" className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-4">
            Escalable a distintos niveles de digitalización
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Los planes combinan digitalización básica, monitoreo satelital y servicios de asesoría climática para que cada organización avance a su propio ritmo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Nova Lite', desc: 'Registro digital básico de productores, parcelas y entregas con georreferenciación.', price: 'Desde $400/mes' },
              { name: 'Nova Smart', desc: 'Trazabilidad completa, monitoreo satelital NDVI, reportes EUDR y blockchain integrity.', price: 'Desde $800/mes', featured: true },
              { name: 'Nova Plus', desc: 'Todo Smart más Plan CLIMA, IA Coach, governance avanzada y soporte premium.', price: 'Desde $1,500/mes' },
            ].map((plan) => (
              <div key={plan.name} className={`p-6 rounded-xl border shadow-sm ${plan.featured ? 'bg-primary text-primary-foreground border-primary ring-2 ring-accent' : 'bg-card border-border'}`}>
                <h3 className={`font-bold text-lg mb-2 ${plan.featured ? '' : 'text-foreground'}`}>{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.featured ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{plan.desc}</p>
                <p className={`font-semibold ${plan.featured ? '' : 'text-foreground'}`}>{plan.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* H8 - Casos y confianza */}
      <section id="casos-resumen" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Validado con cooperativas y socios técnicos
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            La plataforma se desarrolla y prueba en conjunto con cooperativas, centros de investigación y certificadoras, priorizando rigurosidad técnica y viabilidad operativa.
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            {['CATIE', 'EARTH University', 'Rainforest Alliance', 'Fairtrade', 'GIZ'].map((name) => (
              <div key={name} className="px-6 py-3 rounded-lg bg-muted text-muted-foreground font-medium text-sm">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* H9 - CTA final */}
      <section id="cta-contacto" className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">Conversemos sobre la próxima auditoría digital</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            Un equipo técnico revisa la situación actual de trazabilidad y cumplimiento de la cooperativa y propone un flujo digital y un plan de implementación acordes a sus capacidades.
          </p>
          <NavLink to="/contacto#form-contacto-demo" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors shadow-lg">
            Solicitar demo <ArrowRight className="h-4 w-4" />
          </NavLink>
        </div>
      </section>
    </PublicLayout>
  );
}
