import { z } from 'zod';

/**
 * Schema para crear una nueva plaza
 */
export const createPlazaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  ciudad: z.string().min(1, 'La ciudad es requerida').max(100),
  estado: z.string().min(1, 'El estado es requerido').max(100),
  direccion: z.string().optional(),
  activo: z.boolean().optional().default(true)
});

/**
 * Schema para actualizar una plaza
 */
export const updatePlazaSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  ciudad: z.string().min(1).max(100).optional(),
  estado: z.string().min(1).max(100).optional(),
  direccion: z.string().optional(),
  activo: z.boolean().optional()
});

/**
 * TypeScript types
 */
export type CreatePlazaInput = z.infer<typeof createPlazaSchema>;
export type UpdatePlazaInput = z.infer<typeof updatePlazaSchema>;