/**
 * Constantes de tablas y query keys para React Query.
 * Usar para invalidación y consistencia.
 */
export const TABLE = {
  productores: 'productores',
  parcelas: 'parcelas',
  entregas: 'entregas',
  lotes_acopio: 'lotes_acopio',
  lotes_comerciales: 'lotes_comerciales',
  lotes_comerciales_lotes_acopio: 'lotes_comerciales_lotes_acopio',
  contratos: 'contratos',
  ofertas_comerciales: 'ofertas_comerciales',
  ofertas_lotes: 'ofertas_lotes',
  reclamos_postventa: 'reclamos_postventa',
  comparacion_muestras: 'comparacion_muestras',
  clientes_compradores: 'clientes_compradores',
  lotes_exportacion: 'lotes_exportacion',
  plot_module_snapshot: 'plot_module_snapshot',
  disease_assessments: 'disease_assessments',
  resilience_assessments: 'resilience_assessments',
  cycle_learning_log: 'cycle_learning_log',
} as const;

export const QUERY_KEYS = {
  productores: [TABLE.productores] as const,
  parcelas: [TABLE.parcelas] as const,
  entregas: [TABLE.entregas] as const,
  lotesComerciales: [TABLE.lotes_comerciales] as const,
  lotesOfrecidos: ['lotes_ofrecidos'] as const,
  contratos: [TABLE.contratos] as const,
  ofertasComerciales: [TABLE.ofertas_comerciales] as const,
  reclamos: [TABLE.reclamos_postventa] as const,
  rankingCooperativas: ['ranking_cooperativas'] as const,
  clientesCompradores: [TABLE.clientes_compradores] as const,
  lotesExportacion: [TABLE.lotes_exportacion] as const,
  moduleSnapshot: ['module-snapshot'] as const,
} as const;
