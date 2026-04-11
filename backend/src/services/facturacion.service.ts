import { supabase } from '../config/supabase';
import {
  CreateClienteFacturacionInput,
  UpdateClienteFacturacionInput,
  CreateServicioClienteInput,
  UpdateServicioClienteInput,
  CreateCobroMensualInput,
  UpdateCobroMensualInput,
  CrearMovimientoDTO,
  MovimientoResponse,
} from '../schemas/facturacion.schema';

export class FacturacionService {
  async getClientes(): Promise<any[]> {
    const { data, error } = await supabase
      .from('clientes_facturacion')
      .select(`
        *,
        locales:local_id (
          id,
          nombre,
          razon_social,
          rfc,
          email,
          plaza_id
        ),
        servicios_cliente (*)
      `)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error obteniendo clientes de facturación: ${error.message}`);
    }

    return (data || []).map((cliente: any) => ({
      ...cliente,
      servicios_cliente: (cliente.servicios_cliente || []).filter((servicio: any) => servicio.activo),
    }));
  }

  async getClienteById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('clientes_facturacion')
      .select(`
        *,
        locales:local_id (
          id,
          nombre,
          razon_social,
          rfc,
          email,
          plaza_id
        ),
        servicios_cliente (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error obteniendo cliente de facturación: ${error.message}`);
    }

    return {
      ...data,
      servicios_cliente: (data?.servicios_cliente || []).filter((servicio: any) => servicio.activo),
    };
  }

  async createCliente(data: CreateClienteFacturacionInput): Promise<any> {
    const { data: created, error } = await supabase
      .from('clientes_facturacion')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando cliente de facturación: ${error.message}`);
    }

