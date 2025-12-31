import api from '../utils/api';
import { Usuario, ApiResponse } from '../types';

export const usuarioService = {
  // Obtener todos los usuarios (solo ADMIN)
  getAll: async (): Promise<Usuario[]> => {
    const response = await api.get<ApiResponse<Usuario[]>>('/usuarios');
    return response.data.data || [];
  },

  // Obtener un usuario por ID
  getById: async (id: string): Promise<Usuario> => {
    const response = await api.get<ApiResponse<Usuario>>(`/usuarios/${id}`);
    return response.data.data!;
  },

  // Crear nuevo usuario
  create: async (data: Partial<Usuario> & { password: string }): Promise<Usuario> => {
    const response = await api.post<ApiResponse<Usuario>>('/usuarios', data);
    return response.data.data!;
  },

  // Actualizar usuario
  update: async (id: string, data: Partial<Usuario> & { password?: string }): Promise<Usuario> => {
    const response = await api.put<ApiResponse<Usuario>>(`/usuarios/${id}`, data);
    return response.data.data!;
  },

  // Eliminar usuario (soft delete)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/usuarios/${id}`);
  },
};