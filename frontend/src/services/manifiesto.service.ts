// frontend/src/services/manifiesto.service.ts

import api from '../utils/api';

export interface CreateManifiestoInput {
  local_id: string;
  recoleccion_id: string;
  recolector_id: string;
  folio?: string;
  fecha_emision?: string;
}

export const manifiestoService = {
  /**
   * Obtener todos los manifiestos
   */
  async getAll(page: number = 1, limit: number = 50, plazaId?: string, localId?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (plazaId) params.append('plaza_id', plazaId);
    if (localId) params.append('local_id', localId);

    const response = await api.get(`/manifiestos?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Obtener un manifiesto por ID
   */
  async getById(id: string) {
    const response = await api.get(`/manifiestos/${id}`);
    return response.data.data;
  },

  /**
   * Obtener manifiestos de un local
   */
  async getByLocal(localId: string) {
    const response = await api.get(`/manifiestos/local/${localId}`);
    return response.data.data;
  },

  /**
   * Verificar si una recolección ya tiene manifiesto
   */
  async getByRecoleccion(recoleccionId: string) {
    const response = await api.get(`/manifiestos/recoleccion/${recoleccionId}`);
    return response.data;
  },

  /**
   * Contar total de manifiestos
   */
  async count() {
    const response = await api.get('/manifiestos/count');
    return response.data.data.total;
  },

  /**
   * Crear un nuevo manifiesto
   */
  async create(data: CreateManifiestoInput) {
    const response = await api.post('/manifiestos', data);
    return response.data.data;
  },

  /**
   * Eliminar un manifiesto
   */
  async delete(id: string) {
    const response = await api.delete(`/manifiestos/${id}`);
    return response.data;
  },
};