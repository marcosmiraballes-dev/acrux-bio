// ============================================
// ACRUX-BIO - Tipos de TypeScript
// ============================================

export interface Plaza {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Local {
  id: string;
  plaza_id: string;
  nombre: string;
  giro: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoResiduo {
  id: string;
  nombre: string;
  factor_co2: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Recoleccion {
  id: string;
  usuario_id: string;
  plaza_id: string;
  local_id: string;
  fecha_recoleccion: string;
  total_kilos: number;
  co2_evitado: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface DetalleRecoleccion {
  id: string;
  recoleccion_id: string;
  tipo_residuo_id: string;
  kilos: number;
  co2_evitado: number;
  created_at: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'CAPTURADOR' | 'VISOR';
  activo: boolean;
  created_at: string;
  updated_at: string;
}