 Guía de Inclusión, Lenguaje de Género y Despliegue en Nova Silva
> **Versión:** 1.0  
> **Fecha:** 2026-03-05  
> **Alcance:** Lineamientos de lenguaje inclusivo, captura demográfica, saludos personalizados y exportación de reportes de género e inclusión.
---
## 1. Principios Rectores
Nova Silva adopta un enfoque de **lenguaje inclusivo no forzado**, basado en tres principios:
1. **Respeto por la autodeclaración**: El género demográfico se captura únicamente por autodeclaración voluntaria. Nunca se infiere de forma visible al usuario.
2. **Neutralidad cuando es posible**: Se prefiere el uso de sustantivos colectivos o perífrasis inclusivas sobre el genérico masculino.
3. **Consistencia centralizada**: Todos los textos visibles se gestionan desde `src/lib/labels.ts`. Ningún componente debe tener labels hardcodeados.
---
## 2. Sistema Centralizado de Terminología (`src/lib/labels.ts`)
### 2.1 Roles y Actores
| Término interno (código) | Label visible (UI) | Uso |
|---|---|---|
| `productor` | "Persona productora" | Singular, headers, formularios |
| `productores` | "Productoras y productores" | Plural, listas, tablas |
| `exportador` | "Casa de Exportación" | Neutral, evita género |
| `tecnico` | "Persona técnica" | Singular inclusivo |
| `tecnicos` | "Personal técnico" | Colectivo neutral |
| `trabajador` | "Persona trabajadora" | Formularios de jornales |
| `jornalero` | "Persona jornalera" | Módulo de jornales |
| `jornaleros` | "Personal jornalero" | Plural colectivo |
### 2.2 Reglas Críticas
```
✅ CORRECTO                          ❌ INCORRECTO
─────────────────────────────────    ─────────────────────────────────
"Productoras y productores"          "Productores" (genérico masculino)
"Personal técnico"                   "Los técnicos"
"Casa de Exportación"                "El exportador"
"Persona productora"                 "Productor/a" (barra)
"No hay productoras ni productores"  "No hay productores registrados"
```
### 2.3 Dónde NO se cambia la terminología
- **Rutas**: `/productor/*`, `/exportador/*`, `/tecnico/*` → permanecen intactas
- **Tablas de BD**: `productores`, `exportadores` → no se renombran
- **Columnas**: `productor_id`, `exportador_id` → estables
- **Enums/tipos TypeScript**: `UserRole`, `OrganizationType` → estables
- **Nombres de archivos y componentes**: sin cambios
---
## 3. Saludos Personalizados por Género (`src/lib/genderHelper.ts`)
### 3.1 Mecanismo
Nova Silva personaliza el saludo del dashboard ("Bienvenido/Bienvenida") usando una heurística basada en el **primer nombre** del usuario.
```typescript
import { getGreeting } from '@/lib/genderHelper';
// En dashboards:
title={`${getGreeting(user?.name)}, ${user?.name?.split(' ')[0]}`}
// → "Bienvenida, María" o "Bienvenido, Carlos"
```
### 3.2 Lógica de Detección
1. Se extrae el **primer nombre** del campo `name` del perfil.
2. Se verifica contra una lista de ~120 **nombres femeninos hispanos** conocidos.
3. Se verifican **excepciones masculinas** que terminan en 'a' (Joshua, Elías, Nicolás, etc.).
4. Si no está en la lista, se aplican terminaciones típicamente femeninas (`-a`, `-ia`, `-ina`, `-ela`, etc.).
5. **Default**: Si no se puede determinar → `"Bienvenido"` (masculino gramatical como fallback).
### 3.3 Caso Especial: Productor
El dashboard del productor usa `genero_demografico` de la tabla `productores` en lugar del nombre:
```typescript
// DashboardProductor.tsx
title={`${getGreeting(productor.genero_demografico)}, ${productor.nombre}`}
```
Aquí `getGreeting` recibe directamente el valor demográfico, pero la función actual solo verifica nombres. **Se debe verificar que ambos flujos sean coherentes.**
### 3.4 Dashboards que Usan getGreeting
| Dashboard | Fuente del nombre | Archivo |
|---|---|---|
| Cooperativa | `user?.name` (perfil auth) | `DashboardCooperativa.tsx` |
| Exportador | `user?.name` (perfil auth) | `DashboardExportador.tsx` |
| Certificadora | `user?.name` (perfil auth) | `DashboardCertificadora.tsx` |
| Productor | `productor.genero_demografico` | `DashboardProductor.tsx` |
---
## 4. Captura de Datos Demográficos
### 4.1 Campos y Opciones
Los datos demográficos son **siempre opcionales** y requieren **consentimiento explícito**.
#### Opciones de Género (`GENERO_OPTIONS` en `useInclusionMetrics.ts`)
| Valor en BD | Label visible |
|---|---|
| `masculino` | Masculino |
| `femenino` | Femenino |
| `no_binario` | No binario |
| `otro` | Otro |
| `prefiero_no_decir` | Prefiero no decir |
#### Campos Demográficos Capturados
| Campo | Tipo | Tabla(s) | Descripción |
|---|---|---|---|
| `genero_demografico` | text | `productores`, `org_people` | Autodeclaración de género |
| `anio_nacimiento` | integer | `productores`, `org_people` | Para rangos etarios agregados |
| `consentimiento_reportes` | boolean | `productores`, `org_people` | Autorización para uso en reportes |
| `fecha_inicio` / `fecha_fin` | date | `org_people` | Para métricas de rotación |
### 4.2 Componente de Captura
`src/components/inclusion/DemographicProfileForm.tsx` es el componente reutilizable para captura demográfica:
```tsx
<DemographicProfileForm
  data={{ genero: 'femenino', consentimiento_reportes_agregados: true }}
  onChange={(data) => handleUpdate(data)}
  showRotationFields={true}  // Solo para org_people
  disabled={false}
/>
```
### 4.3 Reglas de Privacidad
1. **Nunca** mostrar datos demográficos individuales en tablas o listas.
2. Solo usar en **reportes agregados** y solo con consentimiento.
3. Mostrar siempre el aviso de privacidad (componente con icono `Shield`).
4. Si no hay consentimiento, el registro se excluye de las métricas.
---
## 5. Métricas de Inclusión (`useInclusionMetrics.ts`)
### 5.1 Función SQL: `get_inclusion_summary`
Retorna un JSON agregado con:
```json
{
  "productores": {
    "total": 380,
    "con_genero": 312,
    "con_edad": 290,
    "con_consentimiento": 305,
    "por_genero": ["masculino", "femenino", "no_binario"]
  },
  "personal": {
    "total": 45,
    "con_genero": 40,
    "activos": 42,
    "por_tipo": ["area_tecnica", "experto_campo", "cuadrilla"]
  }
}
```
### 5.2 Indicadores Calculados
| Indicador | Fórmula | Interpretación |
|---|---|---|
| **Cobertura de datos** | `con_consentimiento / total × 100` | ≥80% Alta, ≥50% Media, ≥20% Baja, <20% Insuficiente |
| **Distribución de género** | Conteo por categoría | Desagregación por masculino, femenino, no binario, otro, sin dato |
| **Jóvenes (<35)** | Filtro por `anio_nacimiento > año_actual - 35` | Riesgo de relevo generacional |
| **Adultos mayores (55+)** | Filtro por `anio_nacimiento < año_actual - 55` | Próximos a retiro |
| **Rotación** | Ingresos - Salidas en período | Estabilidad organizacional |
### 5.3 Tipos de Personal de Organización (`TIPO_PERSONA_OPTIONS`)
| Valor | Label |
|---|---|
| `area_tecnica` | Área Técnica |
| `experto_campo` | Experta/o de campo |
| `cuadrilla` | Cuadrilla de trabajo |
| `administrativo` | Personal administrativo |
| `comercial` | Área comercial |
> **Nota**: "Experta/o de campo" es una de las pocas excepciones donde se usa barra, por ser un cargo formal.
---
## 6. Exportación de Reportes de Género e Inclusión
### 6.1 Reporte Principal: `generateGenderInclusionReport()`
**Archivo**: `src/lib/genderReportExport.ts`  
**Idiomas**: Español, Inglés, Alemán  
**Formato**: PDF (jsPDF)
#### Estructura del Reporte (7 secciones obligatorias)
1. **Identificación del Reporte**
   - Código único, tipo, versión del protocolo
   - Fecha de generación, organización, período de análisis
   - Nota de datos simulados (entorno demo)
