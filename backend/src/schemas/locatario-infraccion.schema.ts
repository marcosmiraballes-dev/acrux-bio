import { z } from 'zod';

// Schema para crear locatario de infracciones
export const createLocatarioInfraccionSchema = z.object({
  codigo_local: z.string()
    .min(1, 'El código de local es requerido')
    .max(50, 'El código no puede exceder 50 caracteres')
    .trim(),
  nombre_comercial: z.string()
    .min(1, 'El nombre comercial es requerido')
    .max(255, 'El nombre comercial no puede exceder 255 caracteres')
    .trim(),
  plaza_id: z.string()
    .uuid('El ID de plaza debe ser un UUID válido'),
  activo: z.boolean().optional().default(true),
  notas: z.string().optional().nullable()
});

// Schema para actualizar locatario de infracciones
export const updateLocatarioInfraccionSchema = z.object({
  codigo_local: z.string()
    .min(1, 'El código de local es requerido')
    .max(50, 'El código no puede exceder 50 caracteres')
    .trim()
    .optional(),
  nombre_comercial: z.string()
    .min(1, 'El nombre comercial es requerido')
    .max(255, 'El nombre comercial no puede exceder 255 caracteres')
    .trim()
    .optional(),
  plaza_id: z.string()
    .uuid('El ID de plaza debe ser un UUID válido')
    .optional(),
  activo: z.boolean().optional(),
  notas: z.string().optional().nullable()
});

// Tipos TypeScript
export type CreateLocatarioInfraccionInput = z.infer<typeof createLocatarioInfraccionSchema>;
export type UpdateLocatarioInfraccionInput = z.infer<typeof updateLocatarioInfraccionSchema>;