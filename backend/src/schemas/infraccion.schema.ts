import { z } from 'zod';

// Schema para crear infracción
export const createInfraccionSchema = z.object({
  nro_aviso: z.string()
    .min(1, 'El número de aviso es requerido')
    .max(20, 'El número de aviso no puede exceder 20 caracteres')
    .trim()
    .optional(), // Puede ser opcional si se genera automático
  locatario_id: z.string()
    .uuid('El ID de locatario debe ser un UUID válido'),
  fecha_infraccion: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/, 'La fecha debe estar en formato YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS'),
  descripcion_falta: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .trim(),
  reglamento_id: z.string()
    .uuid('El ID de reglamento debe ser un UUID válido'),
  tipo_aviso_id: z.string()
    .uuid('El ID de tipo de aviso debe ser un UUID válido')
    .optional(), // AHORA ES OPCIONAL - se asigna automáticamente
  estatus: z.enum(['Pendiente', 'Resuelto', 'Cancelado']).optional().default('Pendiente'),
  notas: z.string().optional().nullable()
});

// Schema para actualizar infracción
export const updateInfraccionSchema = z.object({
  nro_aviso: z.string()
    .min(1, 'El número de aviso es requerido')
    .max(20, 'El número de aviso no puede exceder 20 caracteres')
    .trim()
    .optional(),
  locatario_id: z.string()
    .uuid('El ID de locatario debe ser un UUID válido')
    .optional(),
  fecha_infraccion: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/, 'La fecha debe estar en formato YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS')
    .optional(),
  descripcion_falta: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .trim()
    .optional(),
  reglamento_id: z.string()
    .uuid('El ID de reglamento debe ser un UUID válido')
    .optional(),
  tipo_aviso_id: z.string()
    .uuid('El ID de tipo de aviso debe ser un UUID válido')
    .optional(),
  estatus: z.enum(['Pendiente', 'Resuelto', 'Cancelado']).optional(),
  notas: z.string().optional().nullable(),
  resuelto_fecha: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/, 'La fecha debe estar en formato YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS')
    .optional()
    .nullable(),
  resuelto_por: z.string()
    .uuid('El ID de usuario debe ser un UUID válido')
    .optional()
    .nullable()
});

// Schema para marcar como resuelta
export const resolverInfraccionSchema = z.object({
  resuelto_fecha: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/, 'La fecha debe estar en formato YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS')
    .optional(),
  notas: z.string().optional().nullable()
});

// Tipos TypeScript
export type CreateInfraccionInput = z.infer<typeof createInfraccionSchema>;
export type UpdateInfraccionInput = z.infer<typeof updateInfraccionSchema>;
export type ResolverInfraccionInput = z.infer<typeof resolverInfraccionSchema>;