# Nova Silva — Prompt Maestro para Cursor / Supabase / AI Assistants

> **Versión:** 2026-03-05
> **Propósito:** Documento canónico que define la arquitectura, contratos de datos, convenciones y restricciones del proyecto. Cualquier agente AI (Cursor, Supabase AI, Lovable, etc.) DEBE respetar este documento como fuente de verdad.

---

## 1. Stack Tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | SPA, no SSR |
| Estilos | Tailwind CSS + shadcn/ui | Tokens semánticos HSL en `index.css` |
| State | TanStack React Query v5 | `staleTime: 5min`, `refetchOnWindowFocus: false` |
| Routing | react-router-dom v6 | Rutas por rol (`/cooperativa/*`, `/exportador/*`, etc.) |
| Backend | Supabase (EXTERNO) | PostgreSQL + Auth + RLS + Edge Functions |
| Supabase URL | `https://qbwmsarqewxjuwgkdfmg.supabase.co` | Hardcoded en `src/integrations/supabase/client.ts` |
| Auth | Supabase Auth (email/password) | Roles en tabla `user_roles`, NO en JWT claims |

### Restricciones Absolutas
- **NO** usar `import.meta.env.VITE_SUPABASE_URL` — URL hardcoded
- **NO** usar `supabase.functions.invoke()` — usar `fetch()` con URL completa
- **NO** usar Next.js, Angular, Vue, SSR
- **NO** usar localStorage como base de datos
- **NO** almacenar roles en `profiles` — solo en `user_roles`
- **NO** usar `cooperativa_id` en queries — solo `organization_id` (`ORG_ID_ONLY = true`)

---

## 2. Arquitectura Multi-Tenant

### Modelo de Tenant
```
platform_organizations (tabla madre)
  ├── id (uuid) ← Este es el "tenant ID"
  ├── nombre
  ├── tipo (text) ← Determina UI, módulos, terminología
  └── ...

profiles (1:1 con auth.users)
  ├── user_id → auth.users(id)
  ├── organization_id → platform_organizations(id) ← TENANT LINK
  ├── productor_id (nullable) ← Solo para rol productor
  ├── name
  └── organization_name
```

### Resolución del Tenant (Frontend)
```
AuthContext.buildUserFromSession()
  → getUserProfile(userId) → profiles.organization_id
  → getOrganizationInfo(orgId) → organizaciones.tipo, organizaciones.nombre
  → Resultado: user.organizationId, user.orgTipo, user.organizationName
```

**Hook canónico:** `useOrgContext()` — única fuente de verdad para `organizationId`, `role`, `orgTipo`, `activeModules`.

### Resolución del Tenant (SQL / RLS)
```sql
-- Función SECURITY DEFINER que obtiene org_id del usuario autenticado
public.get_user_organization_id(auth.uid())
  → SELECT organization_id FROM profiles WHERE user_id = $1
```

### Filtrado en Queries
```typescript
import { applyOrgFilter } from '@/lib/orgFilter';

let q = supabase.from('productores').select('*');
q = applyOrgFilter(q, organizationId);
// Equivale a: .eq('organization_id', organizationId)
```

---

## 3. Sistema de Roles y Permisos

### Capa 1: Rol de Plataforma (`user_roles.role`)
Define el tipo de cuenta/vista del usuario.

| role | Vista/Dashboard | Tabla |
|---|---|---|
| `cooperativa` | `/cooperativa/*` | `user_roles` |
| `exportador` | `/exportador/*` | `user_roles` |
| `productor` | `/productor/*` | `user_roles` |
| `tecnico` | `/tecnico/*` | `user_roles` |
| `certificadora` | `/certificadora/*` | `user_roles` |
| `admin` | `/admin/*` | `user_roles` |

### Capa 2: Rol Interno de Organización (`organizacion_usuarios.rol_interno`)
Define permisos granulares DENTRO de la organización.

