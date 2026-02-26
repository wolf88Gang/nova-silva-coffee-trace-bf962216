# Onboarding Refactor — QA Checklist

## Resumen
Flujo de onboarding de 3 pasos para crear organizaciones. Org-centric desde el primer clic, sin mencionar "cooperativa" como default.

## Archivos

### Nuevos
- `src/pages/onboarding/OnboardingOrganization.tsx` — Wizard principal (3 steps)
- `src/components/onboarding/StepOrgType.tsx` — Step 1: selección tipo org
- `src/components/onboarding/StepModules.tsx` — Step 2: módulos configurables
- `src/components/onboarding/StepConfirmation.tsx` — Step 3: datos + creación

### Modificados
- `src/App.tsx` — Ruta `/onboarding/organization`
- `src/components/RoleBasedRedirect.tsx` — Redirige a onboarding si user sin org

## Flujo

```
Step 1: ¿Qué tipo de organización eres?
  → Cooperativa | Beneficio Privado | Productor Empresarial | Exportador

Step 2: Configura tus módulos
  → Pre-seleccionados por tipo, toggleables

Step 3: Confirma tu organización
  → Nombre, País, Tamaño, Plan → INSERT en organizaciones
```

## QA Checklist

### ✅ Navegación
- [ ] `/onboarding/organization` muestra wizard paso 1
- [ ] Barra de progreso avanza correctamente (33% → 66% → 100%)
- [ ] Botones "Siguiente" y "Atrás" funcionan

### ✅ Step 1 - Tipo de organización
- [ ] 4 tarjetas con iconos y features
- [ ] Selección resalta tarjeta con ring primario
- [ ] No se puede avanzar sin seleccionar
- [ ] NO dice "Crear cooperativa" en ningún lugar

### ✅ Step 2 - Módulos
- [ ] Módulos pre-seleccionados según tipo elegido
- [ ] Cooperativa: productores, parcelas, entregas, vital, créditos...
- [ ] Exportador: lotes_comerciales, contratos, eudr, finanzas...
- [ ] Productor empresarial: parcelas, vital, finanzas, inventario
- [ ] Badges "Recomendado" en módulos default
- [ ] Se pueden activar/desactivar libremente

### ✅ Step 3 - Confirmación
- [ ] Muestra resumen: tipo + módulos seleccionados
- [ ] Formulario: nombre org, país, tamaño, plan
- [ ] Validación: nombre y país requeridos
- [ ] Botón "Crear organización" (no "Crear cooperativa")

### ✅ Creación
- [ ] INSERT en `organizaciones` con tipo_organizacion correcto
- [ ] UPDATE en `profiles` con organization_id
- [ ] UPSERT en `user_roles` con role mapeado
- [ ] Redirige a `/app` → dashboard correspondiente

### ✅ Redirect automático
- [ ] Usuario autenticado sin organization_id → redirigido a `/onboarding/organization`
- [ ] Demo users no se redirigen a onboarding
- [ ] Usuario con org → va directo a dashboard

### ✅ Multi-org future-ready
- [ ] No hay UNIQUE constraint fuerte que impida multi-org futuro
- [ ] El modelo profiles.organization_id es nullable