2. **Resumen Ejecutivo Técnico**
   - Análisis de composición sociodemográfica
   - Énfasis en distribución de género en 4 dimensiones
3. **Marco Metodológico**
   - Protocolo de registro único de Nova Silva
   - Consentimiento informado explícito
   - Autodeclaración como criterio primario
   - Captura longitudinal para series de tiempo
4. **Resultados Desagregados por Género** (4 tablas)
   | Tabla | Contenido | Columnas |
   |---|---|---|
   | 4.1 Productores | Distribución por género | Categoría, Cantidad, %, Hectáreas, % Superficie |
   | 4.2 Parcelas | Titularidad por género | Categoría, Parcelas, %, Sup. Promedio |
   | 4.3 Jornales | Participación laboral | Categoría, Jornales, %, Kg Promedio |
   | 4.4 Liderazgo | Cargos formales | Categoría, Cargos, %, Tipo Cargo |
5. **Análisis Técnico**
   - 5.1 Análisis de Brechas: identificación de disparidades estructurales
   - 5.2 Participación Económica Real: más allá de conteos
6. **Implicaciones Operativas e Institucionales**
   - Diseño de asistencia técnica diferenciada
   - Criterios de elegibilidad para financiamiento
   - Estrategias de retención de talento joven
   - Cumplimiento de certificaciones (Fair Trade, RA)
   - Reportes a donantes y cooperación internacional
