// backend/src/schemas/vehiculo.schema.ts

import { z } from 'zod';

// Schema para crear vehículo
export const createVehiculoSchema = z.object({
  tipo: z.string()
    .min(1, 'El tipo de vehículo es requerido')
    .max(100, 'El tipo no puede exceder 100 caracteres'),
  placas: z.string()
    .min(1, 'Las placas son requeridas')
    .max(20, 'Las placas no pueden exceder 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Las placas solo pueden contener letras mayúsculas, números y guiones')
    .transform(val => val.toUpperCase()),
  activo: z.boolean().optional().default(true)
});

// Schema para actualizar vehículo
export const updateVehiculoSchema = z.object({
  tipo: z.string()
    .min(1, 'El tipo de vehículo es requerido')
    .max(100, 'El tipo no puede exceder 100 caracteres')
    .optional(),
  placas: z.string()
    .min(1, 'Las placas son requeridas')
    .max(20, 'Las placas no pueden exceder 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Las placas solo pueden contener letras mayúsculas, números y guiones')
    .transform(val => val.toUpperCase())
    .optional(),
  activo: z.boolean().optional()
});

export type CreateVehiculoInput = z.infer<typeof createVehiculoSchema>;
export type UpdateVehiculoInput = z.infer<typeof updateVehiculoSchema>;