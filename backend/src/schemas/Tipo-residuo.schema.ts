import { z } from 'zod';

/**
 * Schema para crear un nuevo tipo de residuo
 */
export const createTipoResiduoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(50),
  descripcion: z.string().optional(),
  factor_co2: z.number().min(0, 'El factor CO2 debe ser positivo').max(100),
  activo: z.boolean().optional().default(true)
});

/**
 * Schema para actualizar un tipo de residuo
 */
export const updateTipoResiduoSchema = z.object({
  nombre: z.string().min(1).max(50).optional(),
  descripcion: z.string().optional(),
  factor_co2: z.number().min(0).max(100).optional(),
  activo: z.boolean().optional()
});

/**
 * TypeScript types
 */
export type CreateTipoResiduoInput = z.infer<typeof createTipoResiduoSchema>;
export type UpdateTipoResiduoInput = z.infer<typeof updateTipoResiduoSchema>;