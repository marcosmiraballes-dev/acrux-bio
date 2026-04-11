import api from '../utils/api';
import { MovimientoCuenta } from '../types';

export const facturacionService = {
  getClientes: async (): Promise<any[]> => {
    const response = await api.get('/facturacion/clientes');
    return response.data.data || [];
  },

  getClienteById: async (id: string): Promise<any> => {
    const response = await api.get(`/facturacion/clientes/${id}`);
    return response.data.data;
  },

  createCliente: async (data: any): Promise<any> => {
    const response = await api.post('/facturacion/clientes', data);
    return response.data.data;
  },

  updateCliente: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/facturacion/clientes/${id}`, data);
    return response.data.data;
  },

  deleteCliente: async (id: string): Promise<any> => {
    const response = await api.delete(`/facturacion/clientes/${id}`);
    return response.data.data;
  },

  getServiciosByCliente: async (clienteId: string): Promise<any[]> => {
    const response = await api.get(`/facturacion/clientes/${clienteId}/servicios`);
    return response.data.data || [];
  },

  createServicio: async (data: any): Promise<any> => {
    const response = await api.post('/facturacion/servicios', data);
    return response.data.data;
  },

  updateServicio: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/facturacion/servicios/${id}`, data);
    return response.data.data;
  },

  deleteServicio: async (id: string): Promise<any> => {
    const response = await api.delete(`/facturacion/servicios/${id}`);
    return response.data.data;
  },

  getCobrosMes: async (mes: number, anio: number): Promise<any[]> => {
    const response = await api.get(`/facturacion/cobros/mes/${mes}/${anio}`);
    return response.data.data || [];
  },

  getCobrosByCliente: async (clienteId: string): Promise<any[]> => {
    const response = await api.get(`/facturacion/cobros/cliente/${clienteId}`);
    return response.data.data || [];
  },

  createCobro: async (data: any): Promise<any> => {
    const response = await api.post('/facturacion/cobros', data);
    return response.data.data;
  },

  updateCobro: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/facturacion/cobros/${id}`, data);
    return response.data.data;
  },

  generarCobrosMes: async (mes: number, anio: number): Promise<any[]> => {
    const response = await api.post(`/facturacion/cobros/generar/${mes}/${anio}`);
    return response.data.data || [];
  },
};

export const crearMovimiento = async (data: {
  cliente_id: string;
  tipo: 'penalizacion' | 'descuento' | 'ajuste' | 'nota_credito';
  descripcion?: string;
  monto: number;
  es_cargo: boolean;
  fecha: string;
}): Promise<MovimientoCuenta> => {
  const response = await api.post('/facturacion/movimientos', data);
  return response.data;
};

export const listarMovimientosPorCliente = async (cliente_id: string): Promise<MovimientoCuenta[]> => {
  const response = await api.get(`/facturacion/movimientos/cliente/${cliente_id}`);
  return response.data;
};

export const eliminarMovimiento = async (id: string): Promise<void> => {
  await api.delete(`/facturacion/movimientos/${id}`);
};
