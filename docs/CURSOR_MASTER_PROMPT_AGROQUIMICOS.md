# Master Prompt para Cursor — Motor de Cumplimiento de Agroquímicos

> **Contexto**: Nova Silva es una plataforma multi-tenant para cooperativas y exportadores de café.
> Este prompt guía la implementación del submotor de cumplimiento agroquímico (Capa 4: Restricciones Ambientales).
> **Prerequisitos**: Tablas `ag_active_ingredients`, `ag_market_mrls`, `ag_certification_rules`, `org_certifications`, `org_export_markets` ya desplegadas en Supabase.
> Última actualización: 2026-03-07

---

## Arquitectura

### Supabase externo
- URL: `https://qbwmsarqewxjuwgkdfmg.supabase.co`
- Client: `src/integrations/supabase/client.ts`
- **Prohibido**: `import.meta.env`, `supabase.functions.invoke()`
- Edge Functions se invocan con `fetch()` directo + headers manuales

### Multi-tenancy
- Tenant = `organization_id` (desde `useOrgContext()`)
- Hook central: `src/hooks/useOrgContext.ts`
- RPCs de cumplimiento usan `_org_id` para filtrar mercados y certificaciones de la org

---

## Tablas de referencia (Supabase)

| Tabla | Tipo | Descripción |
|-------|------|-------------|
| `ag_active_ingredients` | Catálogo global | ~48 moléculas con flags HHP, Estocolmo, Rotterdam, Montreal |
| `ag_commercial_products` | Catálogo global | Productos comerciales con formulaciones |
| `ag_product_ingredients` | Puente | Ingredientes × Productos (concentración %) |
| `ag_market_mrls` | Catálogo versionado | LMR por ingrediente × mercado (EU, USA, JAPAN, CHINA, KOREA, CODEX) |
| `ag_certification_rules` | Catálogo versionado | Reglas por ingrediente × certificadora (fairtrade, gcp, rainforest_alliance, etc.) |
| `org_certifications` | Tenant | Certificaciones activas de cada organización |
| `org_export_markets` | Tenant | Mercados de exportación de cada organización |

### RPCs disponibles

```sql
-- Ingredientes bloqueados para una org (combina mercados + certs + HHP)
get_blocked_ingredients(_org_id uuid) → (ingredient_id, nombre_comun, bloqueado_por, nivel, detalle)

-- Validar un ingrediente específico
check_ingredient_compliance(_org_id, _ingredient_id) → (is_allowed, bloqueado_por, nivel, detalle)

-- Ingredientes en phase-out (alertas tempranas)
get_phaseout_ingredients(_org_id) → (ingredient_id, nombre_comun, certificadora, fecha_phase_out, dias_restantes)
```

---

## Fase 1: Hook de cumplimiento

### `src/hooks/useComplianceEngine.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';

interface BlockedIngredient {
  ingredient_id: string;
  nombre_comun: string;
  clase_funcional: string;
  bloqueado_por: string;    // 'mercado:EU', 'cert:fairtrade', 'convenio:estocolmo'
  nivel: string;            // 'prohibido', 'lista_roja', 'cancelado'
  detalle: string;
}

interface PhaseoutIngredient {
  ingredient_id: string;
  nombre_comun: string;
  certificadora: string;
  nivel_restriccion: string;
  fecha_phase_out: string;
  dias_restantes: number;
}

export function useBlockedIngredients() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['blocked-ingredients', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_blocked_ingredients', {
        _org_id: organizationId!,
      });
      if (error) throw error;
      return (data ?? []) as BlockedIngredient[];
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 30, // 30 min — catálogos cambian poco
  });
}

export function usePhaseoutIngredients() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['phaseout-ingredients', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_phaseout_ingredients', {
        _org_id: organizationId!,
      });
      if (error) throw error;
      return (data ?? []) as PhaseoutIngredient[];
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 30,
  });
}