| rol_interno | Label UI | Descripción |
|---|---|---|
| `admin_org` | Administrador | Acceso total dentro de la org |
| `tecnico` | Técnico de campo | Productores, parcelas, VITAL |
| `comercial` | Comercial | Lotes, contratos, EUDR, finanzas |
| `auditor` | Auditor interno | Solo lectura en parcelas, EUDR, finanzas |
| `viewer` | Solo lectura | Sin escritura |

### Capa 3: Permisos Granulares (8 booleanos en `organizacion_usuarios`)

| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `permiso_gestion_productores` | boolean | false | CRUD de actores/productores |
| `permiso_crear_editar_productores` | boolean | false | Crear y editar productores |
| `permiso_ver_parcelas_clima` | boolean | false | Ver parcelas y evaluación VITAL |
| `permiso_gestion_lotes_acopio` | boolean | false | Gestión de lotes de acopio |
| `permiso_ver_eudr_exportador` | boolean | false | Ver paquetes EUDR y trazabilidad |
| `permiso_gestion_contratos` | boolean | false | Gestión de contratos |
| `permiso_gestion_configuracion_org` | boolean | false | Configuración de la organización |
| `permiso_ver_informes_financieros` | boolean | false | Ver informes financieros |

### Matriz de Permisos por Defecto

| Permiso | admin_org | tecnico | comercial | auditor | viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| gestion_productores | ✅ | ✅ | ❌ | ❌ | ❌ |
| crear_editar_productores | ✅ | ✅ | ❌ | ❌ | ❌ |
| ver_parcelas_clima | ✅ | ✅ | ❌ | ✅ | ❌ |
| gestion_lotes_acopio | ✅ | ❌ | ✅ | ❌ | ❌ |
| ver_eudr_exportador | ✅ | ❌ | ✅ | ✅ | ❌ |
| gestion_contratos | ✅ | ❌ | ✅ | ❌ | ❌ |
| gestion_configuracion_org | ✅ | ❌ | ❌ | ❌ | ❌ |
| ver_informes_financieros | ✅ | ❌ | ✅ | ✅ | ❌ |

**Fuente de verdad frontend:** `src/config/orgPermissions.ts`

---

## 4. Esquema SQL — Tablas Clave

### 4.1 `organizacion_usuarios` (YA CREADA)

```sql
CREATE TABLE public.organizacion_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id uuid NOT NULL REFERENCES platform_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol_interno text NOT NULL DEFAULT 'viewer',
  rol_visible text,                    -- Texto libre: "Jefa de certificaciones"
  scope text DEFAULT 'full',           -- Reservado
  activo boolean NOT NULL DEFAULT true,
  -- 8 permisos booleanos
  permiso_gestion_productores boolean NOT NULL DEFAULT false,
  permiso_crear_editar_productores boolean NOT NULL DEFAULT false,
  permiso_ver_parcelas_clima boolean NOT NULL DEFAULT false,
  permiso_gestion_lotes_acopio boolean NOT NULL DEFAULT false,
  permiso_ver_eudr_exportador boolean NOT NULL DEFAULT false,
  permiso_gestion_contratos boolean NOT NULL DEFAULT false,
  permiso_gestion_configuracion_org boolean NOT NULL DEFAULT false,
  permiso_ver_informes_financieros boolean NOT NULL DEFAULT false,
  -- Denormalized
  user_name text,
  user_email text,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organizacion_id, user_id)
);

-- Índices
CREATE INDEX idx_org_usuarios_org ON organizacion_usuarios(organizacion_id);
CREATE INDEX idx_org_usuarios_user ON organizacion_usuarios(user_id);

-- Trigger updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizacion_usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Funciones Helper (SECURITY DEFINER)

```sql
-- Obtener org_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_uid uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM profiles WHERE user_id = _uid LIMIT 1;
$$;

-- ¿Es admin_org en su organización?
CREATE OR REPLACE FUNCTION public.is_org_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizacion_usuarios
    WHERE user_id = _uid AND rol_interno = 'admin_org' AND activo = true
  );
$$;

-- ¿Es admin de plataforma?
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _uid AND role = 'admin'
  );
