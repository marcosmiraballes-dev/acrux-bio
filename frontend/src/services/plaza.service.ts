import api from '../utils/api';
import { Plaza, ApiResponse } from '../types';

export const plazaService = {
  // Obtener todas las plazas
  getAll: async (): Promise<Plaza[]> => {
    const response = await api.get<ApiResponse<Plaza[]>>('/plazas');
    return response.data.data || [];
  },

  // Obtener una plaza por ID
  getById: async (id: string): Promise<Plaza> => {
    const response = await api.get<ApiResponse<Plaza>>(`/plazas/${id}`);
    return response.data.data!;
  },

  // Crear nueva plaza
  create: async (data: Partial<Plaza>): Promise<Plaza> => {
    const response = await api.post<ApiResponse<Plaza>>('/plazas', data);
    return response.data.data!;
  },

  // Actualizar plaza
  update: async (id: string, data: Partial<Plaza>): Promise<Plaza> => {
    const response = await api.put<ApiResponse<Plaza>>(`/plazas/${id}`, data);
    return response.data.data!;
  },

  // Eliminar plaza (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/plazas/${id}`);
  },
};