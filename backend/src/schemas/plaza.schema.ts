import { z } from 'zod';

export const createPlazaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  ciudad: z.string().min(1, 'La ciudad es requerida').max(100),
  estado: z.string().min(1, 'El estado es requerido').max(100),
  direccion: z.string().optional(),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  activo: z.boolean().optional().default(true)
});

export const updatePlazaSchema = z.object({
  nombre: z.string().optional(),
  ciudad: z.string().optional(),
  estado: z.string().optional(),
  direccion: z.string().nullable().optional(),
  contacto: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  activo: z.boolean().optional()
});

export type CreatePlazaInput = z.infer<typeof createPlazaSchema>;
export type UpdatePlazaInput = z.infer<typeof updatePlazaSchema>;