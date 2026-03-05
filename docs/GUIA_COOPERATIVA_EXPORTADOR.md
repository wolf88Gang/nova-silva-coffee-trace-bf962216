# Guía Completa: Dinámica Cooperativa ↔ Exportador en Nova Silva
> **Propósito**: Documentar exhaustivamente el flujo comercial entre cooperativas y exportadores, incluyendo vinculación, subastas, ofertas, análisis de mercado e interpretación Nova Silva.
---
## 1. ARQUITECTURA DE LA RELACIÓN
### 1.1 Tabla Pivot: `cooperativa_exportadores`
La relación se gestiona mediante la tabla `cooperativa_exportadores`:
```sql
-- Columnas clave
id uuid PK
cooperativa_id uuid FK → platform_organizations
exportador_id uuid FK → platform_organizations
estado text ('pendiente' | 'activo' | 'inactivo')
origen_relacion text ('solicitud_exportador' | 'admin' | etc.)
created_at, updated_at timestamps
```
**RLS**: Ambas organizaciones pueden ver relaciones donde son parte. Solo la cooperativa puede aceptar/rechazar.
### 1.2 Tabla de Ofertas: `lotes_ofrecidos_exportadores`
> **⚠️ NOTA**: Esta tabla NO existe aún en el schema actual. Los hooks usan `(supabase as any)` para castear.
```sql
-- Estructura esperada
id uuid PK
lote_comercial_id uuid FK → lotes_comerciales
cooperativa_id uuid (dueña del lote)
exportador_id uuid | null (null = oferta pública)
es_oferta_publica boolean
estado_oferta text ('activo' | 'aceptado' | 'confirmado' | 'rechazado')
fecha_oferta timestamp
precio_ofertado numeric
condiciones_pago text
fecha_entrega_propuesta date
notas text
respuesta_cooperativa text ('pendiente' | 'aceptada' | 'rechazada')
comentario_cooperativa text
fecha_respuesta timestamp
```
---
## 2. FLUJO COMPLETO PASO A PASO
### FASE 1: Vinculación (Descubrimiento)
**Desde Exportador** → `/exportador/proveedores` (CarteraProveedores.tsx)
| Tab | Función | Qué muestra |
|-----|---------|-------------|
| **Cooperativas** | Cooperativas ya vinculadas | Tabla con: Nombre, País/Región, Volumen (kg), Ventana cosecha, % EUDR listo, Riesgo climático, Reclamos |
| **Proveedores externos** | Proveedores sin Nova Silva | CRUD manual de productores/parcelas/docs EUDR |
| **Explorar** | Directorio público | Cooperativas disponibles con botón "Solicitar vinculación" |
**Hooks involucrados**:
- `useCarteraProveedores()` → Datos agregados de cooperativas vinculadas
- `useDirectorioCooperativas()` → Listado público de cooperativas
- `useSolicitarVinculacion()` → Crea registro en `cooperativa_exportadores` con estado='pendiente'
- `useProveedoresExportador()` → Proveedores externos manuales
**Filtros disponibles para el exportador**:
- País / Región
- Riesgo climático (bajo/medio/alto/sin_datos)
- Estado EUDR (≥80%, 50-79%, <50%)
---
**Desde Cooperativa** → `/cooperativa/exportadores` (ExportadoresAsociados.tsx)
| Tab | Función | Qué muestra |
|-----|---------|-------------|
| **Solicitudes** | Pendientes de aprobación | Cards con nombre del exportador, fecha, botones Aceptar/Rechazar |
| **Relaciones** | Exportadores activos/inactivos | Tabla con toggle Activar/Desactivar |
**Hooks involucrados**:
- `useSolicitudesPendientes()` → Query a `cooperativa_exportadores` WHERE estado='pendiente'
- `useRelacionesActivas()` → Query a `cooperativa_exportadores` WHERE estado='activo'
- `useAceptarSolicitud()` → UPDATE estado='activo'
- `useRechazarSolicitud()` → UPDATE estado='inactivo'
- `useToggleRelacion()` → Toggle activo/inactivo
**Resumen visual**: Card header muestra `X solicitudes pendientes · Y relaciones activas · Z inactivas`
---
### FASE 2: Subastas / Ofertas Públicas
**Vista del Exportador** → `/exportador/subastas` o tab "Subastas" en CafeHub (`SubastasDisponibles.tsx`)
Este es el módulo más rico visualmente. **1,467 líneas** de UI.
#### 2.1 Vista principal (Grid de cards)
**KPIs superiores** (4 cards):
1. Ofertas activas (total)
2. Con pujas (lotes que ya tienen ofertas)
3. Sin ofertas aún
4. kg disponibles (suma total)
**Cada Card de Oferta muestra**:
- Código de lote comercial
- Nombre de la cooperativa
- Badge "Pública" + Badge de riesgo (Verde/Ámbar/Rojo)
- Volumen (kg) + Región de origen
- **Mejor oferta actual** (precio en USD, en tiempo real vía realtime)
- Número de ofertas recibidas
- Tiempo desde publicación ("hace 3 días")
- Botón "Ofertar" / "Mejorar" (si ya tiene oferta)
#### 2.2 Detail Sheet (Panel lateral al hacer click en card)
**Estructura en tabs**:
| Tab | Contenido detallado |
|-----|---------------------|
| **Origen** | Terroir completo: País, Región, Municipio, Comunidad, Altitud (min/max/prom), Microclima, Tipo de suelo, Manejo de sombra, Productores, Parcelas, Área, Variedades, Edad plantaciones, Densidad, Rendimiento, Proceso, Beneficio, Cosecha |
| **Calidad** | **Calidad física**: Humedad%, Actividad de agua (Aw), Densidad g/L, Malla, Defectos prim/sec. **Perfil SCA**: Puntaje total (grande), Barras de: Fragancia, Sabor, Acidez, Cuerpo, Balance. Descriptores en badges. Notas de catación en itálica. Perfil de tueste recomendado |
| **EUDR** | Progress bars: % Documentación + % Geolocalización. Grid: Productores, Parcelas, Con coordenadas (X/Y), Con polígono (X/Y), Docs vigentes, Docs pendientes. Riesgo deforestación con badge semáforo. Hash de trazabilidad blockchain. Certificaciones en badges |
| **Mercado** | Precio referencia ICE, Diferencial sugerido, Disponibilidad, Punto entrega, Incoterm, Empaque |
#### 2.3 Interpretación Nova Silva (en Detail Sheet)
**Sección especial dentro del panel de detalle**:
```typescript
// Datos del lote incluyen:
indice_vital: number;          // Ej: 72
nivel_madurez: number;         // 1-4 (Inicial/Básico/Operativo/Avanzado)
riesgo_climatico: 'bajo' | 'medio' | 'alto';
interpretacion_novasilva: string;  // Texto narrativo generado
```
**Ejemplo de interpretación**:
> "Lote con buena trazabilidad y calidad consistente. Productores con prácticas de conservación de suelos establecidas. Riesgo climático moderado por variabilidad en temporada de lluvias. Documentación EUDR al 83% de cumplimiento."
Esta interpretación combina:
- Índice VITAL del productor/cooperativa
- Nivel de madurez organizacional
- Análisis climático de la zona
- Estado de cumplimiento EUDR
- Calidad de taza histórica
#### 2.4 Dialog de Oferta
Al presionar "Ofertar", se abre un Dialog con:
- **Precio ofertado** (USD) — input numérico
- **Condiciones de pago** — texto libre (Ej: "Net 30", "50% anticipado")
- **Fecha de entrega propuesta** — date picker
- **Notas** — textarea
**Hook**: `usePlaceBid()` → INSERT en `lotes_ofrecidos_exportadores`
#### 2.5 Realtime
```typescript
useMejorOfertaRealtime(loteComercialId)
// Suscripción a cambios en lotes_ofrecidos_exportadores
// Actualiza precio en tiempo real sin refresh
```
---
### FASE 3: Ofertas Recibidas (Vista Cooperativa)
**Desde Cooperativa** → `/cooperativa/ofertas-recibidas` (OfertasRecibidas.tsx)
#### 3.1 Tabla de ofertas pendientes
| Columna | Datos |
|---------|-------|
| Lote | Código del lote comercial |
| Exportador | Nombre de la organización |
| Volumen | kg del lote |
| Precio ofertado | USD con ícono verde |
| Fecha oferta | Formato "dd MMM yyyy" |
| Riesgo | Badge semáforo (Bajo/Medio/Alto) |
| Acciones | Botones: Analizar, Aceptar, Rechazar |
#### 3.2 Sheet de Análisis (al presionar "Analizar")
Se abre un panel lateral con:
**Datos de la oferta** (sección gris):
- Exportador, Lote, Volumen, Precio ofertado, Condiciones de pago, Fecha, Notas
**🧠 MarketIntelligenceCard — INTERPRETACIÓN NOVA SILVA**
Este es el componente más sofisticado de inteligencia de mercado (`src/components/cooperativa/MarketIntelligenceCard.tsx`).
**Estructura**:
1. **Comparativo de precios** (grid 3 columnas):
   - Precio Oferta (del exportador)
   - Precio Mercado (NY + Diferencial, calculado)
   - Margen (% diferencia, con ícono trending up/down y badge "Sobre mercado" / "Bajo mercado")