    return created;
  }

  async updateCliente(id: string, data: UpdateClienteFacturacionInput): Promise<any> {
    const { data: updated, error } = await supabase
      .from('clientes_facturacion')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando cliente de facturación: ${error.message}`);
    }

    return updated;
  }

  async deleteCliente(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('clientes_facturacion')
      .update({
        activo: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error eliminando cliente de facturación: ${error.message}`);
    }

    return data;
  }

  async getServiciosByCliente(clienteId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('servicios_cliente')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('activo', true)
      .order('nombre_servicio', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo servicios del cliente: ${error.message}`);
    }

    return data || [];
  }

  async createServicio(data: CreateServicioClienteInput): Promise<any> {
    const { data: created, error } = await supabase
      .from('servicios_cliente')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando servicio del cliente: ${error.message}`);
    }

    return created;
  }

  async updateServicio(id: string, data: UpdateServicioClienteInput): Promise<any> {
    const { data: updated, error } = await supabase
      .from('servicios_cliente')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando servicio del cliente: ${error.message}`);
    }

    return updated;
  }

  async deleteServicio(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('servicios_cliente')
      .update({
        activo: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error eliminando servicio del cliente: ${error.message}`);
    }

    return data;
  }

  async getCobrosByCliente(clienteId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cobros_mensuales')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('anio', { ascending: false })
      .order('mes', { ascending: false });

    if (error) {
      throw new Error(`Error obteniendo cobros del cliente: ${error.message}`);
    }

    return data || [];
  }

  async getCobrosMes(mes: number, anio: number): Promise<any[]> {
    const { data: cobros, error } = await supabase
      .from('cobros_mensuales')
      .select(`
        *,
        clientes_facturacion:cliente_id (
          *,
          locales:local_id (
            id,
            nombre,
            razon_social,
            rfc,
            plazas:plaza_id (
              id,
              nombre
            )
          )
        )
      `)
      .eq('mes', mes)
      .eq('anio', anio)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error obteniendo cobros del mes: ${error.message}`);
    }

    const rows = cobros || [];
    const clienteIds = Array.from(new Set(rows.map((row: any) => row.cliente_id).filter(Boolean)));

    let serviciosPorCliente = new Map<string, any[]>();

    if (clienteIds.length > 0) {
      const { data: servicios, error: serviciosError } = await supabase
        .from('servicios_cliente')
        .select('*')
        .in('cliente_id', clienteIds)
        .eq('activo', true);

      if (serviciosError) {
        throw new Error(`Error obteniendo servicios para cobros del mes: ${serviciosError.message}`);
      }

      serviciosPorCliente = (servicios || []).reduce((acc: Map<string, any[]>, servicio: any) => {
        const current = acc.get(servicio.cliente_id) || [];
        current.push(servicio);
        acc.set(servicio.cliente_id, current);
        return acc;
      }, new Map<string, any[]>());
    }

    return rows.map((cobro: any) => {
      const servicios = serviciosPorCliente.get(cobro.cliente_id) || [];
      const montoEsperado = servicios.reduce((sum: number, s: any) => sum + Number(s.costo || 0), 0);

      return {
        ...cobro,
        servicios_cliente: servicios,
        monto_esperado: montoEsperado,
      };
    });
  }

  async createCobro(data: CreateCobroMensualInput): Promise<any> {
    const { data: created, error } = await supabase
      .from('cobros_mensuales')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando cobro mensual: ${error.message}`);
    }

    return created;
  }

  async updateCobro(id: string, data: UpdateCobroMensualInput): Promise<any> {
    const { data: updated, error } = await supabase
      .from('cobros_mensuales')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando cobro mensual: ${error.message}`);
    }

    return updated;
  }

  async generarCobrosMes(mes: number, anio: number): Promise<any[]> {
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes_facturacion')
      .select('*')
      .eq('activo', true);

    if (clientesError) {
      throw new Error(`Error obteniendo clientes activos: ${clientesError.message}`);
    }

    const clientesActivos = clientes || [];

    if (clientesActivos.length === 0) {
      return [];
    }

    const clienteIds = clientesActivos.map((cliente: any) => cliente.id);

    const { data: cobrosExistentes, error: cobrosExistentesError } = await supabase
      .from('cobros_mensuales')
      .select('cliente_id')
      .in('cliente_id', clienteIds)
      .eq('mes', mes)
      .eq('anio', anio);

    if (cobrosExistentesError) {
      throw new Error(`Error validando cobros existentes: ${cobrosExistentesError.message}`);
    }

    const clientesConCobro = new Set((cobrosExistentes || []).map((c: any) => c.cliente_id));

    const { data: servicios, error: serviciosError } = await supabase
      .from('servicios_cliente')
      .select('*')
      .in('cliente_id', clienteIds)
      .eq('activo', true);

    if (serviciosError) {
      throw new Error(`Error obteniendo servicios activos: ${serviciosError.message}`);
    }

    const serviciosPorCliente = (servicios || []).reduce((acc: Map<string, any[]>, servicio: any) => {
      const current = acc.get(servicio.cliente_id) || [];
      current.push(servicio);
      acc.set(servicio.cliente_id, current);
      return acc;
    }, new Map<string, any[]>());

    const nuevosCobros = clientesActivos
      .filter((cliente: any) => !clientesConCobro.has(cliente.id))
      .map((cliente: any) => {
        const serviciosCliente = serviciosPorCliente.get(cliente.id) || [];
        const subtotal = serviciosCliente.reduce((sum: number, s: any) => sum + Number(s.costo || 0), 0);

        return {
          cliente_id: cliente.id,
          mes,
          anio,
          monto_cobrado: subtotal,
          monto_pagado: 0,
          estado: 'pendiente' as const,
        };
      });

    if (nuevosCobros.length === 0) {
      return [];
    }

    const { data: creados, error: crearError } = await supabase
      .from('cobros_mensuales')
      .insert(nuevosCobros)
      .select('*');

    if (crearError) {
      throw new Error(`Error generando cobros del mes: ${crearError.message}`);
    }

    return creados || [];
  }

  async crearMovimiento(data: CrearMovimientoDTO): Promise<MovimientoResponse> {
    const { data: result, error } = await supabase
      .from('movimientos_cuenta')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async listarMovimientosPorCliente(cliente_id: string): Promise<MovimientoResponse[]> {
    const { data, error } = await supabase
      .from('movimientos_cuenta')
      .select('*')
      .eq('cliente_id', cliente_id)
      .order('fecha', { ascending: true });
    if (error) throw error;
    return data;
  }

  async eliminarMovimiento(id: string): Promise<void> {
    const { error } = await supabase
      .from('movimientos_cuenta')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
