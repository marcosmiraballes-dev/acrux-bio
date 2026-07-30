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
   * Contar total de manifiestos
   */
  async count() {
    const response = await api.get('/manifiestos/count');
    return response.data.data.total;
  },

  /**
   * Eliminar un manifiesto
   */
  async delete(id: string) {
    const response = await api.delete(`/manifiestos/${id}`);
    return response.data;
  },
};