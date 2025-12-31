import { z } from 'zod';

/**
 * Schema para crear un nuevo local
 * ✅ ACTUALIZADO: Campo 'direccion' en lugar de 'notas'
 */
export const createLocalSchema = z.object({
  plaza_id: z.string().uuid('Plaza ID inválido').nullable().optional(),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  giro: z.string().max(100).optional(),
  contacto: z.string().max(100).optional(),
  telefono: z.string().max(20).optional(),
  email: z.string().email('Email inválido').max(100).optional(),
  direccion: z.string().optional(), // ✅ CAMBIADO: 'notas' → 'direccion'
  activo: z.boolean().optional().default(true)
});

/**
 * Schema para actualizar un local
 */
export const updateLocalSchema = z.object({
  plaza_id: z.string().uuid('Plaza ID inválido').nullable().optional(),
  nombre: z.string().min(1).max(100).optional(),
  giro: z.string().max(100).optional(),
  contacto: z.string().max(100).optional(),
  telefono: z.string().max(20).optional(),
  email: z.string().email('Email inválido').max(100).optional(),
  direccion: z.string().optional(), // ✅ CAMBIADO: 'notas' → 'direccion'
  activo: z.boolean().optional()
});

/**
 * TypeScript types
 */
export type CreateLocalInput = z.infer<typeof createLocalSchema>;
export type UpdateLocalInput = z.infer<typeof updateLocalSchema>;