

# Plan: Adelantar trabajo de Fase 3 en el frontend

## Contexto
El PDF de Fase 3 define operaciones, control de calidad y escalamiento del modulo de nutricion. Mientras corres los prompts en Supabase y Cursor para crear las tablas backend (`ag_sampling_protocol_logs`, `ag_support_tickets`, `ag_engine_changelog`, `ag_annual_review_reports`), puedo adelantar lo siguiente en el frontend:

## Lo que puedo hacer ahora (sin depender del backend)

### 1. Guardar el documento como referencia
Copiar el PDF parseado a `docs/FASE3_OPERACION_DESPLIEGUE.md` para que quede como referencia canonica del equipo.

### 2. Agregar KPIs de Nutricion al dashboard (§3.8.1)
En `KPISection.tsx`, agregar KPIs de nutricion para cooperativas cuando el modulo `nutricion` este activo:
- % parcelas con plan activo
- % ejecucion completada
- Desviacion promedio plan vs ejecucion

Estos se alimentaran de datos demo por ahora (via `demo-data.ts`) y luego se conectaran a queries reales cuando las tablas existan.

### 3. Agregar tab de Protocolo de Muestreo al modulo Nutricion (§3.2)
Crear un nuevo componente `ProtocoloMuestreoTab.tsx` en `src/components/nutricion/` con:
- Checklist visual del protocolo (15-20 submuestras, profundidad, metodo P, etc.)
- Tabla de registros de protocolo (preparada para `ag_sampling_protocol_logs`)
- Indicador de cumplimiento por parcela

Agregar la tab a `NutricionDashboard.tsx`.

### 4. Agregar seccion de KPIs operativos de calidad de datos (§3.8.2)
Dentro del dashboard de nutricion o como card en el dashboard principal:
- % analisis validos
- % analisis vencidos
- % parcelas sin variedad definida

## Lo que NO hago ahora (depende del backend)
- Queries reales a `ag_sampling_protocol_logs`, `ag_support_tickets`, `ag_engine_changelog`
- Sistema de tickets de soporte (§3.6)
- Gobernanza cientifica y changelog del motor (§3.11)
- Evaluacion anual (§3.12)

Estos se implementan despues de que confirmes que las tablas existen en Supabase.

## Archivos a crear/modificar
| Archivo | Accion |
|---------|--------|
| `docs/FASE3_OPERACION_DESPLIEGUE.md` | Crear (referencia del PDF) |
| `src/components/nutricion/ProtocoloMuestreoTab.tsx` | Crear (checklist + tabla placeholder) |
| `src/components/nutricion/NutricionDashboard.tsx` | Agregar tab de Protocolo |
| `src/components/dashboard/blocks/KPISection.tsx` | Agregar KPIs nutricion |
| `src/lib/demo-data.ts` | Agregar stats de nutricion demo |

