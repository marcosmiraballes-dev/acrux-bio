import { z } from 'zod';

/**
 * Schema para crear un nuevo usuario
 */
export const createUsuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  email: z.string().email('Email inválido').max(100),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['ADMIN', 'DIRECTOR', 'COORDINADOR', 'CAPTURADOR'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser ADMIN, DIRECTOR, COORDINADOR o CAPTURADOR' })
  }),
  activo: z.boolean().optional().default(true)
});

/**
 * Schema para actualizar un usuario
 */
export const updateUsuarioSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  email: z.string().email('Email inválido').max(100).optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  rol: z.enum(['ADMIN', 'DIRECTOR', 'COORDINADOR', 'CAPTURADOR']).optional(),
  activo: z.boolean().optional()
});

/**
 * TypeScript types
 */
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;