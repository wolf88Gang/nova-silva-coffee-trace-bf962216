# Biblia Nova Silva — Módulo Producción

> Documento maestro de arquitectura. Define el modelo unificado de producción agrícola
> que es el núcleo operativo de toda la plataforma.
> Última actualización: 2026-03-10

---

## 1. Principio Fundamental: Producción como Núcleo

Nova Silva **no es software para cooperativas**. Es **infraestructura de producción agrícola**.

El sistema es **organization-centric**, no coop-centric:

```
❌ Antes (coop-centric):
   cooperativa → productores
   exportador → proveedores
   finca → parcelas propias

✅ Ahora (organization-centric):
   organization → actores → fincas → parcelas
```

Cualquier tipo de organización usa la misma estructura. Solo cambian las etiquetas y los módulos habilitados.

---

## 2. Tipos de Organización Soportados

| Tipo BD | Label UI | Actores son... | Usa parcelas | Usa lotes comerciales |
|---------|----------|----------------|--------------|----------------------|
| `cooperativa` | Producción Cooperativa | Socios productores | ✅ | ✅ (vía exportador) |
| `productor_empresarial` | Producción Empresarial | Fincas propias (self) | ✅ | ✅ |
| `exportador` | Casa de Exportación | Proveedores (coops/productores) | ⚠️ indirecto | ✅ |
| `beneficio_privado` | Beneficio Privado | Proveedores | ✅ | ✅ |
| `aggregator` | Agregador | Proveedores | ⚠️ | ✅ |
| `certificadora` | Certificadora | Unidades auditadas | ❌ | ❌ |

**Función clave:** `isProduccionType()` en `src/lib/org-terminology.ts` identifica si un orgTipo pertenece al grupo unificado de Producción (cooperativa + productor + productor_empresarial).

---

## 3. Jerarquía de Datos (4 capas)

```
┌──────────────────────────────────────────┐
│  ORGANIZACIÓN (tenant SaaS)              │
│  platform_organizations                  │
│  organization_id = scope de todo         │
├──────────────────────────────────────────┤
│  ACTOR (entidad humana/empresa)          │
│  productores                             │
│  Puede ser: socio, proveedor, self       │
├──────────────────────────────────────────┤
│  FINCA (unidad geográfica)               │  ← NUEVA CAPA
│  fincas                                  │
│  Agrupa parcelas de un mismo actor       │
├──────────────────────────────────────────┤
│  PARCELA (unidad biológica)              │
│  parcelas                                │
│  Polígono, variedad, altitud, densidad   │
└──────────────────────────────────────────┘
```

### Por qué 4 capas y no 3

Hoy: `Productor → Parcelas`
Propuesto: `Productor → Finca → Parcelas`

La capa **Finca** es necesaria para:
- **Beneficios privados** y **estates** que gestionan múltiples propiedades
- **Modelos de carbono** que operan a nivel de finca, no de parcela
- **Riesgo climático** que aplica a la finca como unidad geográfica
- **Gemelo digital**: cada finca es un objeto digital completo
- **Migración de productores**: un productor puede moverse entre orgs sin perder historial

---

## 4. Escenarios de Uso

### Escenario A: Cooperativa con productores

```
Org: Coop Tarrazú (tipo: cooperativa)
├── Actor: Juan Pérez
│   ├── Finca: El Mirador
│   │   ├── Parcela: Lote 1 (Caturra, 1450m)
│   │   └── Parcela: Lote 2 (Castillo, 1380m)
│   └── Finca: La Esperanza
│       └── Parcela: Lote A (Colombia, 1500m)
├── Actor: María López
│   └── Finca: Monte Verde
│       ├── Parcela: Principal (Geisha, 1600m)
│       └── Parcela: Expansión (SL28, 1550m)
└── Actor: Carlos Mora
    └── Finca: San José
        └── Parcela: Única (Caturra, 1300m)
```

### Escenario B: Productor independiente

```
Org: Finca Monte Claro (tipo: productor_empresarial)
└── Actor: Monte Claro (self, tipo_actor: propio)
    └── Finca: Monte Claro
        ├── Parcela: Alta (Geisha, 1700m)
        ├── Parcela: Media (Bourbon, 1500m)
        └── Parcela: Baja (Caturra, 1300m)
```

### Escenario C: Exportador

```
Org: Volcafe (tipo: exportador)
├── Actor: Beneficio Santa Anita (proveedor)
├── Actor: Coopelibertad (proveedor)
└── Actor: Finca La Esperanza (proveedor)
    → El exportador NO gestiona parcelas directamente
    → Gestiona lotes_acopio y lotes_comerciales
```

### Escenario D: Migración de productor

```
Antes:
  Org: Independiente → Actor: Juan (self)
  
Después (se afilia a cooperativa):
  Org: Coop Tarrazú → Actor: Juan
  
Solo cambia: organization_id en productores
Historial de parcelas, entregas, VITAL → se conserva intacto
```

---

## 5. Qué Vive Dentro de Producción

### Datos base
| Tabla | Qué representa |
|-------|----------------|
| `productores` | Actores (socios/proveedores/self) |
| `fincas` | Unidades geográficas (NUEVA) |
| `parcelas` | Unidades biológicas |