2. **"Interpretación Nova Silva"** — Análisis contextual automático:
   
   El sistema genera texto inteligente basado en:
   ```
   - Si margen < -2% y exportador es VIP → sugiere aceptar por flujo de caja
   - Si margen < -2% y NO es VIP → recomienda negociar
   - Si margen >= 0% → "Excelente oferta, proceder"
   - Si margen entre -2% y 0% → "Aceptable según condiciones"
   ```
   
   **Ejemplo de interpretación generada**:
   > "La oferta actual está 2.2% por debajo del precio de paridad de hoy. Sin embargo, Exportadora del Pacífico ofrece condiciones de pago inmediatas (Net 0), lo que mejora el flujo de caja operativo frente a otros compradores que pagan a 90 días."
3. **Estrategias de respuesta** (3 botones):
   
   | Estrategia | Descripción | Genera |
   |-----------|-------------|--------|
   | **Aceptar** | "Priorizar flujo" | Borrador de carta de aceptación formal |
   | **Contraofertar** | "Negociar precio" | Propuesta con precio sugerido (máx entre oferta+3% y mercado+$2.50) |
   | **Rechazar** | "Buscar mejor" | Carta de rechazo diplomática |
4. **Borrador de respuesta** (editable):
   - Textarea pre-llenado con carta profesional
   - Incluye: datos del lote, precios de mercado, justificación
   - Botón "Copiar Propuesta" (al portapapeles)
   - Botón "Confirmar [Acción]" (ejecuta la mutación)
