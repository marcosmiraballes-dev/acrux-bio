import { z } from 'zod';

// Schema para crear reglamento
export const createReglamentoSchema = z.object({
  numero_punto: z.string()
    .min(1, 'El número de punto es requerido')
    .max(50, 'El número no puede exceder 50 caracteres')
    .trim(),
  descripcion: z.string()
    .min(1, 'La descripción es requerida')
    .trim(),
  activo: z.boolean()
    .optional()
    .default(true),
  orden: z.number()
    .int('El orden debe ser un número entero')
    .min(0, 'El orden no puede ser negativo')
    .optional()
    .default(0)
});

// Schema para actualizar reglamento
export const updateReglamentoSchema = z.object({
  numero_punto: z.string()
    .min(1, 'El número de punto es requerido')
    .max(50, 'El número no puede exceder 50 caracteres')
    .trim()
    .optional(),
  descripcion: z.string()
    .min(1, 'La descripción es requerida')
    .trim()
    .optional(),
  activo: z.boolean()
    .optional(),
  orden: z.number()
    .int('El orden debe ser un número entero')
    .min(0, 'El orden no puede ser negativo')
    .optional()
});

// Tipos derivados
export type CreateReglamentoDTO = z.infer<typeof createReglamentoSchema>;
export type UpdateReglamentoDTO = z.infer<typeof updateReglamentoSchema>;