# Dev Tenant Inspector — Guía de Uso

## Qué es
Panel flotante de diagnóstico multi-tenant visible solo en desarrollo (o para role=admin). Permite validar aislamiento de datos, RLS, módulos activos y configuración de Supabase sin salir del frontend.

## Acceso
- **DEV**: Siempre visible (bottom-right del dashboard)
- **Producción**: Solo visible para `role=admin`
- **Build producción + no admin**: No se renderiza

## Tabs

### 1. Context
Muestra el estado completo de la sesión:
- `User ID`, `Role`, `OrgTipo`, `OrgName`
- `OrganizationId`, `ProductorId`
- `Ready` status
- **Supabase Host**: badge verde "External" o rojo "NOT EXTERNAL" si no apunta a `qbwmsarqewxjuwgkdfmg.supabase.co`
- Lista de módulos activos
- Botón "Reset Demo Data" (solo en contexto demo)

### 2. RLS
Herramientas de validación de Row Level Security:

#### RLS Smoke Test
Ejecuta por cada tabla (`productores`, `parcelas`, `entregas`):
- **SELECT Own**: query con `cooperativa_id = organizationId` → debe pasar
- **SELECT Cross**: query sin filtro y compara con own → diferencia debe ser 0

Resultados:
- ✅ Pass: comportamiento esperado
- ❌ Fail: datos cross-org visibles → **MULTI-TENANT BREACH**
- ⚠️ Error: tabla no existe o error de permisos

#### Check Profile
Verifica que `profiles` es visible bajo RLS para el usuario actual.

### 3. Modules
Lista todos los módulos posibles con estado:
- 🟢 Activo
- ⚪ Inactivo
- Botón ⏸ para simular desactivación (solo frontend, no toca backend)
- Botón ↺ para reactivar simulación

### 4. Data
- **Run Tenant Count**: cuenta registros por tabla filtrados por `cooperativa_id`
- Muestra tabla con count y status
- Confirma filtro aplicado

## Cómo interpretar alertas

### 🔴 MULTI-TENANT BREACH
Se detectaron registros cross-org visibles. La columna "Cross" muestra cuántos registros de otras organizaciones son visibles. **Esto indica un problema de RLS.**

### 🔴 NOT EXTERNAL
El cliente Supabase no apunta al host externo esperado. Puede indicar que Lovable Cloud inyectó otro URL.

### ⚠️ Profile NOT visible
El RLS de `profiles` no permite al usuario ver su propio perfil. Verificar política RLS.

## Cómo validar antes de demo
1. Login como cada rol (cooperativa, exportador, productor)
2. En tab RLS: ejecutar "RLS Smoke Test"
3. Verificar: todas las filas en ✅, Cross count = 0
4. En tab Context: confirmar "External" badge verde
5. En tab Modules: verificar módulos esperados activos

## Seguridad
- No incluye service role key
- No loggea tokens ni anon key
- Usa JWT real del usuario autenticado
- Solo queries SELECT con count (head: true)
- No modifica datos