### Eventos productivos
| Tabla | Módulo |
|-------|--------|
| `entregas` | Acopio |
| `yield_estimations` | Nova Yield |
| `nutricion_planes` | Nutrición |
| `nutricion_aplicaciones` | Nutrición (ejecución) |
| `nutricion_analisis_suelo` | Nutrición (diagnóstico) |
| `disease_assessments` | Nova Guard |
| `resilience_assessments` | VITAL |
| `jornales_*` | Jornales |

### Catálogos agronómicos
| Tabla | Descripción |
|-------|-------------|
| `ag_crops` | Cultivos |
| `ag_crop_varieties` | Variedades |
| `ag_fertilizers` | Fertilizantes |
| `ag_active_ingredients` | Ingredientes activos |
| `ag_nutrients` | Nutrientes |

---

## 6. Conexión con Módulos Científicos

Todos los motores leen de Producción como **data layer agronómico**:

```
                    ┌──────────────┐
                    │  PRODUCCIÓN  │
                    │  (data core) │
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Nova Yield │ │ Nova Guard  │ │  Nutrición  │
    │  estimación │ │ fitosanidad │ │  planes     │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                    ┌──────▼───────┐
                    │    VITAL     │
                    │  resiliencia │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──┐  ┌──────▼──┐  ┌─────▼───┐
       │ Crédito │  │ Carbono │  │  EUDR   │
       │  SCN    │  │         │  │ trazab. │
       └─────────┘  └─────────┘  └─────────┘
```

### Nova Yield
Lee: parcelas, variedad, densidad, historial productivo, conteo de frutos
Genera: estimación de cosecha por parcela y por org

### Nova Guard
Lee: diagnósticos, incidencias, clima, historial de brotes
Genera: alertas fitosanitarias, recomendaciones

### Nutrición
Lee: suelo, variedad, edad del cultivo, fenología, rendimiento esperado
Genera: plan nutricional, historial de fertilización, comisiones

### Protocolo VITAL
Lee: prácticas agrícolas, sombra, suelo, clima, manejo de finca
Genera: score de resiliencia (0-100)

---

## 7. Gemelo Digital de la Finca

Cada finca se convierte en un objeto digital completo:

```
Finca: El Mirador
├── Ubicación: lat/lng, altitud, región
├── Parcelas:
│   ├── Lote 1
│   │   ├── Variedad: Caturra
│   │   ├── Edad: 5 años
│   │   ├── Nutrición: Plan activo (60% ejecución)
│   │   ├── Fitosanidad: Sin alertas
│   │   ├── Rendimiento: 2800 kg/ha estimado
│   │   └── Clima: Riesgo medio (La Niña)
│   └── Lote 2
│       └── ...
├── Score VITAL: 72/100
├── Score Crediticio (SCN): B+
├── Potencial Carbono: 4.2 tCO2/ha/año
└── Estado EUDR: Compliant (georreferenciado)
```

Esto alimenta: score crediticio, riesgo climático, estimación de cosecha, valoración de carbono.

---

## 8. Estructura de Navegación UI

### Sidebar agrupado por dominio

```
📊 Panel Principal

🌱 Producción
   ├── Productores / Proveedores  (etiqueta dinámica)
   ├── Parcelas
   ├── Entregas
   └── Actividad

🔬 Agronomía
   ├── Nutrición
   ├── Nova Guard (Fitosanidad)
   └── Nova Yield (Estimación)

🛡️ Resiliencia
   └── Protocolo VITAL

📋 Cumplimiento
   ├── Trazabilidad
   └── EUDR

💰 Finanzas
   ├── Pagos y Liquidaciones
   └── Créditos

📦 Comercial
   ├── Lotes
   ├── Contratos
   └── Ofertas

💬 Comunicación
   └── Mensajes y Avisos

⚙️ Configuración
   └── Usuarios y Permisos
```

Las secciones se muestran/ocultan según `activeModules` del org.

---

## 9. Reglas Técnicas Invariantes

1. **Scope siempre es `organization_id`**, nunca `auth.uid() = cooperativa_id`
2. **RLS por org**: `get_user_organization_id(auth.uid())` es la fuente de verdad
3. **Etiquetas dinámicas**: `getActorsLabel(orgTipo)` nunca hardcodear "productores" o "proveedores"
4. **Módulos dinámicos**: `getActiveModules(org)` determina qué ve cada org
5. **Un actor puede migrar de org** cambiando solo `organization_id` sin perder historial
6. **La tabla se llama `productores`** en BD pero la UI dice "Actores" / "Productores" / "Proveedores" según contexto
7. **La tabla `fincas`** (cuando exista) agrupa parcelas geográficamente

---

## 10. Ventaja Estratégica

Este diseño hace que Nova Silva sea **horizontal**:

| Sin unificación | Con unificación |
|-----------------|-----------------|
| `coop_productores` | `productores` |
| `exportador_proveedores` | `productores` |
| `finca_productor` | `productores` |
| 3 módulos duplicados | 1 módulo universal |

Todo se reduce a: **actor + organización + finca + parcela**

Esto habilita que sobre el mismo data layer se construyan:
- SCN (score crediticio)
- Créditos
- Carbono
- Seguros paramétricos
- EUDR
- Certificaciones

**Todo nace en Producción.**
