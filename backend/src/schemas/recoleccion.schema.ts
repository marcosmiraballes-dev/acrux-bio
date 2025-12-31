import { z } from 'zod';

/**
 * Schema para validar el detalle de una recolección
 */
export const detalleRecoleccionSchema = z.object({
  tipo_residuo_id: z.string().uuid('ID de tipo de residuo inválido'),
  kilos: z.number().positive('Los kilos deben ser mayores a 0')
});

/**
 * Schema para crear una nueva recolección
 */
export const createRecoleccionSchema = z.object({
  plaza_id: z.string().uuid('ID de plaza inválido'),
  local_id: z.string().uuid('ID de local inválido'),
  fecha_recoleccion: z.string().regex(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/,
    'Fecha debe estar en formato YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS'
  ),
  notas: z.string().optional().nullable(),
  detalles: z.array(detalleRecoleccionSchema).min(1, 'Debe incluir al menos un detalle')
});

/**
 * Schema para actualizar una recolección
 */
export const updateRecoleccionSchema = z.object({
  fecha_recoleccion: z.string().regex(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/,
    'Fecha debe estar en formato YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS'
  ).optional(),
  notas: z.string().optional().nullable(),
  detalles: z.array(detalleRecoleccionSchema).min(1, 'Debe incluir al menos un detalle').optional()
});

export type CreateRecoleccionInput = z.infer<typeof createRecoleccionSchema>;
export type UpdateRecoleccionInput = z.infer<typeof updateRecoleccionSchema>;