**Hook de respuesta**: `useResponderOferta()` → UPDATE en `lotes_ofrecidos_exportadores` + INSERT notificación
#### 3.3 Historial de ofertas
Tabla inferior con ofertas ya respondidas:
- Lote, Exportador, Volumen, Precio, Estado (badge), Fecha respuesta
#### 3.4 Sistema de Notificaciones
Cuando la cooperativa responde:
```typescript
// Se inserta notificación para el exportador
{
  usuario_id: exportador_id,
  tipo: 'oferta_aceptada' | 'oferta_rechazada',
  titulo: 'Tu oferta fue aceptada',
  mensaje: 'La cooperativa aceptó tu oferta por el lote SOL-2024-001',
  link_accion: '/exportador/lotes-ofrecidos',
  metadata: { oferta_id, lote_id }
}
```
---
### FASE 4: Ofertas del Exportador (Comerciales)
**Vista del Exportador** → `/exportador/cafe?tab=ofrecidos` o `/exportador/lotes-ofrecidos` (LotesOfrecidos.tsx)
Gestión de ofertas comerciales PROPIAS del exportador (hacia sus clientes compradores):
| Campo | Tipo |
|-------|------|
| Cliente potencial | Texto libre |
| Tipo de café | Texto (SHB, HB, etc.) |
| Volumen (kg) | Numérico |
| Precio base (USD/lb) | Numérico |
| Estado | borrador → enviada → aprobada/rechazada → cerrada |
| Fecha creación | Auto |
**Hooks**: `useOfertasList()`, `useCreateOferta()` → tabla `ofertas_comerciales` (SÍ existe en schema)
---
## 3. CafeHub — Punto de Entrada Unificado
**Ruta**: `/exportador/cafe` (CafeHub.tsx)
Organiza los 3 módulos en tabs:
| Tab | Ícono | Componente lazy | Descripción |
|-----|-------|-----------------|-------------|
| Inventario | Coffee | `Inventario.tsx` | Lotes comerciales propios |
| Ofrecidos | Package | `LotesOfrecidos.tsx` | Ofertas comerciales a clientes |
| Subastas | Gavel | `SubastasDisponibles.tsx` | Participar en ofertas de cooperativas |
URL synced via `useSearchParams` → `?tab=inventario|ofrecidos|subastas`
---
## 4. INVENTARIO DEL EXPORTADOR
**Vista**: `/exportador/cafe?tab=inventario` (Inventario.tsx)
| Columna | Datos |
|---------|-------|
| Código | Código lote comercial |
| Origen | Región, País |
| Volumen | kg |
| Estado | Badge (disponible, etc.) |
**KPIs**: Total de lotes
**⚠️ Banner amarillo**: "Integración con lotes de acopio pendiente" — La tabla `lotes_comerciales_lotes_acopio` no existe aún para vincular lotes de acopio de cooperativas con lotes comerciales del exportador.
**Hook**: `useLotesComerciales()` → tabla `lotes_comerciales`
---
## 5. MAPA DE HOOKS Y ARCHIVOS
### Hooks principales
| Hook | Archivo | Tabla | Estado |
|------|---------|-------|--------|
| `useOfertasPublicasDisponibles` | `useSubastas.ts` | `lotes_ofrecidos_exportadores` | ⚠️ Stub (tabla no existe) |
| `useMejorOfertaRealtime` | `useSubastas.ts` | `lotes_ofrecidos_exportadores` | ⚠️ Stub |
| `usePlaceBid` | `useSubastas.ts` | `lotes_ofrecidos_exportadores` | ⚠️ Stub |
| `useOfertasRecibidas` | `useOfertasRecibidas.ts` | `lotes_ofrecidos_exportadores` | ⚠️ Cast `as any` |
| `useResponderOferta` | `useOfertasRecibidas.ts` | `lotes_ofrecidos_exportadores` | ⚠️ Cast `as any` |
| `useOfertasList` | `useOfertasComerciales.ts` | `ofertas_comerciales` | ✅ Funcional |
| `useCreateOferta` | `useOfertasComerciales.ts` | `ofertas_comerciales` | ✅ Funcional |
| `useSolicitudesPendientes` | `useSolicitudesVinculacion.ts` | `cooperativa_exportadores` | ✅ Funcional |
| `useRelacionesActivas` | `useSolicitudesVinculacion.ts` | `cooperativa_exportadores` | ✅ Funcional |
| `useCarteraProveedores` | `useCarteraProveedores.ts` | Datos agregados | ✅ Funcional |
| `useDirectorioCooperativas` | `useDirectorioCooperativas.ts` | Directorio público | ✅ Funcional |
| `useLotesComerciales` | `useLotesComerciales.ts` | `lotes_comerciales` | ✅ Funcional |
### Componentes principales
| Componente | Archivo | Rol |
|-----------|---------|-----|
| `SubastasDisponibles` | `src/pages/exportador/SubastasDisponibles.tsx` | Vista completa de subastas (1467 líneas) |
| `OfertasRecibidas` | `src/pages/cooperativa/OfertasRecibidas.tsx` | Gestión de ofertas desde coop |
| `MarketIntelligenceCard` | `src/components/cooperativa/MarketIntelligenceCard.tsx` | Análisis de rentabilidad + interpretación Nova Silva |
| `ExportadoresAsociados` | `src/pages/cooperativa/ExportadoresAsociados.tsx` | Gestión de relaciones |
| `CarteraProveedores` | `src/pages/exportador/CarteraProveedores.tsx` | Directorio + cartera de coops |
| `LotesOfrecidos` | `src/pages/exportador/LotesOfrecidos.tsx` | Ofertas comerciales propias |
| `CafeHub` | `src/pages/exportador/CafeHub.tsx` | Hub unificado con 3 tabs |
| `Inventario` | `src/pages/exportador/Inventario.tsx` | Lotes comerciales |
---
## 6. DÓNDE ESTÁ LA INTERPRETACIÓN NOVA SILVA
### 6.1 En Subastas (para el exportador)
**Ubicación**: `SubastasDisponibles.tsx` → Detail Sheet → Sección "Mercado"
**Datos mostrados**:
- `indice_vital` (0-100): Índice de resiliencia del grupo productor
- `nivel_madurez` (1-4): Nivel organizacional
- `riesgo_climatico`: Evaluación climática de la zona
- `interpretacion_novasilva`: Texto narrativo con análisis integral
**Propósito**: Que el exportador evalúe no solo calidad de taza, sino sostenibilidad y riesgo del origen.
### 6.2 En Ofertas Recibidas (para la cooperativa)
**Ubicación**: `OfertasRecibidas.tsx` → Sheet de detalle → `MarketIntelligenceCard`
**Datos mostrados**:
- Comparativo Precio Oferta vs Precio Mercado (NY + diferencial)
- Margen % con trending visual
- **"Interpretación Nova Silva"** — texto contextual que considera:
  - Precio vs mercado
  - Si el exportador es VIP / recurrente
  - Condiciones de pago (Net 0 vs Net 90)
  - Calidad del lote (puntaje SCA)
