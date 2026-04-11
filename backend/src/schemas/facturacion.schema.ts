import { z } from 'zod';

const isoDateString = z.string().datetime({ offset: true });

export const createClienteFacturacionSchema = z.object({
  local_id: z.string().uuid('Local ID inválido').optional().nullable(),
  modo_pago: z.enum(['PUE', 'PPD']),
  forma_pago: z.string(),
  fecha_inicio: isoDateString.optional().nullable(),
  activo: z.boolean().default(true),
});

export const updateClienteFacturacionSchema = createClienteFacturacionSchema.partial();

export const createServicioClienteSchema = z.object({
  cliente_id: z.string().uuid('Cliente ID inválido'),
  nombre_servicio: z.string(),
  costo: z.number().positive('El costo debe ser mayor a 0'),
  activo: z.boolean().default(true),
});

export const updateServicioClienteSchema = createServicioClienteSchema.partial();

export const createCobroMensualSchema = z.object({
  cliente_id: z.string().uuid('Cliente ID inválido'),
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(1000).max(9999),
  numero_servicio: z.number().optional().nullable(),
  folio: z.string().optional().nullable(),
  monto_cobrado: z.number().optional().nullable(),
  monto_pagado: z.number().default(0),
  estado: z.enum(['pendiente', 'pagado', 'parcial']).default('pendiente'),
  fecha_pago: isoDateString.optional().nullable(),
  notas: z.string().optional().nullable(),
});

export const updateCobroMensualSchema = createCobroMensualSchema.partial();

export type CreateClienteFacturacionInput = z.infer<typeof createClienteFacturacionSchema>;
export type UpdateClienteFacturacionInput = z.infer<typeof updateClienteFacturacionSchema>;
export type CreateServicioClienteInput = z.infer<typeof createServicioClienteSchema>;
export type UpdateServicioClienteInput = z.infer<typeof updateServicioClienteSchema>;
export type CreateCobroMensualInput = z.infer<typeof createCobroMensualSchema>;
export type UpdateCobroMensualInput = z.infer<typeof updateCobroMensualSchema>;

export const CrearMovimientoSchema = z.object({
  cliente_id: z.string().uuid(),
  tipo: z.enum(['penalizacion', 'descuento', 'ajuste', 'nota_credito']),
  descripcion: z.string().optional(),
  monto: z.number().positive(),
  es_cargo: z.boolean(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CrearMovimientoDTO = z.infer<typeof CrearMovimientoSchema>;

export const MovimientoResponseSchema = z.object({
  id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  tipo: z.string(),
  descripcion: z.string().nullable(),
  monto: z.number(),
  es_cargo: z.boolean(),
  fecha: z.string(),
  created_at: z.string(),
});

export type MovimientoResponse = z.infer<typeof MovimientoResponseSchema>;
