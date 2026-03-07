# Guía Completa: Subastas, Lotes, Ofertas, Contratos y Reclamos
> Referencia técnica y funcional del flujo comercial completo en Nova Silva.
> Última actualización: 2026-03-05
---
## 1. Arquitectura General del Flujo Comercial
```
COOPERATIVA                          EXPORTADOR                         CLIENTE
─────────────                        ──────────                         ───────
Entregas → Lotes Acopio              Lotes Comerciales                  Comprador
         ↓                                ↑
    Ofrecer a Exportador         Vincular lotes_acopio
    (lotes_ofrecidos_exportadores)        ↓
         ↓                          Ofertas Comerciales
    Subastas Públicas               (ofertas_comerciales)
    o Dirigidas                          ↓
         ↓                          Contratos
    Exportador acepta               (contratos)
    o contraoferta                       ↓
         ↓                          Lotes Exportación
    MarketIntelligence              (lotes_exportacion)
    (análisis automático)                ↓
                                    Reclamos Postventa
                                    (reclamos_postventa)
```
---
## 2. Tablas Involucradas
### 2.1 Tablas Existentes en DB
| Tabla | Owner | Descripción |
|-------|-------|-------------|
| `lotes_acopio` | Cooperativa | Lotes de café en acopio, agrupan entregas |
| `lotes_comerciales` | Exportador | Lotes listos para venta, agrupan lotes_acopio |
| `lotes_comerciales_lotes_acopio` | Link table | M:N entre comerciales y acopio (volumen_asignado, porcentaje) |
| `ofertas_comerciales` | Exportador | Ofertas del exportador hacia clientes |
| `ofertas_lotes` | Exportador | Lotes incluidos en cada oferta (volumen, precio) |
| `lotes_ofrecidos_exportadores` | Cooperativa | Subastas: coop ofrece lotes a exportadores |
| `contratos` | Exportador | Contratos firmados con clientes |
| `lotes_exportacion` | Exportador | Lotes físicos de embarque (ICO, peso neto) |
| `reclamos_postventa` | Exportador | Reclamos de clientes compradores |
| `clientes_compradores` | Exportador | Cartera de clientes internacionales |
| `cooperativa_exportadores` | Ambos | Vinculación cooperativa ↔ exportador |
### 2.2 Tablas Pendientes de Migración
| Tabla | Estado | Notas |
|-------|--------|-------|
| `reclamos_postventa` | ⚠️ Existe en DB pero hooks retornan `[]` | Hooks son placeholders, necesitan conectar |
| `ofertas_lotes` | ⚠️ Hooks listos, tabla puede no existir | Verificar con `supabase--read-query` |
| `lotes_comerciales_lotes_acopio` | ⚠️ Se usa con `(supabase as any)` | No está en types.ts, tabla puede existir |
---
## 3. Workflow Completo Paso a Paso
### 3.1 Fase 1: Acopio (Cooperativa)
```
Productor entrega café → Entrega registrada
                              ↓
                    Se asigna a Lote de Acopio
                    (lotes_acopio: código, tipo_cafe, humedad, cantidad_total_kg)
                              ↓
                    Estado: 'recibido' → 'procesado' → 'listo'
```
**Hook:** `useLotesAcopio()` (cooperativa)
**Página:** `/cooperativa/lotes`
### 3.2 Fase 2: Ofrecimiento / Subasta (Cooperativa → Exportador)
La cooperativa decide ofrecer un lote a exportadores. Dos modalidades:
#### A) Oferta Pública (Subasta Abierta)
```typescript
// Todos los exportadores vinculados pueden ver el lote
useCreateOferta({
  lote_comercial_id: 'xxx',
  es_oferta_publica: true,
  notas: 'Lote SHB, 84+ puntos SCA'
});
```
#### B) Oferta Dirigida (A exportadores específicos)
```typescript
// Solo exportadores seleccionados ven el lote
useCreateOferta({
  lote_comercial_id: 'xxx',
  exportador_ids: ['exp-1', 'exp-2'],
  es_oferta_publica: false,
  notas: 'Oferta exclusiva micro-lote'
});
```
**Tabla:** `lotes_ofrecidos_exportadores`
**Estados:** `activo` → `aceptado` | `revocado`
**Hook:** `useCreateOferta()`, `useOfertasCooperativa()` (cooperativa side)
**Página Cooperativa:** `/cooperativa/ofertas-recibidas` (ve respuestas de exportadores)
### 3.3 Fase 3: Subasta / Exploración (Exportador)
El exportador ve los lotes disponibles en su panel de subastas:
**Página:** `/exportador/subastas` → `SubastasDisponibles.tsx`
```
Exportador ve lote ofrecido
        ↓
Revisa perfil del lote:
  - Puntaje SCA (si existe catación)
  - Estado EUDR
  - Score VITAL
  - Origen, variedad, proceso
  - Volumen disponible
        ↓
Decide: Aceptar | Contraofertar | Pasar
```
**Hook exportador:** `useLotesOfrecidosParaExportador(estadoFilter)`
**Hook aceptar:** `useAcceptOferta()`
**Datos que se muestran al exportador:**
```typescript
interface SubastaLote {
  // De lotes_ofrecidos_exportadores
  id: string;
  estado_oferta: 'activo' | 'revocado' | 'aceptado';
  es_oferta_publica: boolean;
  notas: string;
  // Joined de lotes_comerciales
  codigo_lote_comercial: string;
  volumen_total: number;
  estado_riesgo: 'Verde' | 'Ambar' | 'Rojo';
  origen_pais: string;
  origen_region: string;
  // Cooperativa info
  cooperativa_nombre: string;
}
```
### 3.4 Fase 4: Market Intelligence (Cooperativa)
Cuando un exportador hace una oferta/contraoferta, la cooperativa ve análisis automático:
**Componente:** `MarketIntelligenceCard.tsx`
```typescript
interface MarketIntelligenceCardProps {
  oferta: {
    precio_ofertado: number | null;
    volumen_kg: number | null;
    condiciones_pago: string | null;
    incoterm: string | null;
    exportador_nombre: string | null;
  };
  onAceptar: () => void;
  onContraofertar: () => void;
  onRechazar: () => void;
}
```
**Lógica de análisis:**
- Compara precio ofertado vs. precio NY (bolsa) + diferencial
- Evalúa condiciones de pago (Net 0 mejor que Net 90)
- Calcula margen estimado
- Genera recomendación: ✅ Aceptar | ⚠️ Contraofertar | ❌ Rechazar
**Página:** `/cooperativa/ofertas-recibidas` → `OfertasRecibidas.tsx`
### 3.5 Fase 5: Lote Comercial (Exportador)
Una vez aceptada la oferta, el exportador crea/actualiza su lote comercial:
```typescript
interface LoteComercial {
  id: string;
  exportador_id: string;
  codigo_lote_comercial: string;    // Ej: "LC-2026-001"
  descripcion: string | null;
  origen_pais: string | null;       // "Costa Rica"
  origen_region: string | null;     // "Tarrazú"
  variedad: string[] | null;        // ["Caturra", "Catuaí"]
  proceso: string | null;           // "Lavado"
  certificaciones_aplicables: string[] | null;  // ["FairTrade", "Orgánico"]
  volumen_total: number | null;     // kg
  volumen_disponible: number | null;
  estado_disponibilidad: EstadoDisponibilidad;
  estado_riesgo: 'Verde' | 'Ambar' | 'Rojo';
  contrato_id: string | null;
}
type EstadoDisponibilidad = 
  | 'en_acopio'      // Aún en cooperativa
  | 'listo'          // Procesado, listo para venta
  | 'disponible'     // Activamente ofrecido
  | 'comprometido'   // Asignado a contrato
  | 'embarcado'      // En tránsito
  | 'liquidado';     // Vendido y pagado
```
**Vinculación con lotes de acopio:**
```typescript
// M:N link table
useLinkLotesAcopio({
  loteComercialId: 'lc-xxx',
  lotesAcopio: [
    { lote_acopio_id: 'la-001', volumen_asignado: 5000 },
    { lote_acopio_id: 'la-002', volumen_asignado: 3000 },
  ]
});
```
**Hooks:**
- `useLotesComerciales()` — Lista todos
- `useLoteComercialConDetalles(id)` — Con lotes_acopio vinculados
- `useCreateLoteComercial()` / `useUpdateLoteComercial()` / `useDeleteLoteComercial()`
- `useLinkLotesAcopio()` — Vincular lotes de acopio
**Páginas:**
- `/exportador/inventario` → Vista de inventario de lotes comerciales
- `/exportador/calidad` → Vista calidad con cataciones por lote
### 3.6 Fase 6: Oferta Comercial (Exportador → Cliente)
El exportador crea ofertas formales para sus clientes:
```typescript
interface OfertaComercial {
  id: string;
  organization_id: string;
  cliente_potencial: string | null;
  tipo_cafe: string | null;
  volumen_oferta_kg: number | null;
  precio_base_usd_lb: number | null;
  estado: EstadoOferta;
  fecha_creacion: string;
}
type EstadoOferta = 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'cerrada';
```
**Sub-entidades de la oferta:**
```
Oferta Comercial
  ├── ofertas_lotes[]        → Lotes incluidos (volumen, precio por lote)
  └── muestras_oferta[]      → Muestras enviadas al cliente (estado tracking)
```
**Hooks:**
- `useOfertasList(filters?)` / `useOfertaDetalle(id)`
- `useCreateOferta()` / `useUpdateOferta()` / `useDeleteOferta()`
- `useAddLoteToOferta()` / `useRemoveLoteFromOferta()` / `useUpdateOfertaLote()`
**Páginas:**
- `/exportador/ofertas` → `OfertasComerciales.tsx` (lista)
- `/exportador/ofertas/:id` → `OfertaDetalle.tsx` (detalle con lotes y muestras)
### 3.7 Fase 7: Contrato (Exportador ↔ Cliente)
Cuando el cliente aprueba la oferta, se crea un contrato:
```typescript
interface Contrato {
  id: string;
  exportador_id: string;
  cliente_id: string | null;
  oferta_id: string | null;              // Link a oferta que originó
  codigo_interno_contrato: string;        // Ej: "CT-2026-015"
  fecha_firma: string | null;
  tipo_precio: string | null;             // "fijo" | "diferencial"
  basis_total: number | null;             // Diferencial sobre NY
  volumen_total_contratado: number | null;
  incoterm: string | null;                // "FOB" | "CIF" | "EXW"
  puerto_origen: string | null;
  puerto_destino: string | null;
  ventana_entrega_inicio: string | null;
  ventana_entrega_fin: string | null;
  estado_contrato: EstadoContrato;
  // Pagos
  precio_pactado_unitario: number | null;
  moneda: string | null;                  // "USD"
  monto_total_contrato: number | null;
  estado_pago: EstadoPago;
  monto_pagado: number | null;
  fecha_ultimo_pago: string | null;
}
type EstadoContrato = 'borrador' | 'activo' | 'completado' | 'cancelado';
type EstadoPago = 'pendiente' | 'parcial' | 'completado';
```
**Hooks:**
- `useContratos()` / `useContratoById(id)`
- `useCreateContrato()` / `useUpdateContrato()` / `useDeleteContrato()`
**Página:** `/exportador/contratos` → `Contratos.tsx`
### 3.8 Fase 8: Lote de Exportación
El lote comercial se convierte en lote de exportación cuando se embarca:
```typescript
interface LoteExportacion {
  id: string;
  contrato_id: string;
  organization_id: string;
  codigo_ico: string;          // Código ICO internacional
  peso_neto_kg: number;
  calidad_taza: number;        // Puntaje SCA
  eudr_compliant: boolean;
  estado_fisico: 'en_beneficio' | 'listo' | 'embarcado' | 'entregado';
}
```
**Página:** `/exportador/eudr` (vista EUDR con compliance por lote)
### 3.9 Fase 9: Reclamos Post-Venta
Cuando el cliente reporta problemas después de recibir el café:
```typescript
interface Reclamo {
  id: string;
  lote_comercial_id: string;
  tipo: TipoReclamo;
  severidad: SeveridadReclamo;
  descripcion: string | null;
  fecha_reclamo: string;
  estado: EstadoReclamo;
  creado_por: string | null;
}
type TipoReclamo = 'peso' | 'calidad' | 'humedad' | 'documentacion' | 'tiempo' | 'otro';
type SeveridadReclamo = 'baja' | 'media' | 'alta';
type EstadoReclamo = 'abierto' | 'en_analisis' | 'en_investigacion' | 'resuelto' | 'cerrado';
```
**Workflow de reclamo:**
```
Cliente reporta problema
        ↓
  Estado: 'abierto'
        ↓
  Exportador investiga
  Estado: 'en_analisis' → 'en_investigacion'
        ↓
  Se vincula con comparacion_muestras
  (Offer vs PSS vs Arrival)
        ↓
  Resolución
  Estado: 'resuelto' → 'cerrado'
```
**Hooks:**
- `useAllReclamos()` / `useReclamosLote(loteId)`
- `useCreateReclamo()` / `useUpdateReclamo()`
**Página:** `/exportador/reclamos` → `ReclamosPostventa.tsx`
**Estadísticas en dashboard:**
- Reclamos abiertos
- En análisis
- Alta severidad (activos)
### 3.10 Ranking de Cooperativas (Vista Exportador)
El exportador puede rankear sus proveedores (cooperativas):
```typescript
interface CooperativaRanking {
  cooperativa_id: string;
  cooperativa_nombre: string;
  volumen_total_kg: number;
  total_lotes: number;
  lotes_eudr_listo: number;
  porcentaje_eudr_listo: number;
  reclamos_totales: number;
  reclamos_alta: number;
}
```
**Hook:** `useRankingCooperativas()`
**Ordenamiento:** % EUDR listo (descendente)
---
## 4. Comparación de Muestras (Quality Control)
El sistema permite comparar muestras en 3 etapas del proceso:
```
Muestra Offer → Muestra PSS → Muestra Arrival
(Pre-embarque)   (Pre-shipment)  (En destino)
```
**Tabla:** `comparacion_muestras`
```typescript
{
  lote_comercial_id: string;
  muestra_offer_id: string;        // Muestra original
  muestra_pss_id: string;          // Pre-shipment sample
  muestra_arrival_id: string;      // Arrival sample
  diferencia_puntaje_offer_pss: number;
  diferencia_puntaje_pss_arrival: number;
  diferencia_puntaje_offer_arrival: number;
  semaforo: 'verde' | 'ambar' | 'rojo' | 'pendiente';
}
```
**Reglas del semáforo:**
- 🟢 Verde: Diferencia < 1.5 puntos SCA
- 🟡 Ámbar: Diferencia 1.5 - 3.0 puntos
- 🔴 Rojo: Diferencia > 3.0 puntos → Genera alerta de reclamo
---
## 5. Permisos por Rol (RBAC)
### Recursos comerciales en la matriz de permisos:
| Recurso | Admin | Field Tech | Warehouse | Compliance | Viewer |
|---------|-------|------------|-----------|------------|--------|
| `lotes_acopio` | CRUD + share + approve | view | view + create + edit | view + approve | view |
| `lotes_comerciales` | CRUD + approve | — | view | view + approve | view |
| `contratos` | CRUD | — | — | view | view |
| `paquetes_eudr` | view + create + export | — | — | view + create + export | view |
### Visibilidad Cross-Org:
**Cooperativa → Exportador (comparte):**
- ✅ lotes_acopio (código, volumen, certificaciones)
- ✅ parcelas (coordenadas, área)
- ✅ documentos (tipo, estado)
- ❌ productores.telefono, productores.correo, productores.cedula
- 🔒 productores.nombre → pseudonimizado como "Productor P-001"
**Exportador → Certificadora (comparte):**
- ✅ lotes_comerciales
- ✅ paquetes_eudr
- ✅ parcelas.coordenadas
- ❌ contratos.precios
- ❌ clientes_compradores
---
## 6. CaféHub (Exportador)
Vista unificada con tabs para el exportador:
```
/exportador/cafehub
  ├── Tab: Inventario         → Lotes comerciales (Inventario.tsx)
  ├── Tab: Lotes Ofrecidos    → Lotes de cooperativas (LotesOfrecidos.tsx)
  └── Tab: Subastas           → Subastas públicas (SubastasDisponibles.tsx)
```
**Componente:** `CafeHub.tsx` (lazy loading por tab)
---
## 7. Diagrama de Estados
### Lote de Acopio
```
recibido → procesado → listo → ofrecido → comprometido
```
### Lote Comercial (estado_disponibilidad)
```
en_acopio → listo → disponible → comprometido → embarcado → liquidado
```
### Oferta entre Cooperativa y Exportador (lotes_ofrecidos)
```
activo → aceptado
       → revocado
```
### Oferta Comercial (exportador → cliente)
```
borrador → enviada → aprobada → cerrada
                   → rechazada
```
### Contrato
```
borrador → activo → completado
                  → cancelado
```
### Reclamo
```
abierto → en_analisis → en_investigacion → resuelto → cerrado
```
### Pago de Contrato
```
pendiente → parcial → completado
```
---
## 8. Hooks Maestros (Resumen)
| Hook | Archivo | Rol Principal |
|------|---------|---------------|
| `useLotesComerciales()` | `useLotesComerciales.ts` | Exportador |
| `useLoteComercialConDetalles(id)` | `useLotesComerciales.ts` | Exportador |
| `useCreateLoteComercial()` | `useLotesComerciales.ts` | Exportador |
| `useLinkLotesAcopio()` | `useLotesComerciales.ts` | Exportador |
| `useExportadores()` | `useLotesComerciales.ts` | Cooperativa |
| `useOfertasList()` | `useOfertasComerciales.ts` | Exportador |
| `useOfertaDetalle(id)` | `useOfertasComerciales.ts` | Exportador |
| `useCreateOferta()` | `useLotesOfrecidos.ts` | Cooperativa |
| `useOfertasCooperativa()` | `useLotesOfrecidos.ts` | Cooperativa |
| `useLotesOfrecidosParaExportador()` | `useLotesOfrecidos.ts` | Exportador |
| `useAcceptOferta()` | `useLotesOfrecidos.ts` | Exportador |
| `useRevokeOferta()` | `useLotesOfrecidos.ts` | Cooperativa |
| `useAddLoteToOferta()` | `useOfertaLotes.ts` | Exportador |
| `useContratos()` | `useContratos.ts` | Exportador |
| `useCreateContrato()` | `useContratos.ts` | Exportador |
| `useAllReclamos()` | `useReclamos.ts` | Exportador |
| `useCreateReclamo()` | `useReclamos.ts` | Exportador |
| `useRankingCooperativas()` | `useReclamos.ts` | Exportador |
| `useCarteraProveedores()` | `useCarteraProveedores.ts` | Exportador |
---
## 9. Páginas y Rutas
| Ruta | Componente | Rol |
|------|-----------|-----|
| `/cooperativa/lotes` | Lotes de acopio | Cooperativa |
| `/cooperativa/ofertas-recibidas` | OfertasRecibidas.tsx | Cooperativa |
| `/cooperativa/exportadores` | Gestión vinculación | Cooperativa |
| `/exportador/inventario` | Inventario.tsx | Exportador |
| `/exportador/cafehub` | CafeHub.tsx (tabs) | Exportador |
| `/exportador/subastas` | SubastasDisponibles.tsx | Exportador |
| `/exportador/ofertas` | OfertasComerciales.tsx | Exportador |
| `/exportador/ofertas/:id` | OfertaDetalle.tsx | Exportador |
| `/exportador/contratos` | Contratos.tsx | Exportador |
| `/exportador/reclamos` | ReclamosPostventa.tsx | Exportador |
| `/exportador/calidad` | Calidad.tsx | Exportador |
| `/exportador/eudr` | EUDR dashboard | Exportador |
| `/exportador/proveedores` | Cartera proveedores | Exportador |
| `/exportador/clientes` | ClientesCompradores.tsx | Exportador |
---
## 10. Checklist de Implementación para Nuevo Proyecto
### Fase 1: Base de Datos
- [ ] Migrar tabla `lotes_comerciales` con campos actualizados
- [ ] Migrar tabla `lotes_comerciales_lotes_acopio` (link M:N)
- [ ] Migrar tabla `lotes_ofrecidos_exportadores` (subastas)
- [ ] Migrar tabla `ofertas_comerciales` con campos extendidos
- [ ] Migrar tabla `ofertas_lotes` (lotes en cada oferta)
- [ ] Migrar tabla `contratos` con campos de pago
- [ ] Migrar tabla `reclamos_postventa` y conectar hooks
- [ ] Migrar tabla `comparacion_muestras`
- [ ] Migrar tabla `cooperativa_exportadores`
- [ ] Crear RLS policies por organización para todas las tablas
### Fase 2: Hooks
- [ ] Copiar `useLotesComerciales.ts`
- [ ] Copiar `useLotesOfrecidos.ts`
- [ ] Copiar `useOfertasComerciales.ts`
- [ ] Copiar `useOfertaLotes.ts`
- [ ] Copiar `useContratos.ts`
- [ ] Copiar `useReclamos.ts` → **Conectar a tabla real** (actualmente placeholder)
- [ ] Copiar `useCarteraProveedores.ts`
- [ ] Copiar `useOfertasRecibidas.ts`
### Fase 3: Componentes UI
- [ ] Implementar `MarketIntelligenceCard.tsx` (análisis de precios)
- [ ] Implementar `SubastasDisponibles.tsx` (vista exportador)
- [ ] Implementar `OfertasRecibidas.tsx` (vista cooperativa)
- [ ] Implementar `ReclamosPostventa.tsx`
- [ ] Implementar `CafeHub.tsx` (tabs unificados)
### Fase 4: Integraciones
- [ ] Conectar comparación de muestras con semáforo de calidad
- [ ] Integrar ranking de cooperativas en dashboard exportador
- [ ] Vincular reclamos con auditoría EUDR
- [ ] Implementar realtime en `lotes_ofrecidos_exportadores` para notificaciones de subastas
---
## 11. Notas Técnicas Importantes
1. **`(supabase as any)`**: Varias tablas se acceden con type assertion porque no están en `types.ts` autogenerado. Al migrar, asegurar que las tablas existan para que se incluyan en la regeneración de tipos.
2. **Hooks Placeholder**: `useReclamos.ts` retorna arrays vacíos. La tabla `reclamos_postventa` **sí existe** en la DB pero los hooks no están conectados. Priorizar en migración.
3. **Cooperativa ID vs User ID**: En `useLotesOfrecidos.ts`, `cooperativa_id` se asigna como `user.id` (no `organization_id`). Verificar consistencia con el patrón `get_user_organization_id()`.
4. **Market Intelligence**: El componente actual usa lógica estática. Para la V2, considerar integrar precios reales de la bolsa de NY vía API externa.
5. **Volumen Tracking**: El flujo debe mantener consistencia: `volumen_disponible` del lote comercial debe decrementarse al comprometerse en contrato.
