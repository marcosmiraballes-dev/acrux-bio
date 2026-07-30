import api from '../utils/api';
import { Recoleccion, ApiResponse } from '../types';

export const recoleccionService = {
  // Obtener todas las recolecciones (con filtros opcionales)
  getAll: async (params?: {
    plaza_id?: string;
    local_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<Recoleccion[]> => {
    const queryParams = new URLSearchParams();
    if (params?.plaza_id) queryParams.append('plaza_id', params.plaza_id);
    if (params?.local_id) queryParams.append('local_id', params.local_id);
    if (params?.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);
    if (params?.fecha_hasta) queryParams.append('fecha_hasta', params.fecha_hasta);

    const queryString = queryParams.toString();
    const url = queryString ? `/recolecciones?${queryString}` : '/recolecciones';
    
    const response = await api.get<ApiResponse<Recoleccion[]>>(url);
    
    // ✅ CORREGIDO: El backend retorna directamente { success: true, data: [...] }
    // donde data es el ARRAY de recolecciones
    return response.data.data || [];
  },

  // Actualizar recolección
  update: async (id: string, data: {
    plaza_id?: string;
    local_id: string;
    fecha_recoleccion: string;
    notas?: string;
    detalles: Array<{
      tipo_residuo_id: string;
      kilos: number;
    }>;
  }): Promise<Recoleccion> => {
    const response = await api.put<ApiResponse<Recoleccion>>(`/recolecciones/${id}`, data);
    return response.data.data!;
  },

  // Eliminar recolección (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/recolecciones/${id}`);
  },
};