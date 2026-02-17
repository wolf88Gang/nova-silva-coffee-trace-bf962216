import { NavLink } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import {
  Shield, Leaf, Globe2, Cpu, Lock, FileCheck,
  ArrowRight, Sprout
} from 'lucide-react';

const modules = [
  {
    id: 'modulo-clima-plan', icon: Sprout, title: 'Plan CLIMA',
    desc: 'Sistema de diagnóstico de vulnerabilidad y capacidad adaptativa para productores y organizaciones cafetaleras, basado en el marco IPCC (Exposición, Sensibilidad, Capacidad Adaptativa).',
    features: ['100 preguntas para productores en 6 bloques temáticos', '58 preguntas para diagnóstico organizacional', 'Scoring en escala 0.0–1.0 con 4 niveles de madurez', 'Plan de acciones correctivas con seguimiento'],
    cta: { label: 'Conocer el Plan CLIMA', to: '/plan-clima#que-es-plan-clima' },
  },
  {
    id: 'modulo-trazabilidad-eudr', icon: Shield, title: 'Trazabilidad EUDR y Certificaciones',
    desc: 'Registro georreferenciado de productores y lotes, validación con datos satelitales y reportes técnicos en formatos aceptados por certificadoras.',
    features: ['Geolocalización de parcelas con puntos y polígonos', 'Documentos legales con estados vigente/vencido/pendiente', 'Paquete EUDR completo con composición de lotes', 'Exportación PDF/JSON para compradores'],
    cta: { label: 'Ver normas y cumplimiento', to: '/cumplimiento-y-certificaciones#eudr' },
  },
  {
    id: 'modulo-blockchain-integrity', icon: Lock, title: 'Blockchain Integrity',
    desc: 'Sistema de integridad de evidencia basado en huellas digitales criptográficas SHA-256 registradas en blockchain pública.',
    features: ['Hash SHA-256 de paquetes EUDR y evidencias', 'Almacenamiento del hash, no del archivo, en cadena pública', 'Verificación de no alteración en cualquier momento', 'Base para verificador público de evidencias'],
  },
  {
    id: 'modulo-gis-ndvi', icon: Globe2, title: 'GIS Satélite / NDVI',
    desc: 'Análisis satelital de cobertura vegetal, detección de cambios en uso de suelo y validación geoespacial de parcelas registradas.',
    features: ['Imágenes satelitales multitemporales', 'Índice NDVI para salud de la vegetación', 'Cruce de polígonos con mapas de deforestación', 'Validación remota para certificadoras'],
  },
  {
    id: 'modulo-ia-coach', icon: Cpu, title: 'IA Coach',
    desc: 'Asistente inteligente que brinda recomendaciones agronómicas basadas en datos de campo, clima y diagnósticos VITAL.',
    features: ['Interpretaciones automáticas de diagnósticos', 'Recomendaciones de manejo por finca', 'Análisis de evidencias fotográficas', 'Respuestas a preguntas técnicas'],
  },
  {
    id: 'modulo-governance-consent', icon: FileCheck, title: 'Governance & Consent',
    desc: 'Gobernanza de datos, control de accesos y consentimiento informado del productor, alineado con GDPR y legislación local.',
    features: ['Control de acceso por roles y permisos', 'Consentimiento informado digital del productor', 'Auditoría de cambios y trazabilidad de accesos', 'Segregación estricta de información (RLS)'],
  },
];

export default function SolucionesPage() {
  return (
    <PublicLayout>
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Soluciones integradas para la cadena de valor del café</h1>
          <p className="text-primary-foreground/80 text-lg">
            Una plataforma modular que conecta datos de campo, validación satelital e integridad blockchain para generar evidencia auditable alineada con las normas más exigentes.
          </p>
        </div>
      </section>

      <section id="plataforma-resumen" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8 space-y-16">
          {modules.map((m, i) => (
            <div key={m.id} id={m.id} className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-12 items-start max-w-5xl mx-auto`}>
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">{m.title}</h2>
                </div>
                <p className="text-muted-foreground">{m.desc}</p>
                <ul className="space-y-2">
                  {m.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Leaf className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {m.cta && (
                  <NavLink to={m.cta.to} className="inline-flex items-center gap-2 text-accent font-medium hover:underline mt-2">
                    {m.cta.label} <ArrowRight className="h-4 w-4" />
                  </NavLink>
                )}
              </div>
              <div className="flex-1 w-full lg:max-w-md">
                <div className="aspect-video rounded-xl bg-muted border border-border flex items-center justify-center">
                  <m.icon className="h-16 w-16 text-muted-foreground/30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Explore cómo cada módulo puede integrarse a su organización</h2>
          <NavLink to="/contacto#form-contacto-demo" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors shadow-lg">
            Solicitar demo <ArrowRight className="h-4 w-4" />
          </NavLink>
        </div>
      </section>
    </PublicLayout>
  );
}