- Generación automática de borradores de respuesta
### 6.3 En la Cartera de Proveedores (para el exportador)
**Ubicación**: `CarteraProveedores.tsx` → Tab "Cooperativas"
**Datos mostrados por cooperativa**:
- % EUDR listo (con color semáforo)
- Riesgo climático (badge)
- Reclamos totales + alta severidad
- Volumen disponible + ventana de cosecha
---
## 7. TABLAS PENDIENTES DE CREAR
Para que todo funcione end-to-end:
### 7.1 `lotes_ofrecidos_exportadores`
```sql
CREATE TABLE public.lotes_ofrecidos_exportadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_comercial_id uuid REFERENCES lotes_comerciales(id),
  cooperativa_id uuid NOT NULL,
  exportador_id uuid,
  es_oferta_publica boolean DEFAULT false,
  estado_oferta text DEFAULT 'activo',
  fecha_oferta timestamptz DEFAULT now(),
  precio_ofertado numeric,
  condiciones_pago text,
  fecha_entrega_propuesta date,
  notas text,
  respuesta_cooperativa text DEFAULT 'pendiente',
  comentario_cooperativa text,
  fecha_respuesta timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- RLS
ALTER TABLE public.lotes_ofrecidos_exportadores ENABLE ROW LEVEL SECURITY;
-- Cooperativa puede ver ofertas de sus lotes
CREATE POLICY "Coop can view offers"
  ON public.lotes_ofrecidos_exportadores FOR SELECT
  USING (cooperativa_id = get_user_organization_id(auth.uid()) OR is_admin(auth.uid()));
-- Exportador puede ver sus propias ofertas
CREATE POLICY "Exporter can view own offers"
  ON public.lotes_ofrecidos_exportadores FOR SELECT
  USING (exportador_id = auth.uid() OR es_oferta_publica = true OR is_admin(auth.uid()));
-- Exportador puede crear ofertas
CREATE POLICY "Exporter can create offers"
  ON public.lotes_ofrecidos_exportadores FOR INSERT
  WITH CHECK (exportador_id = auth.uid() OR is_admin(auth.uid()));
-- Cooperativa puede actualizar respuesta
CREATE POLICY "Coop can respond"
  ON public.lotes_ofrecidos_exportadores FOR UPDATE
  USING (cooperativa_id = get_user_organization_id(auth.uid()) OR is_admin(auth.uid()));
-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.lotes_ofrecidos_exportadores;
```
### 7.2 `notificaciones` (si no existe)
```sql
CREATE TABLE public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensaje text,
  link_accion text,
  metadata jsonb,
  leida boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```
