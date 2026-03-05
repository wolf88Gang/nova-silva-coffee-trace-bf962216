import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Leaf, Bug, TreePine, Eye, ArrowRight, ArrowLeft, CheckCircle,
  AlertTriangle, Calendar, Shield, Droplets, CircleDot, FileText,
  Zap, RotateCcw, Sprout, FlaskConical, ShieldAlert, Microscope, Send,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Disease database (biblia fitosanitaria) ──
interface Disease {
  id: string;
  name: string;
  scientificName: string;
  category: 'enfermedad' | 'plaga' | 'deficiencia';
  parts: string[];
  symptoms: { id: string; label: string; description: string; match: number }[];
  riskLevel: 'critico' | 'alto' | 'medio' | 'bajo';
  priority: string;
  description: string;
  immediateAction: string;
  treatment: { regenerativo: { nombre: string; receta: string; dosis: string; frecuencia: string; nota: string }; convencional: { nombre: string; dosis: string; frecuencia: string } };
  prevention: string[];
  earlyWarnings: string[];
}

const diseases: Disease[] = [
  // ═══ ENFERMEDADES FÚNGICAS (10) ═══
  {
    id: 'roya', name: 'Roya del Cafeto', scientificName: 'Hemileia vastatrix',
    category: 'enfermedad', parts: ['hojas'],
    symptoms: [
      { id: 'manchas_amarillas', label: 'Manchas amarillas en el envés', description: 'Manchas circulares 3-10mm amarillo-anaranjado en el envés', match: 30 },
      { id: 'polvo_naranja', label: 'Polvo anaranjado al tocar', description: 'Esporas del hongo que se desprenden al contacto', match: 30 },
      { id: 'defoliacion', label: 'Defoliación prematura', description: 'Caída masiva de hojas viejas', match: 20 },
      { id: 'hojas_secas', label: 'Hojas secas o marchitas', description: 'Necrosis avanzada', match: 10 },
      { id: 'zona_humeda', label: 'Zona húmeda y poca ventilación', description: 'Condiciones favorables para el hongo', match: 10 },
    ],
    riskLevel: 'critico', priority: 'Prioridad Crítica. Enfermedad sistémica más devastadora. Intervención inmediata si incidencia >5%.',
    description: 'Hongo que causa defoliación severa y pérdida de producción hasta 50%.',
    immediateAction: 'Reportar a la cooperativa para alerta epidemiológica regional',
    treatment: { regenerativo: { nombre: 'Caldo Bordelés', receta: '1kg sulfato de cobre + 1kg cal viva en 100L agua', dosis: '400-600 L/ha', frecuencia: 'Cada 15-21 días en lluvias', nota: 'Aplicar en horas frescas. pH neutro.' }, convencional: { nombre: 'Cyproconazole (Triazol)', dosis: '0.5-0.75 L/ha', frecuencia: 'Cada 30-45 días, máx 3/ciclo' } },
    prevention: ['Sombra regulada 40-60%', 'Podar para circulación de aire', 'Eliminar hojas infectadas', 'Fertilización balanceada', 'Densidad adecuada'],
    earlyWarnings: ['Puntos amarillentos en envés', 'Polvo anaranjado al frotar', 'Hojas viejas afectadas primero', 'Mayor incidencia post-lluvia'],
  },
  {
    id: 'ojo_gallo', name: 'Ojo de Gallo', scientificName: 'Mycena citricolor',
    category: 'enfermedad', parts: ['hojas', 'fruto'],
    symptoms: [
      { id: 'lesion_circular', label: 'Lesiones circulares definidas', description: 'Manchas redondas 5-15mm con borde oscuro', match: 35 },
      { id: 'centro_gris', label: 'Centro gris con borde oscuro', description: 'Lesión madura con centro grisáceo', match: 25 },
      { id: 'caida_hojas', label: 'Caída prematura de hojas', description: 'Defoliación parcial', match: 20 },
      { id: 'humedad_alta', label: 'Humedad alta y poca ventilación', description: 'Microclima húmedo y sombreado', match: 20 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Monitorear y ajustar sombra.',
    description: 'Hongo favorecido por sombra excesiva y alta humedad.',
    immediateAction: 'Evaluar % sombra y planificar poda de regulación',
    treatment: { regenerativo: { nombre: 'Caldo Bordelés', receta: 'Misma preparación que para roya', dosis: '400-600 L/ha', frecuencia: 'Cada 21-30 días en lluvias', nota: 'Combinar con regulación de sombra.' }, convencional: { nombre: 'Oxicloruro de cobre', dosis: '2-3 kg/ha', frecuencia: 'Cada 21-30 días' } },
    prevention: ['Regular sombra a 40-50%', 'Poda de formación y sanitaria', 'Mejorar circulación de aire'],
    earlyWarnings: ['Lesiones circulares en hojas bajeras', 'Sombra excesiva >60%', 'Lluvias prolongadas con neblina'],
  },
  {
    id: 'antracnosis', name: 'Antracnosis', scientificName: 'Colletotrichum spp.',
    category: 'enfermedad', parts: ['hojas', 'fruto', 'tallo'],
    symptoms: [
      { id: 'manchas_oscuras', label: 'Manchas oscuras irregulares', description: 'Manchas necróticas irregulares en hojas/frutos', match: 25 },
      { id: 'necrosis', label: 'Necrosis progresiva desde bordes', description: 'Muerte del tejido desde puntas al centro', match: 25 },
      { id: 'frutos_momificados', label: 'Frutos momificados/negros', description: 'Frutos secos y oscuros sin caer', match: 25 },
      { id: 'muerte_ramas', label: 'Muerte regresiva de ramas', description: 'Puntas de ramas se secan progresivamente', match: 25 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Asociada a estrés nutricional.',
    description: 'Hongo oportunista en plantas debilitadas.',
    immediateAction: 'Análisis foliar y de suelo para deficiencias',
    treatment: { regenerativo: { nombre: 'Bacillus subtilis', receta: 'Formulado comercial en aspersión foliar', dosis: '2-3 L/ha', frecuencia: 'Cada 15-21 días', nota: 'Complementar con nutrición foliar (K, Ca, B).' }, convencional: { nombre: 'Clorotalonil', dosis: '1.5-2 L/ha', frecuencia: 'Cada 21-30 días' } },
    prevention: ['Nutrición balanceada K y Ca', 'Evitar estrés hídrico', 'Regular carga productiva'],
    earlyWarnings: ['Manchas oscuras en puntas nuevas', 'Frutos oscureciéndose', 'Signos de estrés nutricional'],
  },
  {
    id: 'mal_hilachas', name: 'Mal de Hilachas', scientificName: 'Pellicularia koleroga',
    category: 'enfermedad', parts: ['hojas', 'tallo'],
    symptoms: [
      { id: 'micelio_blanco', label: 'Hilos blancos entre hojas', description: 'Red de micelio blanco visible', match: 40 },
      { id: 'hojas_pegadas', label: 'Hojas pegadas por micelio', description: 'Grupos adheridos por hilos fúngicos', match: 25 },
      { id: 'hojas_secas_colgadas', label: 'Hojas secas colgando de hilos', description: 'Hojas muertas sostenidas por micelio', match: 20 },
      { id: 'sombra_densa', label: 'Sombra densa y muy húmeda', description: 'Exceso de sombra y humedad', match: 15 },
    ],
    riskLevel: 'bajo', priority: 'Prioridad Baja. Regulación de sombra resuelve mayoría.',
    description: 'Hongo en sombra excesiva. Se propaga por filamentos blancos.',
    immediateAction: 'Poda urgente de árboles de sombra en zona afectada',
    treatment: { regenerativo: { nombre: 'Caldo Bordelés + poda', receta: 'Aplicar después de podar y regular sombra', dosis: '400 L/ha', frecuencia: 'Una aplicación post-poda', nota: 'La regulación de sombra es clave.' }, convencional: { nombre: 'Sulfato de cobre', dosis: '2 kg/ha', frecuencia: 'Una aplicación localizada' } },
    prevention: ['Sombra regulada <50%', 'Poda frecuente', 'Buen drenaje', 'Eliminar material infectado'],
    earlyWarnings: ['Filamentos blancos en ramas bajeras', 'Hojas adhiriéndose', 'Sombra >65%'],
  },
  {
    id: 'mancha_hierro', name: 'Mancha de Hierro', scientificName: 'Cercospora coffeicola',
    category: 'enfermedad', parts: ['hojas', 'fruto'],
    symptoms: [
      { id: 'manchas_concentricas', label: 'Manchas concéntricas café-rojizas', description: 'Anillos concéntricos en hojas', match: 35 },
      { id: 'halo_amarillo_hierro', label: 'Halo amarillo alrededor de manchas', description: 'Aureola clorótica rodeando la lesión', match: 25 },
      { id: 'frutos_manchados', label: 'Manchas hundidas en frutos verdes', description: 'Lesiones deprimidas oscuras en cereza', match: 25 },
      { id: 'defoliacion_parcial', label: 'Defoliación parcial', description: 'Caída de hojas afectadas', match: 15 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Asociada a deficiencia de nitrógeno.',
    description: 'Hongo que prospera en plantas con nutrición deficiente, especialmente bajo en N.',
    immediateAction: 'Evaluar plan de fertilización. Verificar niveles de nitrógeno',
    treatment: { regenerativo: { nombre: 'Caldo Bordelés + fertilización', receta: 'Aspersión cúprica + corrección de N foliar', dosis: '400 L/ha + 2 kg urea/100L', frecuencia: 'Cada 21 días', nota: 'Corregir deficiencia nutricional es prioritario.' }, convencional: { nombre: 'Epoxiconazole', dosis: '0.5 L/ha', frecuencia: 'Cada 30-45 días' } },
    prevention: ['Fertilización adecuada con N', 'Sombra moderada', 'Poda sanitaria', 'Evitar estrés hídrico'],
    earlyWarnings: ['Manchas pequeñas con anillos en hojas nuevas', 'Coloración amarillenta generalizada', 'Plantas en zonas poco fertilizadas'],
  },
  {
    id: 'phoma', name: 'Derrite / Phoma', scientificName: 'Phoma spp.',
    category: 'enfermedad', parts: ['hojas', 'fruto', 'tallo'],
    symptoms: [
      { id: 'quemadura_brotes', label: 'Quemadura de brotes tiernos', description: 'Brotes nuevos se necrosan y secan', match: 35 },
      { id: 'lesiones_acuosas', label: 'Lesiones acuosas en hojas jóvenes', description: 'Manchas translúcidas en tejido tierno', match: 25 },
      { id: 'muerte_apical', label: 'Muerte apical de ramas', description: 'Puntas de ramas jóvenes mueren', match: 25 },
      { id: 'altitud_alta', label: 'Parcela en altitud >1400m', description: 'Zonas altas con vientos fríos', match: 15 },
    ],
    riskLevel: 'alto', priority: 'Prioridad Alta. Común en altitudes elevadas con vientos fríos.',
    description: 'Hongo que ataca tejidos tiernos en zonas altas y frías. Favorecido por viento y humedad.',
    immediateAction: 'Instalar barreras rompevientos si no existen',
    treatment: { regenerativo: { nombre: 'Trichoderma + cobre', receta: 'Trichoderma harzianum + oxicloruro de cobre preventivo', dosis: '2 kg Trichoderma + 2 kg cobre/ha', frecuencia: 'Cada 21 días en época fría', nota: 'Proteger brotes nuevos es prioritario.' }, convencional: { nombre: 'Mancozeb + cobre', dosis: '2-3 kg/ha', frecuencia: 'Cada 21 días' } },
    prevention: ['Barreras rompevientos', 'Sombra que proteja de heladas', 'Evitar podas en época fría', 'Nutrición foliar con K y Ca'],
    earlyWarnings: ['Pronóstico de temperaturas <10°C', 'Brotes tiernos empezando a oscurecer', 'Vientos fríos persistentes'],
  },
  {
    id: 'llaga_negra', name: 'Llaga Negra', scientificName: 'Rosellinia bunodes',
    category: 'enfermedad', parts: ['tallo'],
    symptoms: [
      { id: 'marchitez_subita', label: 'Marchitez súbita de la planta', description: 'Planta se marchita rápidamente sin causa obvia', match: 30 },
      { id: 'raices_negras', label: 'Raíces con micelio negro', description: 'Al excavar, raíces cubiertas de masa negra', match: 30 },
      { id: 'olor_humedad', label: 'Olor a humedad en la base', description: 'Olor característico de descomposición', match: 20 },
      { id: 'muerte_focos', label: 'Muerte en focos circulares', description: 'Varias plantas mueren en patrón circular', match: 20 },
    ],
    riskLevel: 'critico', priority: 'Prioridad Crítica. Destruye raíces. Eliminar planta y tratamiento de suelo.',
    description: 'Hongo del suelo que destruye el sistema radical. Se propaga por raíces en contacto.',
    immediateAction: 'Aislar plantas afectadas. NO resembrar sin tratamiento de suelo.',
    treatment: { regenerativo: { nombre: 'Trichoderma + cal', receta: 'Remover planta, aplicar Trichoderma al suelo + encalado', dosis: '5 kg/ha Trichoderma, 2 ton/ha cal', frecuencia: 'Tratamiento único + monitoreo', nota: 'No resembrar hasta 6 meses después del tratamiento.' }, convencional: { nombre: 'Carbendazim al suelo', dosis: '2 L/ha en drench', frecuencia: 'Dos aplicaciones separadas 30 días' } },
    prevention: ['Buen drenaje del suelo', 'Evitar exceso de materia orgánica sin compostar', 'Eliminar tocones viejos', 'Tratamiento preventivo con Trichoderma'],
    earlyWarnings: ['Plantas con amarillamiento sin causa', 'Muerte súbita de plantas individuales', 'Tocones descompuestos con micelio'],
  },
  {
    id: 'mal_rosado', name: 'Mal Rosado', scientificName: 'Corticium salmonicolor',
    category: 'enfermedad', parts: ['tallo'],
    symptoms: [
      { id: 'costra_rosada', label: 'Costra rosada en ramas', description: 'Capa rosada-salmón sobre corteza de ramas', match: 40 },
      { id: 'secamiento_rama', label: 'Secamiento de ramas desde punta', description: 'Ramas afectadas se secan progresivamente', match: 25 },
      { id: 'desprendimiento_corteza', label: 'Corteza se desprende fácilmente', description: 'Al rascar se separa mostrando tejido muerto', match: 20 },
      { id: 'sombra_excesiva_rosado', label: 'Sombra excesiva en la zona', description: 'Zonas del cafetal con mucha sombra', match: 15 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Poda sanitaria + regulación de sombra.',
    description: 'Hongo que forma costra rosada sobre ramas, causando su muerte progresiva.',
    immediateAction: 'Podar y quemar ramas afectadas. Regular sombra.',
    treatment: { regenerativo: { nombre: 'Poda + cobre', receta: 'Cortar ramas 15cm debajo de lesión, sellar con pasta bordelesa', dosis: 'Pasta: 1kg sulfato + 1kg cal/5L', frecuencia: 'Tratamiento único post-poda', nota: 'Desinfectar herramientas entre cortes.' }, convencional: { nombre: 'Carbendazim foliar', dosis: '1 L/ha', frecuencia: 'Cada 30 días' } },
    prevention: ['Regulación de sombra', 'Poda sanitaria oportuna', 'Buena aireación del cafetal', 'Eliminar material enfermo'],
    earlyWarnings: ['Manchas rosadas tenues en corteza', 'Ramas con inicio de marchitez', 'Zonas con poca circulación de aire'],
  },
  {
    id: 'fumagina', name: 'Fumagina', scientificName: 'Capnodium spp.',
    category: 'enfermedad', parts: ['hojas'],
    symptoms: [
      { id: 'hollín_negro', label: 'Capa negra tipo hollín en hojas', description: 'Recubrimiento negro que se raspa fácilmente', match: 35 },
      { id: 'superficie_pegajosa', label: 'Superficie pegajosa (mielecilla)', description: 'Residuo azucarado de insectos chupadores', match: 30 },
      { id: 'presencia_escamas', label: 'Presencia de escamas o cochinillas', description: 'Insectos chupadores en envés o tallos', match: 25 },
      { id: 'reduccion_fotosintesis', label: 'Hojas con crecimiento reducido', description: 'La capa impide la fotosíntesis', match: 10 },
    ],
    riskLevel: 'bajo', priority: 'Prioridad Baja. Controlar la causa: insectos chupadores.',
    description: 'Hongo superficial que crece sobre mielecilla de insectos. No es parásito directo.',
    immediateAction: 'Identificar y controlar insectos chupadores (escamas, cochinillas)',
    treatment: { regenerativo: { nombre: 'Jabón potásico + agua a presión', receta: 'Lavar hojas con jabón potásico al 2% + control biológico de escamas', dosis: '20ml jabón/L agua', frecuencia: 'Cada 7 días hasta limpiar', nota: 'Controlar la causa (insectos) es más importante que lavar.' }, convencional: { nombre: 'Dimetoato (para escamas)', dosis: '0.5-1 L/ha', frecuencia: 'Dos aplicaciones a 15 días' } },
    prevention: ['Control de hormigas (protegen cochinillas)', 'Monitoreo de insectos chupadores', 'Evitar exceso de nitrógeno'],
    earlyWarnings: ['Hojas brillantes o pegajosas', 'Presencia de hormigas en ramas', 'Pequeños insectos en envés'],
  },
  {
    id: 'nematodos', name: 'Nematodos', scientificName: 'Meloidogyne spp.',
    category: 'enfermedad', parts: ['tallo'],
    symptoms: [
      { id: 'amarillamiento_general', label: 'Amarillamiento general sin causa', description: 'Clorosis generalizada de la planta', match: 25 },
      { id: 'enanismo', label: 'Plantas enanas o raquíticas', description: 'Crecimiento detenido sin explicación', match: 25 },
      { id: 'nodulos_raiz', label: 'Nódulos o agallas en raíces', description: 'Al excavar se ven hinchazones en raíces finas', match: 30 },
      { id: 'marchitez_sol', label: 'Marchitez en horas de sol', description: 'Planta se marchita al mediodía y recupera en la noche', match: 20 },
    ],
    riskLevel: 'alto', priority: 'Prioridad Alta. Daño radical irreversible. Usar portainjertos resistentes en renovación.',
    description: 'Gusanos microscópicos del suelo que parasitan raíces formando agallas que impiden absorción.',
    immediateAction: 'Toma de muestras de suelo para análisis nematológico',
    treatment: { regenerativo: { nombre: 'Paecilomyces + materia orgánica', receta: 'Aplicar Paecilomyces lilacinus al suelo + incorporar materia orgánica compostada', dosis: '3 kg/ha + 5 ton/ha compost', frecuencia: 'Cada 3 meses', nota: 'En renovación usar portainjerto Nemaya o Robusta.' }, convencional: { nombre: 'Carbofurán granulado', dosis: '30 g/planta', frecuencia: 'Una aplicación anual' } },
    prevention: ['Portainjertos resistentes (Nemaya, Robusta)', 'Materia orgánica abundante', 'Micorrizas en almácigo', 'Rotación de cultivos en vivero'],
    earlyWarnings: ['Plantas con crecimiento inferior a vecinas', 'Amarillamiento localizado en parches', 'Raíces con hinchazones anormales'],
  },
  // ═══ PLAGAS (10) ═══
  {
    id: 'broca', name: 'Broca del Café', scientificName: 'Hypothenemus hampei',
    category: 'plaga', parts: ['fruto'],
    symptoms: [
      { id: 'perforacion_fruto', label: 'Perforación circular en base del fruto', description: 'Orificio ~1mm en la corona', match: 35 },
      { id: 'aserrin', label: 'Aserrín en entrada del agujero', description: 'Residuos de perforación en base', match: 25 },
      { id: 'frutos_caidos', label: 'Frutos caídos prematuramente', description: 'Frutos cayendo antes de cosecha', match: 20 },
      { id: 'granos_danados', label: 'Granos con galerías internas', description: 'Al abrir: galerías y larvas en grano', match: 20 },
    ],
    riskLevel: 'critico', priority: 'Prioridad Crítica. Plaga #1 del café mundial. Pérdidas 30-80%.',
    description: 'Insecto barrenador que destruye el grano. Plaga más importante del café.',
    immediateAction: 'Iniciar trampeo y recolección de frutos brocados (Re-Re)',
    treatment: { regenerativo: { nombre: 'Beauveria bassiana', receta: 'Suspensión 2×10⁹ conidias/ml, aspersión a frutos', dosis: '2-3 kg/ha formulado', frecuencia: 'Cada 15-21 días si infestación >2%', nota: 'Horas frescas, alta humedad. No mezclar con fungicidas.' }, convencional: { nombre: 'Clorpirifos (restringido)', dosis: '1.5-2 L/ha', frecuencia: 'Máx 2 aplicaciones/ciclo' } },
    prevention: ['Cosecha oportuna y completa', 'No dejar frutos en suelo', 'Trampas alcohol+metanol 1:1', 'Registro trampas cada 15 días'],
    earlyWarnings: ['Perforaciones en corona de frutos', 'Aserrín fino en frutos', 'Trampas >0.5 brocas/trampa/día', 'Frutos maduros cayendo'],
  },
  {
    id: 'minador', name: 'Minador de la Hoja', scientificName: 'Leucoptera coffeella',
    category: 'plaga', parts: ['hojas'],
    symptoms: [
      { id: 'minas_transparentes', label: 'Minas transparentes en hojas', description: 'Áreas translúcidas irregulares donde la larva comió', match: 35 },
      { id: 'larva_visible', label: 'Larvas visibles dentro de la mina', description: 'Pequeñas larvas blanco-verdosas al trasluz', match: 25 },
      { id: 'hojas_secas_minas', label: 'Hojas secas en zonas minadas', description: 'Tejido muerto marrón donde hubo larvas', match: 25 },
      { id: 'epoca_seca_min', label: 'Incidencia mayor en época seca', description: 'Poblaciones crecen sin lluvia', match: 15 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Monitorear poblaciones en época seca.',
    description: 'Micro-lepidóptero cuya larva se alimenta del mesófilo foliar creando minas.',
    immediateAction: 'Monitorear nivel de infestación con muestreo de 30 ramas',
    treatment: { regenerativo: { nombre: 'Aceite de neem + Bacillus thuringiensis', receta: 'Neem al 1% + Bt en aspersión foliar', dosis: '3 L neem + 1 kg Bt/ha', frecuencia: 'Cada 15 días en picos', nota: 'Favorecer enemigos naturales (avispas parasitoides).' }, convencional: { nombre: 'Thiamethoxam', dosis: '200 g/ha', frecuencia: 'Cada 45-60 días' } },
    prevention: ['Sombra regulada que mantenga humedad', 'Favorecer diversidad biológica', 'Monitoreo constante en seca'],
    earlyWarnings: ['Pequeñas áreas translúcidas en hojas nuevas', 'Mariposas blancas diminutas al amanecer', 'Aumento súbito en época seca'],
  },
  {
    id: 'cochinilla', name: 'Cochinilla de la Raíz', scientificName: 'Dysmicoccus texensis',
    category: 'plaga', parts: ['tallo'],
    symptoms: [
      { id: 'masa_algodonosa', label: 'Masa algodonosa blanca en raíces', description: 'Al excavar se ven insectos blancos cerosos', match: 35 },
      { id: 'hormigas_base', label: 'Hormigas abundantes en base de planta', description: 'Hormigas protegen y transportan cochinillas', match: 25 },
      { id: 'marchitez_lenta', label: 'Marchitez lenta y progresiva', description: 'Planta decae gradualmente', match: 20 },
      { id: 'amarillamiento_cochinilla', label: 'Amarillamiento desde hojas bajeras', description: 'Clorosis ascendente', match: 20 },
    ],
    riskLevel: 'alto', priority: 'Prioridad Alta. Control de hormigas es clave.',
    description: 'Insecto chupador que parasita raíces, protegido por hormigas que lo cultivan.',
    immediateAction: 'Control de hormigas con cebo granulado alrededor de plantas afectadas',
    treatment: { regenerativo: { nombre: 'Control de hormigas + Beauveria', receta: 'Cebos para hormigas + Beauveria bassiana en drench', dosis: '50 g cebo/nido + 2 kg Beauveria/ha', frecuencia: 'Cada mes hasta control', nota: 'Sin control de hormigas, el tratamiento es ineficaz.' }, convencional: { nombre: 'Diazinón drench', dosis: '300 ml/100L agua, 250 ml/planta', frecuencia: 'Dos aplicaciones a 30 días' } },
    prevention: ['Control preventivo de hormigas', 'Monitoreo de raíces en muestreos', 'Plantas vigorosas bien nutridas'],
    earlyWarnings: ['Caminos de hormigas hacia base de plantas', 'Plantas con decaimiento sin causa foliar', 'Masa blanca al excavar ligeramente'],
  },
  {
    id: 'palomilla', name: 'Palomilla de Raíz', scientificName: 'Dysmicoccus brevipes',
    category: 'plaga', parts: ['tallo'],
    symptoms: [
      { id: 'masa_cerosa_raiz', label: 'Masa cerosa en cuello de raíz', description: 'Sustancia blanquecina en unión tallo-raíz', match: 35 },
      { id: 'detención_crecimiento', label: 'Detención del crecimiento', description: 'Planta deja de producir brotes nuevos', match: 25 },
      { id: 'defoliacion_severa_p', label: 'Defoliación progresiva', description: 'Pérdida gradual de follaje', match: 20 },
      { id: 'suelo_compactado', label: 'Suelo compactado o pobre', description: 'Condiciones de suelo desfavorables', match: 20 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Similar a cochinilla pero en cuello.',
    description: 'Cochinilla harinosa que ataca el cuello de la raíz y la base del tallo.',
    immediateAction: 'Descubrir cuello de raíz y aplicar tratamiento directo',
    treatment: { regenerativo: { nombre: 'Beauveria + materia orgánica', receta: 'Aplicar Beauveria bassiana en drench + mulch orgánico', dosis: '2 kg/ha + mulch 5 cm', frecuencia: 'Cada 30 días por 3 meses', nota: 'Mejorar estructura del suelo a largo plazo.' }, convencional: { nombre: 'Imidacloprid drench', dosis: '200 ml/100L, 250 ml/planta', frecuencia: 'Una aplicación' } },
    prevention: ['Mantener suelo suelto y bien drenado', 'Materia orgánica abundante', 'Control de hormigas'],
    earlyWarnings: ['Base de tallos con residuos cerosos', 'Plantas con menor vigor que vecinas', 'Hormigas frecuentes en base'],
  },
  {
    id: 'arana_roja', name: 'Araña Roja', scientificName: 'Oligonychus yothersi',
    category: 'plaga', parts: ['hojas'],
    symptoms: [
      { id: 'bronceado_hojas', label: 'Bronceado/opacamiento de hojas', description: 'Hojas pierden brillo y se ven bronce', match: 30 },
      { id: 'telaranas_finas', label: 'Telarañas finas en el envés', description: 'Red sedosa muy fina visible con lupa', match: 30 },
      { id: 'puntitos_amarillos', label: 'Puntitos amarillos diminutos', description: 'Clorosis puntiforme por alimentación', match: 25 },
      { id: 'hojas_caen_arana', label: 'Hojas caen si infestación severa', description: 'Defoliación en ataques fuertes', match: 15 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Picos en época seca.',
    description: 'Ácaro diminuto que succiona savia de las hojas, causando bronceado.',
    immediateAction: 'Aumentar humedad ambiental con riego por aspersión si disponible',
    treatment: { regenerativo: { nombre: 'Aceite de neem + azufre', receta: 'Neem al 1% alternado con azufre mojable', dosis: '3 L neem ó 2 kg azufre/ha', frecuencia: 'Cada 10-15 días en picos', nota: 'Evitar azufre si temperatura >30°C.' }, convencional: { nombre: 'Abamectina', dosis: '300-500 ml/ha', frecuencia: 'Cada 21 días, rotar con Spiromesifen' } },
    prevention: ['Sombra que mantenga humedad', 'Barreras vivas diversas', 'No usar insecticidas de amplio espectro'],
    earlyWarnings: ['Hojas con brillo reducido', 'Pequeñas telarañas al trasluz', 'Época seca prolongada'],
  },
  {
    id: 'escamas', name: 'Escamas / Queresas', scientificName: 'Coccus viridis',
    category: 'plaga', parts: ['hojas', 'tallo'],
    symptoms: [
      { id: 'insectos_planos', label: 'Insectos planos adheridos a ramas/hojas', description: 'Escudos cerosos adheridos al tejido', match: 35 },
      { id: 'mielecilla_escama', label: 'Mielecilla pegajosa', description: 'Sustancia azucarada excretada', match: 25 },
      { id: 'fumagina_asociada', label: 'Fumagina negra asociada', description: 'Hollín negro creciendo sobre mielecilla', match: 25 },
      { id: 'debilitamiento_general', label: 'Debilitamiento general de la planta', description: 'Planta pierde vigor progresivamente', match: 15 },
    ],
    riskLevel: 'bajo', priority: 'Prioridad Baja. Control biológico con parasitoides.',
    description: 'Insectos chupadores protegidos por escudo ceroso. Excretan mielecilla que atrae fumagina.',
    immediateAction: 'Identificar si hay enemigos naturales activos antes de intervenir',
    treatment: { regenerativo: { nombre: 'Aceite mineral + liberación de parasitoides', receta: 'Aceite agrícola al 1% + conservación de Coccophagus spp.', dosis: '3 L aceite/ha', frecuencia: 'Cada 15 días si necesario', nota: 'Preservar avispas parasitoides es el mejor control.' }, convencional: { nombre: 'Buprofezin', dosis: '0.5 L/ha', frecuencia: 'Cada 30 días' } },
    prevention: ['Diversidad vegetal para parasitoides', 'No usar insecticidas amplios', 'Control de hormigas'],
    earlyWarnings: ['Brillo anormal en hojas (mielecilla)', 'Hormigas patrullando ramas', 'Pequeños escudos en envés'],
  },
  {
    id: 'gusano_medidor', name: 'Gusano Medidor', scientificName: 'Leucena spp.',
    category: 'plaga', parts: ['hojas'],
    symptoms: [
      { id: 'mordeduras_bordes', label: 'Mordeduras irregulares en bordes', description: 'Hojas con bordes comidos irregularmente', match: 35 },
      { id: 'larvas_verdes', label: 'Larvas verdes que se arquean al caminar', description: 'Orugas que miden al desplazarse', match: 30 },
      { id: 'defoliacion_rapida', label: 'Defoliación rápida en brotes', description: 'Brotes nuevos consumidos rápidamente', match: 20 },
      { id: 'excrementos_hojas', label: 'Excrementos en hojas inferiores', description: 'Pequeñas bolitas oscuras bajo hojas comidas', match: 15 },
    ],
    riskLevel: 'bajo', priority: 'Prioridad Baja. Generalmente controlado por avispas.',
    description: 'Oruga defoliadora que consume hojas jóvenes. Control biológico natural suele ser suficiente.',
    immediateAction: 'Verificar presencia de controladores naturales antes de actuar',
    treatment: { regenerativo: { nombre: 'Bacillus thuringiensis', receta: 'Bt en aspersión foliar dirigida a brotes', dosis: '1-2 kg/ha', frecuencia: 'Cada 10 días si necesario', nota: 'Bt es selectivo y no daña enemigos naturales.' }, convencional: { nombre: 'Clorpirifos foliar', dosis: '1 L/ha', frecuencia: 'Una aplicación' } },
    prevention: ['Diversidad vegetal para parasitoides', 'Monitoreo regular de brotes', 'Preservar avispas y aves'],
    earlyWarnings: ['Hojas nuevas con pequeñas mordeduras', 'Presencia de mariposas nocturnas', 'Brotes consumidos parcialmente'],
  },
  {
    id: 'trips', name: 'Trips del Café', scientificName: 'Diarthrothrips coffeae',
    category: 'plaga', parts: ['hojas', 'fruto'],
    symptoms: [
      { id: 'plateado_hojas', label: 'Aspecto plateado en envés', description: 'Raspaduras que dan brillo metálico', match: 30 },
      { id: 'deformacion_hojas', label: 'Deformación de hojas jóvenes', description: 'Hojas nuevas se enrollan o deforman', match: 25 },
      { id: 'insectos_diminutos', label: 'Insectos alargados diminutos', description: 'Trips visibles con lupa, 1-2mm', match: 25 },
      { id: 'manchas_fruto_trips', label: 'Cicatrices en frutos jóvenes', description: 'Marcas superficiales en cereza', match: 20 },
    ],
    riskLevel: 'bajo', priority: 'Prioridad Baja. Rara vez causa daño económico significativo.',
    description: 'Insectos diminutos que raspan tejido foliar y de frutos.',
    immediateAction: 'Monitorear con trampas azules adhesivas',
    treatment: { regenerativo: { nombre: 'Extracto de ajo + neem', receta: 'Extracto de ajo al 3% + neem al 0.5%', dosis: '3 L/ha mezcla', frecuencia: 'Cada 10 días', nota: 'Buena cobertura del envés de hojas.' }, convencional: { nombre: 'Spinosad', dosis: '200 ml/ha', frecuencia: 'Cada 21 días' } },
    prevention: ['Trampas azules para monitoreo', 'Humedad adecuada', 'Evitar estrés de la planta'],
    earlyWarnings: ['Hojas nuevas con brillo plateado', 'Captura en trampas azules >10/trampa', 'Periodo seco prolongado'],
  },
  {
    id: 'hormiga_arriera', name: 'Hormiga Arriera', scientificName: 'Atta spp.',
    category: 'plaga', parts: ['hojas'],
    symptoms: [
      { id: 'cortes_semicirculares', label: 'Cortes semicirculares en hojas', description: 'Hojas con pedazos cortados limpiamente', match: 40 },
      { id: 'caminos_hormigas', label: 'Caminos visibles de hormigas', description: 'Senderos limpios donde transitan cargando hojas', match: 25 },
      { id: 'defoliacion_nocturna', label: 'Defoliación repentina nocturna', description: 'Plantas aparecen defoliadas en la mañana', match: 20 },
      { id: 'nidos_tierra', label: 'Montículos de tierra (hormigueros)', description: 'Grandes montículos de tierra suelta', match: 15 },
    ],
    riskLevel: 'alto', priority: 'Prioridad Alta. Pueden defoliar plantas completas en una noche.',
    description: 'Hormigas cortadoras que llevan hojas a sus hongos subterráneos. Defoliadoras agresivas.',
    immediateAction: 'Localizar hormiguero y aplicar cebo granulado en caminos',
    treatment: { regenerativo: { nombre: 'Cebo con Beauveria + barreras', receta: 'Cebos con hongo entomopatógeno en bocas del nido + barrera de cal en base de plantas', dosis: '50 g cebo/boca + anillo de cal', frecuencia: 'Cada 15 días hasta controlar', nota: 'La fumigación del nido contamina suelo y agua. Evitar.' }, convencional: { nombre: 'Fipronil cebo granulado', dosis: '10 g/m² de hormiguero', frecuencia: 'Cada 30 días si persiste' } },
    prevention: ['Monitoreo de nuevos hormigueros', 'Barreras físicas en plantas jóvenes', 'No dejar el terreno limpio sin cobertura'],
    earlyWarnings: ['Caminos de hormigas apareciendo', 'Cortes limpios en hojas bajeras', 'Nuevos montículos de tierra'],
  },
  // ═══ DEFICIENCIAS NUTRICIONALES (8) ═══
  {
    id: 'def_nitrogeno', name: 'Deficiencia de Nitrógeno (N)', scientificName: 'Carencia mineral',
    category: 'deficiencia', parts: ['hojas'],
    symptoms: [
      { id: 'clorosis_uniforme', label: 'Amarillamiento uniforme de hojas viejas', description: 'Clorosis pareja comenzando desde abajo', match: 35 },
      { id: 'hojas_pequenas', label: 'Hojas más pequeñas de lo normal', description: 'Láminas foliares reducidas', match: 25 },
      { id: 'crecimiento_lento', label: 'Crecimiento lento generalizado', description: 'Entrenudos cortos, poca producción de brotes', match: 25 },
      { id: 'caida_prematura_n', label: 'Caída prematura de hojas viejas', description: 'Hojas bajeras amarillas que caen', match: 15 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Corregir con fertilización nitrogenada.',
    description: 'El nitrógeno es el nutriente que más limita la producción. Su deficiencia reduce crecimiento y cosecha.',
    immediateAction: 'Aplicación de fertilizante nitrogenado (urea o sulfato de amonio)',
    treatment: { regenerativo: { nombre: 'Compost + leguminosas', receta: 'Incorporar 5 ton/ha compost maduro + siembra de leguminosas como cobertura', dosis: '5 ton/ha compost + 50 g urea/planta emergencia', frecuencia: 'Compost 2 veces/año', nota: 'A largo plazo, las leguminosas fijan N atmosférico.' }, convencional: { nombre: 'Fórmula 18-5-15-6-2(MgO)-0.3(B)', dosis: '200-250 g/planta/año dividido en 3', frecuencia: '3 aplicaciones/año' } },
    prevention: ['Plan de fertilización basado en análisis de suelo', 'Incorporar materia orgánica', 'Coberturas con leguminosas'],
    earlyWarnings: ['Verde pálido generalizado', 'Hojas viejas amarilleando antes que las nuevas', 'Crecimiento inferior al esperado'],
  },
  {
    id: 'def_fosforo', name: 'Deficiencia de Fósforo (P)', scientificName: 'Carencia mineral',
    category: 'deficiencia', parts: ['hojas'],
    symptoms: [
      { id: 'purpura_hojas', label: 'Coloración púrpura/rojiza en hojas', description: 'Tonos morados especialmente en envés', match: 35 },
      { id: 'raices_pobres', label: 'Sistema radical poco desarrollado', description: 'Raíces escasas y delgadas', match: 25 },
      { id: 'floracion_pobre', label: 'Floración pobre', description: 'Pocas flores o aborto floral', match: 20 },
      { id: 'madurez_tardía', label: 'Maduración retardada de frutos', description: 'Frutos tardan más en madurar', match: 20 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Corregir con roca fosfórica o DAP.',
    description: 'El fósforo es esencial para raíces, floración y fructificación.',
    immediateAction: 'Aplicar fuente de fósforo al suelo (DAP o roca fosfórica)',
    treatment: { regenerativo: { nombre: 'Roca fosfórica + micorrizas', receta: 'Aplicar roca fosfórica molida + inocular con micorrizas', dosis: '200 g roca/planta + 20 g micorriza', frecuencia: 'Una vez al año', nota: 'Las micorrizas mejoran la absorción de P hasta 5x.' }, convencional: { nombre: 'DAP (18-46-0)', dosis: '50-80 g/planta', frecuencia: '2 aplicaciones/año' } },
    prevention: ['Mantener pH del suelo 5.0-5.5', 'Inocular con micorrizas', 'Análisis de suelo regular'],
    earlyWarnings: ['Tonos púrpura en hojas viejas', 'Poca floración vs plantas vecinas', 'Raíces superficiales escasas'],
  },
  {
    id: 'def_potasio', name: 'Deficiencia de Potasio (K)', scientificName: 'Carencia mineral',
    category: 'deficiencia', parts: ['hojas', 'fruto'],
    symptoms: [
      { id: 'quemadura_bordes_k', label: 'Quemadura de bordes de hojas', description: 'Necrosis marginal color café en hojas maduras', match: 35 },
      { id: 'frutos_pequenos', label: 'Frutos pequeños y livianos', description: 'Cerezas de menor tamaño y peso', match: 25 },
      { id: 'susceptibilidad', label: 'Mayor susceptibilidad a enfermedades', description: 'Plantas enferman con más facilidad', match: 20 },
      { id: 'entrenudos_cortos', label: 'Entrenudos cortos', description: 'Crecimiento compacto anormal', match: 20 },
    ],
    riskLevel: 'alto', priority: 'Prioridad Alta. K es crítico para calidad de taza y resistencia.',
    description: 'El potasio regula agua, resistencia a enfermedades y calidad del grano.',
    immediateAction: 'Aplicar KCl o K₂SO₄ al suelo según análisis',
    treatment: { regenerativo: { nombre: 'Ceniza + compost rico en K', receta: 'Ceniza de madera (sin plásticos) + banano picado como mulch', dosis: '200 g ceniza/planta + 5 kg banano', frecuencia: 'Cada 3 meses', nota: 'Ceniza también aporta Ca y microelementos.' }, convencional: { nombre: 'KCl (Muriato de potasio)', dosis: '80-100 g/planta', frecuencia: '3 aplicaciones/año' } },
    prevention: ['Fertilización con fórmula alta en K', 'No quemar residuos de cosecha', 'Análisis de suelo anual'],
    earlyWarnings: ['Bordes de hojas maduras empezando a secar', 'Frutos más pequeños que lo normal', 'Plantas más afectadas por roya'],
  },
  {
    id: 'def_calcio', name: 'Deficiencia de Calcio (Ca)', scientificName: 'Carencia mineral',
    category: 'deficiencia', parts: ['hojas', 'fruto'],
    symptoms: [
      { id: 'deformacion_hojas_nuevas', label: 'Deformación de hojas nuevas', description: 'Hojas jóvenes se enrollan o deforman', match: 30 },
      { id: 'muerte_meristemos', label: 'Muerte de puntos de crecimiento', description: 'Brotes apicales mueren', match: 30 },
      { id: 'frutos_rajados', label: 'Frutos rajados o deformes', description: 'Cerezas con grietas', match: 20 },
      { id: 'ph_bajo', label: 'Suelo con pH <4.5', description: 'Suelo muy ácido', match: 20 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Corregir pH con encalado.',
    description: 'El calcio es esencial para paredes celulares y crecimiento de meristemos.',
    immediateAction: 'Aplicar cal dolomítica según análisis de suelo',
    treatment: { regenerativo: { nombre: 'Cal dolomítica + yeso', receta: 'Encalado con dolomita + yeso agrícola para perfil profundo', dosis: '1-2 ton/ha dolomita + 500 kg/ha yeso', frecuencia: 'Cada 2-3 años según pH', nota: 'La dolomita también aporta Mg. El yeso ayuda en profundidad.' }, convencional: { nombre: 'Nitrato de calcio foliar', dosis: '3-5 kg/ha en 200L agua', frecuencia: 'Cada 15 días en floracion' } },
    prevention: ['Encalado preventivo según pH', 'Análisis de suelo cada 2 años', 'No sobreexplotar suelos ácidos'],
    earlyWarnings: ['Hojas nuevas deformes o pequeñas', 'Puntas de ramas que no crecen', 'pH del suelo descendiendo'],
  },
  {
    id: 'def_magnesio', name: 'Deficiencia de Magnesio (Mg)', scientificName: 'Carencia mineral',
    category: 'deficiencia', parts: ['hojas'],
    symptoms: [
      { id: 'clorosis_intervenal', label: 'Clorosis intervenal en hojas viejas', description: 'Amarillamiento entre nervaduras, venas verdes', match: 40 },
      { id: 'patron_espina_pescado', label: 'Patrón de espina de pescado', description: 'Clorosis simétrica siguiendo las nervaduras', match: 25 },
      { id: 'necrosis_posterior', label: 'Necrosis posterior en zonas cloróticas', description: 'Tejido amarillo se vuelve café y muere', match: 20 },
      { id: 'produccion_alta', label: 'Plantas con alta carga productiva', description: 'Mayor extracción por muchos frutos', match: 15 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Muy común en café con alta producción.',
    description: 'El magnesio es el centro de la clorofila. Su deficiencia es muy visible y frecuente.',
    immediateAction: 'Aplicación foliar de sulfato de magnesio (Epsom)',
    treatment: { regenerativo: { nombre: 'Cal dolomítica + sulfato Mg foliar', receta: 'Dolomita al suelo + aspersión de MgSO₄ foliar para respuesta rápida', dosis: '1 ton/ha dolomita + 3 kg MgSO₄/100L foliar', frecuencia: 'Foliar cada 15 días × 3; suelo anual', nota: 'La dolomita corrige Mg y Ca a largo plazo.' }, convencional: { nombre: 'Kieserita (MgSO₄)', dosis: '100 g/planta', frecuencia: '2 aplicaciones/año' } },
    prevention: ['Usar dolomita en vez de cal calcítica', 'Fórmulas con Mg incluido', 'No exceder potasio (antagonismo K-Mg)'],
    earlyWarnings: ['Hojas viejas con venas verdes y lámina pálida', 'Plantas con mucha carga de frutos', 'Suelos arenosos o muy lavados'],
  },
  {
    id: 'def_hierro', name: 'Deficiencia de Hierro (Fe)', scientificName: 'Carencia mineral',
    category: 'deficiencia', parts: ['hojas'],
    symptoms: [
      { id: 'clorosis_hojas_nuevas', label: 'Clorosis en hojas NUEVAS (jóvenes)', description: 'Amarillamiento de hojas apicales, venas verdes', match: 40 },
      { id: 'blanqueamiento', label: 'Blanqueamiento severo', description: 'Hojas casi blancas en casos severos', match: 25 },
      { id: 'venas_verdes_fe', label: 'Nervaduras se mantienen verdes', description: 'Contraste marcado vena verde / lámina amarilla', match: 25 },
      { id: 'ph_alto_fe', label: 'Suelo con pH >6.5', description: 'Hierro se inmoviliza en pH alto', match: 10 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Verificar pH del suelo.',
    description: 'El hierro es inmóvil: la deficiencia aparece en hojas jóvenes. Común en pH alto.',
    immediateAction: 'Aplicación foliar de quelato de hierro',
    treatment: { regenerativo: { nombre: 'Quelato Fe foliar + corrección pH', receta: 'Fe-EDDHA foliar + acidificar suelo si pH >6', dosis: '2 g Fe-EDDHA/L foliar', frecuencia: 'Cada 15 días × 4', nota: 'Si pH es la causa, acidificar con azufre elemental.' }, convencional: { nombre: 'Sulfato ferroso', dosis: '3-5 g/L foliar', frecuencia: 'Cada 15 días' } },
    prevention: ['Mantener pH adecuado 5.0-5.5', 'No encalar en exceso', 'Materia orgánica que aporte quelatos naturales'],
    earlyWarnings: ['Hojas nuevas más pálidas que las viejas', 'Brotes apicales amarillentos', 'pH del suelo elevándose'],
  },
  {
    id: 'def_boro', name: 'Deficiencia de Boro (B)', scientificName: 'Carencia mineral',
    category: 'deficiencia', parts: ['hojas', 'fruto'],
    symptoms: [
      { id: 'hojas_gruesas_deformes', label: 'Hojas gruesas y deformes', description: 'Láminas engrosadas, coriáceas, rugosas', match: 30 },
      { id: 'muerte_apical_b', label: 'Muerte de yemas apicales', description: 'Puntos de crecimiento mueren', match: 25 },
      { id: 'entrenudos_muy_cortos', label: 'Entrenudos extremadamente cortos', description: 'Rosetas de hojas apretadas', match: 25 },
      { id: 'frutos_deformes_b', label: 'Frutos deformes o vacíos', description: 'Cerezas mal formadas, vanas', match: 20 },
    ],
    riskLevel: 'alto', priority: 'Prioridad Alta. Afecta floración y cuajado directamente.',
    description: 'El boro es crucial para floración, cuajado y transporte de azúcares. Muy sensible.',
    immediateAction: 'Aplicación foliar de Solubor o ácido bórico',
    treatment: { regenerativo: { nombre: 'Ácido bórico foliar + compost', receta: 'Ácido bórico al 0.3% foliar + compost rico en microelementos', dosis: '3 g ácido bórico/L agua', frecuencia: 'Cada 30 días × 3, antes de floración', nota: 'Cuidado: el rango tóxico de B es estrecho. No exceder.' }, convencional: { nombre: 'Solubor', dosis: '1-2 kg/ha', frecuencia: '2-3 aplicaciones/año' } },
    prevention: ['Incluir B en plan de fertilización', 'Análisis foliar anual', 'Materia orgánica que libera B gradualmente'],
    earlyWarnings: ['Hojas nuevas más gruesas de lo normal', 'Yemas que no brotan', 'Floración escasa o desigual'],
  },
  {
    id: 'def_zinc', name: 'Deficiencia de Zinc (Zn)', scientificName: 'Carencia mineral',
    category: 'deficiencia', parts: ['hojas'],
    symptoms: [
      { id: 'hojas_lanceoladas', label: 'Hojas estrechas y lanceoladas', description: 'Hojas nuevas más angostas y alargadas', match: 30 },
      { id: 'moteado_clorotico', label: 'Moteado clorótico', description: 'Manchitas amarillas irregulares en hojas', match: 25 },
      { id: 'rosetas_zn', label: 'Rosetas de hojas pequeñas', description: 'Agrupamiento de hojas enanas en puntas', match: 25 },
      { id: 'internudos_cortos_zn', label: 'Entrenudos muy cortos', description: 'Crecimiento comprimido en brotes', match: 20 },
    ],
    riskLevel: 'medio', priority: 'Prioridad Media. Común en suelos alcalinos o sobre-encalados.',
    description: 'El zinc participa en síntesis de auxinas. Su falta causa enanismo y hojas deformes.',
    immediateAction: 'Aspersión foliar de sulfato de zinc',
    treatment: { regenerativo: { nombre: 'ZnSO₄ foliar + materia orgánica', receta: 'Sulfato de zinc al 0.5% foliar + incorporar compost', dosis: '5 g ZnSO₄/L agua', frecuencia: 'Cada 20 días × 3', nota: 'No mezclar con fosfatos (precipita). Aplicar por separado.' }, convencional: { nombre: 'Quelato de Zn (Zn-EDTA)', dosis: '2-3 L/ha', frecuencia: 'Cada 30 días' } },
    prevention: ['No encalar en exceso (pH >6 reduce Zn)', 'Incluir Zn en plan de fertilización', 'Materia orgánica como fuente gradual'],
    earlyWarnings: ['Hojas nuevas más estrechas', 'Rosetas apicales comprimidas', 'pH del suelo >6.0 post-encalado'],
  },
];

const riskConfig = {
  critico: { label: 'Severidad CRÍTICA', badge: 'bg-destructive text-destructive-foreground', card: 'border-destructive/50 bg-destructive/5', icon: 'text-destructive' },
  alto: { label: 'Severidad ALTA', badge: 'bg-destructive/80 text-destructive-foreground', card: 'border-destructive/30 bg-destructive/5', icon: 'text-destructive' },
  medio: { label: 'Severidad MEDIA', badge: 'bg-accent text-accent-foreground', card: 'border-accent/30 bg-accent/5', icon: 'text-accent' },
  bajo: { label: 'Severidad BAJA', badge: 'bg-primary text-primary-foreground', card: 'border-primary/30 bg-primary/5', icon: 'text-primary' },
};

const categoryOptions = [
  { id: 'enfermedad', label: 'Enfermedad', desc: 'Manchas, hongos, bacterias, virus', icon: Microscope, color: 'bg-purple-500/10 border-purple-500/30' },
  { id: 'plaga', label: 'Plaga', desc: 'Insectos, ácaros, daños físicos', icon: Bug, color: 'bg-orange-500/10 border-orange-500/30' },
  { id: 'deficiencia', label: 'Deficiencia Nutricional', desc: 'Amarillamiento, deformaciones, necrosis', icon: FlaskConical, color: 'bg-yellow-500/10 border-yellow-500/30' },
];

const bodyParts = [
  { id: 'hojas', label: 'Hojas', icon: Leaf, desc: 'Manchas, decoloración, caída' },
  { id: 'fruto', label: 'Fruto', icon: CircleDot, desc: 'Perforaciones, manchas, caída' },
  { id: 'tallo', label: 'Tallo / Raíz', icon: TreePine, desc: 'Necrosis, micelio, muerte' },
];

type SymptomAppearance = 'manchas' | 'polvillo' | 'quemadura' | null;
const appearanceOptions = [
  { id: 'manchas', label: 'Manchas circulares o irregulares', desc: 'Manchas bien definidas de cualquier color', icon: CircleDot },
  { id: 'polvillo', label: 'Polvillo, moho o sustancia sobre la superficie', desc: 'Polvo, capa o sustancia visible', icon: Sprout },
  { id: 'quemadura', label: 'Quemadura o secado desde los bordes', desc: 'Tejido seco que avanza hacia el centro', icon: AlertTriangle },
];

const historial = [
  { fecha: '2026-02-20', tipo: 'Broca detectada', parcela: 'El Mirador', severidad: 'critico' as const, estado: 'tratamiento' },
  { fecha: '2026-02-15', tipo: 'Roya leve', parcela: 'La Esperanza', severidad: 'medio' as const, estado: 'monitoreo' },
  { fecha: '2026-02-10', tipo: 'Ojo de gallo', parcela: 'Cerro Verde', severidad: 'bajo' as const, estado: 'resuelto' },
  { fecha: '2026-01-28', tipo: 'Antracnosis', parcela: 'El Mirador', severidad: 'medio' as const, estado: 'resuelto' },
];

const steps = ['Triage', 'Análisis', 'Resultado', 'Acción'];

export default function SanidadHub() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAppearance, setSelectedAppearance] = useState<SymptomAppearance>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnosisResult, setDiagnosisResult] = useState<Disease | null>(null);
  const [treatmentTab, setTreatmentTab] = useState<'regenerativo' | 'convencional'>('regenerativo');
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [showSospechaForm, setShowSospechaForm] = useState(false);
  const [sospechaDesc, setSospechaDesc] = useState('');
  const [sospechaParcela, setSospechaParcela] = useState('El Mirador');
  const [selectedHistorial, setSelectedHistorial] = useState<typeof historial[0] | null>(null);

  const relevantDiseases = diseases.filter(d =>
    (!selectedPart || d.parts.includes(selectedPart)) &&
    (!selectedCategory || d.category === selectedCategory)
  );
  const allSymptoms = relevantDiseases.flatMap(d => d.symptoms);
  const uniqueSymptoms = allSymptoms.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);

  const toggleSymptom = (id: string) => setSelectedSymptoms(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const runDiagnosis = () => {
    const scored = relevantDiseases.map(d => {
      const totalMatch = d.symptoms.filter(s => selectedSymptoms.includes(s.id)).reduce((sum, s) => sum + s.match, 0);
      return { ...d, confidence: Math.min(totalMatch, 95) };
    }).sort((a, b) => b.confidence - a.confidence);
    setDiagnosisResult(scored[0] ? { ...scored[0] } : null);
    setCurrentStep(2);
  };

  const resetWizard = () => {
    setCurrentStep(0); setSelectedPart(null); setSelectedCategory(null);
    setSelectedAppearance(null); setSelectedSymptoms([]); setDiagnosisResult(null);
    setShowTreatmentDialog(false); setResolved(false);
  };

  const confidence = diagnosisResult ? Math.min(
    diagnosisResult.symptoms.filter(s => selectedSymptoms.includes(s.id)).reduce((sum, s) => sum + s.match, 0), 95
  ) : 0;

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
          {/* Header */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Nova Guard</h2>
                  <p className="text-sm text-muted-foreground">Diagnóstico Inteligente de Sanidad Vegetal</p>
                </div>
              </div>
              <div className="flex items-center gap-1 max-w-lg mx-auto">
                {steps.map((step, i) => (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`h-2 w-full rounded-full transition-colors ${i <= currentStep ? 'bg-primary' : 'bg-muted'}`} />
                    <span className={`text-[10px] ${i <= currentStep ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── STEP 0: TRIAGE ── */}
          {currentStep === 0 && (
            <>
              {/* Quick report */}
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center"><Eye className="h-5 w-5 text-accent" /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">¿Viste algo raro?</p>
                        <p className="text-xs text-muted-foreground">Reportar sospecha o indicio sin diagnóstico completo</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowSospechaForm(!showSospechaForm)}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {showSospechaForm && (
                    <div className="mt-4 space-y-3 border-t border-accent/20 pt-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Parcela</Label>
                        <Select value={sospechaParcela} onValueChange={setSospechaParcela}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="El Mirador">El Mirador</SelectItem>
                            <SelectItem value="La Esperanza">La Esperanza</SelectItem>
                            <SelectItem value="Cerro Verde">Cerro Verde</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">¿Qué observaste?</Label>
                        <textarea
                          value={sospechaDesc}
                          onChange={e => setSospechaDesc(e.target.value)}
                          placeholder="Describe lo que viste: color, ubicación en la planta, cantidad de plantas afectadas..."
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                        />
                      </div>
                      <Button size="sm" disabled={!sospechaDesc.trim()} onClick={() => {
                        toast.success(`Sospecha en "${sospechaParcela}" reportada a tu técnico asignado`);
                        setSospechaDesc('');
                        setShowSospechaForm(false);
                      }}>
                        <Send className="h-3.5 w-3.5 mr-1" /> Enviar reporte a técnico
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-foreground">¿Qué problema detectas hoy?</h3>
                <p className="text-sm text-muted-foreground">Selecciona el área donde observas síntomas</p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                {bodyParts.map(part => (
                  <button key={part.id} onClick={() => { setSelectedPart(part.id); setSelectedSymptoms([]); setSelectedCategory(null); setSelectedAppearance(null); }}
                    className={`p-5 rounded-xl border-2 transition-all hover:scale-[1.03] ${selectedPart === part.id ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-card hover:border-primary/50'}`}>
                    <div className="flex flex-col items-center gap-2">
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center ${selectedPart === part.id ? 'bg-primary/20' : 'bg-muted'}`}>
                        <part.icon className={`h-7 w-7 ${selectedPart === part.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{part.label}</span>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">{part.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedPart && (
                <div className="text-center">
                  <Button size="lg" onClick={() => setCurrentStep(1)}>
                    Continuar <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ── STEP 1: ANALYSIS (multi-sub-step) ── */}
          {currentStep === 1 && (
            <>
              {/* Sub-step: Problem type */}
              {!selectedCategory && (
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-foreground">¿Qué tipo de problema sospechas?</h3>
                      <p className="text-sm text-muted-foreground">Esto nos ayuda a orientar mejor el diagnóstico</p>
                    </div>
                    <div className="space-y-3 max-w-lg mx-auto">
                      {categoryOptions.map(cat => (
                        <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:scale-[1.01] ${cat.color} hover:shadow-md`}>
                          <div className="h-12 w-12 rounded-full bg-card flex items-center justify-center shrink-0">
                            <cat.icon className="h-6 w-6 text-foreground" />
                          </div>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-foreground">{cat.label}</p>
                            <p className="text-xs text-muted-foreground">{cat.desc}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                    <div className="text-center">
                      <Button variant="outline" onClick={() => { setCurrentStep(0); setSelectedCategory(null); }}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sub-step: Appearance (for hojas) */}
              {selectedCategory && selectedPart === 'hojas' && !selectedAppearance && (
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-foreground">¿Cuál es la apariencia predominante de la lesión en la hoja?</h3>
                      <p className="text-sm text-muted-foreground">Observe cuidadosamente la hoja afectada</p>
                    </div>
                    <div className="space-y-3 max-w-lg mx-auto">
                      {appearanceOptions.map(opt => (
                        <button key={opt.id} onClick={() => setSelectedAppearance(opt.id as SymptomAppearance)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all">
                          <opt.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="text-left flex-1">
                            <p className="font-semibold text-foreground">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sub-step: Symptom selection */}
              {selectedCategory && (selectedPart !== 'hojas' || selectedAppearance) && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (selectedPart === 'hojas') setSelectedAppearance(null);
                        else setSelectedCategory(null);
                      }}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                      </Button>
                    </div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-accent" />
                      ¿Qué síntomas observas?
                    </h3>
                    <p className="text-xs text-muted-foreground">Selecciona todos los que apliquen — más síntomas = diagnóstico más preciso</p>

                    <div className="space-y-2">
                      {uniqueSymptoms.map(s => (
                        <button key={s.id} onClick={() => toggleSymptom(s.id)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${selectedSymptoms.includes(s.id)
                            ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedSymptoms.includes(s.id) ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                              {selectedSymptoms.includes(s.id) && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">{s.label}</span>
                              <p className="text-xs text-muted-foreground">{s.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <Button disabled={selectedSymptoms.length === 0} onClick={runDiagnosis} size="lg">
                        Analizar síntomas <Zap className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ── STEP 2: RESULT ── */}
          {currentStep === 2 && diagnosisResult && (
            <>
              <Card className={`border-2 ${riskConfig[diagnosisResult.riskLevel].card}`}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={riskConfig[diagnosisResult.riskLevel].badge}>{riskConfig[diagnosisResult.riskLevel].label}</Badge>
                      {diagnosisResult.riskLevel === 'critico' && <Badge variant="destructive">ALERTA</Badge>}
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-foreground">{confidence}%</span>
                      <span className="text-sm text-muted-foreground ml-1">Confianza</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs tracking-widest text-muted-foreground uppercase">Diagnóstico Probable</p>
                    <h3 className="text-2xl font-bold text-foreground">{diagnosisResult.name}</h3>
                    <p className="text-sm italic text-muted-foreground">{diagnosisResult.scientificName}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted border border-border">
                    <p className="text-sm text-muted-foreground">{diagnosisResult.priority}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1" size="lg" onClick={() => { setShowTreatmentDialog(true); setCurrentStep(3); }}>
                  <Sprout className="h-4 w-4 mr-1" /> Guardar y Ver Plan de Tratamiento
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setCurrentStep(1)}><ArrowLeft className="h-4 w-4 mr-1" /> Mi Historial</Button>
                <Button variant="outline" onClick={() => toast.info('Función de tienda próximamente')}>Tienda</Button>
              </div>
            </>
          )}

          {/* ── STEP 3: ACTION PLAN (Treatment Dialog) ── */}
          {currentStep === 3 && diagnosisResult && (
            <Dialog open={showTreatmentDialog} onOpenChange={(o) => { if (!o) { setShowTreatmentDialog(false); } }}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-primary" /> Tu Plan de Tratamiento
                  </DialogTitle>
                  <p className="text-sm italic text-muted-foreground">{diagnosisResult.name} ({diagnosisResult.scientificName})</p>
                </DialogHeader>

                <Accordion type="multiple" defaultValue={['accion', 'tratamiento', 'prevencion', 'indicios']} className="space-y-3">
                  {/* Immediate Action */}
                  <AccordionItem value="accion" className="border border-accent/30 rounded-lg bg-accent/5 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-accent" />
                        <span className="font-semibold text-accent">Acción Inmediata</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">{diagnosisResult.immediateAction}</p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Treatment */}
                  <AccordionItem value="tratamiento" className="border border-border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">Tratamiento</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant={treatmentTab === 'regenerativo' ? 'default' : 'outline'}
                          onClick={() => setTreatmentTab('regenerativo')}>
                          <Sprout className="h-3.5 w-3.5 mr-1" /> Regenerativo
                        </Button>
                        <Button size="sm" variant={treatmentTab === 'convencional' ? 'default' : 'outline'}
                          onClick={() => setTreatmentTab('convencional')}>
                          <FlaskConical className="h-3.5 w-3.5 mr-1" /> Convencional
                        </Button>
                      </div>
                      {treatmentTab === 'regenerativo' ? (
                        <div className="space-y-2">
                          <p className="font-semibold text-foreground">{diagnosisResult.treatment.regenerativo.nombre}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Receta:</span> {diagnosisResult.treatment.regenerativo.receta}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Dosis:</span> {diagnosisResult.treatment.regenerativo.dosis}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Frecuencia:</span> {diagnosisResult.treatment.regenerativo.frecuencia}</p>
                          <p className="text-xs text-primary italic">💡 {diagnosisResult.treatment.regenerativo.nota}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-semibold text-foreground">{diagnosisResult.treatment.convencional.nombre}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Dosis:</span> {diagnosisResult.treatment.convencional.dosis}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Frecuencia:</span> {diagnosisResult.treatment.convencional.frecuencia}</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Prevention */}
                  <AccordionItem value="prevencion" className="border border-border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">Prevención</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {diagnosisResult.prevention.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />{p}
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Early Warnings */}
                  <AccordionItem value="indicios" className="border border-primary/20 rounded-lg bg-primary/5 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">Indicios Tempranos</span>
                        <span className="text-xs text-muted-foreground">(qué buscar mañana)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {diagnosisResult.earlyWarnings.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-accent shrink-0" />{w}
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Mark as resolved */}
                <Button className="w-full mt-4" variant={resolved ? 'outline' : 'default'}
                  onClick={() => { setResolved(true); toast.success('Diagnóstico marcado como resuelto. Se notificará a la cooperativa.'); setShowTreatmentDialog(false); resetWizard(); }}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Marcar como Resuelto
                </Button>
                <p className="text-xs text-muted-foreground text-center">Esto notificará a la cooperativa que el foco ha sido controlado</p>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* ── HISTORIAL ── */}
        <TabsContent value="historial" className="space-y-4 mt-4">
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
                <button key={i} onClick={() => setSelectedHistorial(h)}
                  className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.tipo} — {h.parcela}</p>
                    <p className="text-xs text-muted-foreground">{h.fecha}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={riskConfig[h.severidad]?.badge}>{h.severidad}</Badge>
                    <Badge variant={h.estado === 'resuelto' ? 'default' : 'secondary'}>{h.estado}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Historial Detail Dialog */}
          <Dialog open={!!selectedHistorial} onOpenChange={() => setSelectedHistorial(null)}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              {selectedHistorial && (() => {
                const matchedDisease = diseases.find(d => d.name.toLowerCase().includes(selectedHistorial.tipo.toLowerCase().split(' ')[0]));
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Bug className="h-5 w-5 text-accent" />
                        {selectedHistorial.tipo}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground">Parcela: {selectedHistorial.parcela} • {selectedHistorial.fecha}</p>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className={riskConfig[selectedHistorial.severidad]?.badge}>{riskConfig[selectedHistorial.severidad]?.label}</Badge>
                        <Badge variant={selectedHistorial.estado === 'resuelto' ? 'default' : 'secondary'}>{selectedHistorial.estado}</Badge>
                      </div>

                      {matchedDisease && (
                        <>
                          <div className="p-3 rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Nombre científico</p>
                            <p className="text-sm italic text-foreground">{matchedDisease.scientificName}</p>
                            <p className="text-sm text-muted-foreground mt-2">{matchedDisease.description}</p>
                          </div>

                          <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="pt-3 pb-3">
                              <p className="text-xs font-semibold text-primary mb-1">Interpretación Nova Silva</p>
                              <p className="text-sm text-muted-foreground">
                                Se registró <span className="font-bold text-foreground">{matchedDisease.name}</span> en la parcela {selectedHistorial.parcela} con severidad {selectedHistorial.severidad}.
                                {selectedHistorial.estado === 'resuelto'
                                  ? ' El foco fue controlado exitosamente.'
                                  : selectedHistorial.estado === 'tratamiento'
                                    ? ` Se recomienda aplicar ${matchedDisease.treatment.regenerativo.nombre} (${matchedDisease.treatment.regenerativo.dosis}) cada ${matchedDisease.treatment.regenerativo.frecuencia}.`
                                    : ' Se recomienda mantener monitoreo quincenal y aplicar tratamiento preventivo.'
                                }
                              </p>
                            </CardContent>
                          </Card>

                          <div>
                            <p className="text-sm font-semibold text-foreground mb-2">Tratamiento recomendado</p>
                            <div className="p-3 rounded-lg border border-border space-y-1">
                              <p className="text-sm font-medium text-foreground">{matchedDisease.treatment.regenerativo.nombre}</p>
                              <p className="text-xs text-muted-foreground">Dosis: {matchedDisease.treatment.regenerativo.dosis}</p>
                              <p className="text-xs text-muted-foreground">Frecuencia: {matchedDisease.treatment.regenerativo.frecuencia}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-foreground mb-2">Indicios tempranos a vigilar</p>
                            <div className="space-y-1">
                              {matchedDisease.earlyWarnings.map((w, wi) => (
                                <div key={wi} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <AlertTriangle className="h-3 w-3 text-accent shrink-0" />{w}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex flex-col gap-2">
                        <Button onClick={() => { toast.success('Datos de diagnóstico enviados a servicio técnico'); setSelectedHistorial(null); }}>
                          <Send className="h-4 w-4 mr-1" /> Enviar a servicio técnico
                        </Button>
                        <Button variant="outline" onClick={() => {
                          const data = `Diagnóstico: ${selectedHistorial.tipo}\nParcela: ${selectedHistorial.parcela}\nFecha: ${selectedHistorial.fecha}\nSeveridad: ${selectedHistorial.severidad}\nEstado: ${selectedHistorial.estado}${matchedDisease ? `\nCientífico: ${matchedDisease.scientificName}\nTratamiento: ${matchedDisease.treatment.regenerativo.nombre}` : ''}`;
                          navigator.clipboard.writeText(data);
                          toast.success('Datos copiados al portapapeles');
                        }}>
                          <FileText className="h-4 w-4 mr-1" /> Exportar datos
                        </Button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
