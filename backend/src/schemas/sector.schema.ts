import { z } from 'zod';

export const createSectorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(50),
  icono: z.string().min(1, 'El icono es requerido').max(10),
  orden: z.number().int().optional().default(0)
});

export const updateSectorSchema = z.object({
  nombre: z.string().min(1).max(50).optional(),
  icono: z.string().min(1).max(10).optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional()
});

export type CreateSectorInput = z.infer<typeof createSectorSchema>;
export type UpdateSectorInput = z.infer<typeof updateSectorSchema>;
