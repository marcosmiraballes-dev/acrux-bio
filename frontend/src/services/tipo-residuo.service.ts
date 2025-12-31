import api from '../utils/api';
import { TipoResiduo, ApiResponse } from '../types';

export const tipoResiduoService = {
  // Obtener todos los tipos de residuos
  getAll: async (): Promise<TipoResiduo[]> => {
    const response = await api.get<ApiResponse<TipoResiduo[]>>('/tipos-residuos');
    return response.data.data || [];
  },

  // Obtener un tipo de residuo por ID
  getById: async (id: string): Promise<TipoResiduo> => {
    const response = await api.get<ApiResponse<TipoResiduo>>(`/tipos-residuos/${id}`);
    return response.data.data!;
  },

  // Crear nuevo tipo de residuo
  create: async (data: Partial<TipoResiduo>): Promise<TipoResiduo> => {
    const response = await api.post<ApiResponse<TipoResiduo>>('/tipos-residuos', data);
    return response.data.data!;
  },

  // Actualizar tipo de residuo
  update: async (id: string, data: Partial<TipoResiduo>): Promise<TipoResiduo> => {
    const response = await api.put<ApiResponse<TipoResiduo>>(`/tipos-residuos/${id}`, data);
    return response.data.data!;
  },

  // Eliminar tipo de residuo (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tipos-residuos/${id}`);
  },
};