export { type UserRole, type OrganizationType, type InternalRole } from '@/lib/roles';

export type RiskLevel = 'verde' | 'ambar' | 'rojo';
export type LotStatus = 'disponible' | 'comprometido' | 'embarcado';
export type LoteAcopioStatus = 'en_proceso' | 'disponible' | 'vendido';

export interface User {
  id: string;
  email: string;
  name: string;
  role: import('@/lib/roles').UserRole;
  organizationName: string;
}

export interface Productor {
  id: string;
  cooperativaId: string;
  nombre: string;
  cedula: string;
  telefono?: string;
  comunidad: string;
  fechaRegistro: string;
}

export interface Parcela {
  id: string;
  productorId: string;
  nombre: string;
  coordenadas: { lat: string; lng: string };
  areaCultivo: number;
  variedad: string;
  documentos: DocumentoLegal[];
  fechaRegistro: string;
}

export interface DocumentoLegal {
  id: string;
  tipo: 'titulo' | 'permiso_ambiental' | 'certificacion' | 'otro';
  nombre: string;
  estado: 'pendiente' | 'verificado' | 'vencido';
  fechaEmision?: string;
  fechaVencimiento?: string;
  notas?: string;
}

export interface DashboardStats {
  totalProductores?: number;
  totalParcelas?: number;
  totalLotesAcopio?: number;
  lotesDisponibles?: number;
}