$$;
```

### 4.3 Políticas RLS

```sql
ALTER TABLE organizacion_usuarios ENABLE ROW LEVEL SECURITY;

-- SELECT: miembros de la misma org o admin plataforma
CREATE POLICY "org_usuarios_select" ON organizacion_usuarios FOR SELECT TO authenticated
  USING (
    organizacion_id = get_user_organization_id(auth.uid())
    OR is_admin(auth.uid())
  );

-- INSERT/UPDATE/DELETE: admin_org de la misma org o admin plataforma
CREATE POLICY "org_usuarios_manage" ON organizacion_usuarios FOR ALL TO authenticated
  USING (
    (organizacion_id = get_user_organization_id(auth.uid()) AND is_org_admin(auth.uid()))
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    (organizacion_id = get_user_organization_id(auth.uid()) AND is_org_admin(auth.uid()))
    OR is_admin(auth.uid())
  );
```

### 4.4 Trigger Anti Auto-Desactivación

```sql
-- Impide que un admin_org se desactive, pierda su rol, o se borre a sí mismo
CREATE OR REPLACE FUNCTION prevent_self_demotion() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.user_id = auth.uid() AND OLD.rol_interno = 'admin_org' THEN
    RAISE EXCEPTION 'no_puedes_eliminarte';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.user_id = auth.uid() AND OLD.rol_interno = 'admin_org' THEN
      IF NEW.activo = false THEN RAISE EXCEPTION 'no_puedes_deshabilitarte'; END IF;
      IF NEW.rol_interno <> 'admin_org' THEN RAISE EXCEPTION 'no_puedes_perder_admin_org'; END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_prevent_self_demotion
  BEFORE UPDATE OR DELETE ON organizacion_usuarios
  FOR EACH ROW EXECUTE FUNCTION prevent_self_demotion();
```

---

## 5. Tablas Existentes Relevantes

| Tabla | Tenant Column | Notas |
|---|---|---|
| `profiles` | `user_id` (PK) | 1:1 con auth.users. Tiene `organization_id` |
| `user_roles` | `user_id` | Rol de plataforma. UNIQUE(user_id, role) |
| `platform_organizations` | `id` (PK) | Tabla madre de tenants |
| `organizaciones` | `id` (PK) | Legacy. Tiene `tipo`, `nombre`. Leída por AuthContext |
| `productores` | `organization_id` | Actores/socios |
| `parcelas` | `organization_id` | Plots |
| `entregas` | `organization_id` | Deliveries |
| `lotes_acopio` | `cooperativa_id` | ⚠️ Legacy, debe migrarse a `organization_id` |
| `cataciones` | `organization_id` | Quality scores |
| `notifications` | `organization_id` | In-app notifications |
| `lotes_ofrecidos` | `organization_id` | Commercial offers |
| `organizacion_usuarios` | `organizacion_id` | Permisos por usuario (NEW) |
| `billing_subscriptions` | `org_id` | Solo lectura |

---

## 6. Sistema de Módulos

### Resolución de Módulos Activos
```
1. org.modules (jsonb array) → Si existe y no está vacío, usar
2. Legacy flags: is_eudr_active, is_vital_active → Augmentar defaults
3. Defaults por orgTipo → getOrgDefaultModules(orgTipo)
```

### Módulos Disponibles
```typescript
type OrgModule =
  | 'core'              // Siempre activo
  | 'productores'       // Gestión de actores
  | 'parcelas'          // Fincas, mapas
  | 'entregas'          // Entregas de campo
  | 'lotes_acopio'      // Lotes de procesamiento
  | 'lotes_comerciales' // Lotes comerciales/export
  | 'contratos'         // Contratos con compradores
  | 'calidad'           // Nova Cup / cataciones
  | 'vital'             // Protocolo VITAL
  | 'eudr'              // Cumplimiento EUDR
  | 'finanzas'          // Finanzas
  | 'creditos'          // Créditos a productores
  | 'jornales'          // Gestión laboral
  | 'inventario'        // Inventario
  | 'mensajes'          // Mensajería interna
  | 'inclusion'         // Inclusión y equidad
  | 'admin';            // Admin plataforma
