import api from '../utils/api';
import { Local, ApiResponse } from '../types';

export const localService = {
  // Obtener todos los locales (con opción de filtrar por plaza)
  getAll: async (plazaId?: string): Promise<Local[]> => {
    const params = plazaId ? `?plaza_id=${plazaId}` : '';
    const response = await api.get<ApiResponse<Local[]>>(`/locales${params}`);
    return response.data.data || [];
  },

  // Obtener un local por ID
  getById: async (id: string): Promise<Local> => {
    const response = await api.get<ApiResponse<Local>>(`/locales/${id}`);
    return response.data.data!;
  },

  // Crear nuevo local
  create: async (data: Partial<Local>): Promise<Local> => {
    const response = await api.post<ApiResponse<Local>>('/locales', data);
    return response.data.data!;
  },

  // Actualizar local
  update: async (id: string, data: Partial<Local>): Promise<Local> => {
    const response = await api.put<ApiResponse<Local>>(`/locales/${id}`, data);
    return response.data.data!;
  },

  // Eliminar local (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/locales/${id}`);
  },
};