/** Check one ingredient in-memory (from cached blocklist) */
export function isIngredientBlocked(
  blocked: BlockedIngredient[],
  ingredientId: string
): { blocked: boolean; reasons: BlockedIngredient[] } {
  const reasons = blocked.filter(b => b.ingredient_id === ingredientId);
  return { blocked: reasons.length > 0, reasons };
}
```

---

## Fase 2: Componentes UI

### 2.1 `ComplianceStatusBadge`
Badge que indica el estatus de un ingrediente:
- 🔴 `prohibido` / `lista_roja` / `cancelado` → badge destructive
- 🟠 `lista_naranja` / `restringido` / `phase_out_2026` → badge warning
- 🟡 `lista_amarilla` / `phase_out_2030` → badge outline amarillo
- 🟢 permitido → badge default

### 2.2 `BlockedIngredientsPanel`
Panel con la lista de ingredientes bloqueados para la org actual:
- Agrupa por `bloqueado_por` (mercado vs certificación vs convenio)
- Muestra `detalle` con tooltip
- Usa `useBlockedIngredients()`

### 2.3 `PhaseoutAlertsCard`
Tarjeta de alertas tempranas:
- Lista ingredientes con `dias_restantes` < 365
- Código de color por urgencia (< 180 días = rojo, < 365 = naranja)
- Link a plan de transición

### 2.4 `ComplianceGuard` (wrapper)
Componente que envuelve la selección de productos en formularios:
- Antes de confirmar una aplicación, verifica `isIngredientBlocked()`
- Si bloqueado: muestra diálogo de error con razones + sugiere alternativas
- Si naranja: muestra advertencia con condiciones fenológicas

---

## Fase 3: Integración con Edge Function

### Modificar `generate_nutrition_plan_v2`
Agregar **Capa 4** al pipeline:

```typescript
// Después de generar las prescripciones (Capa 1-3):
// 4. Filtrado por cumplimiento
const blocked = await getBlockedIngredients(orgId); // consulta DB

for (const prescripcion of prescripciones) {
  const match = blocked.find(b =>
    prescripcion.ingredientes_activos?.includes(b.nombre_comun)
  );

  if (match) {
    prescripcion.bloqueado = true;
    prescripcion.razon_bloqueo = match.bloqueado_por;
    prescripcion.explain_json.capa4 = {
      accion: 'HARD_STOP',
      ingrediente: match.nombre_comun,
      regulacion: match.bloqueado_por,
      nivel: match.nivel,
      detalle: match.detalle,
    };

    // Buscar alternativa permitida
    const alternativa = await buscarAlternativa(
      prescripcion.objetivo_nutricional,
      blocked,
      orgId
    );
    if (alternativa) {
      prescripcion.alternativa = alternativa;
    } else {
      prescripcion.alerta_naranja = true; // requiere intervención humana
    }
  }
}
```

---

## Fase 4: Tab en OperacionesHub

### `CumplimientoTab` (nueva pestaña)
- **Ubicación**: `src/components/cooperativa/operaciones/CumplimientoTab.tsx`
- **Contenido**:
  1. `OrgCertificationsManager` — CRUD de certificaciones de la org
  2. `OrgExportMarketsManager` — CRUD de mercados de exportación
  3. `BlockedIngredientsPanel` — lista de sustancias bloqueadas (resultado dinámico)
  4. `PhaseoutAlertsCard` — alertas de phase-out

### Agregar al `OperacionesHub.tsx`:
```tsx
import { ShieldCheck } from 'lucide-react';
// Tab value="cumplimiento", label="Cumplimiento", icon={ShieldCheck}
```

---

## Reglas críticas de implementación

1. **NUNCA** usar colores directos (`text-red-500`). Usar tokens semánticos del design system.
2. **NUNCA** hardcodear listas de productos prohibidos en el frontend — siempre consultar las RPCs.
3. Los catálogos son **versionados** (`ruleset_version`). Siempre usar la versión más reciente.
4. Las condiciones fenológicas (Lista Naranja) requieren cruzar con datos de floración de la parcela.
5. El `explain_json` de cada plan debe documentar cada decisión de Capa 4 para auditabilidad EUDR.
6. Los componentes de formulario deben usar `ComplianceGuard` antes de permitir registrar aplicaciones.

---

## Estructura de archivos esperada

```
src/
├── hooks/
│   └── useComplianceEngine.ts         # Hook con useBlockedIngredients, usePhaseoutIngredients
├── components/
│   └── cumplimiento/
│       ├── ComplianceStatusBadge.tsx   # Badge semántico por nivel de restricción
│       ├── BlockedIngredientsPanel.tsx # Panel de ingredientes bloqueados
│       ├── PhaseoutAlertsCard.tsx      # Alertas de phase-out
│       ├── ComplianceGuard.tsx         # Wrapper de validación en formularios
│       ├── OrgCertificationsManager.tsx# CRUD certificaciones de la org
│       └── OrgExportMarketsManager.tsx # CRUD mercados de exportación
│   └── cooperativa/operaciones/
│       └── CumplimientoTab.tsx         # Tab integrada en OperacionesHub
├── lib/
│   └── complianceEngine.ts            # Lógica pura: filtrado, clasificación, alternativas
```