```

### Módulos por Defecto según orgTipo

| orgTipo | Módulos |
|---|---|
| `cooperativa` | core, productores, parcelas, entregas, lotes_acopio, calidad, vital, finanzas, creditos, jornales, inventario, mensajes, inclusion |
| `exportador` | core, productores, parcelas, entregas, lotes_acopio, lotes_comerciales, contratos, calidad, eudr, finanzas, mensajes |
| `productor` / `productor_empresarial` | core, parcelas, vital, finanzas, inventario, mensajes |
| `beneficio_privado` | core, productores, parcelas, entregas, lotes_acopio, calidad, vital, finanzas, jornales, inventario, mensajes |
| `certificadora` | core, vital, eudr |
| `tecnico` | core, productores, parcelas, vital |
| `admin` | core, admin |

**Fuente:** `src/lib/org-modules.ts`

---

## 7. Tipos de Organización (Arquetipos)

| orgTipo | Label | Caso de Uso |
|---|---|---|
| `cooperativa` | Cooperativa | Gestión de socios, acopio, créditos, VITAL |
| `exportador` | Exportador | Comercial: lotes, contratos, EUDR. Puede ser operativo (con campo) o trading-only |
| `productor` | Productor | Finca individual con venta directa |
| `productor_empresarial` | Productor Empresarial | Empresa privada de origen con autonomía total |
| `beneficio_privado` | Beneficio Privado | Compra y procesamiento de café |
| `certificadora` | Certificadora | Auditoría y verificación externa |
| `aggregator` | Aggregator | Consolidación de lotes de múltiples orígenes |
| `tecnico` | Técnico | Acceso restringido a campo y VITAL |
| `admin` | Admin | Admin interno Nova Silva |

---

## 8. Hooks y Contratos de Datos del Frontend

### 8.1 `useOrgContext()` — Contexto Central
```typescript
interface OrgContext {
  organizationId: string | null;  // UUID del tenant
  productorId: string | null;     // Solo para rol productor
  role: string | null;            // user_roles.role
  orgTipo: OrgTipo | null;        // organizaciones.tipo
  orgName: string | null;         // organizaciones.nombre
  activeModules: OrgModule[];     // Módulos activos resueltos
  isLoading: boolean;
  isReady: boolean;
}
```

### 8.2 `useOrganizacionUsuarios(organizacionId)` — Listar Usuarios
```typescript
// Query: SELECT * FROM organizacion_usuarios WHERE organizacion_id = $1 ORDER BY created_at
// Returns: OrganizacionUsuario[]
interface OrganizacionUsuario {
  id: string;
  organizacion_id: string;
  user_id: string;
  rol_interno: RolInterno;      // 'admin_org' | 'tecnico' | 'comercial' | 'auditor' | 'viewer'
  rol_visible: string | null;   // Texto libre
  scope: string;
  activo: boolean;
  permiso_gestion_productores: boolean;
  permiso_crear_editar_productores: boolean;
  permiso_ver_parcelas_clima: boolean;
  permiso_gestion_lotes_acopio: boolean;
  permiso_ver_eudr_exportador: boolean;
  permiso_gestion_contratos: boolean;
  permiso_gestion_configuracion_org: boolean;
  permiso_ver_informes_financieros: boolean;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_email: string | null;
}
```

### 8.3 `useAddOrganizacionUsuario()` — Invitar Miembro
```typescript
interface AddOrgUserInput {
  organizacionId: string;         // UUID org
  email: string;                  // Email del nuevo miembro
  name: string;                   // Nombre completo
  rolInterno: RolInterno;         // Rol interno seleccionado
  rolVisible?: string;            // Badge visible (opcional)
  permisos?: Partial<PermissionDefaults>; // Override de defaults (opcional)
}
// Flujo:
// 1. supabase.auth.signUp({ email, password: randomUUID().slice(0,12) })
// 2. wait 1s (trigger creates profile)
// 3. INSERT INTO organizacion_usuarios { organizacion_id, user_id, rol_interno, ...permisos }
```

### 8.4 `useUpdateOrganizacionUsuario()` — Editar Permisos
```typescript
interface UpdateOrgUserInput {
  id: string;                     // organizacion_usuarios.id
  organizacionId: string;         // Para invalidar query cache
  rolInterno?: RolInterno;
  rolVisible?: string | null;
  activo?: boolean;
  permisos?: Partial<PermissionDefaults>;
}
// UPDATE organizacion_usuarios SET ... WHERE id = $1
```

### 8.5 `useDeleteOrganizacionUsuario()` — Eliminar Miembro
```typescript
// DELETE FROM organizacion_usuarios WHERE id = $1
// NO elimina la cuenta auth.users
```

---

## 9. Estructura de Archivos Clave

```
src/
├── integrations/supabase/client.ts   — Supabase client (hardcoded URL)
├── contexts/AuthContext.tsx           — Auth state, session, user builder
├── hooks/
│   ├── useOrgContext.ts              — Central org context hook
│   ├── useOrganizacionUsuarios.ts    — CRUD para organizacion_usuarios
│   ├── useCurrentOrgId.ts            — Simple org ID accessor
│   └── useDataScopes.ts             — Data scope helpers
├── config/
│   ├── orgPermissions.ts             — Roles, permisos, grupos por orgTipo
│   └── featureFlags.ts              — ORG_ID_ONLY, module flags
├── lib/
│   ├── org-modules.ts               — Module system, defaults by orgTipo
│   ├── orgFilter.ts                 — applyOrgFilter() for queries
│   ├── roles.ts                     — Platform roles, permission matrix
│   └── org-terminology.ts           — Labels adaptativos por orgTipo
├── components/
│   ├── admin/
│   │   ├── AddOrgUserDialog.tsx      — Dialog invitar miembro
│   │   └── OrgUserPermissionsEditor.tsx — Dialog editar permisos
│   ├── layout/
│   │   ├── Sidebar.tsx              — Nav filtrado por módulos y rol
│   │   ├── DashboardLayout.tsx      — Layout con role guard
│   │   └── ProfileDropdown.tsx      — Dropdown perfil usuario
│   └── auth/
│       ├── ModuleGuard.tsx          — Guarda por módulo activo
│       └── RoleGuard.tsx            — Guarda por rol
├── pages/
│   ├── cooperativa/UsuariosOrg.tsx   — Página de gestión de usuarios (cooperativa)
│   ├── exportador/                  — Páginas exportador
│   └── ...
└── types/index.ts                    — TypeScript interfaces
```

---

## 10. Convenciones de Código

### Queries a Supabase
```typescript
// ✅ Correcto — usa applyOrgFilter
const { organizationId } = useOrgContext();
let q = supabase.from('productores').select('*');
q = applyOrgFilter(q, organizationId);

