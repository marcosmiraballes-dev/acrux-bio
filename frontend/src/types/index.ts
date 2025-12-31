// Tipos de la aplicación Acrux-Bio

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'DIRECTOR' | 'COORDINADOR' | 'CAPTURADOR';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    usuario: Usuario;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Plaza {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  direccion?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Local {
  id: string;
  plaza_id: string;
  nombre: string;
  giro?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  notas?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  plaza?: Plaza;
}

export interface TipoResiduo {
  id: string;
  nombre: string;
  descripcion?: string;
  factor_co2: number;
  unidad?: string;
  color_hex?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DetalleRecoleccion {
  id?: string;
  recoleccion_id?: string;
  tipo_residuo_id: string;
  kilos: number;
  co2_evitado?: number;
  tipo_residuo?: TipoResiduo;
}

export interface Recoleccion {
  id: string;
  usuario_id: string;
  plaza_id: string;
  local_id: string;
  fecha_recoleccion: string;
  total_kilos: number;
  co2_evitado: number;
  notas?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  usuario?: Usuario;
  plaza?: Plaza;
  local?: Local;
  detalles?: DetalleRecoleccion[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface Estadisticas {
  total_recolecciones: number;
  total_kilos: number;
  total_co2_evitado: number;
  plazas_activas: number;
  locales_activos: number;
  promedio_kilos_por_recoleccion: number;
}
