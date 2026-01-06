// backend/src/schemas/destino-final.schema.ts

import { z } from 'zod';

// Schema para crear destino final
export const createDestinoFinalSchema = z.object({
  nombre_destino: z.string()
    .min(1, 'El nombre del destino es requerido')
    .max(255, 'El nombre no puede exceder 255 caracteres'),
  domicilio: z.string()
    .min(1, 'El domicilio es requerido')
    .optional(),
  numero_autorizacion: z.string()
    .max(100, 'El número de autorización no puede exceder 100 caracteres')
    .optional(),
  activo: z.boolean().optional().default(true)
});

// Schema para actualizar destino final
export const updateDestinoFinalSchema = z.object({
  nombre_destino: z.string()
    .min(1, 'El nombre del destino es requerido')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .optional(),
  domicilio: z.string()
    .optional(),
  numero_autorizacion: z.string()
    .max(100, 'El número de autorización no puede exceder 100 caracteres')
    .optional(),
  activo: z.boolean().optional()
});

export type CreateDestinoFinalInput = z.infer<typeof createDestinoFinalSchema>;
export type UpdateDestinoFinalInput = z.infer<typeof updateDestinoFinalSchema>;