### 7.3 `lotes_comerciales_lotes_acopio` (para vincular inventarios)
```sql
CREATE TABLE public.lotes_comerciales_lotes_acopio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_comercial_id uuid REFERENCES lotes_comerciales(id),
  lote_acopio_id uuid REFERENCES lotes_acopio(id),
  volumen_asignado numeric,
  created_at timestamptz DEFAULT now()
);
```
---
## 8. DIAGRAMA DE FLUJO COMPLETO
```
┌──────────────────────────────────────────────────────────────┐
│                    EXPORTADOR                                 │
│                                                               │
│  1. Explorar directorio (/exportador/proveedores)            │
│     → Buscar cooperativas por región/EUDR/clima              │
│     → Solicitar vinculación                                   │
│                        ↓                                      │
│  ┌─────────────────────┴───────────────────────┐             │
│  │         COOPERATIVA                          │             │
│  │  2. Recibir solicitud (/coop/exportadores)   │             │
│  │     → Aceptar o rechazar                     │             │
│  │     → Toggle activo/inactivo                 │             │
│  └─────────────────────┬───────────────────────┘             │
│                        ↓                                      │
│  3. Ver ofertas disponibles (/exportador/subastas)           │
│     → Cards con datos de lote + mejor oferta realtime        │
│     → Click → Detail Sheet (Origen/Calidad/EUDR/Mercado)     │
│     → Interpretación Nova Silva del lote                     │
│     → Hacer oferta (precio + condiciones + fecha)            │
│                        ↓                                      │
│  ┌─────────────────────┴───────────────────────┐             │
│  │         COOPERATIVA                          │             │
│  │  4. Revisar ofertas (/coop/ofertas-recibidas)│             │
│  │     → Tabla de ofertas pendientes            │             │
│  │     → Sheet de análisis:                     │             │
│  │       - Datos de la oferta                   │             │
│  │       - MarketIntelligenceCard               │             │
│  │         • Precio vs Mercado (NY+Dif)         │             │
│  │         • Margen % con visual                │             │
│  │         • 🧠 Interpretación Nova Silva       │             │
│  │         • 3 estrategias: Aceptar/Contra/No   │             │
│  │         • Borrador de carta editable         │             │
│  │     → Confirmar respuesta                    │             │
│  └─────────────────────┬───────────────────────┘             │
│                        ↓                                      │
│  5. Recibir notificación de respuesta                        │
│     → Notificación in-app con link                           │
│     → Si aceptada → proceder a contrato                     │
│                        ↓                                      │
│  6. Gestionar oferta comercial (/exportador/cafe?tab=ofrecidos)│
│     → Crear oferta comercial para cliente final              │
│     → Vincular lotes al contrato                             │
└──────────────────────────────────────────────────────────────┘
```
---
## 9. CHECKLIST DE IMPLEMENTACIÓN
### Para habilitar el flujo completo:
- [ ] Crear tabla `lotes_ofrecidos_exportadores` con RLS
- [ ] Crear tabla `notificaciones` con RLS
- [ ] Crear tabla `lotes_comerciales_lotes_acopio`
- [ ] Habilitar realtime en `lotes_ofrecidos_exportadores`
- [ ] Actualizar `useSubastas.ts` — reemplazar stubs por queries reales
- [ ] Conectar `useMejorOfertaRealtime` a canal de Supabase Realtime
- [ ] Alimentar datos reales de mercado (precio NY, diferencial) en `MarketIntelligenceCard`
- [ ] Conectar interpretación Nova Silva con datos reales de VITAL/EUDR
- [ ] Implementar componente de notificaciones in-app
- [ ] Agregar funcionalidad de "Ofrecer lote" desde vista de cooperativa
---
## 10. DATOS DEMO
`SubastasDisponibles.tsx` incluye 4 lotes demo completos con datos exhaustivos:
| Lote | Cooperativa | Región | Volumen | Proceso | SCA | EUDR% | VITAL |
|------|-------------|--------|---------|---------|-----|-------|-------|
| SOL-2024-001 | Café de la Selva | Matagalpa | 1,500 kg | Lavado | 84.5 | 83% | 72 |
| MV-2024-015 | Montaña Verde | Jinotega | 2,200 kg | Honey | 86.0 | 88% | 81 |
| SN-2024-008 | Sierra Nevada | Estelí | 850 kg | Natural | 87.5 | 60% | 65 |
| SOL-2024-002 | Café de la Selva | Matagalpa | 680 kg | Lavado | 82.5 | 100% | 68 |