7. **Limitaciones Metodológicas**
   - Autodeclaración puede no capturar todas las identidades
   - Datos de liderazgo limitados a cargos formales registrados
   - Trabajo no remunerado (principalmente femenino) no reflejado en jornales
   - Ingresos de actividades complementarias no capturados
### 6.2 Traducciones
Cada sección tiene traducción completa a 3 idiomas:
```typescript
generateGenderInclusionReport('es'); // Español
generateGenderInclusionReport('en'); // Inglés  
generateGenderInclusionReport('de'); // Alemán
```
### 6.3 Datos Ficticios del Reporte
El reporte utiliza datos ficticios coherentes para demostración:
| Categoría | Mujeres | Hombres | No binario | Sin dato |
|---|---|---|---|---|
| Productores | 145 (38.2%) | 212 (55.8%) | 8 (2.1%) | 15 (3.9%) |
| Parcelas | 168 (31.2%) | 348 (64.7%) | 12 (2.2%) | 10 (1.9%) |
| Jornales | 2,840 (34.5%) | 5,120 (62.2%) | 180 (2.2%) | 90 (1.1%) |
| Liderazgo | 12 (30%) | 25 (62.5%) | 2 (5%) | 1 (2.5%) |
### 6.4 Estilo Visual del PDF
- **Color institucional**: RGB(34, 87, 60) — verde bosque Nova Silva
- **Secciones**: Fondo verde con texto blanco
- **Subsecciones**: Texto verde oscuro, negrita
- **Tablas**: Alternancia de fondo gris (#F0F0F0) para legibilidad
- **Nota de simulación**: Fondo amarillo claro con borde
---
## 7. Etiqueta en la Interfaz
### 7.1 Sidebar y Navegación
```
Sidebar Cooperativa → "Inclusión y Equidad"
```
**NO usar**: "Género e Inclusión Nivel 2", "Reporte de Género", "Módulo Demográfico"
### 7.2 Label del Botón de Exportación
```
"Género e Inclusión"
```
Sin sufijos como "Nivel 2" o "Avanzado" — fueron explícitamente rechazados.
### 7.3 Reporte de Productores (en `reportsExport.ts`)
El reporte de composición de productores también incluye una sección demográfica (`4.2 Perfil Demográfico`) con:
- Edad promedio
- % productores >55 años (riesgo de relevo)
- % productores <35 años
- Distribución por género
- Relación género-tenencia de tierra
---
## 8. Checklist de Verificación para Despliegue
### 8.1 Base de Datos
- [ ] Tabla `productores` tiene columnas: `genero_demografico`, `anio_nacimiento`, `consentimiento_reportes`
- [ ] Tabla `org_people` tiene columnas: `genero_demografico`, `anio_nacimiento`, `consentimiento_reportes`, `fecha_inicio`, `fecha_fin`, `activo`, `tipo_persona`
- [ ] Función SQL `get_inclusion_summary(org_uuid)` desplegada
- [ ] RLS en `org_people` filtra por `organization_id`
### 8.2 Frontend - Componentes
- [ ] `DemographicProfileForm.tsx` integrado en formularios de registro de productores
- [ ] `DemographicProfileForm.tsx` integrado en formularios de personal de organización
- [ ] Checkbox de consentimiento funciona correctamente
- [ ] Campos demográficos son opcionales (no bloquean guardado)
### 8.3 Frontend - Labels
- [ ] `labels.ts` importado y usado en todos los componentes con texto visible
- [ ] Ningún componente tiene labels hardcodeados para roles
- [ ] Sidebar muestra "Inclusión y Equidad" (no variantes)
- [ ] Botones de reporte muestran "Género e Inclusión" (sin "Nivel 2")
### 8.4 Exportación de Reportes
- [ ] `generateGenderInclusionReport()` genera PDF correctamente en 3 idiomas
- [ ] Estructura de 7 secciones completa
- [ ] Nota de datos simulados presente en entorno demo
- [ ] Tablas desagregadas por género incluyen 4 dimensiones
- [ ] Color institucional RGB(34, 87, 60) aplicado
- [ ] Nombre de archivo descargado: formato consistente
### 8.5 Saludos
- [ ] `getGreeting()` funciona en los 4 dashboards (cooperativa, exportador, certificadora, productor)
- [ ] Dashboard productor usa `genero_demografico` en lugar de inferencia por nombre
- [ ] Fallback a "Bienvenido" cuando no se puede determinar
---
## 9. Glosario de Campos en Base de Datos
| Campo BD | Tabla | Tipo | Valores posibles |
|---|---|---|---|
| `genero_demografico` | `productores` | text | masculino, femenino, no_binario, otro, prefiero_no_decir |
| `genero_demografico` | `org_people` | text | masculino, femenino, no_binario, otro, prefiero_no_decir |
| `anio_nacimiento` | `productores`, `org_people` | integer | 1926–2011 (rango dinámico) |
| `consentimiento_reportes` | `productores`, `org_people` | boolean | true/false (default: false) |
| `tipo_persona` | `org_people` | text | area_tecnica, experto_campo, cuadrilla, administrativo, comercial |
| `activo` | `org_people` | boolean | true/false (default: true) |
| `fecha_inicio` | `org_people` | date | Fecha de ingreso |
| `fecha_fin` | `org_people` | date | Fecha de salida (solo si inactivo) |
---
## 10. Arquitectura de Archivos Relacionados
```
src/
├── lib/
│   ├── labels.ts                    # Glosario centralizado de terminología inclusiva
│   ├── genderHelper.ts              # Heurística de género para saludos
│   └── genderReportExport.ts        # Generador PDF de reporte de género (788 líneas)
├── hooks/
│   └── useInclusionMetrics.ts       # Hooks: métricas, CRUD org_people, constantes UI
├── components/
│   └── inclusion/
│       └── DemographicProfileForm.tsx  # Formulario reutilizable de datos demográficos
└── pages/
    ├── cooperativa/
    │   └── DashboardCooperativa.tsx  # Usa getGreeting(user?.name)
    ├── exportador/
    │   └── DashboardExportador.tsx   # Usa getGreeting(user?.name)
    ├── productor/
    │   └── DashboardProductor.tsx    # Usa getGreeting(productor.genero_demografico)
    └── certificadora/
        └── DashboardCertificadora.tsx # Usa getGreeting(user?.name)
```
---
*Documento generado como referencia técnica para reconstrucción y auditoría del sistema de inclusión y lenguaje de género de Nova Silva.*
