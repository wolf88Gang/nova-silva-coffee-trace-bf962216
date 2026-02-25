import { NavLink } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import {
  Eye, Shield, TrendingUp, Wifi, Scale, Award,
  ArrowRight, User, Lock, Code
} from 'lucide-react';

const principles = [
  { icon: Eye, title: 'Transparencia verificable', desc: 'Datos y evidencias diseñados para ser auditables, con trazabilidad clara desde la captura en campo hasta los reportes y las huellas digitales en blockchain.' },
  { icon: Shield, title: 'Soberanía de datos', desc: 'La propiedad de los datos permanece en las cooperativas y productores; Nova Silva actúa como infraestructura de gestión y verificación.' },
  { icon: TrendingUp, title: 'Impacto social y ambiental medible', desc: 'Los indicadores y dashboards VITAL se orientan a medir vulnerabilidad, adaptación y resultados concretos.' },
  { icon: Wifi, title: 'Accesibilidad digital para zonas rurales', desc: 'Compromiso con soluciones offline-first, alfabetización digital y reducción de brechas de acceso.' },
  { icon: Scale, title: 'Escalabilidad sin perder control técnico', desc: 'Arquitectura modular y gobernanza de datos que permiten crecer sin perder precisión ni claridad.' },
  { icon: Award, title: 'Cumplimiento como ventaja competitiva', desc: 'El cumplimiento se utiliza para abrir mercados y fortalecer cadenas de valor, no solo para pasar auditorías.' },
];

const team = [
  { icon: User, name: 'Wolfgang Werner', role: 'CEO', desc: 'Dirección estratégica, alianzas y credibilidad institucional. Experiencia en agricultura resiliente, finanzas rurales y acompañamiento a cooperativas.' },
  { icon: Lock, name: 'José Manuel Montealegre', role: 'Cybersecurity & Blockchain Lead', desc: 'Responsable de seguridad, cifrado y gobernanza de datos. Diseño del módulo de integridad de evidencia e integración blockchain.' },
  { icon: Code, name: 'CTO', role: 'Socio técnico', desc: 'Arquitectura y desarrollo del ecosistema digital. Integración de APIs con certificadoras e implementación de prácticas de seguridad.' },
];

const allies = ['CATIE', 'EARTH University', 'UNA', 'Rainforest Alliance', 'Fairtrade / FLOCERT', 'GlobalG.A.P.', 'INTECO', 'GIZ', 'BID Lab', 'CAF'];

export default function NosotrosPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Tecnología con raíces humanas para la confianza agroambiental</h1>
          <p className="text-primary-foreground/80 text-lg">
            Facilitamos el cumplimiento técnico y documental de cooperativas agrícolas que exportan, integrando tecnología accesible con criterios sociales, éticos y productivos.
          </p>
        </div>
      </section>

      {/* Propósito, misión, visión */}
      <section id="proposito-vision" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
          {[
            { label: 'Propósito', text: 'Convertir los datos agrícolas en evidencia verificable que conecte productores, cooperativas y certificadoras bajo una red de transparencia y confianza mutua.' },
            { label: 'Misión', text: 'Transformar los datos agrícolas en evidencia verificable que permita a las cooperativas cumplir normas internacionales, reducir riesgos y acceder a mercados exigentes sin perder el control de su información.' },
            { label: 'Visión', text: 'Ser la infraestructura de trazabilidad y cumplimiento más confiable de América Latina, empoderando a las cooperativas para cumplir con normas internacionales y adaptarse al cambio climático.' },
          ].map((item) => (
            <div key={item.label} className="p-6 rounded-xl bg-card border border-border shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">{item.label}</span>
              <p className="mt-3 text-foreground text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Principios */}
      <section id="principios-valores" className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">Principios que guían nuestro trabajo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {principles.map((p) => (
              <div key={p.title} className="flex gap-4 p-5 rounded-xl bg-card border border-border shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{p.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section id="equipo-fundador" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">Equipo fundador</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((t) => (
              <div key={t.name} className="text-center p-6 rounded-xl bg-card border border-border shadow-sm">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <t.icon className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{t.name}</h3>
                <p className="text-xs text-accent font-medium mb-2">{t.role}</p>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alianzas */}
      <section id="alianzas-pilotos" className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Alianzas y validaciones institucionales</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Desarrollado junto a quienes conocen el terreno: técnicos, cooperativas, centros de investigación y auditores.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {allies.map((a) => (
              <span key={a} className="px-5 py-2.5 rounded-lg bg-card border border-border text-sm font-medium text-foreground/70 shadow-sm">
                {a}
              </span>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <NavLink to="/impacto#kpis-impacto" className="inline-flex items-center gap-2 text-accent font-medium hover:underline">
              Ver indicadores de impacto <ArrowRight className="h-4 w-4" />
            </NavLink>
            <NavLink to="/contacto#form-contacto-demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors shadow-sm">
              Solicitar demo
            </NavLink>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