// ❌ Incorrecto — usa cooperativa_id
.eq('cooperativa_id', someId)

// ✅ Para tablas no tipadas aún
await (supabase as any).from('organizacion_usuarios').select('*')

// ✅ Edge Functions
const { data: { session } } = await supabase.auth.getSession();
const res = await fetch('https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/my-function', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOi...', // anon key
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({ ... }),
});
```

### Componentes UI
```typescript
// ✅ Usar tokens semánticos
className="bg-background text-foreground border-border"
className="bg-primary text-primary-foreground"

// ❌ No usar colores directos
className="bg-white text-black border-gray-200"
```

### Feature Flags
```typescript
import { ORG_ID_ONLY } from '@/config/featureFlags';
// ORG_ID_ONLY = true → No usar cooperativa_id fallbacks
```

---

## 11. Flujos Críticos

### Login → Dashboard
```
1. supabase.auth.signInWithPassword(email, password)
2. onAuthStateChange('SIGNED_IN')
3. buildUserFromSession(session)
   a. getUserProfile(uid) → profiles.organization_id
   b. getUserRole(uid) → user_roles.role
   c. getOrganizationInfo(orgId) → organizaciones.tipo, nombre
4. setUser({ id, role, organizationId, orgTipo, ... })
5. RoleBasedRedirect → /{role}/dashboard
```

### Invitar Usuario
```
1. Admin abre AddOrgUserDialog
2. Llena: nombre, email, rol interno, permisos
3. handleSubmit():
   a. supabase.auth.signUp({ email, tempPassword })
   b. wait 1s (DB trigger creates profile)
   c. INSERT organizacion_usuarios con permisos
