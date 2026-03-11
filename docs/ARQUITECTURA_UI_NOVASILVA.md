# Arquitectura UI — Nova Silva

> Documento maestro de la estructura de interfaz.
> Principio: organizar por **dominio operativo**, no por tipo de actor.
> Última actualización: 2026-03-11

---

## 1. Principios Rectores

1. **Scope siempre por `organization_id`** — Nunca `auth.uid()` como org
2. **Layouts por rol, no apps separadas** — Un shell, múltiples configuraciones
3. **Módulos por dominio** — Producción, Agronomía, Resiliencia, Cumplimiento, Finanzas
4. **Offline-first** — PWA, cache, sync posterior, UX de campo

---

## 2. Estructura del App Shell

```
AppShell
├─ Sidebar (nav por dominio)
├─ Header contextual (Org / Módulo / Entidad)
├─ Workspace (content area)
└─ OfflineSyncBar (estado de conexión)
```

---

## 3. Navegación por Dominio

### Cooperativa (layout más completo)

```
Panel Principal

Producción
  Productoras y productores
  Parcelas
  Entregas
  Acopio
  Jornales

Agronomía
  Nutrición
  Nova Guard
  Nova Cup

Resiliencia
  Protocolo VITAL
  Inclusión y Equidad

Cumplimiento
  Trazabilidad
  EUDR

Comercial
  Exportadores Asociados
  Ofertas Recibidas

Finanzas
  Panel Financiero

Comunicación

Reportes

Administración
  Usuarios y Permisos
  Diagnóstico Org
```

### Productor (baja carga cognitiva)

```
Inicio

Mi Finca
  Parcelas
  Entregas
  Documentos

Agronomía
  Nutrición
  Sanidad Vegetal

Resiliencia
  Protocolo VITAL

Finanzas

Comunidad
```

### Exportador (origen + lotes + cumplimiento)

```
Panel Principal

Orígenes
  Proveedores
  Entregas y Acopio
  Nova Cup

Comercial
  Gestión de Café
  Lotes Comerciales
  Contratos
  Embarques
  Clientes

Cumplimiento
  EUDR
  Trazabilidad

Analítica

Finanzas

Administración
```

### Certificadora (read-only, estrecho)

```
Panel Principal

Auditorías
  Sesiones
  Verificaciones

Data Room
  Organizaciones
  Evidencia

Reportes
```

### Platform Admin

```
Panel de Administración

Plataforma
  Organizaciones
  Catálogos
  Usuarios
```

---

## 4. Patrones UI Obligatorios

### A. Header contextual (Breadcrumb)

```
[Organización] / [Módulo] / [Entidad]

Ejemplo: Coopelibertad / Nutrición / Parcela La Loma 3
```

Componente: `ContextualBreadcrumb.tsx`

### B. OfflineSyncBar

Barra fija en la parte inferior cuando no hay conexión:

```
⚠ Sin conexión — Los cambios se sincronizarán al reconectarse
```

Componente: `OfflineSyncBar.tsx`

### C. Semáforos semánticos

Usar tokens CSS del design system:
- `--success` (verde) → OK / compliant
- `--warning` (ámbar) → atención / en progreso
- `--destructive` (rojo) → riesgo / incumplimiento

Aplicaciones transversales: riesgo fitosanitario, ejecución nutricional, cumplimiento EUDR, riesgo climático.

### D. Progressive disclosure

Nivel 1: Resumen + estado + acción recomendada
Nivel 2: Detalle técnico + evidencia + histórico
Nivel 3: JSON / trazabilidad / auditoría

---

## 5. Relación entre Módulos

Nutrición **no** es un módulo aislado. Debe consumir y mostrar vínculos con:

| Módulo | Dato que aporta |
|--------|----------------|
| Nova Yield | Rendimiento proyectado |
| Nova Guard | Alertas fitosanitarias que afectan la recomendación |
| VITAL | Capacidad adaptativa y restricciones |
| Finanzas | Costo estimado del plan, necesidad de crédito |

Esto sigue la lógica: el dato agronómico se convierte en activo financiero y soporte de cumplimiento.

---

## 6. Componentes UI del Sistema

### Shell y navegación
- `DashboardLayout` — Shell principal con sidebar + header + offline bar
- `Sidebar` — Navegación por dominio con grupos colapsables
- `ContextualBreadcrumb` — Header [Org / Módulo / Entidad]
- `OfflineSyncBar` — Estado de conexión

### Componentes transversales
- `RiskBadge` — Semáforo semántico (success/warning/destructive)
- `PageHeader` — Título de página + acciones
- `ModuleGuard` — Protección por módulo activo
- `RoleGuard` — Protección por rol

### Producción
- `ActorsHub` — Lista universal de actores (etiquetas dinámicas por orgTipo)
- `ParcelasHub` — Gestión de parcelas con mapa
- `EntregasHub` — Entregas y acopio

### Agronomía
- `NutricionDashboard` — Hub de nutrición (8 pestañas)
- `SoilIntelligenceCard` — Inteligencia de suelo
- `PlanDetailView` — Detalle de plan nutricional
- `EvidenceUploader` — Carga de evidencia

### Resiliencia
- `VitalRadarChart` — Radar de dimensiones VITAL
- `ResilienceAssessmentForm` — Formulario de diagnóstico

---

## 7. Regla de Implementación

```
✅ Un AppShell → múltiples layouts por rol
✅ Navegación por dominio (Producción, Agronomía, Resiliencia...)
✅ Scope siempre organization_id
✅ Etiquetas dinámicas por orgTipo
✅ Progressive disclosure

❌ Apps separadas por tipo de actor
❌ Módulos huérfanos (Nutrición sin links a Yield/Guard)
❌ Scope por user.id
❌ Hardcodear "cooperativa" o "productores"
```
