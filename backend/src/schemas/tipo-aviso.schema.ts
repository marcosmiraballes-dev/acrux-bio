import { z } from 'zod';

// Schema para crear tipo de aviso
export const createTipoAvisoSchema = z.object({
  tipo: z.string()
    .min(1, 'El tipo de aviso es requerido')
    .max(50, 'El tipo no puede exceder 50 caracteres')
    .trim(),
  orden: z.number()
    .int('El orden debe ser un número entero')
    .min(1, 'El orden debe ser mayor a 0'),
  color_badge: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido (ej: #10B981)')
    .optional()
    .default('#10B981')
});

// Schema para actualizar tipo de aviso
export const updateTipoAvisoSchema = z.object({
  tipo: z.string()
    .min(1, 'El tipo de aviso es requerido')
    .max(50, 'El tipo no puede exceder 50 caracteres')
    .trim()
    .optional(),
  orden: z.number()
    .int('El orden debe ser un número entero')
    .min(1, 'El orden debe ser mayor a 0')
    .optional(),
  color_badge: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido (ej: #10B981)')
    .optional()
});

// Tipos derivados
export type CreateTipoAvisoDTO = z.infer<typeof createTipoAvisoSchema>;
export type UpdateTipoAvisoDTO = z.infer<typeof updateTipoAvisoSchema>;