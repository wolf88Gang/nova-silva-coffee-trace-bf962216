# Prompt para Lovable

Tareas pendientes para conectar el frontend a Supabase.

---

## 1. Verificar páginas ya conectadas

Confirmar que estas páginas usan los hooks correctamente:

- **ExportadorClientes**: usa `useClientesCompradores` con fallback a demo. La tabla es `clientes_compradores` (minúsculas). Usar `TABLE.clientes_compradores` de `@/config/keys` si se usa la constante.
- **ExportadorContratos**: usa `useContratos` con fallback a demo.
- **SubastasDisponibles**: usa `useLotesOfrecidos` con loading state (`lotesLoading`). Mantener demo data como fallback cuando `data` esté vacío.

---

## 2. Conectar Cartera Proveedores (ExportadorProveedores)

La página `src/pages/exportador/ExportadorProveedores.tsx` muestra cooperativas proveedoras con datos hardcodeados. Conectarla a Supabase así:

1. **Importar** `useRankingCooperativas` desde `@/hooks/useRankingCooperativas`.
2. **Usar el hook** al inicio del componente:
   ```ts
   const { data: ranking, isLoading } = useRankingCooperativas();
   ```
3. **Mapear** los datos del hook a la UI:
   - `RankingCooperativa.cooperativa_id` → id
   - `RankingCooperativa.nombre` → nombre de la cooperativa
   - `RankingCooperativa.volumen_total` o `lotes_entregados` → volumen histórico
   - `RankingCooperativa.lotes_entregados` → puede usarse para productores o volumen
4. **Fallback a demo** cuando `ranking` esté vacío o `!ranking?.length`:
   ```ts
   const proveedores = (ranking?.length ? ranking.map(r => ({
     id: r.cooperativa_id,
     nombre: r.nombre ?? 'Cooperativa',
     pais: '-',
     region: '-',
     productores: r.lotes_entregados ?? 0,
     volumenHistorico: r.volumen_total ? `${r.volumen_total} kg` : '-',
     compliance: 'compliant' as const,
   })) : DEMO_PROVEEDORES) as typeof DEMO_PROVEEDORES;
   ```
5. **Loading state**: si `isLoading`, mostrar un skeleton o mensaje "Cargando proveedores…".
6. **Compliance/EUDR**: por ahora dejar `compliant` por defecto; más adelante se puede conectar a otra tabla o RPC.

---

## 3. Constantes y keys

- Usar `TABLE` y `QUERY_KEYS` de `@/config/keys` para nombres de tablas y query keys.
- La tabla de clientes es `clientes_compradores` (snake_case). Si Lovable usa `TABLE.CLIENTES_COMPRADORES`, agregar un alias en `keys.ts` o usar `TABLE.clientes_compradores`.

---

## 4. Contratos activos por cliente

En ExportadorClientes, Lovable cruza contratos con clientes para contar contratos activos por nombre de cliente. Asegurarse de que:

- `useContratos` esté disponible en el mismo componente (o en un padre) para filtrar por `estado !== 'cerrado'`.
- La función `contratosActivosPorCliente(nombre)` compare con el nombre del cliente correctamente (puede haber diferencias de formato entre `contratos.cliente` y `clientes_compradores.nombre`).

---

## 5. Resumen de hooks disponibles

| Hook | Tabla/RPC | Uso |
|------|-----------|-----|
| `useClientesCompradores` | `clientes_compradores` | ExportadorClientes |
| `useContratos` | `contratos` | ExportadorContratos, cruce con clientes |
| `useLotesOfrecidos` | `lotes_comerciales` | SubastasDisponibles |
| `useRankingCooperativas` | RPC `get_ranking_cooperativas` | ExportadorProveedores (Cartera) |
| `useOfertasComerciales` | `ofertas_comerciales` | OfertasRecibidas (si existe) |
| `useReclamos` | `reclamos_postventa` | Vista de reclamos (si existe) |
| `useLotesExportacion` | `lotes_exportacion` | Vista lotes exportación (si existe) |
