import { NavLink } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Shield, FileCheck, Lock, ArrowRight, CheckCircle } from 'lucide-react';

const norms = [
  { title: 'EUDR – Reglamento de la UE sobre productos libres de deforestación', items: ['Geolocalización de cada parcela con polígonos GPS', 'Cruce con mapas satelitales de deforestación', 'Declaración de debida diligencia con evidencia trazable', 'Exportación de paquetes en JSON y PDF para importadores'] },
  { title: 'Rainforest Alliance', items: ['Checklists de auditoría por criterio', 'Trazabilidad de volumen y segregación de lotes', 'Exportación de datos en formato RA-XML compatible', 'Documentación de prácticas sociales y ambientales'] },
  { title: 'Fairtrade / FLOCERT', items: ['Registro de precios mínimos y prima', 'Plan de desarrollo con uso de prima documentado', 'Auditoría de cadena de custodia', 'Reportes de beneficiarios y distribución'] },
  { title: 'Orgánico (NOP, UE, JAS)', items: ['Plan de manejo orgánico documentado', 'Registro de insumos y trazabilidad por parcela', 'Separación de lotes convencionales y orgánicos', 'Historial de inspecciones y no conformidades'] },
  { title: 'ISO 14001 / 27001', items: ['Gestión ambiental con indicadores medibles', 'Seguridad de información y protección de datos', 'Registros de auditoría y mejora continua', 'Control de accesos y gobernanza de datos'] },
];

const flowSteps = [
  { num: '01', title: 'Registro en finca', desc: 'Datos de productores, parcelas y coordenadas GPS capturados en campo.' },
  { num: '02', title: 'Validación geoespacial', desc: 'Cruce con imágenes satelitales, NDVI y mapas de deforestación.' },
  { num: '03', title: 'Integridad de evidencia', desc: 'Generación de hash SHA-256 y registro en blockchain pública.' },
  { num: '04', title: 'Reporte para auditoría', desc: 'Paquetes listos en PDF, JSON, CSV y RA-XML para certificadoras.' },
];

export default function CumplimientoPage() {
  return (
    <PublicLayout>
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Cumplimiento y Certificaciones</h1>
          <p className="text-primary-foreground/80 text-lg">
            Traducimos requisitos normativos en checklists, indicadores y evidencia auditable para que las cooperativas accedan a mercados internacionales con confianza.
          </p>
        </div>
      </section>

      {/* EUDR y normas */}
      <section id="eudr" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Normas y certificaciones compatibles
          </h2>
          <div className="space-y-6 max-w-4xl mx-auto">
            {norms.map((n) => (
              <div key={n.title} className="p-6 rounded-xl bg-card border border-border shadow-sm">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {n.title}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {n.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flujo finca a certificación */}
      <section id="flujo-finca-a-certificacion" className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-4">
            De la finca a la certificación
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Un flujo continuo que genera evidencia auditable en cada paso, reforzada con integridad blockchain.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {flowSteps.map((s) => (
              <div key={s.num} className="p-6 rounded-xl bg-card border border-border shadow-sm">
                <span className="text-3xl font-bold text-primary/15">{s.num}</span>
                <h3 className="font-semibold text-foreground mt-2 mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integridad blockchain */}
      <section id="integridad-evidencia-blockchain" className="py-20 md:py-28">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Integridad de evidencia con blockchain</h2>
              </div>
              <p className="text-muted-foreground">
                La plataforma genera huellas digitales criptográficas (SHA-256) de cada registro relevante. Estas se almacenan en una red blockchain pública, actuando como prueba de existencia digital que permite verificar que la información no fue alterada.
              </p>
              <ul className="space-y-2">
                {[
                  'Mayor confianza frente a certificadoras y compradores',
                  'Capacidad de demostrar integridad histórica de registros',
                  'Información sensible permanece cifrada y fuera de la cadena',
                  'Base técnica para verificador público de evidencias',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full lg:max-w-sm">
              <div className="aspect-square rounded-xl bg-muted border border-border flex items-center justify-center">
                <Lock className="h-20 w-20 text-muted-foreground/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Preparemos su próxima auditoría digital</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <NavLink to="/contacto#form-contacto-demo" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors shadow-lg">
              Solicitar demo para EUDR <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