4. Toast success, invalidar cache
```

### Verificar Permisos del Usuario Actual
```typescript
const { organizationId } = useOrgContext();
const { data: orgUsers } = useOrganizacionUsuarios(organizationId);
const { user } = useAuth();
const myPerms = orgUsers?.find(u => u.user_id === user?.id);
const canManage = myPerms?.permiso_gestion_productores ?? false;
```

---

## 12. Reglas para Nuevas Tablas

Al crear cualquier tabla nueva:

1. **Siempre** incluir `organization_id uuid NOT NULL REFERENCES platform_organizations(id)`
2. **Siempre** habilitar RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
3. **Siempre** crear policy SELECT con: `organization_id = get_user_organization_id(auth.uid()) OR is_admin(auth.uid())`
4. **Siempre** crear policy de escritura restringida (admin_org o roles específicos)
5. **Siempre** crear índice en `organization_id`
6. **Siempre** agregar trigger `updated_at` si la tabla tiene esa columna
7. **Nunca** usar `cooperativa_id` como columna de tenant

---

## 13. Smoke Tests Post-Migración

```sql
-- 1. Verificar función helper
SELECT public.get_user_organization_id(auth.uid());

-- 2. Verificar SELECT (debe filtrar por org)
SELECT * FROM organizacion_usuarios;

-- 3. Verificar INSERT como admin_org → debe funcionar
INSERT INTO organizacion_usuarios (organizacion_id, user_id, rol_interno)
VALUES (get_user_organization_id(auth.uid()), 'some-user-uuid', 'viewer');

-- 4. Verificar auto-desactivación → debe fallar
UPDATE organizacion_usuarios SET activo = false WHERE user_id = auth.uid() AND rol_interno = 'admin_org';
-- Expected: ERROR 'no_puedes_deshabilitarte'

-- 5. Verificar updated_at trigger
UPDATE organizacion_usuarios SET rol_visible = 'Test' WHERE id = 'some-id';
SELECT updated_at FROM organizacion_usuarios WHERE id = 'some-id';
```

---

## 14. Terminología Adaptativa

El frontend adapta labels según `orgTipo`:

| Concepto | cooperativa | exportador | productor_empresarial |
|---|---|---|---|
| Actores | Personas socias | Proveedores | Unidades productivas |
| Nav label | Productoras y Productores | Cartera de Proveedores | Unidades |
| Dashboard | Panel de Cooperativa | Panel de Exportación | Panel de Producción |

**Fuente:** `src/lib/org-terminology.ts`

---

## 15. Qué NO Tocar

- `supabase/migrations/` — Read-only, no modificar
- `.gitignore`, `bun.lockb`, `package-lock.json` — Read-only
- `coop_user_permissions` — **DEPRECADO**, no usar para nuevas features
- Columna `cooperativa_id` en queries — Migrado a `organization_id`

---

## 16. Próximos Pasos Pendientes

- [ ] Regenerar tipos TypeScript de Supabase para tipar `organizacion_usuarios`
- [ ] Crear página de usuarios para tipo Exportador
- [ ] Implementar verificación de permisos en módulos (condicionar acceso a features según permisos del usuario actual)
- [ ] Agregar campo teléfono al dialog de invitación
- [ ] Hook `useCurrentUserPermissions()` centralizado para verificar permisos del usuario logueado
