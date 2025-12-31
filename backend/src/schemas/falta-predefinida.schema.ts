import { z } from 'zod';

// Schema para crear falta predefinida
export const createFaltaPredefinidaSchema = z.object({
  descripcion: z.string()
    .min(1, 'La descripción es requerida')
    .trim(),
  reglamento_id: z.string()
    .uuid('ID de reglamento inválido'),
  activo: z.boolean()
    .optional()
    .default(true)
});

// Schema para actualizar falta predefinida
export const updateFaltaPredefinidaSchema = z.object({
  descripcion: z.string()
    .min(1, 'La descripción es requerida')
    .trim()
    .optional(),
  reglamento_id: z.string()
    .uuid('ID de reglamento inválido')
    .optional(),
  activo: z.boolean()
    .optional()
});

// Tipos derivados
export type CreateFaltaPredefinidaDTO = z.infer<typeof createFaltaPredefinidaSchema>;
export type UpdateFaltaPredefinidaDTO = z.infer<typeof updateFaltaPredefinidaSchema>;